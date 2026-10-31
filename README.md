# VYMX Trade Terminal

A research-oriented multi-asset market dashboard and simulated trading sandbox built with React, TypeScript, Vite, Express, WebSockets and Firebase.

> **Data integrity notice:** Market quotes are requested from Yahoo Finance through the server and may be delayed, unavailable, or subject to provider limits. This is an educational/research application, not a broker, exchange, investment adviser, or execution venue. Do not use it to make live trading decisions without independently verifying data.

## Current implementation

- React 19 + TypeScript frontend.
- Express API server and WebSocket price updates.
- Yahoo Finance quote adapter with a short in-memory cache.
- Firebase Authentication and Firestore client integration.
- Gemini-powered AI features when correctly configured.
- Simulated portfolio and order ledger (no real orders are routed).

## Market-data API

### Health
`GET /api/health`

Reports API process health. It does **not** certify that every market feed is live.

### Quotes
`POST /api/prices`

Request:
```json
{ "symbols": ["AAPL", "MSFT", "NIFTY50", "BTC"] }
```

Aliases include `NIFTY50` → `^NSEI`, `SENSEX` → `^BSESN`, `SPX` → `^GSPC`, and `BTC` → `BTC-USD`. The API validates symbols, limits requests to 50 symbols, returns provider metadata and reports partial failures explicitly. A missing quote is not replaced with a fabricated price.

### Snapshot
`GET /api/market-snapshot`

Returns the available quotes for selected global benchmarks. A provider failure is surfaced as an error/partial result.

### Backtesting
The legacy macro-backtest route now returns HTTP 501 until a reproducible historical-data strategy engine is connected. The previous generated return series and hard-coded performance metrics were not genuine backtest results and have been removed from the API.

Unknown `/api/*` routes return HTTP 404 rather than a fabricated success response.

## Local development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/adityamakan/vymx-trade-terminal.git
cd vymx-trade-terminal
npm ci
npm run dev
```

The API defaults to port 5000. Configure Firebase and Gemini credentials using your deployment's secret/environment-variable manager. Never commit private API keys or service-account credentials.

Build:
```bash
npm run build
```

## Python research scripts

Python scripts are separate utilities and are not currently wired into the Express request path. Install their dependencies with:

```bash
python -m pip install -r requirements.txt
```

Do not treat static scenario profiles or illustrative values as measured historical performance. Any future backtest must disclose data source, sample period, survivorship/look-ahead controls, transaction costs, slippage, rebalance rules and benchmark methodology.

## Security and deployment notes

- Firebase client configuration is not a substitute for Firebase Authentication checks on protected server routes.
- Firestore rules must be deployed and tested in the Firebase project.
- Keep secrets in Render/deployment environment settings, never in source control or Vite-exposed `VITE_*` variables.
- Yahoo Finance is an unofficial data source; availability, licensing, latency and rate limits are outside this application's control.

## License

See repository license metadata.


## API integrations and operational safety

The production server exposes live quote, historical candle, financial-statement, and market-proxy endpoints through Yahoo Finance. Optional integrations are enabled only with server-side environment variables; never place provider secrets in frontend code or send them in request headers.

### Optional server environment variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | Server-side Gemini analysis for `/api/ai/:feature` | No; AI routes return an explicit 503 when absent |
| `FRED_API_KEY` | Federal Reserve Economic Data observations | No; FRED route returns an explicit 503 when absent |
| `FINNHUB_API_KEY` | Market news feed | No; Finnhub route returns an explicit 503 when absent |

Configure these in the hosting provider's environment settings. Do not commit secrets to GitHub.

### API routes

- `GET /api/health` — process health and optional-provider configuration state.
- `POST /api/prices` — validated live quote batch; accepts 1–100 symbols and reports partial failures.
- `GET /api/market-snapshot` — major market snapshot.
- `GET /api/historical/:symbol?start=ISO_DATE&end=ISO_DATE&interval=1d` — provider-sourced OHLCV history; defaults to one year and limits requests to five years.
- `GET /api/yahoo/financials/:symbol` — Yahoo Finance profile, valuation, and statement modules when available.
- `GET /api/macro/indicators` — market proxies for cross-asset monitoring. These are not official macroeconomic releases.
- `GET /api/fred/series/:seriesId` — real FRED observations when configured.
- `GET /api/finnhub/news?category=general` — provider-sourced news when configured.
- `POST /api/ai/:feature` — Gemini-generated analysis when configured; output is AI-generated and must not be treated as verified market fact.
- `GET/POST /api/ai/live-news` — real Finnhub headlines when `FINNHUB_API_KEY` is configured; this route does not require Gemini.

### Explicitly disabled capabilities

- Macro backtesting remains disabled (HTTP 501) until a reproducible engine uses validated historical observations, transaction costs, and documented strategy rules. The previous ZIP's hard-coded return profiles are not used.
- Live order execution remains disabled (HTTP 403). No API endpoint in this build submits an order.
- The world-monitor and Yahoo screener adapters return explicit unavailable/not-implemented responses rather than synthetic geopolitical events or invented screener results.
- Demo access is an ephemeral local sandbox, not a verified account. Google sign-in uses Firebase. Phone OTP and email/password sign-in remain unavailable until real server-backed identity providers are configured.

Market-data availability, exchange entitlements, and Yahoo Finance rate limits can affect individual symbols. Quote responses include per-symbol failures rather than substituting stale or fabricated prices.
