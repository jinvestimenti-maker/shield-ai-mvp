import { ApiError } from "./errors.js";

const PRIMARY_GOALS = new Set(["views", "followers", "clients", "consistency"]);
const CREATOR_LEVELS = new Set(["beginner", "active", "advanced"]);
const SOURCES = new Set(["tiktok_connect", "guided_fallback"]);
const PERFORMANCE_BUCKETS = new Set(["low", "medium", "high", "unknown"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertString(value, path, { min = 1, max = 10_000, pattern } = {}) {
  if (typeof value !== "string") {
    throw new ApiError(422, "validation_error", `${path} must be a string`);
  }
  if (value.length < min || value.length > max) {
    throw new ApiError(
      422,
      "validation_error",
      `${path} length must be between ${min} and ${max}`
    );
  }
  if (pattern && !pattern.test(value)) {
    throw new ApiError(422, "validation_error", `${path} format is invalid`);
  }
}

function assertEnum(value, path, allowed) {
  if (!allowed.has(value)) {
    throw new ApiError(
      422,
      "validation_error",
      `${path} must be one of: ${Array.from(allowed).join(", ")}`
    );
  }
}

function assertArray(value, path, maxItems) {
  if (!Array.isArray(value)) {
    throw new ApiError(422, "validation_error", `${path} must be an array`);
  }
  if (value.length > maxItems) {
    throw new ApiError(
      422,
      "validation_error",
      `${path} must contain at most ${maxItems} items`
    );
  }
}

function validateExample(item, path) {
  if (!isObject(item)) {
    throw new ApiError(422, "validation_error", `${path} must be an object`);
  }
  if (item.url !== null && item.url !== undefined) {
    assertString(item.url, `${path}.url`, {
      min: 8,
      max: 500,
      pattern: /^https:\/\/(www\.)?tiktok\.com\/.*$/i
    });
  }
  assertString(item.topic, `${path}.topic`, { min: 2, max: 120 });
  assertString(item.format, `${path}.format`, { min: 2, max: 80 });
  assertString(item.hook, `${path}.hook`, { min: 2, max: 180 });
  assertEnum(item.performanceBucket, `${path}.performanceBucket`, PERFORMANCE_BUCKETS);
}

export function validateNormalizedCreatorInput(input) {
  if (!isObject(input)) {
    throw new ApiError(422, "validation_error", "creatorInput must be an object");
  }

  assertEnum(input.source, "creatorInput.source", SOURCES);

  if (!isObject(input.profile)) {
    throw new ApiError(422, "validation_error", "creatorInput.profile must be an object");
  }
  assertString(input.profile.username, "creatorInput.profile.username", {
    min: 2,
    max: 30,
    pattern: /^[A-Za-z0-9._]+$/
  });
  if (input.profile.profileUrl !== null) {
    assertString(input.profile.profileUrl, "creatorInput.profile.profileUrl", {
      min: 8,
      max: 200,
      pattern: /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._]+\/?$/i
    });
  }
  assertString(input.profile.bio, "creatorInput.profile.bio", { min: 5, max: 300 });
  assertString(input.profile.language, "creatorInput.profile.language", {
    min: 2,
    max: 10,
    pattern: /^[a-z]{2}(-[A-Z]{2})?$/
  });
  assertEnum(input.profile.creatorLevel, "creatorInput.profile.creatorLevel", CREATOR_LEVELS);

  if (!isObject(input.strategy)) {
    throw new ApiError(422, "validation_error", "creatorInput.strategy must be an object");
  }
  assertString(input.strategy.niche, "creatorInput.strategy.niche", { min: 2, max: 100 });
  assertEnum(input.strategy.primaryGoal, "creatorInput.strategy.primaryGoal", PRIMARY_GOALS);

  if (!isObject(input.contentSignals)) {
    throw new ApiError(
      422,
      "validation_error",
      "creatorInput.contentSignals must be an object"
    );
  }
  assertArray(input.contentSignals.recentExamples || [], "creatorInput.contentSignals.recentExamples", 5);
  assertArray(input.contentSignals.bestExamples || [], "creatorInput.contentSignals.bestExamples", 3);

  for (const [index, item] of (input.contentSignals.recentExamples || []).entries()) {
    validateExample(item, `creatorInput.contentSignals.recentExamples[${index}]`);
  }
  for (const [index, item] of (input.contentSignals.bestExamples || []).entries()) {
    validateExample(item, `creatorInput.contentSignals.bestExamples[${index}]`);
  }

  if (!isObject(input.metadata)) {
    throw new ApiError(422, "validation_error", "creatorInput.metadata must be an object");
  }
  assertString(input.metadata.submittedAt, "creatorInput.metadata.submittedAt", {
    min: 20,
    max: 40
  });
  if (Number.isNaN(Date.parse(input.metadata.submittedAt))) {
    throw new ApiError(422, "validation_error", "creatorInput.metadata.submittedAt is invalid");
  }
  if (input.metadata.schemaVersion !== "v1") {
    throw new ApiError(422, "validation_error", "creatorInput.metadata.schemaVersion must be v1");
  }
}

export function validatePreviewOutput(output) {
  if (!isObject(output)) {
    throw new ApiError(502, "invalid_model_output", "preview output must be an object");
  }
  assertString(output.profile_summary, "preview.profile_summary", { min: 10, max: 600 });
  assertString(output.niche_angle, "preview.niche_angle", { min: 5, max: 200 });
  assertArray(output.video_ideas_preview, "preview.video_ideas_preview", 2);
  assertArray(output.hooks_preview, "preview.hooks_preview", 2);
  if (output.video_ideas_preview.length !== 2 || output.hooks_preview.length !== 2) {
    throw new ApiError(502, "invalid_model_output", "preview arrays must contain exactly 2 items");
  }
  output.video_ideas_preview.forEach((item, index) =>
    assertString(item, `preview.video_ideas_preview[${index}]`, { min: 5, max: 220 })
  );
  output.hooks_preview.forEach((item, index) =>
    assertString(item, `preview.hooks_preview[${index}]`, { min: 5, max: 180 })
  );
  assertString(output.profile_tip, "preview.profile_tip", { min: 5, max: 220 });

  assertArray(output.locked_calendar_teaser, "preview.locked_calendar_teaser", 7);
  if (output.locked_calendar_teaser.length !== 7) {
    throw new ApiError(
      502,
      "invalid_model_output",
      "preview.locked_calendar_teaser must contain exactly 7 days"
    );
  }
}

export function validateFullSprintOutput(output) {
  if (!isObject(output)) {
    throw new ApiError(502, "invalid_model_output", "full sprint output must be an object");
  }
  const requiredStrings = [
    "title",
    "creator_profile_summary",
    "strategy",
    "posting_tips",
    "next_actions"
  ];
  for (const field of requiredStrings) {
    assertString(output[field], `sprint.${field}`, { min: 5, max: 1_500 });
  }

  assertArray(output.content_pillars, "sprint.content_pillars", 5);
  assertArray(output.seven_day_plan, "sprint.seven_day_plan", 7);
  assertArray(output.video_ideas, "sprint.video_ideas", 15);
  assertArray(output.hooks, "sprint.hooks", 20);
  assertArray(output.captions, "sprint.captions", 14);
  assertArray(output.ctas, "sprint.ctas", 12);
  assertArray(output.profile_checklist, "sprint.profile_checklist", 12);

  if (output.seven_day_plan.length !== 7) {
    throw new ApiError(502, "invalid_model_output", "sprint.seven_day_plan must contain 7 days");
  }
}
