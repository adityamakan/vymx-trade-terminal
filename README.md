# VYMX Trade Terminal

VYMX is a research-oriented, multi-asset market dashboard and simulated trading sandbox built with React, TypeScript, Vite, Express, WebSockets and Firebase.

> **Data integrity notice:** Market observations are requested from Yahoo Finance and may be delayed, unavailable, incomplete, or subject to provider limits. Sector scores are ETF momentum proxies, not institutional-flow measurements. The application is for education and research; it is not a broker, exchange, investment adviser, or live execution venue. Independently verify all data before making financial decisions.

## Current architecture

- React 19 + TypeScript frontend.
- Express API server with WebSocket market-price broadcasts.
- Yahoo Finance adapter for quotes, historical candles, financial statements, sector ETF proxies, commodity futures, FX crosses and selected yield proxies.
- Firebase Authentication for Google and (when enabled in Firebase) existing Email/Password accounts.
- Firestore ledger sync for verified Firebase users only.
- Guest/demo access is a local sandbox and is not a verified identity.
- Gemini-backed analysis is available only when a server-side API key is configured.
- Portfolio activity is simulated. No real orders are routed.

## Requirements and local development

- Node.js **22.19.0 or later**
- npm

```bash
git clone https://github.com/adityamakan/vymx-trade-terminal.git
cd vymx-trade-terminal
npm ci
npm run dev
```

The Express API defaults to port 5000. The Vite frontend is served through the development server. For production:

```bash
npm run build
npm start
```

Configure Firebase client settings and optional provider secrets through the deployment environment. Never commit private API keys, service-account credentials, or secrets in frontend-exposed `VITE_*` variables.

## Environment variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Server-side Gemini analysis for supported AI features | Optional |
| `FRED_API_KEY` | Federal Reserve Economic Data observations | Optional |
| `FINNHUB_API_KEY` | Provider-sourced market news | Optional |
| `PORT` | Express server port | Optional; defaults to 5000 |

Without optional provider credentials, the corresponding endpoints return explicit unavailable responses. The server does not substitute fabricated news, institutional flows, or AI answers.

## API reference

### Health and market data

- `GET /api/health` — process health and optional-provider configuration. This does not certify that every upstream quote is available.
- `POST /api/prices` — validated quote batch. Accepts 1–100 symbols and reports per-symbol failures.
- `GET /api/market-snapshot` — selected global benchmark quotes.
- `GET /api/historical/:symbol?start=ISO_DATE&end=ISO_DATE&interval=1d` — provider-sourced OHLCV candles. Intraday ranges are more restrictive: 5m/15m/30m up to 60 days; 1h up to 730 days; daily/weekly/monthly up to five years.
- `GET /api/yahoo/financials/:symbol` — Yahoo Finance profile, valuation, financial-data and statement modules when returned by the provider.
- `GET /api/macro/indicators` — cross-asset market proxies. These are not official macroeconomic releases.
- `GET /api/fred/series/:seriesId` — actual FRED observations when `FRED_API_KEY` is configured.
- `GET /api/finnhub/news?category=general` — actual Finnhub news when `FINNHUB_API_KEY` is configured.

### Intelligence and research endpoints

- `GET /api/ai/vymx-intelligence` — provider-backed index, crypto, VIX, sector ETF, commodity, FX and US 10Y quote data. Unsupported sentiment, flow, order-book and dark-pool metrics are returned as unavailable.
- `GET /api/ai/market-auras` — sector ETF momentum scores. Score = `50 + 10 × daily ETF percentage change`, clipped to 0–100. This is a transparent momentum proxy, not a rating or capital-flow estimate.
- `GET /api/ai/narrative` — rule-based summary of observed market quotes. It is not an AI-generated news or causal explanation.
- `GET /api/ai/quiz` — static educational market-structure quiz content.
- `GET /api/ai/exchange-latest?exchange=NSE` — index quote for supported exchanges. Unsupported exchanges return an explicit unavailable response.
- `POST /api/ai/:feature` — Gemini-generated analysis for supported features when a server-side Gemini key is configured. AI-generated text is commentary, not verified market fact.

### Deliberately disabled or unavailable capabilities

- Macro backtesting returns HTTP 501 until a reproducible engine uses validated historical observations, documented strategy rules, and realistic transaction costs/slippage. The older ZIP's hard-coded return profiles are not used.
- Live order execution returns HTTP 403. No endpoint submits a real order.
- Institutional flows, dark-pool activity, order-book depth, smart-money indices, and geopolitical event monitoring require dedicated verified feeds. The UI marks these metrics unavailable rather than fabricating values.
- The Yahoo screener adapter is not implemented and returns HTTP 501.
- The world-monitor adapter returns an explicit unavailable response until a verified event source is connected.
- Globe geopolitical, supply-chain and commodity location markers are illustrative reference/scenario overlays, not live incident, disruption or shipment reports.

## Authentication and ledger isolation

- Google sign-in is verified through Firebase Authentication.
- Email/Password sign-in uses Firebase Authentication for existing accounts when the Email/Password provider is enabled in the Firebase project. Account registration is not exposed in this interface.
- Phone OTP is not enabled; it must not be simulated in the browser.
- Guest/demo access is local-only and is never treated as a Firebase identity.
- A newly authenticated Firebase account starts with an empty simulated portfolio. The app hydrates that account's Firestore ledger before enabling cloud writes, and guest data is not copied into the account.
- Firestore security rules must be deployed and tested in the Firebase project. Client-side checks are not a replacement for server-side authorization.

## Data integrity and operational notes

- Yahoo Finance is an unofficial upstream data source. Availability, latency, licensing and rate limits are outside this application's control.
- Quote responses include source and timestamps and report partial failures rather than fabricating missing prices.
- In-memory caches are bounded and expire automatically.
- WebSocket broadcasts are throttled to the quote-cache cadence and protected against overlapping refreshes.
- API keys are read only from server-side environment variables. Never send provider secrets from the browser in custom headers.
- The simulated portfolio and cash balance are not brokerage assets or withdrawable funds.

## Python research scripts

Python scripts are separate utilities and are not wired into the Express request path. Install their dependencies with:

```bash
python -m pip install -r requirements.txt
```

Any future backtest must disclose source data, sample period, survivorship/look-ahead controls, transaction costs, slippage, rebalance rules and benchmark methodology.

## License

See repository license metadata.
