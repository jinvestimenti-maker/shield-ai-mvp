import { ApiError, normalizeTikTokError } from "./errors.js";

function formEncode(input) {
  return new URLSearchParams(input).toString();
}

export class TikTokClient {
  constructor(config) {
    this.config = config;
  }

  buildAuthorizeUrl(state) {
    const url = new URL(this.config.authBaseUrl);
    url.searchParams.set("client_key", this.config.clientKey);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.config.scopes.join(","));
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("state", state);
    return url.toString();
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formEncode({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.redirectUri
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw normalizeTikTokError(response.status, payload);
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      scope: payload.scope,
      expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
      refreshExpiresAt:
        Date.now() + Number(payload.refresh_expires_in || 7 * 24 * 3600) * 1000,
      openId: payload.open_id
    };
  }

  async refreshAccessToken(connection) {
    if (!connection.refreshToken) {
      throw new ApiError(401, "auth_expired", "No refresh token available");
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formEncode({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw normalizeTikTokError(response.status, payload);
    }

    return {
      ...connection,
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token || connection.refreshToken,
      expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
      refreshExpiresAt:
        Date.now() + Number(payload.refresh_expires_in || 7 * 24 * 3600) * 1000
    };
  }

  async getProfile(accessToken) {
    const response = await fetch(
      `${this.config.displayApiBaseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,follower_count,following_count,likes_count,video_count`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      throw normalizeTikTokError(response.status, payload);
    }

    return payload.data?.user || payload;
  }

  async listVideos(accessToken) {
    const response = await fetch(
      `${this.config.displayApiBaseUrl}/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,create_time,view_count,like_count,comment_count,share_count`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      throw normalizeTikTokError(response.status, payload);
    }

    return payload.data?.videos || payload;
  }
}
