import { ApiError } from "./errors.js";

const VARIANT_MAP = {
  eur_9: { amountCents: 900, currency: "eur" },
  eur_19: { amountCents: 1900, currency: "eur" }
};

export function resolveVariant(variant, config) {
  const entry = VARIANT_MAP[variant];
  if (!entry) {
    throw new ApiError(400, "validation_error", "variant must be eur_9 or eur_19");
  }

  const priceId = variant === "eur_9" ? config.stripePriceEur9 : config.stripePriceEur19;
  if (!priceId) {
    throw new ApiError(500, "config_error", `Missing Stripe price id for ${variant}`);
  }

  return {
    variant,
    amountCents: entry.amountCents,
    currency: entry.currency,
    priceId
  };
}

export function assertStripeConfigured(config) {
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw new ApiError(
      500,
      "config_error",
      "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required"
    );
  }
}

export async function applyStripeWebhookEvent({ event, store, generation }) {
  const object = event.data?.object;
  const checkoutSessionId = object?.id;
  if (!checkoutSessionId) {
    return { ignored: true, reason: "missing_checkout_session_id" };
  }

  if (event.type === "checkout.session.completed") {
    const payment = await store.markPaymentCompletedByCheckoutSession({
      checkoutSessionId,
      paymentIntentId: object.payment_intent || null,
      eventId: event.id
    });

    if (!payment) {
      return { ignored: true, reason: "unknown_checkout_session" };
    }

    await store.upsertEntitlement({
      userId: payment.userId,
      previewId: payment.previewId,
      paymentId: payment.id,
      status: "unlocked"
    });

    let sprintGenerated = false;
    const existingSprint = await store.getSprintByPreviewId(payment.previewId);
    if (!existingSprint) {
      const preview = await store.getPreviewById(payment.previewId);
      if (preview && preview.userId === payment.userId) {
        const generated = await generation.generateFullSprint(preview.creatorInput);
        await store.saveSprint({
          userId: payment.userId,
          previewId: payment.previewId,
          creatorInputId: preview.creatorInputId,
          idempotencyKey: `payment:${payment.id}`,
          sprintJson: generated.output,
          generationMeta: generated.generationMeta
        });
        sprintGenerated = true;
      }
    }

    return {
      processed: true,
      status: "completed",
      paymentId: payment.id,
      userId: payment.userId,
      previewId: payment.previewId,
      priceVariant: payment.priceVariant,
      sprintGenerated
    };
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const payment = await store.markPaymentStatusByCheckoutSession({
      checkoutSessionId,
      status: "failed",
      failedReason: object.payment_status || "async_payment_failed",
      eventId: event.id
    });

    if (!payment) {
      return { ignored: true, reason: "unknown_checkout_session" };
    }

    return { processed: true, status: "failed", paymentId: payment.id };
  }

  if (event.type === "checkout.session.expired") {
    const payment = await store.markPaymentStatusByCheckoutSession({
      checkoutSessionId,
      status: "cancelled",
      failedReason: "checkout_session_expired",
      eventId: event.id
    });

    if (!payment) {
      return { ignored: true, reason: "unknown_checkout_session" };
    }

    return { processed: true, status: "cancelled", paymentId: payment.id };
  }

  return { ignored: true, reason: "event_type_not_handled" };
}
