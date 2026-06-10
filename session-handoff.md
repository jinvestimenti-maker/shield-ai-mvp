# Session Handoff

## Cosa fatto
- Aggiunta `renderAnalyzeBusinessPage()` in `src/frontend-pages.js`: pagina frontend per `/analyze-business`
  - Form: input "Nome attività" + "Città" + bottone "Analizza"
  - Stato di caricamento con messaggi rotanti ("Sto leggendo le recensioni Google…", "Sto analizzando la concorrenza…", ecc.)
  - Stato risultato: Growth Score in cerchio animato, dati attività (nome, indirizzo, rating, recensioni), sezioni Punti di forza (verde), Errori principali (arancio), Opportunità (blu), Idee contenuti, Prossime azioni
  - Stato di errore gentile se l'attività non viene trovata, con bottone "Riprova"
  - Stile: sfondo chiaro, neural network canvas animato (brain 3D ricolorato blu/arancio per tema light), niente card con bordi, separatori a linea sottile, icone Tabler, palette verde/arancio/blu, niente viola
- Aggiunta rotta `GET /analyze-business` in `src/server.js` (la `POST /analyze-business` esistente in `routes/analyze-business.js` resta invariata)
- Aggiornata l'analisi `idee_contenuti` resa nel JSON del backend per popolare la sezione "Idee contenuti"
- Smoke test via curl: `GET /analyze-business` -> 200, `POST /analyze-business` e `/health` ancora funzionanti

## File modificati
- `src/frontend-pages.js` (nuova `renderAnalyzeBusinessPage`)
- `src/server.js` (import + rotta `GET /analyze-business`)

## Prossimo step
- Verifica visiva nel browser (non possibile in questo ambiente: manca chromium-cli/Playwright)
- Aggiungere `OPENAI_API_KEY` e `APIFY_TOKEN` nelle env vars di Render
- Validare/normalizzare l'output di `/analyze-business` con un contratto in `src/contracts.js`
