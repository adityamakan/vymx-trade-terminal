# VYMX System Architecture

## Product boundary

VYMX is a financial-market research interface and paper-trading sandbox. It is not a broker, exchange, investment adviser, custodian, or live execution system. No browser action may submit a real order.

## Runtime topology

Browser (React, TypeScript and Vite)
- Firebase Authentication for identity
- Firestore for user-scoped simulated ledger
- REST and WebSocket market-data requests to Express

Express API (Node)
- Yahoo Finance adapter
- FRED adapter (optional)
- Finnhub news adapter (optional)
- Gemini analysis adapter (optional)

The browser and Express server are separate trust zones. Provider credentials belong only in server environment variables. Firebase client configuration is not a substitute for Firestore security rules.

## Main code areas

| Area | Responsibility | Boundary |
|---|---|---|
| src/components | User-facing research and portfolio screens | UI must not invent provider observations |
| src/hooks | Reusable client data and lifecycle logic | Handle aborts, stale responses and cleanup |
| src/contexts | Shared app state and data-integrity signals | Avoid duplicating server authority |
| src/lib | Firebase and AI client adapters | Never embed server-only secrets |
| src/utils | Pure formatting, market and analytics helpers | Prefer deterministic, unit-tested functions |
| src/data | Static reference metadata and demo defaults | Never label static values as live observations |
| server/server.ts | REST API, provider adapters and WebSocket lifecycle | Validate input, bound work, expose provenance |
| scripts | Repeatable validation and maintenance scripts | Must be safe to run in CI |
| docs | Architecture, data contracts, security and operations | Update when behavior or guarantees change |
| .github/workflows | Automated quality gates | Never deploy production implicitly |

## Data contract

Every provider-backed observation should preserve:
- instrument or series identifier;
- value and unit/currency;
- provider/source name;
- provider observation timestamp, when supplied;
- server retrieval timestamp;
- status: available, stale, partial, unavailable, or illustrative;
- error/unavailability reason when no valid value exists.

Never substitute retrieval time for event time. Never convert missing values to zero. Never mix official macro releases with market proxies without an explicit label.

## Provider responsibilities

- Yahoo Finance is an unofficial market-data upstream. Treat quote and OHLCV data as provider observations, not exchange-certified data.
- FRED series are official published observations when fetched successfully. Keep the series ID, units, frequency and observation date attached to the value.
- Finnhub supplies provider news content; it does not prove causality or independently verify a claim.
- Gemini output is generated commentary. It is not a data source and must not create factual market values.
- Missing credentials or failed requests produce explicit unavailable states.

## Portfolio and execution boundaries

- Portfolio balances, positions and trades are simulated.
- Firebase Authentication identifies the account; Firestore rules must enforce user-scoped access independently of UI checks.
- Cloud ledger writes must remain blocked until the authenticated user's ledger has been hydrated successfully.
- Raw equity change is not a cash-flow-adjusted investment return. TWR/MWR are not claimed until external cash flows are modeled and tested.
- Live order execution remains disabled.

## Engineering invariants

1. Validate all untrusted request inputs at the API boundary.
2. Bound request sizes, provider concurrency, cache growth, timeouts and WebSocket resources.
3. Treat partial provider failures as first-class states.
4. Keep secrets server-side and out of logs.
5. Do not change authentication or Firestore authorization without dedicated regression tests and explicit review.
6. Do not enable a feature simply because its UI exists; require data contract, provenance, tests and operational behavior.
7. Update README, data-quality docs and deployment runbook when a public API or operational guarantee changes.

## Release path

1. Work on a feature or fix branch.
2. Run npm ci, npm run lint, npm test, and npm run build:artifacts.
3. Review dependency audit output and secret scanning.
4. Open a pull request with test evidence and data-provenance notes.
5. Inspect all required CI and deployment checks.
6. Merge only after review; production deployment remains a separate controlled action.
