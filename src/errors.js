export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeTikTokError(responseStatus, payload = {}) {
  if (responseStatus === 401) {
    return new ApiError(401, "auth_expired", "TikTok access token expired", {
      source: payload
    });
  }
  if (responseStatus === 403) {
    return new ApiError(
      403,
      "scope_insufficient",
      "TikTok scope does not permit this API call",
      { source: payload }
    );
  }
  if (responseStatus === 429) {
    return new ApiError(429, "rate_limited", "TikTok rate limit reached", {
      source: payload
    });
  }
  return new ApiError(502, "upstream_error", "TikTok API request failed", {
    status: responseStatus,
    source: payload
  });
}

export function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function errorMiddleware(error, req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  return res.status(500).json({
    error: {
      code: "internal_error",
      message: "Unhandled server error",
      details: { message: error.message }
    }
  });
}
