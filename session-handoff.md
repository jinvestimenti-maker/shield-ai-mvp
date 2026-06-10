# Session Handoff

## Cosa fatto
- Creato `routes/analyze-business.js` (ESM): nuova rotta `POST /analyze-business` che:
  - recupera i dati Google Maps di un'attivita' tramite Apify actor `compass/crawler-google-places`
  - genera un'analisi della presenza online con OpenAI GPT-4o-mini (risposta JSON)
  - restituisce dati business + analisi in un unico JSON
- Collegata la rotta in `src/server.js` (`app.use("/", analyzeBusinessRouter)`)
- Aggiunta dipendenza `apify-client` (`npm install apify-client`)
- Creato `.env.example` con `APIFY_TOKEN` (solo nome variabile)

## File modificati
- `routes/analyze-business.js` (nuovo)
- `src/server.js`
- `package.json`, `package-lock.json`
- `.env.example` (nuovo)

## Prossimo step
- Aggiungere `OPENAI_API_KEY` e `APIFY_TOKEN` nelle env vars di Render
- Collegare la nuova analisi a una pagina frontend (es. `/analyze`)
- Validare/normalizzare l'output di `/analyze-business` con un contratto in `src/contracts.js`
