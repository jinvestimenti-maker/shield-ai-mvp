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
  return renderAppShell({
    title: "SHIA MVP",
    heading: "Turn a TikTok profile into a 7-day content sprint.",
    subheading:
      "Generate a free preview, unlock with Stripe, and get a complete posting sprint from the same flow.",
    body: `
      <section class="card">
        <p class="kicker">MVP Flow</p>
        <p>Landing → Generate → Preview → Paywall → Sprint → Dashboard</p>
      </section>
      <section class="split">
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
      </section>
      <section class="actions">
        <a class="chip" href="/generate">Start Generator</a>
      </section>
    `
  });
}

export function renderGeneratePage() {
  return renderAppShell({
    title: "Generate Preview",
    heading: "Create a Free Preview",
    subheading: "Submit normalized creator input and generate your preview artifact.",
    body: `
      <section class="card">
        <form id="generate-form">
          <div class="split">
            <div>
              <label for="userId">User ID</label>
              <input id="userId" name="userId" required placeholder="user-123" />
            </div>
            <div>
              <label for="username">TikTok Username</label>
              <input id="username" name="username" required placeholder="creator_name" />
            </div>
            <div>
              <label for="language">Language</label>
              <input id="language" name="language" value="en" required />
            </div>
            <div>
              <label for="creatorLevel">Creator Level</label>
              <select id="creatorLevel" name="creatorLevel">
                <option value="beginner">beginner</option>
                <option value="active" selected>active</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
            <div>
              <label for="primaryGoal">Primary Goal</label>
              <select id="primaryGoal" name="primaryGoal">
                <option value="views">views</option>
                <option value="followers" selected>followers</option>
                <option value="clients">clients</option>
                <option value="consistency">consistency</option>
              </select>
            </div>
            <div>
              <label for="niche">Niche</label>
              <input id="niche" name="niche" required placeholder="fitness, SaaS, productivity..." />
            </div>
          </div>
          <label for="bio">Bio</label>
          <textarea id="bio" name="bio" rows="3" required placeholder="What does this creator post and for whom?"></textarea>
          <div class="actions">
            <button class="primary" type="submit">Generate Preview</button>
          </div>
          <p id="generate-error" class="error"></p>
        </form>
      </section>
      <script>
        const form = document.getElementById("generate-form");
        const errorEl = document.getElementById("generate-error");
        const queryPath = new URLSearchParams(location.search).get("path");

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          errorEl.textContent = "";
          const formData = new FormData(form);

          const userId = String(formData.get("userId")).trim();
          const username = String(formData.get("username")).trim().replace(/^@/, "");
          const payload = {
            userId,
            idempotencyKey: "preview:" + Date.now() + ":" + Math.floor(Math.random() * 1e6),
            path: queryPath,
            creatorInput: {
              source: "guided_fallback",
              profile: {
                username,
                profileUrl: "https://www.tiktok.com/@" + username,
                bio: String(formData.get("bio")).trim(),
                language: String(formData.get("language")).trim(),
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
            }
          };

          try {
            const response = await fetch("/api/generate-preview", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-session-id": window.__shiaSessionId || ""
              },
              body: JSON.stringify(payload)
            });
            const body = await response.json();
            if (!response.ok) {
              throw new Error(body?.error?.message || "Preview generation failed");
            }
            location.assign("/preview/" + encodeURIComponent(body.id) + "?userId=" + encodeURIComponent(userId));
          } catch (error) {
            errorEl.textContent = error.message;
          }
        });
      </script>
    `
  });
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
  const circum = Math.round(2 * Math.PI * 80); // 503 — circonferenza anello SVG r=80
  return renderAppShell({
    title: "Analisi Profilo — Shield AI",
    heading: "Analisi del Profilo",
    subheading: "Carico la tua analisi AI…",
    body: `
      <canvas id="nn-canvas" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5;"></canvas>
      <style>
        .wrap { position: relative; z-index: 1; }
        .score-ring-wrap { display:flex;justify-content:center;margin:0.5rem 0 1.4rem; }
        .score-ring-wrap svg { width:min(220px,55vw);height:min(220px,55vw); }
        .ring-bg   { fill:none;stroke:#e0d5c5;stroke-width:14; }
        .ring-fill { fill:none;stroke:var(--accent);stroke-width:14;stroke-linecap:round;
          stroke-dasharray:${circum};stroke-dashoffset:${circum};
          transition:stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1);
          transform:rotate(-90deg);transform-origin:center; }
        .ring-score { font-family:"Fraunces",serif;font-size:2.6rem;fill:var(--ink);text-anchor:middle; }
        .ring-lbl   { font-family:"Space Grotesk",sans-serif;font-size:0.7rem;fill:#6c4e32;text-anchor:middle;text-transform:uppercase;letter-spacing:.08em; }
        .col-green  { border-left:4px solid #16a34a; }
        .col-orange { border-left:4px solid #ea580c; }
        .col-blue   { border-left:4px solid #2563eb; }
        .kicker-green  { color:#166534; }
        .kicker-orange { color:#92400e; }
        .kicker-blue   { color:#1e40af; }
        .bio-box { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:.9rem 1rem;font-style:italic; }
        #loading-wrap { text-align:center;padding:2rem 0; }
        .spinner { display:inline-block;width:36px;height:36px;border:4px solid #e0d5c5;border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin-top:1rem; }
        @keyframes spin { to { transform:rotate(360deg); } }
        #dashboard { display:none; }
      </style>

      <div id="loading-wrap">
        <p class="muted">Analisi AI in corso…</p>
        <div class="spinner"></div>
      </div>
      <p id="analyze-error" class="error"></p>

      <div id="dashboard">
        <div class="score-ring-wrap">
          <svg viewBox="0 0 200 200">
            <circle class="ring-bg"   cx="100" cy="100" r="80" />
            <circle id="ring-fill" class="ring-fill" cx="100" cy="100" r="80" />
            <text id="score-num" class="ring-score" x="100" y="104" dominant-baseline="middle">0</text>
            <text class="ring-lbl" x="100" y="130">/100 Growth Score</text>
          </svg>
        </div>
        <section class="card">
          <p class="kicker">Verdetto AI</p>
          <p id="verdict-text" class="muted">—</p>
        </section>
        <div class="split">
          <article class="card col-green">
            <p class="kicker kicker-green">Forze</p>
            <ul id="forze-list"></ul>
          </article>
          <article class="card col-orange">
            <p class="kicker kicker-orange">Da migliorare</p>
            <ul id="errori-list"></ul>
          </article>
          <article class="card col-blue">
            <p class="kicker kicker-blue">Occasioni</p>
            <ul id="opportunita-list"></ul>
          </article>
        </div>
        <section class="card">
          <p class="kicker">Bio suggerita</p>
          <p id="bio-box" class="bio-box">—</p>
        </section>
        <div class="actions">
          <a class="chip" href="/generate">Genera il tuo piano</a>
        </div>
      </div>

      <script>
        /* ── neural-network canvas ── */
        (function () {
          const canvas = document.getElementById("nn-canvas");
          const ctx = canvas.getContext("2d");
          const N = 38, DIST = 150;
          let nodes = [];
          function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
          function init() {
            nodes = Array.from({ length: N }, () => ({
              x: Math.random() * innerWidth,
              y: Math.random() * innerHeight,
              vx: (Math.random() - .5) * .45,
              vy: (Math.random() - .5) * .45,
              r: 2 + Math.random() * 1.5
            }));
          }
          function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const n of nodes) {
              n.x += n.vx; n.y += n.vy;
              if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
              if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            }
            for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < DIST) {
                ctx.beginPath();
                ctx.strokeStyle = "rgba(193,61,42," + (1 - d / DIST) * .15 + ")";
                ctx.lineWidth = .8;
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
              }
            }
            for (const n of nodes) {
              ctx.beginPath();
              ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(193,61,42,.22)";
              ctx.fill();
            }
            requestAnimationFrame(tick);
          }
          resize(); init(); tick();
          window.addEventListener("resize", resize);
        })();

        /* ── analyze logic ── */
        (function () {
          const loadingWrap = document.getElementById("loading-wrap");
          const dashboard   = document.getElementById("dashboard");
          const errorEl     = document.getElementById("analyze-error");
          const CIRCUM = ${circum};

          function esc(s) {
            return String(s).replace(/[<>&"']/g, c =>
              ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
          }
          function setList(id, arr) {
            document.getElementById(id).innerHTML =
              (Array.isArray(arr) ? arr : []).map(v => "<li>" + esc(v) + "</li>").join("");
          }
          function animateScore(score) {
            const ring = document.getElementById("ring-fill");
            const num  = document.getElementById("score-num");
            score = Math.max(0, Math.min(100, score || 0));
            ring.style.strokeDashoffset = CIRCUM * (1 - score / 100);
            let cur = 0;
            const step = score / 60;
            const iv = setInterval(() => {
              cur = Math.min(cur + step, score);
              num.textContent = Math.round(cur);
              if (cur >= score) clearInterval(iv);
            }, 16);
          }

          async function load() {
            try {
              const raw    = sessionStorage.getItem("shieldCreatorInput");
              const userId = sessionStorage.getItem("shieldUserId");
              if (!raw || !userId) throw new Error("Dati mancanti in sessionStorage — torna a /generate.");
              const creatorInput = JSON.parse(raw);
              const res  = await fetch("/api/analyze", {
                method: "POST",
                headers: { "content-type": "application/json", "x-session-id": window.__shiaSessionId || "" },
                body: JSON.stringify({ userId, creatorInput })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error?.message || "Analisi fallita");

              loadingWrap.style.display = "none";
              dashboard.style.display   = "";
              animateScore(data.growth_score);
              document.getElementById("verdict-text").textContent = data.score_explanation || "—";
              setList("forze-list",       data.punti_di_forza);
              setList("errori-list",      data.errori_principali);
              setList("opportunita-list", data.opportunita);
              document.getElementById("bio-box").textContent = data.suggerimento_bio || "—";
            } catch (err) {
              loadingWrap.style.display = "none";
              errorEl.textContent = err.message;
            }
          }
          load();
        })();
      </script>
    `
  });
}

export function renderDashboardPage({ userId, previews, payments, sprints }) {
  return renderAppShell({
    title: "Dashboard",
    heading: "Creator Dashboard",
    subheading: userId
      ? `History for user ${userId}`
      : "Pass userId query param, for example /dashboard?userId=user-123",
    body: `
      <section class="card">
        <form method="get" action="/dashboard" class="split">
          <div>
            <label for="dashboard-user">User ID</label>
            <input id="dashboard-user" name="userId" value="${escapeHtml(userId || "")}" placeholder="user-123" />
          </div>
          <div style="display:flex;align-items:flex-end;">
            <button type="submit" class="primary">Load Dashboard</button>
          </div>
        </form>
      </section>
      <section class="split">
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
      </section>
      <section class="card">
        <p class="kicker">Sprints (${sprints.length})</p>
        ${renderList(
          sprints.map(
            (item) =>
              `<a href="/sprint/${encodeURIComponent(item.id)}">${escapeHtml(item.id)}</a> · from preview <code>${escapeHtml(item.previewId)}</code> · ${escapeHtml(formatDate(item.createdAt))}`
          )
        )}
      </section>
    `
  });
}
