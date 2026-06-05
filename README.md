# Shield AI MVP (TikTok Baseline API)

Deploy-ready Express backend for Shield AI.

## Routes
- `GET /health`
- `GET /` landing page
- `GET /generate` generator form
- `POST /api/generate-preview`
- `POST /api/create-checkout`
- `POST /api/webhook-payment`
- `GET /paywall/:previewId`
- `GET /dashboard?userId=...`

## Local run
```bash
npm install
npm start
```

## Required env vars
For Stripe payment flow:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_EUR_9`
- `STRIPE_PRICE_EUR_19`

For TikTok OAuth when enabled:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI`

Currently `OPENAI_API_KEY` is listed for future AI generation, but this snapshot uses deterministic local generation in `src/generation.js`.

Recommended production values:
- `APP_BASE_URL=https://your-render-domain.onrender.com`
- `CHECKOUT_SUCCESS_URL=https://your-render-domain.onrender.com/payment/success`
- `CHECKOUT_CANCEL_URL=https://your-render-domain.onrender.com/payment/cancel`

## Render deploy
1. Push this folder to GitHub.
2. On Render, create a Web Service from the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Health check path: `/health`
6. Add env vars in Render.
7. In Stripe, set webhook endpoint to `https://YOUR-RENDER-DOMAIN/api/webhook-payment`.

## Notes
- Do not commit `.env` files.
- Runtime JSON files are created in `data/` automatically.
