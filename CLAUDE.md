# Shield AI

Piattaforma che analizza la presenza online di attivita locali (ristoranti, parrucchieri, ecc.) e genera piani di crescita con AI.

## Stack

- Node.js + Express (ESM, `type: module`)
- Deploy su Render
- OpenAI GPT-4o-mini per le analisi e generazione contenuti
- Apify per i dati Google Maps
- Stripe per i pagamenti

## Struttura del progetto

- `src/server.js` - entry point Express, definisce tutte le rotte
- `src/frontend-pages.js` - rendering HTML lato server delle pagine (landing, analyze, generate, preview, paywall, sprint, dashboard)
- `src/generation.js` - logica di generazione AI (OpenAI GPT-4o-mini, con fallback deterministico locale se manca `OPENAI_API_KEY`)
- `src/contracts.js` - validazione input/contratti dati
- `src/store.js` - persistenza file-based (`FileStore`, JSON in `data/`)
- `src/payment-workflow.js` - logica webhook/checkout Stripe
- `src/tracking.js` - eventi funnel/onboarding
- `src/alerting.js` - notifiche di errore (webhook)
- `src/ingest.js`, `src/tiktok-client.js` - integrazione/OAuth TikTok
- `src/config.js` - configurazione da env vars
- `src/errors.js` - error handling centralizzato (`ApiError`, `asyncHandler`, `errorMiddleware`)
- `db/` - schema/migrazioni dati

### Rotte principali

- `GET /` - landing page
- `GET /analyze` - pagina di analisi
- `GET /generate` - form generatore
- `GET /preview/:id` - preview risultati
- `GET /paywall/:previewId` - paywall
- `GET /sprint/:id` - piano di crescita completo
- `GET /dashboard?userId=...` - dashboard utente
- `POST /api/generate-preview`, `POST /api/analyze`, `POST /api/generate-full-sprint`
- `POST /api/create-checkout`, `POST /api/webhook-payment`, `GET /api/paywall-status/:previewId`
- `POST /api/entitlements/grant`
- `/oauth/tiktok/*`, `/ingest/tiktok/*`

## Preferenze di design

- Sfondi chiari
- Elementi animati (es. canvas con neural network)
- NIENTE bordi o card rettangolari
- Separatori a linea sottile
- Icone Tabler
- Palette: verde / arancio / blu
- Estetica giovane e premium

Da evitare sempre:
- Viola
- Icone bulky/pesanti
- Stile "robotico" o da giornale

## Regole di lavoro

- Task piccoli e mirati
- Una sessione per modulo
- Commit frequenti
- Alla fine di ogni sessione, aggiornare `session-handoff.md` con:
  - cosa e' stato fatto
  - file modificati
  - prossimo step
