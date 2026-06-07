import { ApiError } from "./errors.js";
import {
  validateFullSprintOutput,
  validateNormalizedCreatorInput,
  validatePreviewOutput
} from "./contracts.js";

function safeParseJson(raw) {
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new ApiError(502, "invalid_model_output", "Model output is not parseable JSON");
  }
}

function buildProfileContext(input) {
  const { profile, strategy, contentSignals } = input;
  const recentLines = (contentSignals.recentExamples || [])
    .map((v, i) => `  ${i+1}. Format: "${v.format}" | Topic: "${v.topic}" | Performance: ${v.performanceBucket}`).join("\n");
  const bestLines = (contentSignals.bestExamples || [])
    .map((v, i) => `  ${i+1}. Format: "${v.format}" | Topic: "${v.topic}"`).join("\n");
  return `
CREATOR PROFILE:
- Username: @${profile.username}
- Bio: "${profile.bio}"
- Language: ${profile.language}
- Level: ${profile.creatorLevel}
- Niche: ${strategy.niche}
- Primary goal: ${strategy.primaryGoal}

RECENT VIDEOS:
${recentLines || "  No data"}

BEST VIDEOS:
${bestLines || "  No data"}`.trim();
}

function buildAnalysisPrompt(input) {
  return `You are Shield AI, an expert TikTok growth analyst. Analyze this creator and return ONLY valid JSON, no markdown.

IMPORTANT: Write ALL text values (score_explanation, punti_di_forza, errori_principali, opportunita, suggerimento_bio, benchmark_note) entirely in the language "${input.profile.language}" — the creator's profile language. Do not switch to English unless "${input.profile.language}" is English.

${buildProfileContext(input)}

Return this exact JSON structure:
{
  "growth_score": <integer 0-100>,
  "score_explanation": "<2-3 sentences explaining the score>",
  "punti_di_forza": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "errori_principali": ["<mistake 1 with fix>", "<mistake 2 with fix>", "<mistake 3 with fix>"],
  "opportunita": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "suggerimento_bio": "<rewritten bio max 80 chars>",
  "benchmark_note": "<how this creator compares to similar ${input.profile.creatorLevel} creators in ${input.strategy.niche}>"
}`;
}

function buildPreviewPrompt(input) {
  return `You are Shield AI. Give this creator a preview of their growth plan. Return ONLY valid JSON, no markdown.

${buildProfileContext(input)}

Return this exact JSON structure:
{
  "profile_summary": "<2 sentences: who they are and their main gap>",
  "niche_angle": "<their unique angle in ${input.strategy.niche}>",
  "video_ideas_preview": ["<idea 1 specific to niche>", "<idea 2 specific to niche>"],
  "hooks_preview": ["<viral hook 1 in ${input.profile.language}>", "<viral hook 2 in ${input.profile.language}>"],
  "profile_tip": "<one specific actionable tip>",
  "locked_calendar_teaser": ["Day 1: <theme>","Day 2: <theme>","Day 3: <theme>","Day 4: <theme>","Day 5: <theme>","Day 6: <theme>","Day 7: <theme>"]
}`;
}

function buildFullSprintPrompt(input) {
  return `You are Shield AI. Generate a complete 7-day TikTok growth sprint. Return ONLY valid JSON, no markdown.

${buildProfileContext(input)}

Return this exact JSON structure:
{
  "title": "<sprint title>",
  "creator_profile_summary": "<3 sentences about this creator and what the sprint achieves>",
  "strategy": "<2-3 sentences on the strategic approach for goal: ${input.strategy.primaryGoal}>",
  "content_pillars": ["<pillar 1>","<pillar 2>","<pillar 3>","<pillar 4>"],
  "seven_day_plan": [
    {"day":"Lun","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Mar","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Mer","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Gio","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Ven","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Sab","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"},
    {"day":"Dom","focus":"<theme>","idea":"<specific video idea>","hook":"<hook in ${input.profile.language}>","cta":"<cta>"}
  ],
  "video_ideas": ["<idea 1>","<idea 2>","<idea 3>","<idea 4>","<idea 5>","<idea 6>","<idea 7>","<idea 8>","<idea 9>","<idea 10>","<idea 11>","<idea 12>"],
  "hooks": ["<hook 1>","<hook 2>","<hook 3>","<hook 4>","<hook 5>","<hook 6>","<hook 7>","<hook 8>","<hook 9>","<hook 10>","<hook 11>","<hook 12>"],
  "captions": ["<caption 1>","<caption 2>","<caption 3>","<caption 4>","<caption 5>","<caption 6>","<caption 7>"],
  "ctas": ["<cta 1>","<cta 2>","<cta 3>"],
  "posting_tips": "<specific tips for their niche and goal>",
  "profile_checklist": ["<item 1>","<item 2>","<item 3>","<item 4>","<item 5>"],
  "next_actions": "<concrete first 3 actions in next 24 hours>"
}`;
}

