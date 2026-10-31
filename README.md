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
