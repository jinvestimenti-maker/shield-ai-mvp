import { ApiError } from "./errors.js";

export class IngestionService {
  constructor(client, store) {
    this.client = client;
    this.store = store;
  }

  async resolveValidConnection(userId) {
    const connection = await this.store.getConnection(userId);
    if (!connection) {
      throw new ApiError(404, "not_connected", "TikTok is not connected for this user");
    }

    if (connection.expiresAt > Date.now() + 15_000) {
      return connection;
    }

    const refreshed = await this.client.refreshAccessToken(connection);
    await this.store.upsertConnection(userId, refreshed);
    return refreshed;
  }

  async captureSnapshot(userId) {
    const connection = await this.resolveValidConnection(userId);
    const profile = await this.client.getProfile(connection.accessToken);
    const videos = await this.client.listVideos(connection.accessToken);

    return this.store.saveSnapshot(userId, { profile, videos });
  }
}
