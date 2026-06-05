import { ApiError } from "./errors.js";

export const FUNNEL_EVENT_SCHEMA_VERSION = "v1";

export const FUNNEL_EVENT_NAMES = [
  "landing_view",
  "generator_started",
  "preview_requested",
  "preview_generated",
  "paywall_viewed",
  "checkout_started",
  "payment_completed",
  "full_sprint_generated",
  "sprint_viewed"
];

function normalizePath(value) {
  if (value === "connect" || value === "fallback") {
    return value;
  }
  return "unknown";
}

export function resolveOnboardingPath({ explicitPath, creatorInput }) {
  if (explicitPath) {
    return normalizePath(String(explicitPath).trim().toLowerCase());
  }

  const source = creatorInput?.source ? String(creatorInput.source).trim().toLowerCase() : "";
  if (source.includes("connect") || source.includes("oauth") || source.includes("tiktok")) {
    return "connect";
  }
  if (source.includes("fallback") || source.includes("guided")) {
    return "fallback";
  }

  return "unknown";
}

export function assertValidFunnelEventName(eventName) {
  if (!FUNNEL_EVENT_NAMES.includes(eventName)) {
    throw new ApiError(400, "validation_error", `Unsupported funnel event: ${eventName}`);
  }
}

export async function emitFunnelEvent(store, event) {
  assertValidFunnelEventName(event.eventName);
  return store.recordFunnelEvent({
    ...event,
    schemaVersion: FUNNEL_EVENT_SCHEMA_VERSION
  });
}

export function requireIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "validation_error", "date must be YYYY-MM-DD");
  }
  return value;
}
