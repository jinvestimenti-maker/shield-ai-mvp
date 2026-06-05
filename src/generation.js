import { ApiError } from "./errors.js";
import {
  validateFullSprintOutput,
  validateNormalizedCreatorInput,
  validatePreviewOutput
} from "./contracts.js";

const GOAL_ACTION = {
  views: "maximize view-through rate with repeatable series hooks",
  followers: "convert non-followers using profile-aligned value loops",
  clients: "attract qualified leads with proof-led authority clips",
  consistency: "reduce production friction with template-based batch filming"
};

function toJsonText(value) {
  return JSON.stringify(value, null, 2);
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new ApiError(502, "invalid_model_output", "Model output is not parseable JSON");
  }
}

function buildPreviewDraft(input) {
  const goal = input.strategy.primaryGoal;
  const niche = input.strategy.niche;
  const username = input.profile.username;
  const topSignal = input.contentSignals.bestExamples[0] || input.contentSignals.recentExamples[0];
  const signalText = topSignal ? `${topSignal.format} about ${topSignal.topic}` : "short talking-head explainers";

  return {
    profile_summary: `@${username} creates ${niche} content for ${input.profile.language} audiences. Current level is ${input.profile.creatorLevel}.`,
    niche_angle: `Differentiate with practical ${niche} frameworks and rapid before/after examples.`,
    video_ideas_preview: [
      `${niche} myth vs reality in 30 seconds (${signalText})`,
      `3-step ${niche} quick-win for ${goal} this week`
    ],
    hooks_preview: [
      `If your ${goal} is stuck, copy this ${niche} pattern.`,
      `I tested this ${niche} format for 7 days, here is what changed.`
    ],
    profile_tip: `Pin one proof-based result video and add one CTA that targets ${goal}.`,
    locked_calendar_teaser: [
      "Day 1: Authority",
      "Day 2: Problem breakdown",
      "Day 3: Mini case study",
      "Day 4: Objection handling",
      "Day 5: Contrarian take",
      "Day 6: Story + lesson",
      "Day 7: Conversion recap"
    ]
  };
}

function buildFullSprintDraft(input) {
  const niche = input.strategy.niche;
  const goal = input.strategy.primaryGoal;
  const actionFocus = GOAL_ACTION[goal];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const theme = [
    "Audience pain point",
    "Framework walkthrough",
    "Transformation proof",
    "Behind-the-scenes process",
    "Common mistake fix",
    "Q&A response",
    "Weekly recap and CTA"
  ];

  const sevenDayPlan = days.map((day, index) => ({
    day,
    focus: theme[index],
    idea: `${niche}: ${theme[index]} with one concrete action`,
    hook: `Stop scrolling if you want better ${goal} from ${niche} content.`,
    cta: index === 6 ? "Follow for next week's sprint" : "Save this and test it today"
  }));

  return {
    title: `${niche} 7-Day Growth Sprint`,
    creator_profile_summary: `Creator is ${input.profile.creatorLevel} level, publishing in ${input.profile.language}, focused on ${niche}.`,
    strategy: `Primary goal is ${goal}; strategy is to ${actionFocus}.`,
    content_pillars: [
      `${niche} tutorials`,
      `${niche} mistakes to avoid`,
      `${niche} case studies`,
      `${niche} trend adaptation`
    ],
    seven_day_plan: sevenDayPlan,
    video_ideas: Array.from({ length: 12 }).map(
      (_item, index) => `${niche} video idea ${index + 1}: tactical lesson with clear outcome`
    ),
    hooks: Array.from({ length: 12 }).map(
      (_item, index) => `Hook ${index + 1}: This ${niche} shift changed my ${goal} in a week.`
    ),
    captions: Array.from({ length: 7 }).map(
      (_item, index) =>
        `Caption ${index + 1}: Practical ${niche} execution tip with one action step and one follow CTA.`
    ),
    ctas: [
      "Comment SPRINT for the worksheet",
      "Save this for your next filming block",
      "Follow for tomorrow's execution template"
    ],
    posting_tips:
      "Batch record 3 videos per session, keep first 2 seconds hook-first, and reuse proven format structures.",
    profile_checklist: [
      "Headline states niche and value in one line",
      "Pinned post shows strongest transformation",
      "CTA points to one conversion action",
      "Profile photo and banner are consistent"
    ],
    next_actions:
      "Execute Day 1 and Day 2 in the next 24 hours, then review retention and saves before filming Days 3-4."
  };
}

class DeterministicModel {
  async generatePreview(input) {
    return toJsonText(buildPreviewDraft(input));
  }

  async generateFullSprint(input) {
    return toJsonText(buildFullSprintDraft(input));
  }

  async repair(kind, input) {
    return kind === "preview"
      ? toJsonText(buildPreviewDraft(input))
      : toJsonText(buildFullSprintDraft(input));
  }
}

export class GenerationService {
  constructor(model = new DeterministicModel()) {
    this.model = model;
  }

  async generatePreview(creatorInput) {
    validateNormalizedCreatorInput(creatorInput);
    return this.#generateWithGuardrails("preview", creatorInput, validatePreviewOutput);
  }

  async generateFullSprint(creatorInput) {
    validateNormalizedCreatorInput(creatorInput);
    return this.#generateWithGuardrails("full_sprint", creatorInput, validateFullSprintOutput);
  }

  async #generateWithGuardrails(kind, creatorInput, validateOutput) {
    const attempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const raw =
          kind === "preview"
            ? await this.model.generatePreview(creatorInput)
            : await this.model.generateFullSprint(creatorInput);
        const json = safeParseJson(raw);
        validateOutput(json);
        return {
          output: json,
          generationMeta: { provider: "deterministic-local", attempt }
        };
      } catch (error) {
        lastError = error;
        if (attempt === attempts) {
          break;
        }
        const repairedRaw = await this.model.repair(kind, creatorInput, error);
        try {
          const repairedJson = safeParseJson(repairedRaw);
          validateOutput(repairedJson);
          return {
            output: repairedJson,
            generationMeta: { provider: "deterministic-local", attempt, repaired: true }
          };
        } catch (repairError) {
          lastError = repairError;
        }
      }
    }

    if (lastError instanceof ApiError) {
      throw lastError;
    }
    throw new ApiError(502, "generation_failed", "Generation failed after retry");
  }
}
