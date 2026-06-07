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
        radial-gradient(circle at 12% 8%,  rgba(255,100,82,.10) 0%, transparent 38%),
        radial-gradient(circle at 88% 18%, rgba(245,158,11,.08) 0%, transparent 34%),
        radial-gradient(circle at 50% 96%, rgba(96,165,250,.07) 0%, transparent 42%),
        var(--bg);
    }
    #nn { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
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

<canvas id="nn"></canvas>

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

  /* neural network canvas */
  (function () {
    var canvas = document.getElementById("nn");
    var ctx = canvas.getContext("2d");
    var N = 60, DIST = 170, nodes = [], pulses = [], flashes = [];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function init() {
      nodes = [];
      pulses = [];
      flashes = new Array(N).fill(0);
      for (var i = 0; i < N; i++) {
        var z = Math.random();
        nodes.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          vx: (Math.random() - .5) * (.12 + z * .5),
          vy: (Math.random() - .5) * (.12 + z * .5),
          r: 1 + z * 3,
          z: z
        });
      }
      nodes.sort(function (a, b) { return a.z - b.z; });
    }
    function neighborsOf(i) {
      var list = [];
      for (var j = 0; j < N; j++) {
        if (j === i) continue;
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < DIST) list.push(j);
      }
      return list;
    }
    function fire(i) {
      flashes[i] = 1;
      if (Math.random() < .8) {
        var list = neighborsOf(i);
        if (list.length) {
          var j = list[Math.floor(Math.random() * list.length)];
          pulses.push({ a: i, b: j, t: 0, speed: .025 + Math.random() * .03 });
        }
      }
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < N; i++) {
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy;
        if (nodes[i].x < 0 || nodes[i].x > canvas.width)  nodes[i].vx *= -1;
        if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;
        flashes[i] = Math.max(0, flashes[i] - .035);
      }
      if (Math.random() < .05) fire(Math.floor(Math.random() * N));

      /* synapse connections — brighten when either end is firing */
      for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          var depth = (nodes[i].z + nodes[j].z) / 2;
          var boost = Math.max(flashes[i], flashes[j]) * .5;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,100,82," + ((1 - d / DIST) * (.08 + depth * .34 + boost)) + ")";
          ctx.lineWidth = .5 + depth * .9 + boost * 1.2;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      /* traveling impulses with glowing trail */
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pulse = pulses[p];
        pulse.t += pulse.speed;
        if (pulse.t >= 1) { fire(pulse.b); pulses.splice(p, 1); continue; }
        var a = nodes[pulse.a], b = nodes[pulse.b];
        var x = a.x + (b.x - a.x) * pulse.t;
        var y = a.y + (b.y - a.y) * pulse.t;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(255,214,180,.9)");
        glow.addColorStop(1, "rgba(255,100,82,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,238,225,.95)";
        ctx.fill();
      }

      /* nodes, back to front, flashing ones light up like firing neurons */
      for (var i = 0; i < N; i++) {
        var n = nodes[i], flash = flashes[i];
        var rr = n.r + flash * 3.5;
        ctx.save();
        if (flash > .05) {
          ctx.shadowColor = "rgba(255,225,195," + Math.min(1, flash) + ")";
          ctx.shadowBlur = 8 + flash * 26;
        } else if (n.z < .45) {
          ctx.filter = "blur(" + ((.45 - n.z) * 3.2) + "px)";
        } else {
          ctx.shadowColor = "rgba(255,100,82,.85)";
          ctx.shadowBlur = (n.z - .45) * 18;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = flash > .05
          ? "rgba(255,232,214," + Math.min(1, .45 + flash * .6) + ")"
          : "rgba(255,100,82," + (.14 + n.z * .58) + ")";
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }
    resize(); init(); tick();
    window.addEventListener("resize", function () { resize(); });
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
        radial-gradient(circle at 12% 8%,  rgba(255,100,82,.10) 0%, transparent 38%),
        radial-gradient(circle at 88% 18%, rgba(245,158,11,.08) 0%, transparent 34%),
        radial-gradient(circle at 50% 96%, rgba(96,165,250,.07) 0%, transparent 42%),
        var(--bg);
    }
    #nn { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
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

