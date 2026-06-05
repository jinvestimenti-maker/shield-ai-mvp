import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

async function ensureDataFile(dataDir, file, emptyValue) {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify(emptyValue, null, 2));
  }
}

async function readJson(dataDir, file, emptyValue) {
  await ensureDataFile(dataDir, file, emptyValue);
  const body = await fs.readFile(file, "utf8");
  return JSON.parse(body);
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export class FileStore {
  constructor({ dataDir = path.resolve("data") } = {}) {
    this.oauthStates = new Map();
    this.dataDir = dataDir;
    this.connectionsFile = path.join(dataDir, "connections.json");
    this.snapshotsFile = path.join(dataDir, "snapshots.json");
    this.previewsFile = path.join(dataDir, "previews.json");
    this.sprintsFile = path.join(dataDir, "sprints.json");
    this.entitlementsFile = path.join(dataDir, "entitlements.json");
    this.paymentsFile = path.join(dataDir, "payments.json");
    this.webhookEventsFile = path.join(dataDir, "webhook_events.json");
    this.funnelEventsFile = path.join(dataDir, "funnel_events.json");
  }

  createOauthState(userId, ttlMs) {
    const state = crypto.randomBytes(16).toString("hex");
    this.oauthStates.set(state, {
      userId,
      expiresAt: Date.now() + ttlMs
    });
    return state;
  }

  consumeOauthState(state) {
    const item = this.oauthStates.get(state);
    this.oauthStates.delete(state);
    if (!item || item.expiresAt < Date.now()) {
      return null;
    }
    return item;
  }

  async upsertConnection(userId, connection) {
    const data = await readJson(this.dataDir, this.connectionsFile, {});
    data[userId] = {
      ...connection,
      userId,
      updatedAt: new Date().toISOString()
    };
    await writeJson(this.connectionsFile, data);
  }

  async getConnection(userId) {
    const data = await readJson(this.dataDir, this.connectionsFile, {});
    return data[userId] || null;
  }

  async deleteConnection(userId) {
    const data = await readJson(this.dataDir, this.connectionsFile, {});
    delete data[userId];
    await writeJson(this.connectionsFile, data);
  }

  async saveSnapshot(userId, snapshot) {
    const list = await readJson(this.dataDir, this.snapshotsFile, []);
    const row = {
      id: crypto.randomUUID(),
      userId,
      capturedAt: new Date().toISOString(),
      rawProfile: snapshot.profile,
      rawVideos: snapshot.videos
    };
    list.push(row);
    await writeJson(this.snapshotsFile, list);
    return row;
  }

  async getLatestSnapshot(userId) {
    const list = await readJson(this.dataDir, this.snapshotsFile, []);
    const rows = list.filter((item) => item.userId === userId);
    return rows.sort((a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    )[0] || null;
  }

  async savePreview(row) {
    const list = await readJson(this.dataDir, this.previewsFile, []);
    const saved = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...row
    };
    list.push(saved);
    await writeJson(this.previewsFile, list);
    return saved;
  }

  async findPreviewByIdempotency(userId, idempotencyKey) {
    const list = await readJson(this.dataDir, this.previewsFile, []);
    return (
      list.find((item) => item.userId === userId && item.idempotencyKey === idempotencyKey) ||
      null
    );
  }

  async getPreviewById(previewId) {
    const list = await readJson(this.dataDir, this.previewsFile, []);
    return list.find((item) => item.id === previewId) || null;
  }

  async listPreviewsForUser(userId, { limit = 25 } = {}) {
    const list = await readJson(this.dataDir, this.previewsFile, []);
    return list
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async saveSprint(row) {
    const list = await readJson(this.dataDir, this.sprintsFile, []);
    const saved = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...row
    };
    list.push(saved);
    await writeJson(this.sprintsFile, list);
    return saved;
  }

  async findSprintByIdempotency(userId, idempotencyKey) {
    const list = await readJson(this.dataDir, this.sprintsFile, []);
    return (
      list.find((item) => item.userId === userId && item.idempotencyKey === idempotencyKey) ||
      null
    );
  }

  async getSprintById(sprintId) {
    const list = await readJson(this.dataDir, this.sprintsFile, []);
    return list.find((item) => item.id === sprintId) || null;
  }

  async getSprintByPreviewId(previewId) {
    const list = await readJson(this.dataDir, this.sprintsFile, []);
    const rows = list.filter((item) => item.previewId === previewId);
    return (
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
      null
    );
  }

  async listSprintsForUser(userId, { limit = 25 } = {}) {
    const list = await readJson(this.dataDir, this.sprintsFile, []);
    return list
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async upsertEntitlement({ userId, previewId, paymentId, status = "unlocked" }) {
    const list = await readJson(this.dataDir, this.entitlementsFile, []);
    const existing = list.find((item) => item.userId === userId && item.previewId === previewId);
    const base = {
      id: existing?.id || crypto.randomUUID(),
      userId,
      previewId,
      paymentId: paymentId || null,
      scope: "full_sprint_unlock",
      status,
      updatedAt: new Date().toISOString(),
      unlockedAt: status === "unlocked" ? new Date().toISOString() : null
    };

    if (existing) {
      const index = list.findIndex((item) => item.id === existing.id);
      list[index] = { ...existing, ...base };
    } else {
      list.push({ ...base, createdAt: base.updatedAt });
    }
    await writeJson(this.entitlementsFile, list);
  }

  async hasUnlockedEntitlement(userId, previewId) {
    const list = await readJson(this.dataDir, this.entitlementsFile, []);
    return list.some(
      (item) =>
        item.userId === userId &&
        item.previewId === previewId &&
        item.scope === "full_sprint_unlock" &&
        item.status === "unlocked"
    );
  }

  async createPendingPayment({
    userId,
    previewId,
    variant,
    amountCents,
    currency,
    stripeCheckoutSessionId
  }) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    const row = {
      id: crypto.randomUUID(),
      userId,
      previewId,
      provider: "stripe",
      status: "pending",
      priceVariant: variant,
      amountCents,
      currency,
      stripeCheckoutSessionId,
      stripePaymentIntentId: null,
      failedReason: null,
      completedAt: null,
      webhookEventId: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(row);
    await writeJson(this.paymentsFile, list);
    return row;
  }

  async getPaymentByCheckoutSessionId(checkoutSessionId) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    return list.find((item) => item.stripeCheckoutSessionId === checkoutSessionId) || null;
  }

  async getLatestPaymentForPreview(userId, previewId) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    const rows = list.filter((item) => item.userId === userId && item.previewId === previewId);
    return (
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
      null
    );
  }

  async listPaymentsForUser(userId, { limit = 25 } = {}) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    return list
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async markPaymentCompletedByCheckoutSession({ checkoutSessionId, paymentIntentId, eventId }) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    const index = list.findIndex((item) => item.stripeCheckoutSessionId === checkoutSessionId);
    if (index === -1) {
      return null;
    }

    const existing = list[index];
    if (existing.status === "completed") {
      return existing;
    }

    const updated = {
      ...existing,
      status: "completed",
      stripePaymentIntentId: paymentIntentId || existing.stripePaymentIntentId || null,
      completedAt: existing.completedAt || new Date().toISOString(),
      failedReason: null,
      webhookEventId: eventId || existing.webhookEventId || null,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    await writeJson(this.paymentsFile, list);
    return updated;
  }

  async markPaymentStatusByCheckoutSession({ checkoutSessionId, status, failedReason, eventId }) {
    const list = await readJson(this.dataDir, this.paymentsFile, []);
    const index = list.findIndex((item) => item.stripeCheckoutSessionId === checkoutSessionId);
    if (index === -1) {
      return null;
    }

    const existing = list[index];
    if (existing.status === "completed") {
      return existing;
    }

    const updated = {
      ...existing,
      status,
      failedReason: failedReason || null,
      webhookEventId: eventId || existing.webhookEventId || null,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    await writeJson(this.paymentsFile, list);
    return updated;
  }

  async recordWebhookEventIfNew({ eventId, eventType, payload }) {
    const list = await readJson(this.dataDir, this.webhookEventsFile, []);
    const existing = list.find((item) => item.eventId === eventId);
    if (existing) {
      return { inserted: false, row: existing };
    }

    const row = {
      id: crypto.randomUUID(),
      provider: "stripe",
      eventId,
      eventType,
      payload,
      processingStatus: "processing",
      processedAt: null,
      error: null,
      createdAt: new Date().toISOString()
    };
    list.push(row);
    await writeJson(this.webhookEventsFile, list);
    return { inserted: true, row };
  }

  async updateWebhookEventStatus({ eventId, processingStatus, error = null }) {
    const list = await readJson(this.dataDir, this.webhookEventsFile, []);
    const index = list.findIndex((item) => item.eventId === eventId);
    if (index === -1) {
      return null;
    }

    const updated = {
      ...list[index],
      processingStatus,
      processedAt: new Date().toISOString(),
      error
    };
    list[index] = updated;
    await writeJson(this.webhookEventsFile, list);
    return updated;
  }

  async recordFunnelEvent(row) {
    const list = await readJson(this.dataDir, this.funnelEventsFile, []);
    if (row.idempotencyKey) {
      const existing = list.find((item) => item.idempotencyKey === row.idempotencyKey);
      if (existing) {
        return { inserted: false, row: existing };
      }
    }

    const saved = {
      id: crypto.randomUUID(),
      schemaVersion: row.schemaVersion || "v1",
      eventName: row.eventName,
      userId: row.userId || null,
      sessionId: row.sessionId || null,
      primaryObjectId: row.primaryObjectId || null,
      priceVariant: row.priceVariant || null,
      onboardingPath: row.onboardingPath || "unknown",
      path: row.path || null,
      idempotencyKey: row.idempotencyKey || null,
      metadata: row.metadata || {},
      occurredAt: row.occurredAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    list.push(saved);
    await writeJson(this.funnelEventsFile, list);
    return { inserted: true, row: saved };
  }

  async getDailyFunnelCheckpoint({ date, orderedEventNames }) {
    const list = await readJson(this.dataDir, this.funnelEventsFile, []);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const dayRows = list.filter((item) => {
      const timestamp = new Date(item.occurredAt).getTime();
      return timestamp >= dayStart.getTime() && timestamp <= dayEnd.getTime();
    });

    const stepCounts = {};
    for (const eventName of orderedEventNames) {
      stepCounts[eventName] = 0;
    }

    const variantBreakdown = {};
    const pathBreakdown = {};
    for (const row of dayRows) {
      if (!(row.eventName in stepCounts)) {
        stepCounts[row.eventName] = 0;
      }
      stepCounts[row.eventName] += 1;

      const variant = row.priceVariant || "none";
      const path = row.onboardingPath || "unknown";
      if (!variantBreakdown[variant]) {
        variantBreakdown[variant] = {};
      }
      if (!pathBreakdown[path]) {
        pathBreakdown[path] = {};
      }
      variantBreakdown[variant][row.eventName] = (variantBreakdown[variant][row.eventName] || 0) + 1;
      pathBreakdown[path][row.eventName] = (pathBreakdown[path][row.eventName] || 0) + 1;
    }

    const steps = orderedEventNames.map((eventName) => ({
      eventName,
      count: stepCounts[eventName] || 0
    }));

    return {
      date,
      totalEvents: dayRows.length,
      steps,
      stepCounts,
      priceVariantBreakdown: variantBreakdown,
      onboardingPathBreakdown: pathBreakdown
    };
  }
}
