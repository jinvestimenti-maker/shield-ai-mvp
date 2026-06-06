import express from "express";
import Stripe from "stripe";
import { getConfig } from "./config.js";
import { ApiError, asyncHandler, errorMiddleware } from "./errors.js";
import { FileStore } from "./store.js";
import { TikTokClient } from "./tiktok-client.js";
import { IngestionService } from "./ingest.js";
import { GenerationService } from "./generation.js";
import { validateNormalizedCreatorInput } from "./contracts.js";
import { AlertingService } from "./alerting.js";
import {
  renderDashboardPage,
  renderGeneratePage,
  renderLandingPage,
  renderPaywallPage,
  renderPreviewPage,
  renderSprintPage
} from "./frontend-pages.js";
import {
  applyStripeWebhookEvent,
  assertStripeConfigured,
  resolveVariant
} from "./payment-workflow.js";
import {
  emitFunnelEvent,
  FUNNEL_EVENT_NAMES,
  requireIsoDate,
  resolveOnboardingPath
} from "./tracking.js";

const config = getConfig();
const app = express();
const store = new FileStore();
const client = new TikTokClient(config);
const ingestion = new IngestionService(client, store);
const generation = new GenerationService(process.env.OPENAI_API_KEY || null);
const alerting = new AlertingService({
  webhookUrl: config.alertWebhookUrl,
  source: config.alertSource
});
const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

function getSessionId(req) {
  const raw = req.headers["x-session-id"];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function getRequestPath(req) {
  const value = req.body?.path || req.query?.path;
  return value ? String(value) : null;
}

async function track(event) {
  try {
    await emitFunnelEvent(store, event);
  } catch (error) {
    console.error("Failed to emit funnel event", error);
  }
}

app.post(
  "/api/webhook-payment",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    assertStripeConfigured(config);
    if (!stripe) {
      throw new ApiError(500, "config_error", "Stripe client is not configured");
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      throw new ApiError(400, "validation_error", "Missing Stripe-Signature header");
    }

    let event;
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body ? String(req.body) : "");
      event = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
    } catch (error) {
      throw new ApiError(400, "validation_error", `Invalid webhook signature: ${error.message}`);
    }

    const receipt = await store.recordWebhookEventIfNew({
      eventId: event.id,
      eventType: event.type,
      payload: event
    });
    if (!receipt.inserted) {
      return res.json({ received: true, replayed: true });
    }

    try {
      const outcome = await applyStripeWebhookEvent({ event, store, generation });
      if (!outcome.ignored && (outcome.status === "failed" || outcome.status === "cancelled")) {
        await alerting.notifyFailure("payment_status_transition", {
          status: outcome.status,
          paymentId: outcome.paymentId || null,
          stripeEventId: event.id
        });
      }
      if (event.type === "checkout.session.completed" && !outcome.ignored && outcome.paymentId) {
        const preview = outcome.previewId ? await store.getPreviewById(outcome.previewId) : null;
        const onboardingPath = resolveOnboardingPath({
          creatorInput: preview?.creatorInput
        });

        await track({
          eventName: "payment_completed",
          userId: outcome.userId || preview?.userId || null,
          sessionId: getSessionId(req),
          primaryObjectId: outcome.paymentId,
          priceVariant: outcome.priceVariant || null,
          onboardingPath,
          path: getRequestPath(req),
          idempotencyKey: `payment_completed:${outcome.paymentId}`,
          metadata: {
            source: "stripe_webhook",
            stripeEventId: event.id
          }
        });

        if (outcome.sprintGenerated && outcome.previewId) {
          const sprint = await store.getSprintByPreviewId(outcome.previewId);
          if (sprint) {
            await track({
              eventName: "full_sprint_generated",
              userId: sprint.userId,
              sessionId: getSessionId(req),
              primaryObjectId: sprint.id,
              priceVariant: outcome.priceVariant || null,
              onboardingPath,
              path: getRequestPath(req),
              idempotencyKey: `full_sprint_generated:${sprint.id}`,
              metadata: {
                source: "stripe_webhook_autogen",
                paymentId: outcome.paymentId
              }
            });
          }
        }
      }
      await store.updateWebhookEventStatus({
        eventId: event.id,
        processingStatus: outcome.ignored ? "ignored" : "processed"
      });
      return res.json({ received: true, replayed: false, ...outcome });
    } catch (error) {
      await store.updateWebhookEventStatus({
        eventId: event.id,
        processingStatus: "failed",
        error: error.message
      });
      await alerting.notifyFailure("stripe_webhook_processing_failed", {
        stripeEventId: event.id,
        eventType: event.type,
        error: error.message
      });
      throw error;
    }
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  track({
    eventName: "landing_view",
    sessionId: getSessionId(_req),
    userId: _req.query.userId ? String(_req.query.userId) : null,
    onboardingPath: resolveOnboardingPath({ explicitPath: getRequestPath(_req) }),
    path: getRequestPath(_req),
    metadata: {
      source: "page_load"
    }
  });
  res.type("html").send(renderLandingPage());
});

