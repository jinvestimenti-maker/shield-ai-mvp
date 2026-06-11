function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function renderAppShell({ title, heading, subheading, body, actions = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Space+Grotesk:wght@400;500;700&display=swap");
    :root {
      --bg: #f6f1e8;
      --bg-muted: #eadfcd;
      --ink: #1a120b;
      --accent: #c13d2a;
      --accent-dark: #8d2617;
      --card: #fff9ef;
      --ok: #166534;
      --warn: #92400e;
      --err: #991b1b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Space Grotesk", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 10% 5%, #ffe6bf 0%, transparent 35%),
        radial-gradient(circle at 90% 20%, #fbd3c4 0%, transparent 30%),
        linear-gradient(180deg, var(--bg) 0%, #f4ecdf 100%);
    }
    .wrap {
      width: min(980px, 92vw);
      margin: 2.5rem auto;
      padding-bottom: 2rem;
      animation: rise 0.45s ease-out both;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    h1 {
      margin: 0;
      font-family: "Fraunces", serif;
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1.05;
    }
    p { line-height: 1.5; margin: 0.65rem 0; }
    .subheading { max-width: 68ch; color: #3d3125; }
    .nav { margin: 1.1rem 0 1.8rem; display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .chip {
      display: inline-block;
      text-decoration: none;
      background: var(--ink);
      color: #fff;
      padding: 0.45rem 0.8rem;
      border-radius: 999px;
      font-size: 0.9rem;
      border: 0;
      cursor: pointer;
    }
    .chip.secondary { background: #7f5f42; }
    .card {
      background: var(--card);
      border: 1px solid #d7c5ab;
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 0.9rem;
      box-shadow: 0 3px 0 rgba(26, 18, 11, 0.09);
    }
    .split {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 0.8rem;
    }
    label { display: block; font-weight: 700; margin: 0.35rem 0; }
    input, select, textarea {
      width: 100%;
      border: 1px solid #bba489;
      border-radius: 10px;
      padding: 0.65rem 0.7rem;
      font: inherit;
      background: #fffdfa;
    }
    button.primary {
      border: 0;
      border-radius: 10px;
      padding: 0.72rem 0.95rem;
      background: linear-gradient(135deg, var(--accent) 0%, #df6a3c 100%);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    button.primary:hover { background: linear-gradient(135deg, var(--accent-dark) 0%, #c74f25 100%); }
    ul { padding-left: 1.1rem; margin-top: 0.45rem; }
    .kicker {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6c4e32;
      margin-bottom: 0.5rem;
    }
    .status-ok { color: var(--ok); font-weight: 700; }
    .status-warn { color: var(--warn); font-weight: 700; }
    .status-err { color: var(--err); font-weight: 700; }
    code { background: #f2e6d6; padding: 0.1rem 0.3rem; border-radius: 6px; }
    .muted { color: #654f3b; font-size: 0.95rem; }
    .actions { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .error { color: var(--err); font-weight: 700; margin-top: 0.7rem; min-height: 1.3rem; }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>${escapeHtml(heading)}</h1>
    <p class="subheading">${escapeHtml(subheading)}</p>
    <nav class="nav">
      <a class="chip" href="/">Landing</a>
      <a class="chip secondary" href="/generate">Generate</a>
      <a class="chip secondary" href="/dashboard">Dashboard</a>
      ${actions}
    </nav>
    ${body}
  </main>
  <script>
    (function () {
      try {
        const key = "shia.session.id";
        let value = localStorage.getItem(key);
        if (!value) {
          value = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9);
          localStorage.setItem(key, value);
        }
        window.__shiaSessionId = value;
      } catch (_error) {
        window.__shiaSessionId = null;
      }
    })();
  </script>
</body>
</html>`;
}

function renderList(items) {
  if (!items.length) {
    return "<p class=\"muted\">No records yet.</p>";
  }
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function deriveOnboardingPathFromSource(source) {
  const value = source ? String(source).toLowerCase() : "";
  if (value.includes("connect") || value.includes("oauth") || value.includes("tiktok")) {
    return "connect";
  }
  if (value.includes("fallback") || value.includes("guided")) {
    return "fallback";
  }
  return "unknown";
}

export function renderLandingPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SHIA MVP — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:  #1a1d2e;
      --bg2: #242842;
      --ink:  #eef0f7;
      --ink2: #c2c6da;
      --ink3: #8d92ad;
      --line: #353a56;
      --green:  #4ade80;
      --orange: #fb923c;
      --blue:   #60a5fa;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 12%, rgba(124,58,237,.20) 0%, transparent 46%),
        radial-gradient(ellipse at 82% 8%,  rgba(96,165,250,.16) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 80%, rgba(255,100,82,.14) 0%, transparent 48%),
        radial-gradient(ellipse at 12% 85%, rgba(124,58,237,.13) 0%, transparent 44%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(880px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* heading */
    .hero-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.9rem, 4.4vw, 2.9rem); letter-spacing: -.03em; margin-bottom: .6rem; max-width: 22ch;
    }
    .hero-sub { font-size: .95rem; font-weight: 500; color: var(--ink3); margin-bottom: 2.4rem; max-width: 60ch; }

    /* cards */
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .6rem; }
    .card {
      background: var(--bg2); border: 1px solid var(--line); border-radius: 16px;
      padding: 1.25rem 1.4rem; margin-bottom: 1.1rem;
    }
    .card p { color: var(--ink2); font-size: .92rem; line-height: 1.5; font-weight: 500; }
    .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.1rem; }
    .page ul { list-style: none; display: flex; flex-direction: column; gap: .55rem; margin-top: .2rem; }
    .page li { font-size: .9rem; line-height: 1.45; color: var(--ink2); font-weight: 500; padding-left: 1.05rem; position: relative; }
    .page li::before { content: "•"; position: absolute; left: 0; color: var(--a1); font-weight: 900; }

    /* buttons */
    .btn-primary {
      display: inline-block; text-decoration: none; cursor: pointer; border: 0;
      background: linear-gradient(135deg, var(--a1) 0%, #df6a3c 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .85rem 1.8rem; border-radius: 999px; transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .85; }
    .btn-ghost { font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 500; }
    .btn-ghost:hover { color: var(--ink); }
    .actions-row { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; margin-top: .5rem; }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <p class="hero-title">Turn a TikTok profile into a 7-day content sprint.</p>
  <p class="hero-sub">Generate a free preview, unlock with Stripe, and get a complete posting sprint from the same flow.</p>

  <section class="card">
    <p class="kicker">MVP Flow</p>
    <p>Landing → Generate → Preview → Paywall → Sprint → Dashboard</p>
  </section>

  <div class="split">
    <article class="card">
      <p class="kicker">What you get in preview</p>
      <ul>
        <li>2 video ideas and 2 hooks</li>
        <li>1 profile optimization tip</li>
        <li>7-day teaser calendar</li>
      </ul>
    </article>
    <article class="card">
      <p class="kicker">After payment</p>
      <ul>
        <li>Full 7-day sprint with hooks and captions</li>
        <li>CTA recommendations and profile checklist</li>
        <li>Saved in dashboard by user id</li>
      </ul>
    </article>
  </div>

  <div class="actions-row">
    <a class="btn-primary" href="/generate">Start Generator →</a>
    <a class="btn-ghost" href="/dashboard">Dashboard</a>
  </div>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();
</script>

</body>
</html>`;
}

export function renderGeneratePage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Analizza il Profilo — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:  #1a1d2e;
      --bg2: #242842;
      --ink:  #eef0f7;
      --ink2: #c2c6da;
      --ink3: #8d92ad;
      --line: #353a56;
      --green:  #4ade80;
      --orange: #fb923c;
      --blue:   #60a5fa;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 12%, rgba(124,58,237,.20) 0%, transparent 46%),
        radial-gradient(ellipse at 82% 8%,  rgba(96,165,250,.16) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 80%, rgba(255,100,82,.14) 0%, transparent 48%),
        radial-gradient(ellipse at 12% 85%, rgba(124,58,237,.13) 0%, transparent 44%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(640px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* heading */
    .gen-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.7rem, 4vw, 2.5rem); letter-spacing: -.03em; margin-bottom: .3rem;
    }
    .gen-sub { font-size: .9rem; font-weight: 500; color: var(--ink3); margin-bottom: 2.2rem; max-width: 60ch; }

    /* form */
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .5rem; }
    .field { margin-bottom: .75rem; }
    .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
    label { display: block; font-size: .82rem; font-weight: 700; color: var(--ink2); margin-bottom: .45rem; }
    input, select, textarea {
      width: 100%; font: inherit; font-size: .95rem; color: var(--ink);
      background: var(--bg2); border: 1px solid var(--line); border-radius: 10px;
      padding: .75rem .9rem; transition: border-color .15s;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--a1); }
    textarea { resize: vertical; }
    @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } }

    /* button */
    .btn-primary {
      display: inline-block; text-decoration: none; cursor: pointer; border: 0;
      background: linear-gradient(135deg, var(--a1) 0%, #df6a3c 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .85rem 1.8rem; border-radius: 999px; transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .85; }
    .btn-ghost { font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 500; }
    .btn-ghost:hover { color: var(--ink); }
    .actions-row { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; margin-top: .5rem; }

    /* error */
    .error { color: #f87171; font-weight: 600; font-size: .9rem; min-height: 1.4rem; margin-top: .9rem; }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <p class="gen-title">Analizza il tuo Profilo</p>
  <p class="gen-sub">Inserisci i dati del tuo profilo TikTok per ricevere un'analisi AI istantanea: punti di forza, errori da correggere e occasioni di crescita.</p>

  <form id="generate-form">
    <p class="kicker">Profilo</p>
    <div class="field-grid">
      <div class="field">
        <label for="userId">User ID</label>
        <input id="userId" name="userId" required placeholder="user-123" />
      </div>
      <div class="field">
        <label for="username">Username TikTok</label>
        <input id="username" name="username" required placeholder="creator_name" />
      </div>
      <div class="field">
        <label for="language">Lingua</label>
        <input id="language" name="language" value="it" required />
      </div>
      <div class="field">
        <label for="creatorLevel">Livello creator</label>
        <select id="creatorLevel" name="creatorLevel">
          <option value="beginner">beginner</option>
          <option value="active" selected>active</option>
          <option value="advanced">advanced</option>
        </select>
      </div>
      <div class="field">
        <label for="primaryGoal">Obiettivo</label>
        <select id="primaryGoal" name="primaryGoal">
          <option value="views">views</option>
          <option value="followers" selected>followers</option>
          <option value="clients">clienti</option>
          <option value="consistency">consistenza</option>
        </select>
      </div>
      <div class="field">
        <label for="niche">Nicchia</label>
        <input id="niche" name="niche" required placeholder="fitness, SaaS, produttività…" />
      </div>
    </div>

    <div class="field">
      <label for="bio">Bio attuale</label>
      <textarea id="bio" name="bio" rows="3" required placeholder="Di cosa parli e per chi crei contenuti?"></textarea>
    </div>

    <div class="actions-row">
      <button class="btn-primary" type="submit">Analizza il Profilo →</button>
      <a class="btn-ghost" href="/">← Home</a>
    </div>
    <p id="generate-error" class="error"></p>
  </form>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();

  /* form submit */
  (function () {
    const form = document.getElementById("generate-form");
        const errorEl = document.getElementById("generate-error");

        form.addEventListener("submit", function (event) {
          event.preventDefault();
          errorEl.textContent = "";
          const formData = new FormData(form);

          const userId = String(formData.get("userId")).trim();
          const username = String(formData.get("username")).trim().replace(/^@/, "");
          const bio = String(formData.get("bio")).trim();
          const language = String(formData.get("language")).trim();

          if (!/^[A-Za-z0-9._]{2,30}$/.test(username)) {
            errorEl.textContent = "Username TikTok non valido: usa 2-30 caratteri (lettere, numeri, punti, underscore).";
            return;
          }
          if (bio.length < 5 || bio.length > 300) {
            errorEl.textContent = "Bio non valida: deve contenere tra 5 e 300 caratteri.";
            return;
          }
          if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
            errorEl.textContent = "Lingua non valida: usa il formato 'it' oppure 'it-IT'.";
            return;
          }

          const creatorInput = {
            source: "guided_fallback",
            profile: {
              username,
              profileUrl: "https://www.tiktok.com/@" + username,
              bio,
              language,
              creatorLevel: String(formData.get("creatorLevel"))
            },
            strategy: {
              niche: String(formData.get("niche")).trim(),
              primaryGoal: String(formData.get("primaryGoal"))
            },
            contentSignals: {
              recentExamples: [],
              bestExamples: []
            },
            metadata: {
              submittedAt: new Date().toISOString(),
              schemaVersion: "v1"
            }
          };

          try {
            sessionStorage.setItem("shieldCreatorInput", JSON.stringify(creatorInput));
            sessionStorage.setItem("shieldUserId", userId);
            location.assign("/analyze");
          } catch (error) {
            errorEl.textContent = error.message;
          }
        });
  })();
</script>

</body>
</html>`;
}

export function renderPreviewPage({ preview }) {
  const output = preview.previewJson || {};
  const userId = preview.userId;
  const path = deriveOnboardingPathFromSource(preview.creatorInput?.source);
  const pathQuery = path === "unknown" ? "" : "&path=" + encodeURIComponent(path);
  return renderAppShell({
    title: "Preview",
    heading: "Preview Ready",
    subheading: `Preview ID: ${preview.id}`,
    body: `
      <section class="card">
        <p class="kicker">Profile Summary</p>
        <p>${escapeHtml(output.profile_summary || "No summary available")}</p>
      </section>
      <section class="split">
        <article class="card">
          <p class="kicker">Video Ideas</p>
          ${renderList((output.video_ideas_preview || []).map((v) => escapeHtml(v)))}
        </article>
        <article class="card">
          <p class="kicker">Hooks</p>
          ${renderList((output.hooks_preview || []).map((v) => escapeHtml(v)))}
        </article>
      </section>
      <section class="card">
        <p class="kicker">Tip + Calendar Teaser</p>
        <p><strong>Tip:</strong> ${escapeHtml(output.profile_tip || "n/a")}</p>
        ${renderList((output.locked_calendar_teaser || []).map((day, idx) => `Day ${idx + 1}: ${escapeHtml(day)}`))}
      </section>
      <section class="actions">
        <a class="chip" href="/paywall/${encodeURIComponent(preview.id)}?userId=${encodeURIComponent(userId)}${pathQuery}">Unlock Full Sprint</a>
      </section>
    `
  });
}

export function renderPaywallPage({ preview, paywallStatus, sprint }) {
  const userId = preview.userId;
  const status = paywallStatus?.paymentStatus || "none";
  const entitlementStatus = paywallStatus?.entitlementStatus || "locked";
  const canRetry = paywallStatus?.canRetry || false;

  let statusClass = "status-warn";
  if (entitlementStatus === "unlocked") {
    statusClass = "status-ok";
  } else if (status === "failed" || status === "cancelled") {
    statusClass = "status-err";
  }

  return renderAppShell({
    title: "Paywall",
    heading: "Unlock the Full Sprint",
    subheading: `Preview ${preview.id} for user ${userId}`,
    body: `
      <section class="card">
        <p class="kicker">Payment + Entitlement</p>
        <p>Payment status: <span class="${statusClass}">${escapeHtml(status)}</span></p>
        <p>Entitlement: <span class="${statusClass}">${escapeHtml(entitlementStatus)}</span></p>
        <p class="muted">Retry available: ${canRetry ? "yes" : "no"}</p>
      </section>
      <section class="split">
        <article class="card">
          <p class="kicker">Option A</p>
          <p><strong>EUR 9</strong> one-time</p>
          <button class="primary" type="button" data-variant="eur_9">Checkout EUR 9</button>
        </article>
        <article class="card">
          <p class="kicker">Option B</p>
          <p><strong>EUR 19</strong> one-time</p>
          <button class="primary" type="button" data-variant="eur_19">Checkout EUR 19</button>
        </article>
      </section>
      <section class="card">
        <p class="kicker">Next</p>
        ${
          sprint
            ? `<p class="status-ok">Sprint generated and unlocked.</p>
               <p><a class="chip" href="/sprint/${encodeURIComponent(sprint.id)}">Open Sprint</a></p>`
            : "<p class=\"muted\">After payment completion, refresh status and open your sprint.</p>"
        }
        <div class="actions">
          <button class="chip secondary" type="button" id="refresh-status">Refresh Status</button>
          <a class="chip secondary" href="/dashboard?userId=${encodeURIComponent(userId)}">Open Dashboard</a>
        </div>
        <p id="paywall-error" class="error"></p>
      </section>
      <script>
        const userId = ${JSON.stringify(userId)};
        const previewId = ${JSON.stringify(preview.id)};
        const queryPath = new URLSearchParams(location.search).get("path");
        const errorEl = document.getElementById("paywall-error");
        const checkoutButtons = Array.from(document.querySelectorAll("[data-variant]"));

        async function createCheckout(variant) {
          errorEl.textContent = "";
          try {
            const response = await fetch("/api/create-checkout", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-session-id": window.__shiaSessionId || ""
              },
              body: JSON.stringify({ userId, previewId, variant, path: queryPath })
            });
            const body = await response.json();
            if (!response.ok) {
              throw new Error(body?.error?.message || "Checkout creation failed");
            }
            if (body.checkoutUrl) {
              location.assign(body.checkoutUrl);
              return;
            }
            location.reload();
          } catch (error) {
            errorEl.textContent = error.message;
          }
        }

        async function refreshStatus() {
          errorEl.textContent = "";
          try {
            const response = await fetch("/api/paywall-status/" + encodeURIComponent(previewId) + "?userId=" + encodeURIComponent(userId));
            const body = await response.json();
            if (!response.ok) {
              throw new Error(body?.error?.message || "Unable to refresh status");
            }
            location.reload();
          } catch (error) {
            errorEl.textContent = error.message;
          }
        }

        for (const button of checkoutButtons) {
          button.addEventListener("click", () => createCheckout(button.dataset.variant));
        }
        document.getElementById("refresh-status").addEventListener("click", refreshStatus);
      </script>
    `
  });
}

export function renderSprintPage({ sprint }) {
  const data = sprint.sprintJson || {};
  return renderAppShell({
    title: "Full Sprint",
    heading: data.title || "Full Sprint Output",
    subheading: `Sprint ${sprint.id} · created ${formatDate(sprint.createdAt)}`,
    actions: `<a class="chip secondary" href="/dashboard?userId=${encodeURIComponent(sprint.userId)}">Back to Dashboard</a>`,
    body: `
      <section class="card">
        <p class="kicker">Strategy</p>
        <p>${escapeHtml(data.strategy || "n/a")}</p>
      </section>
      <section class="split">
        <article class="card">
          <p class="kicker">7-Day Plan</p>
          ${renderList((data.seven_day_plan || []).map((v) => escapeHtml(v)))}
        </article>
        <article class="card">
          <p class="kicker">Video Ideas</p>
          ${renderList((data.video_ideas || []).slice(0, 12).map((v) => escapeHtml(v)))}
        </article>
      </section>
      <section class="split">
        <article class="card">
          <p class="kicker">Hooks</p>
          ${renderList((data.hooks || []).slice(0, 12).map((v) => escapeHtml(v)))}
        </article>
        <article class="card">
          <p class="kicker">Captions</p>
          ${renderList((data.captions || []).slice(0, 12).map((v) => escapeHtml(v)))}
        </article>
      </section>
    `
  });
}

export function renderAnalyzePage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Analisi Profilo — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:  #1a1d2e;
      --bg2: #242842;
      --ink:  #eef0f7;
      --ink2: #c2c6da;
      --ink3: #8d92ad;
      --line: #353a56;
      --green:  #4ade80;
      --orange: #fb923c;
      --blue:   #60a5fa;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 12%, rgba(124,58,237,.20) 0%, transparent 46%),
        radial-gradient(ellipse at 82% 8%,  rgba(96,165,250,.16) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 80%, rgba(255,100,82,.14) 0%, transparent 48%),
        radial-gradient(ellipse at 12% 85%, rgba(124,58,237,.13) 0%, transparent 44%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(880px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* loading */
    #loading { text-align: center; padding: 5rem 0; }
    .loading-txt { font-size: .95rem; font-weight: 500; color: var(--ink3); }
    .spinner {
      width: 38px; height: 38px;
      border: 3px solid var(--line); border-top-color: var(--a1);
      border-radius: 50%; animation: spin .7s linear infinite; margin: 1.5rem auto 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* error */
    .err { color: #f87171; font-weight: 600; font-size: .95rem; text-align: center; min-height: 1.5rem; padding: .4rem 0; }

    /* dashboard */
    #dash { display: none; }
    .dash-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.7rem, 4vw, 2.5rem); letter-spacing: -.03em; margin-bottom: .3rem;
    }
    .dash-sub { font-size: .9rem; font-weight: 500; color: var(--ink3); margin-bottom: 2.2rem; }

    /* ring */
    .ring-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; }
    .ring-outer {
      --pct: 0;
      width: 210px; height: 210px; border-radius: 50%;
      background: conic-gradient(
        from -90deg,
        var(--a1) 0%,
        var(--a2) calc(var(--pct) * 1%),
        var(--line) calc(var(--pct) * 1%) 100%
      );
      display: grid; place-items: center;
    }
    .ring-inner {
      width: 164px; height: 164px; border-radius: 50%; background: var(--bg);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1rem;
    }
    .ring-num {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: 3.2rem; line-height: 1; letter-spacing: -.05em;
    }
    .ring-lbl { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); }

    /* verdict */
    .verdict { text-align: center; max-width: 58ch; margin: .5rem auto 2.5rem; }
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .5rem; }
    .verdict-body { font-size: 1.05rem; line-height: 1.6; color: var(--ink2); font-weight: 500; }

    /* divider */
    hr { border: none; border-top: 1px solid var(--line); margin: 0 0 2rem; }

    /* 3 cols */
    .three-col { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 2.5rem; }
    .col { padding: 0 1.6rem; }
    .col:first-child { padding-left: 0; }
    .col:last-child  { padding-right: 0; }
    .col + .col { border-left: 1px solid var(--line); }
    .col-kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .9rem; }
    .ck-green  { color: var(--green); }
    .ck-orange { color: var(--orange); }
    .ck-blue   { color: var(--blue); }
    .col ul { list-style: none; display: flex; flex-direction: column; gap: .6rem; }
    .col li { font-size: .91rem; line-height: 1.45; color: var(--ink2); font-weight: 500; padding-left: 1.05rem; position: relative; }
    .col li::before { content: "•"; position: absolute; left: 0; font-weight: 900; }
    .col-green  li::before { color: var(--green); }
    .col-orange li::before { color: var(--orange); }
    .col-blue   li::before { color: var(--blue); }
    @media (max-width: 600px) {
      .three-col { grid-template-columns: 1fr; }
      .col + .col { border-left: none; border-top: 1px solid var(--line); padding: 1.5rem 0 0; margin-top: 1.5rem; }
    }

    /* bio */
    .bio-section { margin-bottom: 2.2rem; }
    .bio-box {
      font-size: 1rem; font-style: italic; font-weight: 500; line-height: 1.55; color: var(--ink);
      padding: 1rem 1.25rem; background: var(--bg2); border-left: 3px solid var(--a1); border-radius: 0 8px 8px 0;
    }

    /* cta */
    .cta-row { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; }
    .btn-primary {
      display: inline-block; text-decoration: none;
      background: linear-gradient(135deg, var(--a1) 0%, #df6a3c 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .75rem 1.6rem; border-radius: 999px; transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .85; }
    .btn-ghost { font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 500; }
    .btn-ghost:hover { color: var(--ink); }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <div id="loading">
    <p class="loading-txt">Analisi AI in corso…</p>
    <div class="spinner"></div>
  </div>
  <p id="err" class="err"></p>

  <div id="dash">
    <p class="dash-title">Analisi del Profilo</p>
    <p class="dash-sub">Risultati generati da Shield AI</p>

    <div class="ring-wrap">
      <div class="ring-outer" id="ring-outer">
        <div class="ring-inner">
          <span class="ring-num" id="score-num">0</span>
          <span class="ring-lbl">Growth Score</span>
        </div>
      </div>
    </div>

    <div class="verdict">
      <p class="kicker">Verdetto AI</p>
      <p class="verdict-body" id="verdict-text">—</p>
    </div>

    <hr>

    <div class="three-col">
      <div class="col col-green">
        <p class="col-kicker ck-green">Forze</p>
        <ul id="forze-list"></ul>
      </div>
      <div class="col col-orange">
        <p class="col-kicker ck-orange">Da migliorare</p>
        <ul id="errori-list"></ul>
      </div>
      <div class="col col-blue">
        <p class="col-kicker ck-blue">Occasioni</p>
        <ul id="opportunita-list"></ul>
      </div>
    </div>

    <hr>

    <div class="bio-section">
      <p class="kicker" style="margin-bottom:.6rem;">Bio suggerita</p>
      <p class="bio-box" id="bio-text">—</p>
    </div>

    <div class="cta-row">
      <a class="btn-primary" href="/generate">Genera il tuo piano</a>
      <a class="btn-ghost" href="/">← Home</a>
    </div>
  </div>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();

  /* analyze */
  (function () {
    var loading = document.getElementById("loading");
    var dash    = document.getElementById("dash");
    var errEl   = document.getElementById("err");

    function esc(s) {
      return String(s).replace(/[<>&"']/g, function (c) {
        return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function setList(id, arr) {
      document.getElementById(id).innerHTML =
        (Array.isArray(arr) ? arr : []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("");
    }
    function animateRing(score) {
      var ring = document.getElementById("ring-outer");
      var num  = document.getElementById("score-num");
      score = Math.max(0, Math.min(100, score || 0));
      var dur = 1200, start = performance.now();
      function frame(now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var cur = Math.round(score * eased);
        ring.style.setProperty("--pct", cur);
        num.textContent = cur;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function load() {
      var raw    = sessionStorage.getItem("shieldCreatorInput");
      var userId = sessionStorage.getItem("shieldUserId");
      if (!raw || !userId) {
        loading.style.display = "none";
        errEl.textContent = "Dati mancanti in sessionStorage — torna a /generate.";
        return;
      }
      var creatorInput;
      try { creatorInput = JSON.parse(raw); } catch (e) {
        loading.style.display = "none";
        errEl.textContent = "creatorInput non valido — torna a /generate.";
        return;
      }
      fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json", "x-session-id": window.__shiaSessionId || "" },
        body: JSON.stringify({ userId: userId, creatorInput: creatorInput })
      })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data && r.data.error ? r.data.error.message : "Analisi fallita");
        var d = r.data;
        loading.style.display = "none";
        dash.style.display    = "block";
        animateRing(d.growth_score);
        document.getElementById("verdict-text").textContent = d.score_explanation || "—";
        setList("forze-list",       d.punti_di_forza);
        setList("errori-list",      d.errori_principali);
        setList("opportunita-list", d.opportunita);
        document.getElementById("bio-text").textContent = d.suggerimento_bio || "—";
      })
      .catch(function (err) {
        loading.style.display = "none";
        errEl.textContent = err.message;
      });
    }
    load();
  })();
</script>

</body>
</html>`;
}

export function renderAnalyzeBusinessPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Analizza la tua attività — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/dist/tabler-icons.min.css">
  <style>
    :root {
      --bg:  #f7f8fc;
      --bg2: #ffffff;
      --ink:  #161a2b;
      --ink2: #4b5066;
      --ink3: #9095ab;
      --line: #e7e9f2;
      --green:  #16a34a;
      --orange: #f97316;
      --blue:   #2563eb;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 10%, rgba(37,99,235,.07) 0%, transparent 46%),
        radial-gradient(ellipse at 84% 6%,  rgba(249,115,22,.07) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 85%, rgba(22,163,74,.06) 0%, transparent 48%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(880px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* hero / form */
    .hero { padding: 1rem 0 3rem; }
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .6rem; }
    .hero-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.8rem, 4.5vw, 2.8rem); letter-spacing: -.03em; line-height: 1.1;
      margin-bottom: .8rem; max-width: 18ch;
    }
    .hero-sub { font-size: 1rem; color: var(--ink2); font-weight: 500; max-width: 56ch; margin-bottom: 2.2rem; line-height: 1.6; }

    .form-row { display: flex; gap: 1.5rem; margin-bottom: 1.6rem; flex-wrap: wrap; }
    .field { flex: 1 1 220px; }
    .field label {
      display: flex; align-items: center; gap: .4rem; font-size: .8rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em; color: var(--ink3); margin-bottom: .5rem;
    }
    .field input {
      width: 100%; border: none; border-bottom: 1px solid var(--line); background: transparent;
      font: inherit; font-size: 1.05rem; font-weight: 600; color: var(--ink); padding: .6rem .1rem;
      transition: border-color .15s;
    }
    .field input:focus { outline: none; border-bottom-color: var(--blue); }
    .field input::placeholder { color: var(--ink3); font-weight: 500; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: .5rem; border: none; cursor: pointer;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .85rem 1.8rem; border-radius: 999px; transition: opacity .15s, transform .15s;
    }
    .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
    .btn-primary i { font-size: 1.1rem; }
    .btn-ghost {
      font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 600;
      background: none; border: none; cursor: pointer; padding: .5rem 0;
    }
    .btn-ghost:hover { color: var(--ink); }

    /* loading */
    #loading { display: none; text-align: center; padding: 5rem 0; }
    .spinner {
      width: 42px; height: 42px;
      border: 3px solid var(--line); border-top-color: var(--blue);
      border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 1.6rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-txt { font-size: 1rem; font-weight: 600; color: var(--ink2); transition: opacity .25s; min-height: 1.5em; }

    /* error */
    .err { color: #dc2626; font-weight: 600; font-size: .9rem; min-height: 1.4rem; margin-top: .6rem; }
    #result-err { display: none; text-align: center; padding: 4rem 0; }
    .err-icon { font-size: 2.6rem; color: var(--orange); margin-bottom: 1rem; }
    .err-title { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.4rem; margin-bottom: .6rem; }
    .err-body { font-size: .95rem; color: var(--ink2); max-width: 46ch; margin: 0 auto 1.8rem; line-height: 1.6; }

    /* result */
    #dash { display: none; }
    .biz-head { margin-bottom: 2.4rem; }
    .biz-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: clamp(1.6rem, 4vw, 2.4rem); letter-spacing: -.03em; margin-bottom: .5rem; }
    .biz-meta { display: flex; align-items: center; gap: 1.4rem; flex-wrap: wrap; color: var(--ink2); font-size: .92rem; font-weight: 600; }
    .biz-meta span { display: inline-flex; align-items: center; gap: .35rem; }
    .biz-meta i { font-size: 1.1rem; }
    .star-icon { color: var(--orange); }

    /* ring */
    .ring-wrap { display: flex; flex-direction: column; align-items: center; margin: 2.2rem 0; }
    .ring-outer {
      --pct: 0;
      width: 200px; height: 200px; border-radius: 50%;
      background: conic-gradient(
        from -90deg,
        var(--a1) 0%,
        var(--a2) calc(var(--pct) * 1%),
        var(--line) calc(var(--pct) * 1%) 100%
      );
      display: grid; place-items: center;
    }
    .ring-inner {
      width: 158px; height: 158px; border-radius: 50%; background: var(--bg2);
      box-shadow: 0 8px 30px rgba(22,28,55,.06);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1rem;
    }
    .ring-num {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: 3rem; line-height: 1; letter-spacing: -.05em;
    }
    .ring-lbl { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); }

    /* verdict */
    .verdict { text-align: center; max-width: 58ch; margin: 0 auto 2.5rem; }
    .verdict-body { font-size: 1.05rem; line-height: 1.6; color: var(--ink2); font-weight: 500; }

    /* divider */
    hr { border: none; border-top: 1px solid var(--line); margin: 0 0 2rem; }

    /* sections */
    .section-block { margin-bottom: 2.4rem; }
    .section-title {
      display: flex; align-items: center; gap: .5rem; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .1em; margin-bottom: 1.1rem; color: var(--ink3);
    }
    .section-title i { font-size: 1.05rem; }
    .st-green  { color: var(--green); }
    .st-orange { color: var(--orange); }
    .st-blue   { color: var(--blue); }

    /* 3 cols */
    .three-col { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 2.4rem; }
    .col { padding: 0 1.6rem; }
    .col:first-child { padding-left: 0; }
    .col:last-child  { padding-right: 0; }
    .col + .col { border-left: 1px solid var(--line); }
    .col ul { list-style: none; display: flex; flex-direction: column; gap: .7rem; }
    .col li { font-size: .91rem; line-height: 1.5; color: var(--ink2); font-weight: 500; padding-left: 1.05rem; position: relative; }
    .col li::before { content: "•"; position: absolute; left: 0; font-weight: 900; }
    .col-green  li::before { color: var(--green); }
    .col-orange li::before { color: var(--orange); }
    .col-blue   li::before { color: var(--blue); }
    @media (max-width: 600px) {
      .three-col { grid-template-columns: 1fr; }
      .col + .col { border-left: none; border-top: 1px solid var(--line); padding: 1.6rem 0 0; margin-top: 1.6rem; }
      .form-row { gap: 1rem; }
    }

    /* idee contenuti */
    .idea-list { list-style: none; display: flex; flex-direction: column; gap: .9rem; }
    .idea-list li { display: flex; gap: .8rem; align-items: flex-start; font-size: .95rem; line-height: 1.55; color: var(--ink2); font-weight: 500; }
    .idea-list i { color: var(--blue); font-size: 1.2rem; flex-shrink: 0; margin-top: .15rem; }

    /* next actions */
    .next-box {
      font-size: 1rem; font-weight: 500; line-height: 1.6; color: var(--ink);
      padding: 1.1rem 1.3rem; background: var(--bg2); border-left: 3px solid var(--a1); border-radius: 0 10px 10px 0;
    }

    .cta-row { display: flex; align-items: center; gap: 1.4rem; flex-wrap: wrap; margin-top: .5rem; }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <section class="hero" id="form-section">
    <p class="kicker">Analisi gratuita</p>
    <h1 class="hero-title">Scopri il potenziale online della tua attività</h1>
    <p class="hero-sub">Inserisci nome e città: la nostra AI legge i dati pubblici della tua attività su Google e ti restituisce un piano d'azione su misura in pochi minuti.</p>
    <div class="form-row">
      <div class="field">
        <label for="biz-name"><i class="ti ti-building-store"></i> Nome attività</label>
        <input type="text" id="biz-name" placeholder="Es. Ristorante Da Mario" autocomplete="off">
      </div>
      <div class="field">
        <label for="biz-city"><i class="ti ti-map-pin"></i> Città</label>
        <input type="text" id="biz-city" placeholder="Es. Milano" autocomplete="off">
      </div>
    </div>
    <button class="btn-primary" id="analyze-btn"><i class="ti ti-sparkles"></i> Analizza</button>
    <p id="form-err" class="err"></p>
  </section>

  <section id="loading">
    <div class="spinner"></div>
    <p class="loading-txt" id="loading-msg">Sto leggendo le recensioni Google…</p>
  </section>

  <section id="result-err">
    <p class="err-icon"><i class="ti ti-mood-sad"></i></p>
    <p class="err-title">Non siamo riusciti a trovare questa attività</p>
    <p class="err-body">Controlla che nome e città siano scritti come compaiono su Google Maps e riprova. Se il problema continua, riprova tra qualche minuto.</p>
    <button class="btn-primary" id="retry-btn"><i class="ti ti-refresh"></i> Riprova</button>
  </section>

  <div id="dash">
    <div class="biz-head">
      <p class="kicker">Risultato analisi</p>
      <p class="biz-name" id="biz-name-out">—</p>
      <div class="biz-meta">
        <span><i class="ti ti-map-pin"></i><span id="biz-address-out">—</span></span>
        <span><i class="ti ti-star-filled star-icon"></i><span id="biz-rating-out">—</span></span>
        <span><i class="ti ti-message-circle-2"></i><span id="biz-reviews-out">—</span></span>
      </div>
    </div>

    <div class="ring-wrap">
      <div class="ring-outer" id="ring-outer">
        <div class="ring-inner">
          <span class="ring-num" id="score-num">0</span>
          <span class="ring-lbl">Growth Score</span>
        </div>
      </div>
    </div>

    <div class="verdict">
      <p class="kicker">Verdetto AI</p>
      <p class="verdict-body" id="verdict-text">—</p>
    </div>

    <hr>

    <div class="three-col">
      <div class="col col-green">
        <p class="section-title st-green"><i class="ti ti-circle-check"></i> Punti di forza</p>
        <ul id="forze-list"></ul>
      </div>
      <div class="col col-orange">
        <p class="section-title st-orange"><i class="ti ti-alert-triangle"></i> Errori principali</p>
        <ul id="errori-list"></ul>
      </div>
      <div class="col col-blue">
        <p class="section-title st-blue"><i class="ti ti-bulb"></i> Opportunità</p>
        <ul id="opportunita-list"></ul>
      </div>
    </div>

    <hr>

    <div class="section-block">
      <p class="section-title st-blue"><i class="ti ti-brand-instagram"></i> Idee contenuti</p>
      <ul class="idea-list" id="idee-list"></ul>
    </div>

    <hr>

    <div class="section-block">
      <p class="section-title"><i class="ti ti-rocket"></i> Prossime azioni</p>
      <p class="next-box" id="next-actions-text">—</p>
    </div>

    <div class="cta-row">
      <button class="btn-primary" id="new-analysis-btn"><i class="ti ti-search"></i> Nuova analisi</button>
      <a class="btn-ghost" href="/">← Home</a>
    </div>
  </div>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();

  /* page logic */
  (function () {
    var formSection = document.getElementById("form-section");
    var loading     = document.getElementById("loading");
    var resultErr   = document.getElementById("result-err");
    var dash        = document.getElementById("dash");
    var formErr     = document.getElementById("form-err");
    var nameInput   = document.getElementById("biz-name");
    var cityInput   = document.getElementById("biz-city");
    var analyzeBtn  = document.getElementById("analyze-btn");
    var retryBtn    = document.getElementById("retry-btn");
    var newBtn      = document.getElementById("new-analysis-btn");
    var loadingMsg  = document.getElementById("loading-msg");

    var loadingMessages = [
      "Sto leggendo le recensioni Google…",
      "Sto analizzando la concorrenza…",
      "Sto controllando i dati della tua attività…",
      "Sto preparando i suggerimenti…",
      "Sto generando idee di contenuti per i social…"
    ];
    var msgTimer = null;

    function startMessages() {
      var i = 0;
      loadingMsg.textContent = loadingMessages[0];
      loadingMsg.style.opacity = 1;
      msgTimer = setInterval(function () {
        i = (i + 1) % loadingMessages.length;
        loadingMsg.style.opacity = 0;
        setTimeout(function () {
          loadingMsg.textContent = loadingMessages[i];
          loadingMsg.style.opacity = 1;
        }, 250);
      }, 2600);
    }
    function stopMessages() {
      if (msgTimer) { clearInterval(msgTimer); msgTimer = null; }
    }

    function esc(s) {
      return String(s).replace(/[<>&"']/g, function (c) {
        return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function setList(id, arr) {
      document.getElementById(id).innerHTML =
        (Array.isArray(arr) ? arr : []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("");
    }
    function setIdeaList(id, arr) {
      document.getElementById(id).innerHTML =
        (Array.isArray(arr) ? arr : []).map(function (v) {
          return "<li><i class=\\"ti ti-bulb-filled\\"></i><span>" + esc(v) + "</span></li>";
        }).join("");
    }
    function animateRing(score) {
      var ring = document.getElementById("ring-outer");
      var num  = document.getElementById("score-num");
      score = Math.max(0, Math.min(100, score || 0));
      var dur = 1200, start = performance.now();
      function frame(now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var cur = Math.round(score * eased);
        ring.style.setProperty("--pct", cur);
        num.textContent = cur;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function showState(state) {
      formSection.style.display = state === "form" ? "block" : "none";
      loading.style.display     = state === "loading" ? "block" : "none";
      resultErr.style.display   = state === "error" ? "block" : "none";
      dash.style.display        = state === "result" ? "block" : "none";
    }

    function runAnalysis() {
      var name = nameInput.value.trim();
      var city = cityInput.value.trim();
      formErr.textContent = "";
      if (!name || !city) {
        formErr.textContent = "Inserisci nome attività e città.";
        return;
      }

      showState("loading");
      startMessages();

      fetch("/analyze-business", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName: name, location: city })
      })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        stopMessages();
        if (!r.ok) {
          showState("error");
          return;
        }
        var d   = r.data || {};
        var biz = d.business || {};
        var an  = d.analysis || {};

        document.getElementById("biz-name-out").textContent = biz.name || name;
        document.getElementById("biz-address-out").textContent = biz.address || city;
        document.getElementById("biz-rating-out").textContent =
          typeof biz.rating === "number" ? biz.rating.toFixed(1) : "—";
        document.getElementById("biz-reviews-out").textContent =
          typeof biz.reviewsCount === "number" ? biz.reviewsCount + " recensioni" : "Nessuna recensione";

        showState("result");
        animateRing(an.growth_score);
        document.getElementById("verdict-text").textContent = an.score_explanation || "—";
        setList("forze-list",       an.punti_di_forza);
        setList("errori-list",      an.errori_principali);
        setList("opportunita-list", an.opportunita);
        setIdeaList("idee-list",    an.idee_contenuti);
        document.getElementById("next-actions-text").textContent = an.next_actions || "—";
      })
      .catch(function () {
        stopMessages();
        showState("error");
      });
    }

    analyzeBtn.addEventListener("click", runAnalysis);
    retryBtn.addEventListener("click", function () { showState("form"); });
    newBtn.addEventListener("click", function () {
      nameInput.value = "";
      cityInput.value = "";
      showState("form");
      nameInput.focus();
    });
    [nameInput, cityInput].forEach(function (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") runAnalysis();
      });
    });

    showState("form");
  })();
</script>

</body>
</html>`;
}

export function renderCreateAdPage() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Crea un Annuncio AI — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.44.0/dist/tabler-icons.min.css">
  <style>
    :root {
      --bg:  #f7f8fc;
      --bg2: #ffffff;
      --ink:  #161a2b;
      --ink2: #4b5066;
      --ink3: #9095ab;
      --line: #e7e9f2;
      --green:  #16a34a;
      --orange: #f97316;
      --blue:   #2563eb;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 10%, rgba(37,99,235,.07) 0%, transparent 46%),
        radial-gradient(ellipse at 84% 6%,  rgba(249,115,22,.07) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 85%, rgba(22,163,74,.06) 0%, transparent 48%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(880px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* hero / form */
    .hero { padding: 1rem 0 3rem; }
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .6rem; }
    .hero-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.8rem, 4.5vw, 2.8rem); letter-spacing: -.03em; line-height: 1.1;
      margin-bottom: .8rem; max-width: 22ch;
    }
    .hero-sub { font-size: 1rem; color: var(--ink2); font-weight: 500; max-width: 56ch; margin-bottom: 2.2rem; line-height: 1.6; }

    /* upload zone */
    .upload-zone {
      border: 2px dashed var(--line); border-radius: 16px;
      padding: 2.6rem 1.5rem; text-align: center; cursor: pointer;
      transition: border-color .15s, background .15s; margin-bottom: 1.4rem;
    }
    .upload-zone:hover, .upload-zone.dragover {
      border-color: var(--blue); background: rgba(37,99,235,.04);
    }
    .upload-zone i.upload-icon { font-size: 2.4rem; color: var(--ink3); margin-bottom: .8rem; display: block; }
    .upload-zone p { margin: .2rem 0; font-weight: 600; }
    .upload-zone .muted { font-weight: 500; font-size: .85rem; color: var(--ink3); margin-top: .3rem; }
    .upload-zone img.preview {
      max-width: 100%; max-height: 320px; border-radius: 12px; display: block; margin: 0 auto;
    }

    /* hint */
    .hint {
      display: flex; align-items: center; gap: .6rem;
      font-size: .88rem; color: var(--ink2); font-weight: 600;
      padding: .85rem 1.1rem; background: rgba(249,115,22,.08);
      border-left: 3px solid var(--orange); border-radius: 0 10px 10px 0;
      margin-bottom: 2.2rem;
    }
    .hint i { color: var(--orange); font-size: 1.15rem; flex-shrink: 0; }

    /* style picker */
    .style-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-bottom: 1.6rem; }
    .style-option {
      display: flex; flex-direction: column; gap: .4rem; align-items: flex-start; text-align: left;
      border: 1px solid var(--line); border-radius: 14px; padding: 1.1rem 1.2rem;
      background: var(--bg2); cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .15s;
      font: inherit; color: var(--ink);
    }
    .style-option:hover { transform: translateY(-1px); }
    .style-option i { font-size: 1.4rem; color: var(--ink3); }
    .style-option .style-name { font-weight: 700; font-size: 1rem; }
    .style-option .style-desc { font-size: .85rem; color: var(--ink2); line-height: 1.4; font-weight: 500; }
    .style-option.selected {
      border-color: var(--blue); box-shadow: 0 0 0 2px rgba(37,99,235,.15);
    }
    .style-option.selected i { color: var(--blue); }

    /* buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: .5rem; border: none; cursor: pointer;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .85rem 1.8rem; border-radius: 999px; transition: opacity .15s, transform .15s;
    }
    .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .55; cursor: not-allowed; transform: none; }
    .btn-primary i { font-size: 1.1rem; }
    .btn-ghost {
      font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 600;
      background: none; border: none; cursor: pointer; padding: .5rem 0;
    }
    .btn-ghost:hover { color: var(--ink); }
    .gen-hint { font-size: .85rem; color: var(--ink3); font-weight: 500; margin-top: .7rem; }

    /* loading */
    #loading { display: none; text-align: center; padding: 5rem 0; }
    .spinner {
      width: 42px; height: 42px;
      border: 3px solid var(--line); border-top-color: var(--blue);
      border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 1.6rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-txt { font-size: 1rem; font-weight: 600; color: var(--ink2); transition: opacity .25s; min-height: 1.5em; }
    .loading-sub { font-size: .85rem; color: var(--ink3); font-weight: 500; margin-top: .5rem; }

    /* error */
    .err { color: #dc2626; font-weight: 600; font-size: .9rem; min-height: 1.4rem; margin-top: .6rem; }
    #result-err { display: none; text-align: center; padding: 4rem 0; }
    .err-icon { font-size: 2.6rem; color: var(--orange); margin-bottom: 1rem; }
    .err-title { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.4rem; margin-bottom: .6rem; }
    .err-body { font-size: .95rem; color: var(--ink2); max-width: 46ch; margin: 0 auto 1.8rem; line-height: 1.6; }

    /* result */
    #result { display: none; text-align: center; }
    .result-style-badge {
      display: inline-flex; align-items: center; gap: .4rem; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: 1rem;
    }
    .result-img-wrap { margin-bottom: 1.8rem; }
    #result-img {
      max-width: 100%; max-height: 640px; border-radius: 16px;
      box-shadow: 0 8px 30px rgba(22,28,55,.08);
    }
    .cta-row { display: flex; align-items: center; justify-content: center; gap: 1.4rem; flex-wrap: wrap; }

    @media (max-width: 600px) {
      .style-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <section class="hero" id="form-section">
    <p class="kicker">AI Ad Generator</p>
    <h1 class="hero-title">Trasforma la foto del tuo prodotto in un annuncio pro</h1>
    <p class="hero-sub">Carica una foto del prodotto, scegli uno stile e l'AI genera un'immagine pubblicitaria pronta per i tuoi social.</p>

    <div class="upload-zone" id="upload-zone">
      <input type="file" id="photo-input" accept="image/jpeg,image/png" hidden>
      <div id="upload-placeholder">
        <i class="ti ti-photo-up upload-icon"></i>
        <p>Trascina qui la foto o clicca per selezionarla</p>
        <p class="muted">JPG o PNG, max 5MB</p>
      </div>
      <img id="preview-img" class="preview" style="display:none" alt="Anteprima foto prodotto">
    </div>

    <p class="hint"><i class="ti ti-info-circle"></i> Usa una foto con etichetta/logo ben visibile per il miglior risultato</p>

    <p class="kicker">Scegli uno stile</p>
    <div class="style-grid">
      <button type="button" class="style-option" data-style="floating">
        <i class="ti ti-droplet"></i>
        <span class="style-name">Floating</span>
        <span class="style-desc">Splash dinamici, vortice nel liquido, ghiaccio e sfondo scuro drammatico</span>
      </button>
      <button type="button" class="style-option" data-style="minimal">
        <i class="ti ti-square-rounded"></i>
        <span class="style-name">Minimal</span>
        <span class="style-desc">Sfondo chiaro e pulito, ombre morbide, stile elegante</span>
      </button>
      <button type="button" class="style-option" data-style="social">
        <i class="ti ti-brand-instagram"></i>
        <span class="style-name">Social</span>
        <span class="style-desc">Contesto lifestyle, luce naturale, colori vivaci per Instagram</span>
      </button>
    </div>

    <button class="btn-primary" id="generate-btn"><i class="ti ti-sparkles"></i> Genera</button>
    <p class="gen-hint">La generazione richiede circa 10-30 secondi.</p>
    <p id="form-err" class="err"></p>
  </section>

  <section id="loading">
    <div class="spinner"></div>
    <p class="loading-txt" id="loading-msg">Sto analizzando la tua foto…</p>
    <p class="loading-sub">Può richiedere fino a 30 secondi, non chiudere la pagina.</p>
  </section>

  <section id="result-err">
    <p class="err-icon"><i class="ti ti-mood-sad" id="result-err-icon"></i></p>
    <p class="err-title" id="result-err-title">Non siamo riusciti a generare l'annuncio</p>
    <p class="err-body" id="result-err-msg">—</p>
    <button class="btn-primary" id="retry-btn"><i class="ti ti-refresh"></i> Riprova</button>
  </section>

  <div id="result">
    <p class="result-style-badge" id="result-style-badge"><i class="ti ti-sparkles"></i> Stile</p>
    <div class="result-img-wrap">
      <img id="result-img" alt="Annuncio generato dall'AI">
    </div>
    <div class="cta-row">
      <a class="btn-primary" id="download-btn" download="annuncio-shield-ai.png"><i class="ti ti-download"></i> Scarica</a>
      <button class="btn-ghost" id="new-gen-btn"><i class="ti ti-arrow-back-up"></i> Genera un altro annuncio</button>
    </div>
  </div>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();

  /* page logic */
  (function () {
    var formSection = document.getElementById("form-section");
    var loading      = document.getElementById("loading");
    var resultErr    = document.getElementById("result-err");
    var result       = document.getElementById("result");
    var formErr      = document.getElementById("form-err");

    var uploadZone        = document.getElementById("upload-zone");
    var photoInput        = document.getElementById("photo-input");
    var uploadPlaceholder = document.getElementById("upload-placeholder");
    var previewImg        = document.getElementById("preview-img");
    var styleOptions      = Array.prototype.slice.call(document.querySelectorAll(".style-option"));
    var generateBtn       = document.getElementById("generate-btn");
    var loadingMsg        = document.getElementById("loading-msg");
    var resultImg         = document.getElementById("result-img");
    var resultBadge       = document.getElementById("result-style-badge");
    var downloadBtn       = document.getElementById("download-btn");
    var newGenBtn         = document.getElementById("new-gen-btn");
    var retryBtn          = document.getElementById("retry-btn");
    var resultErrTitle    = document.getElementById("result-err-title");
    var resultErrMsg      = document.getElementById("result-err-msg");
    var resultErrIcon     = document.getElementById("result-err-icon");

    var MAX_SIZE = 5 * 1024 * 1024;
    var ALLOWED_TYPES = ["image/jpeg", "image/png"];
    var STYLE_LABELS = { floating: "Floating", minimal: "Minimal", social: "Social" };

    var selectedFile = null;
    var selectedStyle = null;

    function showState(state) {
      formSection.style.display = state === "form" ? "block" : "none";
      loading.style.display     = state === "loading" ? "block" : "none";
      resultErr.style.display   = state === "error" ? "block" : "none";
      result.style.display      = state === "result" ? "block" : "none";
    }

    function setFile(file) {
      if (ALLOWED_TYPES.indexOf(file.type) === -1) {
        formErr.textContent = "Formato non valido: usa un'immagine JPG o PNG.";
        return;
      }
      if (file.size > MAX_SIZE) {
        formErr.textContent = "L'immagine supera il limite di 5MB.";
        return;
      }
      formErr.textContent = "";
      selectedFile = file;
      var reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        uploadPlaceholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    }

    uploadZone.addEventListener("click", function () { photoInput.click(); });
    photoInput.addEventListener("change", function () {
      if (photoInput.files && photoInput.files[0]) setFile(photoInput.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (evt) {
      uploadZone.addEventListener(evt, function (e) {
        e.preventDefault(); e.stopPropagation();
        uploadZone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      uploadZone.addEventListener(evt, function (e) {
        e.preventDefault(); e.stopPropagation();
        uploadZone.classList.remove("dragover");
      });
    });
    uploadZone.addEventListener("drop", function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0]) setFile(files[0]);
    });

    styleOptions.forEach(function (opt) {
      opt.addEventListener("click", function () {
        styleOptions.forEach(function (o) { o.classList.remove("selected"); });
        opt.classList.add("selected");
        selectedStyle = opt.dataset.style;
        formErr.textContent = "";
      });
    });

    var loadingMessages = [
      "Sto analizzando la tua foto…",
      "Sto applicando lo stile scelto…",
      "Sto generando l'immagine con l'AI…",
      "Ultimi ritocchi all'annuncio…"
    ];
    var msgTimer = null;

    function startMessages() {
      var i = 0;
      loadingMsg.textContent = loadingMessages[0];
      loadingMsg.style.opacity = 1;
      msgTimer = setInterval(function () {
        i = (i + 1) % loadingMessages.length;
        loadingMsg.style.opacity = 0;
        setTimeout(function () {
          loadingMsg.textContent = loadingMessages[i];
          loadingMsg.style.opacity = 1;
        }, 250);
      }, 4000);
    }
    function stopMessages() {
      if (msgTimer) { clearInterval(msgTimer); msgTimer = null; }
    }

    function showError(code, message) {
      if (code === "rate_limit_exceeded") {
        resultErrIcon.className = "ti ti-clock-exclamation";
        resultErrTitle.textContent = "Limite giornaliero raggiunto";
        resultErrMsg.textContent = message || "Hai raggiunto il limite di 3 generazioni gratuite per oggi. Riprova domani.";
        retryBtn.style.display = "none";
      } else {
        resultErrIcon.className = "ti ti-mood-sad";
        resultErrTitle.textContent = "Non siamo riusciti a generare l'annuncio";
        resultErrMsg.textContent = message || "Si è verificato un errore imprevisto. Riprova tra qualche istante.";
        retryBtn.style.display = "inline-flex";
      }
      showState("error");
    }

    function runGenerate() {
      formErr.textContent = "";
      if (!selectedFile) {
        formErr.textContent = "Carica prima una foto del prodotto.";
        return;
      }
      if (!selectedStyle) {
        formErr.textContent = "Scegli uno stile per il tuo annuncio.";
        return;
      }

      showState("loading");
      startMessages();

      var formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("style", selectedStyle);

      fetch("/generate-ad", { method: "POST", body: formData })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          stopMessages();
          if (!r.ok) {
            var err = (r.data && r.data.error) || {};
            showError(err.code, err.message);
            return;
          }
          var img = (r.data && r.data.image) || {};
          var style = (r.data && r.data.style) || selectedStyle;
          var dataUrl = "data:" + (img.mimeType || "image/png") + ";base64," + img.base64;
          resultImg.src = dataUrl;
          resultBadge.innerHTML = '<i class="ti ti-sparkles"></i> Stile ' + (STYLE_LABELS[style] || style);
          downloadBtn.href = dataUrl;
          downloadBtn.download = "shield-ai-ad-" + style + ".png";
          showState("result");
        })
        .catch(function () {
          stopMessages();
          showError(null, "Errore di connessione. Controlla la rete e riprova.");
        });
    }

    generateBtn.addEventListener("click", runGenerate);
    retryBtn.addEventListener("click", function () { showState("form"); });
    newGenBtn.addEventListener("click", function () { showState("form"); });

    showState("form");
  })();
</script>

</body>
</html>`;
}

export function renderDashboardPage({ userId, previews, payments, sprints }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard — Shield AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:  #1a1d2e;
      --bg2: #242842;
      --ink:  #eef0f7;
      --ink2: #c2c6da;
      --ink3: #8d92ad;
      --line: #353a56;
      --green:  #4ade80;
      --orange: #fb923c;
      --blue:   #60a5fa;
      --a1: #ff6452;
      --a2: #f59e0b;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Plus Jakarta Sans", sans-serif; color: var(--ink); min-height: 100vh;
      background:
        radial-gradient(ellipse at 18% 12%, rgba(124,58,237,.20) 0%, transparent 46%),
        radial-gradient(ellipse at 82% 8%,  rgba(96,165,250,.16) 0%, transparent 42%),
        radial-gradient(ellipse at 70% 80%, rgba(255,100,82,.14) 0%, transparent 48%),
        radial-gradient(ellipse at 12% 85%, rgba(124,58,237,.13) 0%, transparent 44%),
        var(--bg);
    }
    .page { position: relative; z-index: 1; width: min(880px, 94vw); margin: 0 auto; padding: 2.5rem 0 5rem; }

    /* header */
    .hdr { display: flex; align-items: center; gap: .75rem; margin-bottom: 2.8rem; }
    .logo-sq {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--a1) 0%, var(--a2) 100%);
      display: grid; place-items: center;
      font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff;
    }
    .logo-name { font-family: "Clash Display", sans-serif; font-weight: 700; font-size: 1.25rem; letter-spacing: -.02em; }

    /* heading */
    .hero-title {
      font-family: "Clash Display", sans-serif; font-weight: 700;
      font-size: clamp(1.7rem, 4vw, 2.5rem); letter-spacing: -.03em; margin-bottom: .3rem;
    }
    .hero-sub { font-size: .9rem; font-weight: 500; color: var(--ink3); margin-bottom: 2.2rem; max-width: 60ch; }

    /* form */
    .kicker { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink3); margin-bottom: .6rem; }
    label { display: block; font-size: .82rem; font-weight: 700; color: var(--ink2); margin-bottom: .45rem; }
    input, select, textarea {
      width: 100%; font: inherit; font-size: .95rem; color: var(--ink);
      background: var(--bg2); border: 1px solid var(--line); border-radius: 10px;
      padding: .75rem .9rem; transition: border-color .15s;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--a1); }
    .lookup-form { display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
    .lookup-form .field { flex: 1; min-width: 220px; }

    /* cards */
    .card {
      background: var(--bg2); border: 1px solid var(--line); border-radius: 16px;
      padding: 1.25rem 1.4rem; margin-bottom: 1.1rem;
    }
    .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.1rem; }
    .page ul { list-style: none; display: flex; flex-direction: column; gap: .55rem; margin-top: .2rem; }
    .page li { font-size: .9rem; line-height: 1.45; color: var(--ink2); font-weight: 500; padding-left: 1.05rem; position: relative; }
    .page li::before { content: "•"; position: absolute; left: 0; color: var(--a1); font-weight: 900; }
    .page li a { color: var(--ink); font-weight: 700; text-decoration: none; }
    .page li a:hover { color: var(--a1); }
    .muted { color: var(--ink3); font-size: .9rem; }
    code { background: var(--bg); border: 1px solid var(--line); padding: .12rem .4rem; border-radius: 6px; font-size: .85em; color: var(--ink2); }

    /* buttons */
    .btn-primary {
      display: inline-block; text-decoration: none; cursor: pointer; border: 0;
      background: linear-gradient(135deg, var(--a1) 0%, #df6a3c 100%);
      color: #fff; font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700;
      font-size: .95rem; padding: .85rem 1.8rem; border-radius: 999px; transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .85; }
    .btn-ghost { font-size: .88rem; color: var(--ink3); text-decoration: none; font-weight: 500; }
    .btn-ghost:hover { color: var(--ink); }
    .actions-row { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; margin-top: .5rem; }
  </style>
</head>
<body>

<div class="page">

  <header class="hdr">
    <div class="logo-sq">S</div>
    <span class="logo-name">Shield AI</span>
  </header>

  <p class="hero-title">Creator Dashboard</p>
  <p class="hero-sub">${escapeHtml(
    userId ? `History for user ${userId}` : "Pass userId query param, for example /dashboard?userId=user-123"
  )}</p>

  <section class="card">
    <form method="get" action="/dashboard" class="lookup-form">
      <div class="field">
        <label for="dashboard-user">User ID</label>
        <input id="dashboard-user" name="userId" value="${escapeHtml(userId || "")}" placeholder="user-123" />
      </div>
      <button type="submit" class="btn-primary">Load Dashboard</button>
    </form>
  </section>

  <div class="split">
    <article class="card">
      <p class="kicker">Previews (${previews.length})</p>
      ${renderList(
        previews.map(
          (item) =>
            `<a href="/preview/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(item.userId)}">${escapeHtml(item.id)}</a> · ${escapeHtml(formatDate(item.createdAt))}`
        )
      )}
    </article>
    <article class="card">
      <p class="kicker">Payments (${payments.length})</p>
      ${renderList(
        payments.map(
          (item) =>
            `<code>${escapeHtml(item.status)}</code> · ${escapeHtml(item.priceVariant)} · <a href="/paywall/${encodeURIComponent(item.previewId)}?userId=${encodeURIComponent(item.userId)}">${escapeHtml(item.previewId)}</a>`
        )
      )}
    </article>
  </div>

  <section class="card">
    <p class="kicker">Sprints (${sprints.length})</p>
    ${renderList(
      sprints.map(
        (item) =>
          `<a href="/sprint/${encodeURIComponent(item.id)}">${escapeHtml(item.id)}</a> · from preview <code>${escapeHtml(item.previewId)}</code> · ${escapeHtml(formatDate(item.createdAt))}`
      )
    )}
  </section>

  <div class="actions-row">
    <a class="btn-ghost" href="/">← Home</a>
    <a class="btn-ghost" href="/generate">Generate</a>
  </div>

</div>

<script>
  /* session id */
  (function () {
    try {
      var k = "shia.session.id", v = localStorage.getItem(k);
      if (!v) { v = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 1e9); localStorage.setItem(k, v); }
      window.__shiaSessionId = v;
    } catch (e) { window.__shiaSessionId = null; }
  })();
</script>

</body>
</html>`;
}
