import { Router } from "express";
import { ApifyClient } from "apify-client";
import { ApiError, asyncHandler } from "../src/errors.js";

const router = Router();

const APIFY_ACTOR_ID = "compass/crawler-google-places";

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

async function fetchGoogleMapsData({ businessName, location }) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new ApiError(500, "config_error", "APIFY_TOKEN is not configured");
  }

  const client = new ApifyClient({ token });
  const run = await client.actor(APIFY_ACTOR_ID).call({
    searchStringsArray: [`${businessName} ${location}`.trim()],
    maxCrawledPlacesPerSearch: 1,
    language: "it"
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  if (!items || items.length === 0) {
    throw new ApiError(404, "not_found", "No Google Maps data found for this business");
  }
  return items[0];
}

function buildAnalysisPrompt(place, businessInfo) {
  return `You are Shield AI, an expert local business growth analyst. Analyze this business's online presence based on its Google Maps data and return ONLY valid JSON, no markdown.

BUSINESS INPUT:
- Name: ${businessInfo.businessName}
- Location: ${businessInfo.location}

GOOGLE MAPS DATA:
- Title: ${place.title || "N/A"}
- Category: ${place.categoryName || "N/A"}
- Address: ${place.address || "N/A"}
- Rating: ${place.totalScore ?? "N/A"}
- Reviews count: ${place.reviewsCount ?? "N/A"}
- Website: ${place.website || "N/A"}
- Phone: ${place.phone || "N/A"}
- Opening hours: ${JSON.stringify(place.openingHours || [])}

Return this exact JSON structure:
{
  "growth_score": <integer 0-100>,
  "score_explanation": "<2-3 sentences explaining the score>",
  "punti_di_forza": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "errori_principali": ["<mistake 1 with fix>", "<mistake 2 with fix>", "<mistake 3 with fix>"],
  "opportunita": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "next_actions": "<concrete first 3 actions to improve online presence>"
}`;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, "config_error", "OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are Shield AI. Always respond with valid JSON only. No markdown, no explanation."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new ApiError(502, "openai_error", `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

router.post(
  "/analyze-business",
  asyncHandler(async (req, res) => {
    const businessName = req.body?.businessName;
    const location = req.body?.location;
    if (!businessName || !location) {
      throw new ApiError(400, "validation_error", "businessName and location are required");
    }

    const place = await fetchGoogleMapsData({ businessName, location });
    const prompt = buildAnalysisPrompt(place, { businessName, location });
    const raw = await callOpenAI(prompt);
    const analysis = safeParseJson(raw);

    res.json({
      business: {
        name: place.title || businessName,
        address: place.address || location,
        category: place.categoryName || null,
        rating: place.totalScore ?? null,
        reviewsCount: place.reviewsCount ?? null,
        website: place.website || null,
        phone: place.phone || null
      },
      analysis
    });
  })
);

export default router;