class OpenAIModel {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async call(prompt) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          { role: "system", content: "You are Shield AI. Always respond with valid JSON only. No markdown, no explanation." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) throw new ApiError(502, "openai_error", `OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async generateAnalysis(input) { return this.call(buildAnalysisPrompt(input)); }
  async generatePreview(input) { return this.call(buildPreviewPrompt(input)); }
  async generateFullSprint(input) { return this.call(buildFullSprintPrompt(input)); }
  async repair(kind, input) {
    if (kind === "analysis") return this.generateAnalysis(input);
    if (kind === "preview") return this.generatePreview(input);
    return this.generateFullSprint(input);
  }
}

class DeterministicModel {
  async generateAnalysis(input) {
    return JSON.stringify({
      growth_score: 42,
      score_explanation: `@${input.profile.username} is a ${input.profile.creatorLevel} creator. Connect OpenAI API key for real analysis.`,
      punti_di_forza: ["Content exists", "Niche is defined", "Goal is clear"],
      errori_principali: ["OpenAI not connected — real analysis unavailable"],
      opportunita: ["Connect OpenAI API key to get real insights"],
      suggerimento_bio: input.profile.bio,
      benchmark_note: "Real benchmark requires OpenAI API key."
    });
  }

  async generatePreview(input) {
    const { profile, strategy, contentSignals } = input;
    const topSignal = contentSignals.bestExamples[0] || contentSignals.recentExamples[0];
    const signalText = topSignal ? `${topSignal.format} about ${topSignal.topic}` : "short explainers";
    return JSON.stringify({
      profile_summary: `@${profile.username} creates ${strategy.niche} content. Level: ${profile.creatorLevel}.`,
      niche_angle: `Differentiate with practical ${strategy.niche} frameworks.`,
      video_ideas_preview: [`${strategy.niche} myth vs reality (${signalText})`, `3-step ${strategy.niche} quick-win`],
      hooks_preview: [`Se vuoi più ${strategy.primaryGoal}, copia questo schema.`, `Ho testato questo formato per 7 giorni.`],
      profile_tip: `Pin your best ${strategy.niche} result video.`,
      locked_calendar_teaser: ["Day 1: Authority","Day 2: Problem","Day 3: Case study","Day 4: Objection","Day 5: Contrarian","Day 6: Story","Day 7: CTA"]
    });
  }

  async generateFullSprint(input) {
    const { strategy, profile } = input;
    const days = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
    const themes = ["Authority","Problem","Proof","Process","Mistake fix","Q&A","CTA recap"];
    return JSON.stringify({
      title: `${strategy.niche} 7-Day Growth Sprint`,
      creator_profile_summary: `Creator is ${profile.creatorLevel} level in ${strategy.niche}.`,
      strategy: `Focus on ${strategy.primaryGoal} through consistent ${strategy.niche} content.`,
      content_pillars: [`${strategy.niche} tutorials`,`${strategy.niche} mistakes`,`${strategy.niche} results`,`${strategy.niche} trends`],
      seven_day_plan: days.map((day, i) => ({ day, focus: themes[i], idea: `${strategy.niche}: ${themes[i]}`, hook: `Smetti di scorrere se vuoi migliorare il tuo ${strategy.primaryGoal}.`, cta: i === 6 ? "Seguimi" : "Salva questo video" })),
      video_ideas: Array.from({length:12},(_,i)=>`${strategy.niche} idea ${i+1}`),
      hooks: Array.from({length:12},(_,i)=>`Hook ${i+1}: ${strategy.niche} tip`),
      captions: Array.from({length:7},(_,i)=>`Caption ${i+1}: ${strategy.niche} tip`),
      ctas: ["Commenta SPRINT","Salva per dopo","Seguimi"],
      posting_tips: "Post 3x/week, hook-first, batch record.",
      profile_checklist: ["Bio chiara","Video pinnato","CTA visibile","Foto coerente","Link in bio"],
      next_actions: "Gira il video del Giorno 1 nelle prossime 24 ore."
    });
  }

  async repair(kind, input) {
    if (kind === "analysis") return this.generateAnalysis(input);
    if (kind === "preview") return this.generatePreview(input);
    return this.generateFullSprint(input);
  }
}

function validateAnalysisOutput(output) {
  if (!output || typeof output !== "object") throw new ApiError(502, "invalid_model_output", "analysis must be object");
  if (typeof output.growth_score !== "number" || output.growth_score < 0 || output.growth_score > 100)
    throw new ApiError(502, "invalid_model_output", "growth_score must be 0-100");
  if (!Array.isArray(output.punti_di_forza) || !Array.isArray(output.errori_principali) || !Array.isArray(output.opportunita))
    throw new ApiError(502, "invalid_model_output", "analysis arrays missing");
}

export class GenerationService {
  constructor(apiKey = null) {
    this.model = apiKey ? new OpenAIModel(apiKey) : new DeterministicModel();
    this.usingAI = !!apiKey;
  }

  async generateAnalysis(creatorInput) {
    validateNormalizedCreatorInput(creatorInput);
    return this.#run("analysis", creatorInput, validateAnalysisOutput);
  }

  async generatePreview(creatorInput) {
    validateNormalizedCreatorInput(creatorInput);
    return this.#run("preview", creatorInput, validatePreviewOutput);
  }

  async generateFullSprint(creatorInput) {
    validateNormalizedCreatorInput(creatorInput);
    return this.#run("full_sprint", creatorInput, validateFullSprintOutput);
  }

  async #run(kind, creatorInput, validateOutput) {
    const provider = this.usingAI ? "openai-gpt-4o-mini" : "deterministic-local";
    let lastError = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let raw;
        if (kind === "analysis") raw = await this.model.generateAnalysis(creatorInput);
        else if (kind === "preview") raw = await this.model.generatePreview(creatorInput);
        else raw = await this.model.generateFullSprint(creatorInput);
        const json = safeParseJson(raw);
        validateOutput(json);
        return { output: json, generationMeta: { provider, attempt } };
      } catch (error) {
        lastError = error;
        if (attempt === 2) break;
        try {
          const repairedRaw = await this.model.repair(kind, creatorInput);
          const repairedJson = safeParseJson(repairedRaw);
          validateOutput(repairedJson);
          return { output: repairedJson, generationMeta: { provider, attempt, repaired: true } };
        } catch (e) { lastError = e; }
      }
    }
    if (lastError instanceof ApiError) throw lastError;
    throw new ApiError(502, "generation_failed", "Generation failed after retry");
  }
}