<canvas id="nn"></canvas>

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

  /* neural network canvas */
  (function () {
    var canvas = document.getElementById("nn");
    var ctx = canvas.getContext("2d");
    var N = 60, DIST = 170, nodes = [], pulses = [], flashes = [];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function init() {
      nodes = [];
      pulses = [];
      flashes = new Array(N).fill(0);
      for (var i = 0; i < N; i++) {
        var z = Math.random();
        nodes.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          vx: (Math.random() - .5) * (.12 + z * .5),
          vy: (Math.random() - .5) * (.12 + z * .5),
          r: 1 + z * 3,
          z: z
        });
      }
      nodes.sort(function (a, b) { return a.z - b.z; });
    }
    function neighborsOf(i) {
      var list = [];
      for (var j = 0; j < N; j++) {
        if (j === i) continue;
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < DIST) list.push(j);
      }
      return list;
    }
    function fire(i) {
      flashes[i] = 1;
      if (Math.random() < .8) {
        var list = neighborsOf(i);
        if (list.length) {
          var j = list[Math.floor(Math.random() * list.length)];
          pulses.push({ a: i, b: j, t: 0, speed: .025 + Math.random() * .03 });
        }
      }
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < N; i++) {
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy;
        if (nodes[i].x < 0 || nodes[i].x > canvas.width)  nodes[i].vx *= -1;
        if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;
        flashes[i] = Math.max(0, flashes[i] - .035);
      }
      if (Math.random() < .05) fire(Math.floor(Math.random() * N));

      /* synapse connections — brighten when either end is firing */
      for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          var depth = (nodes[i].z + nodes[j].z) / 2;
          var boost = Math.max(flashes[i], flashes[j]) * .5;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,100,82," + ((1 - d / DIST) * (.08 + depth * .34 + boost)) + ")";
          ctx.lineWidth = .5 + depth * .9 + boost * 1.2;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      /* traveling impulses with glowing trail */
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pulse = pulses[p];
        pulse.t += pulse.speed;
        if (pulse.t >= 1) { fire(pulse.b); pulses.splice(p, 1); continue; }
        var a = nodes[pulse.a], b = nodes[pulse.b];
        var x = a.x + (b.x - a.x) * pulse.t;
        var y = a.y + (b.y - a.y) * pulse.t;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(255,214,180,.9)");
        glow.addColorStop(1, "rgba(255,100,82,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,238,225,.95)";
        ctx.fill();
      }

      /* nodes, back to front, flashing ones light up like firing neurons */
      for (var i = 0; i < N; i++) {
        var n = nodes[i], flash = flashes[i];
        var rr = n.r + flash * 3.5;
        ctx.save();
        if (flash > .05) {
          ctx.shadowColor = "rgba(255,225,195," + Math.min(1, flash) + ")";
          ctx.shadowBlur = 8 + flash * 26;
        } else if (n.z < .45) {
          ctx.filter = "blur(" + ((.45 - n.z) * 3.2) + "px)";
        } else {
          ctx.shadowColor = "rgba(255,100,82,.85)";
          ctx.shadowBlur = (n.z - .45) * 18;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = flash > .05
          ? "rgba(255,232,214," + Math.min(1, .45 + flash * .6) + ")"
          : "rgba(255,100,82," + (.14 + n.z * .58) + ")";
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }
    resize(); init(); tick();
    window.addEventListener("resize", function () { resize(); });
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
        radial-gradient(circle at 12% 8%,  rgba(255,100,82,.10) 0%, transparent 38%),
        radial-gradient(circle at 88% 18%, rgba(245,158,11,.08) 0%, transparent 34%),
        radial-gradient(circle at 50% 96%, rgba(96,165,250,.07) 0%, transparent 42%),
        var(--bg);
    }
    #nn { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
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

<canvas id="nn"></canvas>

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

  /* neural network canvas */
  (function () {
    var canvas = document.getElementById("nn");
    var ctx = canvas.getContext("2d");
    var N = 60, DIST = 170, nodes = [], pulses = [], flashes = [];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function init() {
      nodes = [];
      pulses = [];
      flashes = new Array(N).fill(0);
      for (var i = 0; i < N; i++) {
        var z = Math.random();
        nodes.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          vx: (Math.random() - .5) * (.12 + z * .5),
          vy: (Math.random() - .5) * (.12 + z * .5),
          r: 1 + z * 3,
          z: z
        });
      }
      nodes.sort(function (a, b) { return a.z - b.z; });
    }
    function neighborsOf(i) {
      var list = [];
      for (var j = 0; j < N; j++) {
        if (j === i) continue;
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < DIST) list.push(j);
      }
      return list;
    }
    function fire(i) {
      flashes[i] = 1;
      if (Math.random() < .8) {
        var list = neighborsOf(i);
        if (list.length) {
          var j = list[Math.floor(Math.random() * list.length)];
          pulses.push({ a: i, b: j, t: 0, speed: .025 + Math.random() * .03 });
        }
      }
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < N; i++) {
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy;
        if (nodes[i].x < 0 || nodes[i].x > canvas.width)  nodes[i].vx *= -1;
        if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;
        flashes[i] = Math.max(0, flashes[i] - .035);
      }
      if (Math.random() < .05) fire(Math.floor(Math.random() * N));

      /* synapse connections — brighten when either end is firing */
      for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          var depth = (nodes[i].z + nodes[j].z) / 2;
          var boost = Math.max(flashes[i], flashes[j]) * .5;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,100,82," + ((1 - d / DIST) * (.08 + depth * .34 + boost)) + ")";
          ctx.lineWidth = .5 + depth * .9 + boost * 1.2;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      /* traveling impulses with glowing trail */
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pulse = pulses[p];
        pulse.t += pulse.speed;
        if (pulse.t >= 1) { fire(pulse.b); pulses.splice(p, 1); continue; }
        var a = nodes[pulse.a], b = nodes[pulse.b];
        var x = a.x + (b.x - a.x) * pulse.t;
        var y = a.y + (b.y - a.y) * pulse.t;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(255,214,180,.9)");
        glow.addColorStop(1, "rgba(255,100,82,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,238,225,.95)";
        ctx.fill();
      }

      /* nodes, back to front, flashing ones light up like firing neurons */
      for (var i = 0; i < N; i++) {
        var n = nodes[i], flash = flashes[i];
        var rr = n.r + flash * 3.5;
        ctx.save();
        if (flash > .05) {
          ctx.shadowColor = "rgba(255,225,195," + Math.min(1, flash) + ")";
          ctx.shadowBlur = 8 + flash * 26;
        } else if (n.z < .45) {
          ctx.filter = "blur(" + ((.45 - n.z) * 3.2) + "px)";
        } else {
          ctx.shadowColor = "rgba(255,100,82,.85)";
          ctx.shadowBlur = (n.z - .45) * 18;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = flash > .05
          ? "rgba(255,232,214," + Math.min(1, .45 + flash * .6) + ")"
          : "rgba(255,100,82," + (.14 + n.z * .58) + ")";
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }
    resize(); init(); tick();
    window.addEventListener("resize", function () { resize(); });
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
        radial-gradient(circle at 12% 8%,  rgba(255,100,82,.10) 0%, transparent 38%),
        radial-gradient(circle at 88% 18%, rgba(245,158,11,.08) 0%, transparent 34%),
        radial-gradient(circle at 50% 96%, rgba(96,165,250,.07) 0%, transparent 42%),
        var(--bg);
    }
    #nn { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
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