app.get("/generate", (_req, res) => {
  track({
    eventName: "generator_started",
    sessionId: getSessionId(_req),
    userId: _req.query.userId ? String(_req.query.userId) : null,
    onboardingPath: resolveOnboardingPath({ explicitPath: getRequestPath(_req) }),
    path: getRequestPath(_req),
    metadata: {
      source: "page_load"
    }
  });
  res.type("html").send(renderGeneratePage());
});

app.get(
  "/preview/:id",
  asyncHandler(async (req, res) => {
    const preview = await store.getPreviewById(req.params.id);
    if (!preview) {
      throw new ApiError(404, "not_found", "Preview not found");
    }
    res.type("html").send(renderPreviewPage({ preview }));
  })
);

app.get(
  "/paywall/:previewId",
  asyncHandler(async (req, res) => {
    const preview = await store.getPreviewById(req.params.previewId);
    if (!preview) {
      throw new ApiError(404, "not_found", "Preview not found");
    }

    const paywallStatus = {
      previewId: preview.id,
      paymentStatus: "none",
      entitlementStatus: "locked",
      canRetry: false
    };
    const latestPayment = await store.getLatestPaymentForPreview(preview.userId, preview.id);
    const unlocked = await store.hasUnlockedEntitlement(preview.userId, preview.id);
    paywallStatus.paymentStatus = latestPayment?.status || "none";
    paywallStatus.entitlementStatus = unlocked ? "unlocked" : "locked";
    paywallStatus.canRetry =
      paywallStatus.paymentStatus === "failed" || paywallStatus.paymentStatus === "cancelled";

    const sprint = await store.getSprintByPreviewId(preview.id);
    await track({
      eventName: "paywall_viewed",
      userId: preview.userId,
      sessionId: getSessionId(req),
      primaryObjectId: preview.id,
      onboardingPath: resolveOnboardingPath({ creatorInput: preview.creatorInput }),
      path: getRequestPath(req),
      metadata: {
        source: "page_load"
      }
    });
    res.type("html").send(renderPaywallPage({ preview, paywallStatus, sprint }));
  })
);

app.get(
  "/sprint/:id",
  asyncHandler(async (req, res) => {
    const sprint = await store.getSprintById(req.params.id);
    if (!sprint) {
      throw new ApiError(404, "not_found", "Sprint not found");
    }
    const preview = await store.getPreviewById(sprint.previewId);
    await track({
      eventName: "sprint_viewed",
      userId: sprint.userId,
      sessionId: getSessionId(req),
      primaryObjectId: sprint.id,
      onboardingPath: resolveOnboardingPath({ creatorInput: preview?.creatorInput }),
      path: getRequestPath(req),
      metadata: {
        source: "page_load",
        previewId: sprint.previewId
      }
    });
    res.type("html").send(renderSprintPage({ sprint }));
  })
);

app.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const userId = req.query.userId ? String(req.query.userId) : "";
    const [previews, payments, sprints] = userId
      ? await Promise.all([
          store.listPreviewsForUser(userId),
          store.listPaymentsForUser(userId),
          store.listSprintsForUser(userId)
        ])
      : [[], [], []];

    res.type("html").send(
      renderDashboardPage({
        userId,
        previews,
        payments,
        sprints
      })
    );
  })
);

