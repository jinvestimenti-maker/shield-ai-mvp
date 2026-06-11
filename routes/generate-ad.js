import { Router } from "express";
import multer from "multer";
import { ApiError, asyncHandler } from "../src/errors.js";
import { AD_STYLES, AD_STYLE_KEYS, isValidAdStyle } from "../config/adStyles.js";

const router = Router();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const MAX_GENERATIONS_PER_DAY = 3;
const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new ApiError(400, "invalid_file_type", "Sono accettati solo file JPG o PNG"));
      return;
    }
    cb(null, true);
  }
});

function uploadMiddleware(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "file_too_large", "L'immagine supera il limite di 5MB"));
      return;
    }
    next(err);
  });
}

// In-memory rate limiting: max MAX_GENERATIONS_PER_DAY generations per IP per day.
const rateLimitStore = new Map();

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function assertRateLimitNotExceeded(ip) {
  const entry = rateLimitStore.get(ip);
  const today = getTodayKey();
  if (entry && entry.date === today && entry.count >= MAX_GENERATIONS_PER_DAY) {
    throw new ApiError(
      429,
      "rate_limit_exceeded",
      `Limite di ${MAX_GENERATIONS_PER_DAY} generazioni al giorno raggiunto. Riprova domani.`
    );
  }
}

function recordGeneration(ip) {
  const today = getTodayKey();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.date !== today) {
    rateLimitStore.set(ip, { date: today, count: 1 });
    return;
  }
  entry.count += 1;
}

async function callGeminiImageEdit({ apiKey, prompt, imageBuffer, mimeType }) {
  let response;
  try {
    response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString("base64")
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    });
  } catch (error) {
    throw new ApiError(502, "gemini_unreachable", "Impossibile contattare Gemini API", {
      message: error.message
    });
  }

  if (!response.ok) {
    let details;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(502, "gemini_error", `Gemini API error: ${response.status}`, {
      source: details
    });
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData || part.inline_data);
  if (!imagePart) {
    throw new ApiError(502, "invalid_model_output", "Gemini non ha restituito un'immagine", {
      source: data
    });
  }

  const inline = imagePart.inlineData || imagePart.inline_data;
  return {
    mimeType: inline.mimeType || inline.mime_type || "image/png",
    data: inline.data
  };
}

router.post(
  "/generate-ad",
  uploadMiddleware,
  asyncHandler(async (req, res) => {
    const ip = getClientIp(req);
    assertRateLimitNotExceeded(ip);

    if (!req.file) {
      throw new ApiError(400, "validation_error", "Campo 'photo' (immagine jpg/png) obbligatorio");
    }

    const style = req.body?.style;
    if (!style || !isValidAdStyle(style)) {
      throw new ApiError(
        400,
        "validation_error",
        `Il campo 'style' deve essere uno tra: ${AD_STYLE_KEYS.join(", ")}`
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, "config_error", "GEMINI_API_KEY non configurata");
    }

    const template = AD_STYLES[style];
    const generated = await callGeminiImageEdit({
      apiKey,
      prompt: template.prompt,
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype
    });

    recordGeneration(ip);

    res.json({
      style,
      image: {
        mimeType: generated.mimeType,
        base64: generated.data
      }
    });
  })
);

export default router;