<canvas id="nn"></canvas>

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

  /* neural network canvas */
  (function () {
    var canvas = document.getElementById("nn");
    var ctx = canvas.getContext("2d");
    var N = 60, DIST = 170, nodes = [], pulses = [], flashes = [];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function init() {
      nodes = [];
      pulses = [];
      flashes = new Array(N).fill(0);
      for (var i = 0; i < N; i++) {
        var z = Math.random();
        nodes.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          vx: (Math.random() - .5) * (.12 + z * .5),
          vy: (Math.random() - .5) * (.12 + z * .5),
          r: 1 + z * 3,
          z: z
        });
      }
      nodes.sort(function (a, b) { return a.z - b.z; });
    }
    function neighborsOf(i) {
      var list = [];
      for (var j = 0; j < N; j++) {
        if (j === i) continue;
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < DIST) list.push(j);
      }
      return list;
    }
    function fire(i) {
      flashes[i] = 1;
      if (Math.random() < .8) {
        var list = neighborsOf(i);
        if (list.length) {
          var j = list[Math.floor(Math.random() * list.length)];
          pulses.push({ a: i, b: j, t: 0, speed: .025 + Math.random() * .03 });
        }
      }
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < N; i++) {
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy;
        if (nodes[i].x < 0 || nodes[i].x > canvas.width)  nodes[i].vx *= -1;
        if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;
        flashes[i] = Math.max(0, flashes[i] - .035);
      }
      if (Math.random() < .05) fire(Math.floor(Math.random() * N));

      /* synapse connections — brighten when either end is firing */
      for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          var depth = (nodes[i].z + nodes[j].z) / 2;
          var boost = Math.max(flashes[i], flashes[j]) * .5;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,100,82," + ((1 - d / DIST) * (.08 + depth * .34 + boost)) + ")";
          ctx.lineWidth = .5 + depth * .9 + boost * 1.2;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      /* traveling impulses with glowing trail */
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pulse = pulses[p];
        pulse.t += pulse.speed;
        if (pulse.t >= 1) { fire(pulse.b); pulses.splice(p, 1); continue; }
        var a = nodes[pulse.a], b = nodes[pulse.b];
        var x = a.x + (b.x - a.x) * pulse.t;
        var y = a.y + (b.y - a.y) * pulse.t;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(255,214,180,.9)");
        glow.addColorStop(1, "rgba(255,100,82,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,238,225,.95)";
        ctx.fill();
      }

      /* nodes, back to front, flashing ones light up like firing neurons */
      for (var i = 0; i < N; i++) {
        var n = nodes[i], flash = flashes[i];
        var rr = n.r + flash * 3.5;
        ctx.save();
        if (flash > .05) {
          ctx.shadowColor = "rgba(255,225,195," + Math.min(1, flash) + ")";
          ctx.shadowBlur = 8 + flash * 26;
        } else if (n.z < .45) {
          ctx.filter = "blur(" + ((.45 - n.z) * 3.2) + "px)";
        } else {
          ctx.shadowColor = "rgba(255,100,82,.85)";
          ctx.shadowBlur = (n.z - .45) * 18;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = flash > .05
          ? "rgba(255,232,214," + Math.min(1, .45 + flash * .6) + ")"
          : "rgba(255,100,82," + (.14 + n.z * .58) + ")";
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }
    resize(); init(); tick();
    window.addEventListener("resize", function () { resize(); });
  })();
</script>

</body>
</html>`;
}
