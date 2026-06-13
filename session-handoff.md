# Session Handoff

## Cosa fatto (questa sessione)
- Nuovo wizard ADMIN-ONLY `/admin/studio` che collega in un unico flusso i
  3 moduli esistenti (analisi business, generazione annuncio, generazione
  video) per preparare demo complete da mostrare ai business locali.
  Orchestrazione solo frontend + stato client, NESSUN modulo esistente
  riscritto.
- `routes/admin-studio.js` (nuovo):
  - `GET /admin/studio`, protetta riusando `requireAdmin` (Basic Auth,
    `ADMIN_KEY`) esportato da `routes/admin-generate-video.js`.
  - Pagina unica a 4 step con stepper + nav Avanti/Indietro, stato
    condiviso in un oggetto JS (`state`: businessName, location, instagram,
    business, analysis, adImageBase64, adImageMimeType, videoUrl).
  - **Step 1 — Analisi**: form nome business + città + handle Instagram
    (quest'ultimo solo metadato locale, mostrato in Step 4, NON inviato
    all'API). Chiama `POST /analyze-business` esistente, mostra growth
    score (badge colorato verde/arancio/rosso), punti di forza, errori,
    opportunità, idee contenuti, prossime azioni.
  - **Step 2 — Annuncio**: upload foto + selezione stile
    (floating/minimal/social), chiama `POST /generate-ad` esistente
    (FormData), mostra l'immagine generata e salva `base64`+`mimeType`
    in `state`.
  - **Step 3 — Video**: mostra l'immagine dello Step 2 come fonte, prompt
    movimento opzionale, chiama `POST /admin/generate-video` esistente con
    `{ imageBase64, mimeType, prompt }`, poi polling `GET .../status` ogni
    4s fino a `COMPLETED` e `GET .../result` -> `videoUrl`, mostra `<video>`.
  - **Step 4 — Presentazione**: vista pulita che riunisce growth score,
    punti di forza/errori/opportunità, handle Instagram, immagine annuncio
    e video generato. Bottone "Nuova demo" resetta `state` e torna a Step 1.
  - "Avanti" è disabilitato finché lo step corrente non ha completato la
    sua chiamata (`canAdvance()`).
- `src/server.js`: import + `app.use("/", adminStudioRouter)`.

## Smoke test / verifica eseguiti
- `node --check` su `routes/admin-studio.js` -> OK; estratto e validato
  anche lo script inline (`<script>...</script>`, ~14k caratteri) -> OK.
- `GET /admin/studio` senza auth -> 401; con `ADMIN_KEY` corretta -> 200,
  tutti gli ID DOM attesi presenti (analyzeBtn, bizName, bizLocation,
  genAdBtn, adPhoto, styleOpt, genVideoBtn, videoSourceImg, presBizName,
  resetBtn).
- **Contratti dei 3 endpoint riusati testati con chiamate reali**:
  - `POST /analyze-business` -> 500 `config_error` ("APIFY_TOKEN is not
    configured"). `APIFY_TOKEN` non è settata in `.env` locale, quindi lo
    Step 1 non è testabile end-to-end con dati reali in questa sessione.
    Il path di errore della UI (mostra "Errore: <message>") è comunque
    corretto per questa risposta.
  - `POST /generate-ad` (con `GEMINI_API_KEY` reale, foto
    `examples/test-output-3.png`, style `minimal`) -> 200,
    `{ style: "minimal", image: { mimeType: "image/png", base64: <1.9MB
    string> } }` — shape combacia con quanto legge lo Step 2.
  - `POST /admin/generate-video` (con `FAL_KEY` reale, Basic Auth, usando
    direttamente il base64 appena ottenuto da `/generate-ad`, come fa lo
    Step 3) -> 200 `{ requestId }`. Submit accettato; NON ripetuto il
    polling fino a `COMPLETED`/download dell'mp4 (già validato in una
    sessione precedente con lo stesso endpoint, per non ripetere un costo
    fal.ai + attesa di minuti).

## NON verificato (richiede test live nel browser)
- **Il flusso completo end-to-end con dati reali per Step 1**: serve
  `APIFY_TOKEN` (e `OPENAI_API_KEY`, già menzionata come mancante su Render
  in sessioni precedenti) per ottenere `business`/`analysis` reali.
- **Propagazione automatica della Basic Auth del browser** da
  `/admin/studio` a `/admin/generate-video*` per lo Step 3: il codice non
  invia un header `Authorization` esplicito, si basa sulla cache delle
  credenziali Basic del browser per lo stesso realm/origin. Mai testato in
  un browser reale — se non funziona, il fix è aggiungere un header
  `Authorization` costruito da un campo "ADMIN_KEY" inserito una volta
  nella pagina (richiederebbe esporre la key lato client, da valutare).
- **Navigazione completa dei 4 step in UI** (click reali su Avanti/Indietro,
  upload file via file picker, selezione stile, drag&drop, responsive
  layout su mobile) — testato solo via curl/contratti API, non in browser.
- **Bottone "Nuova demo"** (reset dello stato e dei campi form) — logica
  scritta ma non cliccata in un browser.

## File modificati/creati
- `routes/admin-studio.js` (nuovo)
- `routes/admin-generate-video.js` (esportata `requireAdmin` per riuso)
- `src/server.js` (import + `app.use` per `/admin/studio`)

## Prossimo step
- Test live in browser di tutto il wizard `/admin/studio` (Giovanni).
- Se la Basic Auth non si propaga automaticamente a `/admin/generate-video*`
  durante lo Step 3, tornare su questo file per gestirla.
- Settare `APIFY_TOKEN`/`OPENAI_API_KEY` (per Step 1) e `FAL_KEY`/`ADMIN_KEY`
  (per Step 3, già da sessione precedente) su Render.
- Backlog precedente: cleanup di `test-output*.png`/`examples/` in root,
  test end-to-end `/create-ad` in browser reale.