app.post(
  "/api/create-checkout",
  asyncHandler(async (req, res) => {
    assertStripeConfigured(config);
    if (!stripe) {
      throw new ApiError(500, "config_error", "Stripe client is not configured");
    }

    const userId = req.body?.userId;
    const previewId = req.body?.previewId;
    const variant = req.body?.variant;
    if (!userId || !previewId || !variant) {
      throw new ApiError(400, "validation_error", "userId, previewId, and variant are required");
    }

    const preview = await store.getPreviewById(previewId);
    if (!preview || preview.userId !== userId) {
      throw new ApiError(404, "not_found", "Preview not found for user");
    }

    const latestPayment = await store.getLatestPaymentForPreview(userId, previewId);
    if (latestPayment?.status === "completed") {
      const unlocked = await store.hasUnlockedEntitlement(userId, previewId);
      return res.json({
        alreadyPaid: true,
        previewId,
        paymentStatus: "completed",
        entitlementStatus: unlocked ? "unlocked" : "locked"
      });
    }

    const resolved = resolveVariant(variant, config);
    const successUrl = req.body?.successUrl || config.checkoutSuccessUrl;
    const cancelUrl = req.body?.cancelUrl || config.checkoutCancelUrl;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: resolved.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        previewId,
        variant: resolved.variant
      }
    });

    await store.createPendingPayment({
      userId,
      previewId,
      variant: resolved.variant,
      amountCents: resolved.amountCents,
      currency: resolved.currency,
      stripeCheckoutSessionId: session.id
    });
    await track({
      eventName: "checkout_started",
      userId,
      sessionId: getSessionId(req),
      primaryObjectId: session.id,
      priceVariant: resolved.variant,
      onboardingPath: resolveOnboardingPath({ creatorInput: preview.creatorInput }),
      path: getRequestPath(req),
      idempotencyKey: `checkout_started:${session.id}`,
      metadata: {
        source: "api_create_checkout",
        amountCents: resolved.amountCents,
        currency: resolved.currency
      }
    });

    return res.status(201).json({
      checkoutUrl: session.url,
      sessionId: session.id,
      variant: resolved.variant,
      amountCents: resolved.amountCents,
      currency: resolved.currency
    });
  })
);

app.get(
  "/api/paywall-status/:previewId",
  asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
      throw new ApiError(400, "validation_error", "userId query param is required");
    }

    const preview = await store.getPreviewById(req.params.previewId);
    if (!preview || preview.userId !== userId) {
      throw new ApiError(404, "not_found", "Preview not found for user");
    }

    const latestPayment = await store.getLatestPaymentForPreview(userId, req.params.previewId);
    const unlocked = await store.hasUnlockedEntitlement(userId, req.params.previewId);
    const paymentStatus = latestPayment?.status || "none";
    const canRetry = paymentStatus === "failed" || paymentStatus === "cancelled";

    return res.json({
      previewId: req.params.previewId,
      paymentStatus,
      entitlementStatus: unlocked ? "unlocked" : "locked",
      canRetry,
      latestPaymentId: latestPayment?.id || null
    });
  })
);

app.post(
  ["/api/generate-preview", "/generate-preview"],
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    const creatorInput = req.body?.creatorInput;
    const idempotencyKey = req.body?.idempotencyKey;
    const creatorInputId = req.body?.creatorInputId || null;

    if (!userId || !idempotencyKey || !creatorInput) {
      throw new ApiError(
        400,
        "validation_error",
        "userId, creatorInput, and idempotencyKey are required"
      );
    }

    validateNormalizedCreatorInput(creatorInput);
    const onboardingPath = resolveOnboardingPath({
      explicitPath: getRequestPath(req),
      creatorInput
    });
    await track({
      eventName: "preview_requested",
      userId,
      sessionId: getSessionId(req),
      primaryObjectId: creatorInputId,
      onboardingPath,
      path: getRequestPath(req),
      idempotencyKey: `preview_requested:${userId}:${idempotencyKey}`,
      metadata: {
        source: "api_generate_preview",
        idempotencyKey
      }
    });

    const existing = await store.findPreviewByIdempotency(userId, idempotencyKey);
    if (existing) {
      return res.json({ ...existing, reused: true });
    }

    let generated;
    try {
      generated = await generation.generatePreview(creatorInput);
    } catch (error) {
      await alerting.notifyFailure("preview_generation_failed", {
        userId,
        creatorInputId,
        idempotencyKey,
        error: error.message
      });
      throw error;
    }
    const saved = await store.savePreview({
      userId,
      creatorInputId,
      idempotencyKey,
      creatorInput,
      previewJson: generated.output,
      generationMeta: generated.generationMeta
    });
    await track({
      eventName: "preview_generated",
      userId,
      sessionId: getSessionId(req),
      primaryObjectId: saved.id,
      onboardingPath,
      path: getRequestPath(req),
      idempotencyKey: `preview_generated:${saved.id}`,
      metadata: {
        source: "api_generate_preview"
      }
    });

    return res.status(201).json({ ...saved, reused: false });
  })
);

app.post(
  "/api/entitlements/grant",
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    const previewId = req.body?.previewId;
    const paymentId = req.body?.paymentId || null;
    if (!userId || !previewId) {
      throw new ApiError(400, "validation_error", "userId and previewId are required");
    }

    await store.upsertEntitlement({ userId, previewId, paymentId, status: "unlocked" });
    return res.status(201).json({
      userId,
      previewId,
      status: "unlocked",
      scope: "full_sprint_unlock"
    });
  })
);

