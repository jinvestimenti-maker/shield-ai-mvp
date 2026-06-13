import { Router } from "express";
import { fal } from "@fal-ai/client";
import { ApiError, asyncHandler } from "../src/errors.js";

const router = Router();

const FAL_MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";

let falConfigured = false;

function ensureFalConfigured() {
  if (falConfigured) {
    return;
  }
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new ApiError(500, "config_error", "FAL_KEY non configurata");
  }
  fal.config({ credentials: falKey });
  falConfigured = true;
}

// HTTP Basic Auth gate: username is irrelevant, password must match ADMIN_KEY.
export function requireAdmin(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    next(new ApiError(500, "config_error", "ADMIN_KEY non configurata"));
    return;
  }

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");
  let password = null;
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    password = decoded.split(":").slice(1).join(":");
  }

  if (password !== adminKey) {
    res.set("WWW-Authenticate", 'Basic realm="Shield AI Admin"');
    next(new ApiError(401, "unauthorized", "Accesso negato"));
    return;
  }

  next();
}

function resolveStartImageUrl(body) {
  const { imageUrl, imageBase64, mimeType } = body || {};
  if (imageUrl) {
    return imageUrl;
  }
  if (imageBase64) {
    return `data:${mimeType || "image/png"};base64,${imageBase64}`;
  }
  throw new ApiError(
    400,
    "validation_error",
    "Fornisci 'imageUrl' oppure 'imageBase64' (opzionalmente con 'mimeType')"
  );
}

router.post(
  "/admin/generate-video",
  requireAdmin,
  asyncHandler(async (req, res) => {
    ensureFalConfigured();

    const startImageUrl = resolveStartImageUrl(req.body);
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";

    const { request_id: requestId } = await fal.queue.submit(FAL_MODEL, {
      input: {
        prompt,
        start_image_url: startImageUrl
      }
    });

    res.json({ requestId });
  })
);

router.get(
  "/admin/generate-video/:requestId/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    ensureFalConfigured();

    const status = await fal.queue.status(FAL_MODEL, {
      requestId: req.params.requestId,
      logs: true
    });

    res.json(status);
  })
);

router.get(
  "/admin/generate-video/:requestId/result",
  requireAdmin,
  asyncHandler(async (req, res) => {
    ensureFalConfigured();

    const result = await fal.queue.result(FAL_MODEL, {
      requestId: req.params.requestId
    });

    const videoUrl = result?.data?.video?.url;
    if (!videoUrl) {
      throw new ApiError(502, "invalid_model_output", "fal.ai non ha restituito un video", {
        source: result?.data
      });
    }

    res.json({ videoUrl });
  })
);

router.get("/admin/generate-video", requireAdmin, (_req, res) => {
  res.type("html").send(renderAdminGenerateVideoPage());
});

function renderAdminGenerateVideoPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin · Genera Reel (image-to-video)</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      max-width: 640px; margin: 2rem auto; padding: 0 1rem;
      color: #161a2b; background: #f7f8fc;
    }
    h1 { font-size: 1.25rem; margin-bottom: .25rem; }
    p.hint { color: #6b7280; font-size: .85rem; margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; font-size: .85rem; margin: 1rem 0 .25rem; }
    input[type="text"], input[type="url"], textarea {
      width: 100%; padding: .5rem .6rem; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: .9rem; font-family: inherit;
    }
    textarea { resize: vertical; min-height: 60px; }
    .row { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; }
    button {
      margin-top: 1.25rem; padding: .6rem 1.2rem; border: none; border-radius: 6px;
      background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; font-size: .9rem;
    }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    #status { margin-top: 1rem; font-size: .85rem; color: #4b5066; white-space: pre-wrap; }
    #result { margin-top: 1.25rem; }
    #result video { max-width: 100%; border-radius: 8px; }
    #result a { display: inline-block; margin-top: .5rem; font-size: .9rem; }
    .error { color: #dc2626; }
  </style>
</head>
<body>
  <h1>Genera Reel (image-to-video)</h1>
  <p class="hint">Strumento interno admin. Input: immagine (URL o base64) + prompt opzionale &rarr; mp4 via fal.ai Kling.</p>

  <label for="imageUrl">URL immagine</label>
  <input type="url" id="imageUrl" placeholder="https://...">

  <label for="imageBase64">...oppure carica un'immagine</label>
  <input type="file" id="imageFile" accept="image/*">

  <label for="prompt">Prompt movimento (opzionale)</label>
  <textarea id="prompt" placeholder="es. slow zoom in, gentle camera pan"></textarea>

  <button id="generateBtn">Genera video</button>

  <div id="status"></div>
  <div id="result"></div>

  <script>
    var imageUrlEl = document.getElementById("imageUrl");
    var imageFileEl = document.getElementById("imageFile");
    var promptEl = document.getElementById("prompt");
    var generateBtn = document.getElementById("generateBtn");
    var statusEl = document.getElementById("status");
    var resultEl = document.getElementById("result");

    var fileBase64 = null;
    var fileMimeType = null;

    imageFileEl.addEventListener("change", function () {
      var file = imageFileEl.files && imageFileEl.files[0];
      if (!file) { fileBase64 = null; fileMimeType = null; return; }
      fileMimeType = file.type;
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        fileBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      };
      reader.readAsDataURL(file);
    });

    function setStatus(text, isError) {
      statusEl.textContent = text || "";
      statusEl.className = isError ? "error" : "";
    }

    function poll(requestId) {
      fetch("/admin/generate-video/" + requestId + "/status")
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) {
            setStatus("Errore: " + ((r.data.error && r.data.error.message) || "status check failed"), true);
            generateBtn.disabled = false;
            return;
          }
          var s = r.data.status;
          setStatus("Stato: " + s + (r.data.logs ? "\\n" + r.data.logs.map(function (l) { return l.message; }).join("\\n") : ""));
          if (s === "COMPLETED") {
            fetchResult(requestId);
          } else {
            setTimeout(function () { poll(requestId); }, 4000);
          }
        })
        .catch(function () {
          setStatus("Errore di rete durante il polling.", true);
          generateBtn.disabled = false;
        });
    }

    function fetchResult(requestId) {
      fetch("/admin/generate-video/" + requestId + "/result")
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          generateBtn.disabled = false;
          if (!r.ok) {
            setStatus("Errore: " + ((r.data.error && r.data.error.message) || "result failed"), true);
            return;
          }
          setStatus("Completato.");
          var videoUrl = r.data.videoUrl;
          resultEl.innerHTML = '<video controls src="' + videoUrl + '"></video><br>' +
            '<a href="' + videoUrl + '" target="_blank" download>Scarica mp4</a>';
        })
        .catch(function () {
          setStatus("Errore di rete nel recupero del risultato.", true);
          generateBtn.disabled = false;
        });
    }

    generateBtn.addEventListener("click", function () {
      var imageUrl = imageUrlEl.value.trim();
      if (!imageUrl && !fileBase64) {
        setStatus("Fornisci un URL immagine o carica un file.", true);
        return;
      }

      var body = { prompt: promptEl.value.trim() };
      if (imageUrl) {
        body.imageUrl = imageUrl;
      } else {
        body.imageBase64 = fileBase64;
        body.mimeType = fileMimeType;
      }

      generateBtn.disabled = true;
      resultEl.innerHTML = "";
      setStatus("Invio richiesta...");

      fetch("/admin/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) {
            setStatus("Errore: " + ((r.data.error && r.data.error.message) || "richiesta fallita"), true);
            generateBtn.disabled = false;
            return;
          }
          setStatus("In coda (requestId: " + r.data.requestId + ")...");
          poll(r.data.requestId);
        })
        .catch(function () {
          setStatus("Errore di rete.", true);
          generateBtn.disabled = false;
        });
    });
  </script>
</body>
</html>`;
}

export default router;
