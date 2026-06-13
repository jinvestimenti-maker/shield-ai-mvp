import { Router } from "express";
import { requireAdmin } from "./admin-generate-video.js";

const router = Router();

router.get("/admin/studio", requireAdmin, (_req, res) => {
  res.type("html").send(renderAdminStudioPage());
});

function renderAdminStudioPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin · Studio Demo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      max-width: 720px; margin: 2rem auto; padding: 0 1rem;
      color: #161a2b; background: #f7f8fc;
    }
    h1 { font-size: 1.25rem; margin-bottom: .25rem; }
    h2 { font-size: 1.1rem; margin: 0 0 .25rem; }
    h4 { font-size: .85rem; margin: 1rem 0 .35rem; }
    p.hint { color: #6b7280; font-size: .85rem; margin-bottom: 1.5rem; }

    /* stepper */
    .stepper { display: flex; gap: .5rem; margin-bottom: 1.5rem; }
    .step-pill {
      flex: 1; text-align: center; padding: .5rem .25rem; border-radius: 6px;
      font-size: .75rem; font-weight: 600; color: #9095ab; background: #eef0f7;
    }
    .step-pill.active { color: #fff; background: #2563eb; }
    .step-pill.done { color: #16a34a; background: #eaf7ef; }

    /* steps */
    .step { display: none; }
    .step.active { display: block; }

    /* forms */
    label { display: block; font-weight: 600; font-size: .85rem; margin: 1rem 0 .25rem; }
    label:first-of-type { margin-top: 0; }
    input[type="text"], input[type="file"], textarea {
      width: 100%; padding: .5rem .6rem; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: .9rem; font-family: inherit;
    }
    textarea { resize: vertical; min-height: 60px; }

    button {
      padding: .6rem 1.2rem; border: none; border-radius: 6px;
      font-weight: 600; cursor: pointer; font-size: .9rem;
    }
    button.primary { background: #2563eb; color: #fff; }
    button.secondary { background: #e7e9f2; color: #161a2b; }
    button:disabled { background: #9ca3af; color: #fff; cursor: not-allowed; }

    .status-msg { margin-top: .6rem; font-size: .85rem; color: #4b5066; white-space: pre-wrap; }
    .status-msg.error { color: #dc2626; }

    /* step 1: analysis result */
    .score-row { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
    .score-badge {
      flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; color: #fff; background: #9ca3af;
    }
    .score-badge.good { background: #16a34a; }
    .score-badge.mid  { background: #f97316; }
    .score-badge.bad  { background: #dc2626; }
    .biz-name { font-weight: 700; font-size: 1rem; }
    .biz-meta { color: #6b7280; font-size: .85rem; }
    .cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: .5rem; }
    .cols h4 { margin-top: 0; }
    ul.plain { margin: 0; padding-left: 1.1rem; font-size: .85rem; }
    ul.plain li { margin-bottom: .35rem; }

    /* step 2: ad generator */
    .style-options { display: flex; gap: .6rem; margin-top: .25rem; }
    .style-opt {
      flex: 1; padding: .6rem; border: 2px solid #e7e9f2; border-radius: 8px;
      cursor: pointer; font-size: .8rem; text-align: center;
    }
    .style-opt strong { display: block; font-size: .85rem; margin-bottom: .15rem; }
    .style-opt.selected { border-color: #2563eb; background: #eef2ff; }
    .preview-img { max-width: 220px; border-radius: 8px; display: block; margin-top: .6rem; }
    .result-img { max-width: 100%; border-radius: 8px; display: block; }

    /* step 3 / presentation video */
    video { max-width: 100%; border-radius: 8px; display: block; }

    /* nav */
    .nav { display: flex; justify-content: space-between; margin-top: 1.5rem; }

    /* presentation */
    .presentation { margin-top: .5rem; }
    .pres-media { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    @media (max-width: 600px) { .cols, .pres-media { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Studio Demo</h1>
  <p class="hint">Strumento interno admin: dal nome del business alla demo pronta da mostrare.</p>

  <div class="stepper">
    <div class="step-pill" data-step="1">1. Analisi</div>
    <div class="step-pill" data-step="2">2. Annuncio</div>
    <div class="step-pill" data-step="3">3. Video</div>
    <div class="step-pill" data-step="4">4. Presentazione</div>
  </div>

  <!-- STEP 1: Analisi business -->
  <section class="step" data-step="1">
    <label for="bizName">Nome business</label>
    <input type="text" id="bizName" placeholder="es. Trattoria Da Mario">

    <label for="bizLocation">Città / location</label>
    <input type="text" id="bizLocation" placeholder="es. Milano">

    <label for="bizInstagram">Handle Instagram (opzionale, solo per la demo)</label>
    <input type="text" id="bizInstagram" placeholder="@mario_trattoria">

    <button id="analyzeBtn" class="primary" style="margin-top:1rem;">Analizza</button>
    <div id="analyzeStatus" class="status-msg"></div>

    <div id="analyzeResult" style="display:none;">
      <div class="score-row">
        <div class="score-badge" id="scoreBadge">—</div>
        <div>
          <div class="biz-name" id="bizNameOut">—</div>
          <div class="biz-meta" id="bizMetaOut">—</div>
        </div>
      </div>
      <p id="scoreExplanation" style="margin-top:.75rem; font-size:.9rem;"></p>
      <div class="cols">
        <div>
          <h4>Punti di forza</h4>
          <ul class="plain" id="forzeList"></ul>
        </div>
        <div>
          <h4>Errori</h4>
          <ul class="plain" id="erroriList"></ul>
        </div>
        <div>
          <h4>Opportunità</h4>
          <ul class="plain" id="opportunitaList"></ul>
        </div>
      </div>
      <h4>Idee contenuti</h4>
      <ul class="plain" id="ideeList"></ul>
      <h4>Prossime azioni</h4>
      <p id="nextActions" style="font-size:.85rem;"></p>
    </div>
  </section>

  <!-- STEP 2: Generazione annuncio -->
  <section class="step" data-step="2">
    <label for="adPhoto">Foto prodotto/locale (jpg/png, max 5MB)</label>
    <input type="file" id="adPhoto" accept="image/jpeg,image/png">
    <img id="adPhotoPreview" class="preview-img" style="display:none;">

    <label>Stile annuncio</label>
    <div class="style-options">
      <div class="style-opt" data-style="floating">
        <strong>Floating</strong>
        Fotografia da studio, vortice e splash
      </div>
      <div class="style-opt" data-style="minimal">
        <strong>Minimal</strong>
        Sfondo chiaro, ombre morbide
      </div>
      <div class="style-opt" data-style="social">
        <strong>Social</strong>
        Lifestyle, luce naturale
      </div>
    </div>

    <button id="genAdBtn" class="primary" style="margin-top:1rem;">Genera annuncio</button>
    <div id="genAdStatus" class="status-msg"></div>

    <div id="adResult" style="display:none; margin-top:1.25rem;">
      <h4 style="margin-top:0;">Annuncio generato</h4>
      <img id="adResultImg" class="result-img">
    </div>
  </section>

  <!-- STEP 3: Generazione video -->
  <section class="step" data-step="3">
    <p style="font-size:.85rem; color:#6b7280;">Immagine selezionata (dallo Step 2):</p>
    <img id="videoSourceImg" class="preview-img">

    <label for="videoPrompt">Prompt movimento (opzionale)</label>
    <textarea id="videoPrompt" placeholder="es. slow zoom in, gentle camera pan"></textarea>

    <button id="genVideoBtn" class="primary" style="margin-top:1rem;">Genera video</button>
    <div id="genVideoStatus" class="status-msg"></div>

    <div id="videoResult" style="display:none; margin-top:1.25rem;">
      <h4 style="margin-top:0;">Video generato</h4>
      <video id="videoResultPlayer" controls></video>
    </div>
  </section>

  <!-- STEP 4: Presentazione -->
  <section class="step" data-step="4">
    <div class="presentation">
      <div class="score-row">
        <div class="score-badge" id="presScoreBadge">—</div>
        <div>
          <h2 id="presBizName">—</h2>
          <div class="biz-meta" id="presBizMeta"></div>
        </div>
      </div>
      <p id="presScoreExplanation" style="margin-top:.75rem; font-size:.9rem;"></p>
      <div class="cols">
        <div>
          <h4>Punti di forza</h4>
          <ul class="plain" id="presForzeList"></ul>
        </div>
        <div>
          <h4>Errori</h4>
          <ul class="plain" id="presErroriList"></ul>
        </div>
        <div>
          <h4>Opportunità</h4>
          <ul class="plain" id="presOpportunitaList"></ul>
        </div>
      </div>
      <div class="pres-media">
        <div>
          <h4 style="margin-top:0;">Annuncio</h4>
          <img id="presAdImg" class="result-img">
        </div>
        <div>
          <h4 style="margin-top:0;">Video</h4>
          <video id="presVideo" controls></video>
        </div>
      </div>
    </div>
    <button id="resetBtn" class="secondary" style="margin-top:1.5rem;">Nuova demo</button>
  </section>

  <div class="nav">
    <button id="backBtn" class="secondary">Indietro</button>
    <button id="nextBtn" class="primary">Avanti</button>
  </div>

  <script>
    var TOTAL_STEPS = 4;
    var currentStep = 1;

    // Shared state passed between steps.
    var state = {
      businessName: null,
      location: null,
      instagram: null,
      business: null,
      analysis: null,
      adImageBase64: null,
      adImageMimeType: null,
      videoUrl: null
    };

    var stepEls = document.querySelectorAll(".step");
    var pillEls = document.querySelectorAll(".step-pill");
    var backBtn = document.getElementById("backBtn");
    var nextBtn = document.getElementById("nextBtn");

    function setStatus(el, text, isError) {
      el.textContent = text || "";
      el.className = "status-msg" + (isError ? " error" : "");
    }

    function setList(ulId, items) {
      var ul = document.getElementById(ulId);
      ul.innerHTML = "";
      (items || []).forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }

    function scoreClass(score) {
      if (typeof score !== "number") return "";
      if (score >= 70) return "good";
      if (score >= 40) return "mid";
      return "bad";
    }

    function canAdvance(step) {
      if (step === 1) return !!state.analysis;
      if (step === 2) return !!state.adImageBase64;
      if (step === 3) return !!state.videoUrl;
      return false;
    }

    function render() {
      stepEls.forEach(function (el) {
        el.classList.toggle("active", Number(el.dataset.step) === currentStep);
      });
      pillEls.forEach(function (el) {
        var n = Number(el.dataset.step);
        el.classList.toggle("active", n === currentStep);
        el.classList.toggle("done", n < currentStep);
      });
      backBtn.disabled = currentStep === 1;
      if (currentStep === TOTAL_STEPS) {
        nextBtn.style.display = "none";
      } else {
        nextBtn.style.display = "inline-block";
        nextBtn.textContent = "Avanti";
        nextBtn.disabled = !canAdvance(currentStep);
      }
    }

    backBtn.addEventListener("click", function () {
      if (currentStep > 1) {
        currentStep -= 1;
        render();
      }
    });

    nextBtn.addEventListener("click", function () {
      if (currentStep >= TOTAL_STEPS || !canAdvance(currentStep)) return;
      currentStep += 1;
      if (currentStep === 3) prepareStep3();
      if (currentStep === 4) fillPresentation();
      render();
    });

    /* ---------------- STEP 1: Analisi business ---------------- */

    var bizName = document.getElementById("bizName");
    var bizLocation = document.getElementById("bizLocation");
    var bizInstagram = document.getElementById("bizInstagram");
    var analyzeBtn = document.getElementById("analyzeBtn");
    var analyzeStatus = document.getElementById("analyzeStatus");
    var analyzeResult = document.getElementById("analyzeResult");

    function fillAnalyzeResult() {
      var biz = state.business || {};
      var an = state.analysis || {};

      var badge = document.getElementById("scoreBadge");
      badge.textContent = typeof an.growth_score === "number" ? an.growth_score : "—";
      badge.className = "score-badge " + scoreClass(an.growth_score);

      document.getElementById("bizNameOut").textContent = biz.name || state.businessName;
      var metaParts = [];
      if (biz.address) metaParts.push(biz.address);
      if (typeof biz.rating === "number") metaParts.push(biz.rating.toFixed(1) + " ★");
      if (typeof biz.reviewsCount === "number") metaParts.push(biz.reviewsCount + " recensioni");
      document.getElementById("bizMetaOut").textContent = metaParts.join(" · ") || "—";

      document.getElementById("scoreExplanation").textContent = an.score_explanation || "—";
      setList("forzeList", an.punti_di_forza);
      setList("erroriList", an.errori_principali);
      setList("opportunitaList", an.opportunita);
      setList("ideeList", an.idee_contenuti);
      document.getElementById("nextActions").textContent = an.next_actions || "—";

      analyzeResult.style.display = "block";
    }

    analyzeBtn.addEventListener("click", function () {
      var name = bizName.value.trim();
      var location = bizLocation.value.trim();
      if (!name || !location) {
        setStatus(analyzeStatus, "Inserisci nome business e città.", true);
        return;
      }

      analyzeBtn.disabled = true;
      setStatus(analyzeStatus, "Analisi in corso...");

      fetch("/analyze-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name, location: location })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          analyzeBtn.disabled = false;
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            setStatus(analyzeStatus, "Errore: " + (err.message || "analisi non riuscita"), true);
            return;
          }
          state.businessName = name;
          state.location = location;
          state.instagram = bizInstagram.value.trim();
          state.business = r.data.business;
          state.analysis = r.data.analysis;
          setStatus(analyzeStatus, "Analisi completata.");
          fillAnalyzeResult();
          render();
        })
        .catch(function () {
          analyzeBtn.disabled = false;
          setStatus(analyzeStatus, "Errore di rete. Riprova.", true);
        });
    });

    /* ---------------- STEP 2: Generazione annuncio ---------------- */

    var adPhotoInput = document.getElementById("adPhoto");
    var adPhotoPreview = document.getElementById("adPhotoPreview");
    var styleOpts = document.querySelectorAll(".style-opt");
    var genAdBtn = document.getElementById("genAdBtn");
    var genAdStatus = document.getElementById("genAdStatus");
    var adResult = document.getElementById("adResult");
    var adResultImg = document.getElementById("adResultImg");

    var selectedAdFile = null;
    var selectedAdStyle = null;

    adPhotoInput.addEventListener("change", function () {
      var file = adPhotoInput.files && adPhotoInput.files[0];
      if (!file) { selectedAdFile = null; return; }
      selectedAdFile = file;
      var reader = new FileReader();
      reader.onload = function (e) {
        adPhotoPreview.src = e.target.result;
        adPhotoPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });

    styleOpts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        styleOpts.forEach(function (o) { o.classList.remove("selected"); });
        opt.classList.add("selected");
        selectedAdStyle = opt.dataset.style;
      });
    });

    genAdBtn.addEventListener("click", function () {
      if (!selectedAdFile) {
        setStatus(genAdStatus, "Carica una foto.", true);
        return;
      }
      if (!selectedAdStyle) {
        setStatus(genAdStatus, "Scegli uno stile.", true);
        return;
      }

      var formData = new FormData();
      formData.append("photo", selectedAdFile);
      formData.append("style", selectedAdStyle);

      genAdBtn.disabled = true;
      setStatus(genAdStatus, "Generazione annuncio in corso (10-30s)...");

      fetch("/generate-ad", { method: "POST", body: formData })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          genAdBtn.disabled = false;
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            setStatus(genAdStatus, "Errore: " + (err.message || "generazione non riuscita"), true);
            return;
          }
          var img = (r.data && r.data.image) || {};
          state.adImageBase64 = img.base64;
          state.adImageMimeType = img.mimeType || "image/png";

          adResultImg.src = "data:" + state.adImageMimeType + ";base64," + state.adImageBase64;
          adResult.style.display = "block";
          setStatus(genAdStatus, "Annuncio generato.");
          render();
        })
        .catch(function () {
          genAdBtn.disabled = false;
          setStatus(genAdStatus, "Errore di rete. Riprova.", true);
        });
    });

    /* ---------------- STEP 3: Generazione video ---------------- */

    var videoSourceImg = document.getElementById("videoSourceImg");
    var videoPrompt = document.getElementById("videoPrompt");
    var genVideoBtn = document.getElementById("genVideoBtn");
    var genVideoStatus = document.getElementById("genVideoStatus");
    var videoResult = document.getElementById("videoResult");
    var videoResultPlayer = document.getElementById("videoResultPlayer");

    function prepareStep3() {
      videoSourceImg.src = "data:" + state.adImageMimeType + ";base64," + state.adImageBase64;
    }

    function pollVideoStatus(requestId) {
      fetch("/admin/generate-video/" + requestId + "/status")
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            setStatus(genVideoStatus, "Errore: " + (err.message || "status check fallito"), true);
            genVideoBtn.disabled = false;
            return;
          }
          var s = r.data.status;
          setStatus(genVideoStatus, "Stato: " + s + "...");
          if (s === "COMPLETED") {
            fetchVideoResult(requestId);
          } else {
            setTimeout(function () { pollVideoStatus(requestId); }, 4000);
          }
        })
        .catch(function () {
          setStatus(genVideoStatus, "Errore di rete durante il polling.", true);
          genVideoBtn.disabled = false;
        });
    }

    function fetchVideoResult(requestId) {
      fetch("/admin/generate-video/" + requestId + "/result")
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          genVideoBtn.disabled = false;
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            setStatus(genVideoStatus, "Errore: " + (err.message || "recupero risultato fallito"), true);
            return;
          }
          state.videoUrl = r.data.videoUrl;
          videoResultPlayer.src = state.videoUrl;
          videoResult.style.display = "block";
          setStatus(genVideoStatus, "Video pronto.");
          render();
        })
        .catch(function () {
          genVideoBtn.disabled = false;
          setStatus(genVideoStatus, "Errore di rete nel recupero del risultato.", true);
        });
    }

    genVideoBtn.addEventListener("click", function () {
      var body = {
        imageBase64: state.adImageBase64,
        mimeType: state.adImageMimeType,
        prompt: videoPrompt.value.trim()
      };

      genVideoBtn.disabled = true;
      setStatus(genVideoStatus, "Invio richiesta a fal.ai...");

      fetch("/admin/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            setStatus(genVideoStatus, "Errore: " + (err.message || "richiesta fallita"), true);
            genVideoBtn.disabled = false;
            return;
          }
          setStatus(genVideoStatus, "In coda (requestId: " + r.data.requestId + "). La generazione richiede qualche minuto...");
          pollVideoStatus(r.data.requestId);
        })
        .catch(function () {
          setStatus(genVideoStatus, "Errore di rete.", true);
          genVideoBtn.disabled = false;
        });
    });

    /* ---------------- STEP 4: Presentazione ---------------- */

    var resetBtn = document.getElementById("resetBtn");

    function fillPresentation() {
      var biz = state.business || {};
      var an = state.analysis || {};

      var badge = document.getElementById("presScoreBadge");
      badge.textContent = typeof an.growth_score === "number" ? an.growth_score : "—";
      badge.className = "score-badge " + scoreClass(an.growth_score);

      document.getElementById("presBizName").textContent = biz.name || state.businessName;
      var metaParts = [];
      if (biz.address) metaParts.push(biz.address);
      if (state.instagram) metaParts.push(state.instagram);
      if (typeof biz.rating === "number") metaParts.push(biz.rating.toFixed(1) + " ★");
      if (typeof biz.reviewsCount === "number") metaParts.push(biz.reviewsCount + " recensioni");
      document.getElementById("presBizMeta").textContent = metaParts.join(" · ") || "—";

      document.getElementById("presScoreExplanation").textContent = an.score_explanation || "—";
      setList("presForzeList", an.punti_di_forza);
      setList("presErroriList", an.errori_principali);
      setList("presOpportunitaList", an.opportunita);

      document.getElementById("presAdImg").src =
        "data:" + state.adImageMimeType + ";base64," + state.adImageBase64;
      document.getElementById("presVideo").src = state.videoUrl;
    }

    resetBtn.addEventListener("click", function () {
      state = {
        businessName: null,
        location: null,
        instagram: null,
        business: null,
        analysis: null,
        adImageBase64: null,
        adImageMimeType: null,
        videoUrl: null
      };

      bizName.value = "";
      bizLocation.value = "";
      bizInstagram.value = "";
      analyzeResult.style.display = "none";
      setStatus(analyzeStatus, "");

      adPhotoInput.value = "";
      adPhotoPreview.style.display = "none";
      adPhotoPreview.src = "";
      styleOpts.forEach(function (o) { o.classList.remove("selected"); });
      selectedAdFile = null;
      selectedAdStyle = null;
      adResult.style.display = "none";
      setStatus(genAdStatus, "");

      videoPrompt.value = "";
      videoResult.style.display = "none";
      videoResultPlayer.src = "";
      setStatus(genVideoStatus, "");

      currentStep = 1;
      render();
    });

    render();
  </script>
</body>
</html>`;
}

export default router;