app.post(
  ["/api/generate-full-sprint", "/generate-full-sprint"],
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    const previewId = req.body?.previewId;
    const idempotencyKey = req.body?.idempotencyKey;
    if (!userId || !previewId || !idempotencyKey) {
      throw new ApiError(
        400,
        "validation_error",
        "userId, previewId, and idempotencyKey are required"
      );
    }

    const existing = await store.findSprintByIdempotency(userId, idempotencyKey);
    if (existing) {
      return res.json({ ...existing, reused: true });
    }

    const preview = await store.getPreviewById(previewId);
    if (!preview || preview.userId !== userId) {
      throw new ApiError(404, "not_found", "Preview not found for user");
    }

    const hasEntitlement = await store.hasUnlockedEntitlement(userId, previewId);
    if (!hasEntitlement) {
      throw new ApiError(
        403,
        "entitlement_required",
        "Full sprint generation requires paid entitlement"
      );
    }

    let generated;
    try {
      generated = await generation.generateFullSprint(preview.creatorInput);
    } catch (error) {
      await alerting.notifyFailure("full_sprint_generation_failed", {
        userId,
        previewId,
        idempotencyKey,
        error: error.message
      });
      throw error;
    }
    const saved = await store.saveSprint({
      userId,
      previewId,
      idempotencyKey,
      creatorInputId: preview.creatorInputId,
      sprintJson: generated.output,
      generationMeta: generated.generationMeta
    });
    await track({
      eventName: "full_sprint_generated",
      userId,
      sessionId: getSessionId(req),
      primaryObjectId: saved.id,
      onboardingPath: resolveOnboardingPath({ creatorInput: preview.creatorInput }),
      priceVariant: null,
      path: getRequestPath(req),
      idempotencyKey: `full_sprint_generated:${saved.id}`,
      metadata: {
        source: "api_generate_full_sprint",
        previewId
      }
    });

    return res.status(201).json({ ...saved, reused: false });
  })
);

app.get(
  "/api/tracking/funnel-checkpoint",
  asyncHandler(async (req, res) => {
    const date = requireIsoDate(String(req.query.date || new Date().toISOString().slice(0, 10)));
    const report = await store.getDailyFunnelCheckpoint({
      date,
      orderedEventNames: FUNNEL_EVENT_NAMES
    });
    return res.json(report);
  })
);

app.get(
  "/api/preview/:id",
  asyncHandler(async (req, res) => {
    const preview = await store.getPreviewById(req.params.id);
    if (!preview) {
      throw new ApiError(404, "not_found", "Preview not found");
    }
    return res.json(preview);
  })
);

app.get(
  "/api/sprint/:id",
  asyncHandler(async (req, res) => {
    const sprint = await store.getSprintById(req.params.id);
    if (!sprint) {
      throw new ApiError(404, "not_found", "Sprint not found");
    }
    return res.json(sprint);
  })
);

app.post(
  "/oauth/tiktok/connect-url",
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    if (!userId) {
      throw new ApiError(400, "validation_error", "userId is required");
    }

    const state = store.createOauthState(userId, config.stateTtlMs);
    const authorizeUrl = client.buildAuthorizeUrl(state);
    res.json({ authorizeUrl, state });
  })
);

app.get(
  "/oauth/tiktok/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      throw new ApiError(400, "validation_error", "code and state are required");
    }

    const stateData = store.consumeOauthState(state);
    if (!stateData) {
      throw new ApiError(400, "invalid_state", "OAuth state is invalid or expired");
    }

    const tokenSet = await client.exchangeCodeForToken(code);
    await store.upsertConnection(stateData.userId, tokenSet);

    res.json({
      connected: true,
      userId: stateData.userId,
      expiresAt: new Date(tokenSet.expiresAt).toISOString()
    });
  })
);

app.post(
  "/oauth/tiktok/disconnect",
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    if (!userId) {
      throw new ApiError(400, "validation_error", "userId is required");
    }

    await store.deleteConnection(userId);
    res.json({ disconnected: true, userId });
  })
);

app.post(
  "/ingest/tiktok/snapshot",
  asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    if (!userId) {
      throw new ApiError(400, "validation_error", "userId is required");
    }

    const snapshot = await ingestion.captureSnapshot(userId);
    res.status(201).json(snapshot);
  })
);

app.get(
  "/ingest/tiktok/snapshot/:userId",
  asyncHandler(async (req, res) => {
    const snapshot = await store.getLatestSnapshot(req.params.userId);
    if (!snapshot) {
      throw new ApiError(404, "not_found", "No snapshot found for user");
    }

    res.json(snapshot);
  })
);

app.use(errorMiddleware);

app.listen(config.port, () => {
  console.log(`TikTok baseline API listening on ${config.port}`);
});
