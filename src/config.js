import process from "node:process";

const required = [
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REDIRECT_URI"
];

export function getConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`TikTok env vars missing: ${missing.join(", ")}. TikTok OAuth will not work until configured.`);
  }

  return {
    port: Number(process.env.PORT || 3333),
    baseUrl: process.env.APP_BASE_URL || "http://localhost:3333",
    clientKey: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: process.env.TIKTOK_REDIRECT_URI,
    scopes: (process.env.TIKTOK_SCOPES || "user.info.basic,video.list").split(","),
    authBaseUrl: process.env.TIKTOK_AUTH_BASE_URL || "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: process.env.TIKTOK_TOKEN_URL || "https://open.tiktokapis.com/v2/oauth/token/",
    displayApiBaseUrl:
      process.env.TIKTOK_DISPLAY_API_BASE_URL || "https://open.tiktokapis.com/v2",
    stateTtlMs: Number(process.env.STATE_TTL_MS || 10 * 60 * 1000),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    stripePriceEur9: process.env.STRIPE_PRICE_EUR_9 || "",
    stripePriceEur19: process.env.STRIPE_PRICE_EUR_19 || "",
    checkoutSuccessUrl:
      process.env.CHECKOUT_SUCCESS_URL || "http://localhost:3333/payment/success",
    checkoutCancelUrl: process.env.CHECKOUT_CANCEL_URL || "http://localhost:3333/payment/cancel",
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || "",
    alertSource: process.env.ALERT_SOURCE || "shield-ai-mvp"
  };
}
