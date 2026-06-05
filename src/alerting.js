export class AlertingService {
  constructor({ webhookUrl = "", source = "shield-ai-mvp" } = {}) {
    this.webhookUrl = webhookUrl;
    this.source = source;
  }

  get enabled() {
    return Boolean(this.webhookUrl);
  }

  async notifyFailure(alertType, payload = {}) {
    if (!this.enabled) {
      return { sent: false, reason: "disabled" };
    }

    const body = {
      source: this.source,
      alertType,
      severity: "error",
      timestamp: new Date().toISOString(),
      payload
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(`Alert webhook returned ${response.status}`);
      }
      return { sent: true };
    } catch (error) {
      console.error("Failed to deliver alert", {
        alertType,
        message: error.message
      });
      return { sent: false, reason: "delivery_failed" };
    }
  }
}
