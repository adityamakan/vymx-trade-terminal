# Market and portfolio data quality contract

This document describes what VYMX may claim about its data. A visualized value is not automatically a verified value.

## Observation states

Every provider-backed observation should be treated as one of:

- **Available:** a provider returned a finite, valid observation with a source. Freshness-sensitive features additionally require a valid provider observation timestamp; server retrieval time alone is not proof of fresh market data.
- **Stale:** the observation exists but is older than the consuming feature's freshness threshold.
- **Partial:** some requested symbols or fields were returned while others failed or were omitted.
- **Unavailable:** no valid observation exists, the provider is not configured, or the request failed.
- **Illustrative:** a static geographic reference, educational example, or scenario overlay that is not a live market observation.

Never convert missing values to zero. Never fill missing observations with random, synthetic, or stale values while labeling the result live.

## Unavailable and proxy-only indicators

- Missing provider-reported daily percentage or absolute change remains `null`; the interface must display `N/A`, not a bundled demo value or a fabricated zero.
- The screener does not currently receive an order-book depth feed, implied-volatility surface, calculated beta, RSI/MACD series or a verified volatility series. These fields must remain `N/A` until they are computed from documented provider observations.
- Institutional ownership/flow, liquidity-pool depth and order-book imbalance are not supplied by the current quote adapter. They must not be inferred from price direction or quote volume.
- The sentiment gauge is a heuristic proxy based on provider price-change observations. It is not an official Fear & Greed index, a realized-volatility estimate, or a traded-volume breadth measure. It is displayed only when broad quote coverage and required cross-asset inputs are present; otherwise the score and component metrics are unavailable.

## Provider provenance

- Quote and historical OHLCV endpoints currently use Yahoo Finance through the server adapter. Yahoo Finance is an unofficial upstream; latency, availability, completeness, licensing, and rate limits are outside VYMX's control.
- FX rates are indicative quote-derived conversions, not executable exchange rates. A portfolio valuation should retain the FX rate, currency, source, and timestamp used for each conversion.
- FRED observations are official FRED series only when the configured FRED API responds successfully. A market proxy (for example, a Treasury-yield quote) must not be described as an official macroeconomic release.
- Finnhub news is provider news content, not independently verified causal explanation.
- Sector ETF returns are market proxies. They are not institutional flows, fund positioning, or analyst ratings.

## Portfolio return methodology

The current portfolio snapshot analytics calculate changes between USD-normalized equity observations. Until external deposits, withdrawals, fees, taxes, and transfers are explicitly represented and incorporated, cumulative return, CAGR, volatility, Sharpe, Sortino, VaR, CVaR, and drawdown must not be described as cash-flow-adjusted investment performance.

A deposit can increase portfolio equity without representing investment profit. A withdrawal can decrease equity without representing investment loss. Do not compare such raw equity changes with a benchmark as if they were time-weighted returns.

Before presenting performance as investment-grade:
1. Persist dated external cash flows with signed amount, currency, FX conversion, and event type.
2. Compute sub-period returns around external flows and geometrically link them to derive time-weighted return (TWR).
3. Optionally calculate money-weighted return (MWR/IRR) from dated investor cash flows.
4. Document treatment of fees, taxes, dividends, splits, corporate actions, and missing valuations.
5. Test known scenarios: deposit-only (zero investment return), withdrawal-only, fee-only, dividend, FX-only movement, and mixed flows.
6. Keep raw account equity change distinct from TWR and MWR in API contracts and UI labels.

## Risk-statistic conventions

- Daily observations are collapsed to the last available snapshot per UTC calendar day. This is a technical convention, not proof that the value is a local-market close.
- Annualization uses 252 trading days for volatility, Sharpe, and Sortino.
- Sharpe currently assumes a 0% annual risk-free rate; Sortino uses a 0% target. The UI must disclose both assumptions.
- Historical VaR/CVaR use the empirical 5th percentile of the available daily simple-return sample. These are historical estimates, not forecasts or guarantees.
- Minimum observation thresholds are enforced. If the sample is too short, the metric is unavailable rather than extrapolated.
- A minimum 30-calendar-day history is required before CAGR is shown. This is a guardrail, not a guarantee of statistical reliability.

## Freshness and failure handling

A consumer must define a freshness threshold appropriate to the instrument and market session. A quote retrieved recently can still contain an old provider market timestamp, particularly outside market hours. Use the provider's market-observation timestamp for freshness decisions and expose server retrieval time separately as `fetchedAt`. If the provider timestamp is absent or invalid, keep `quoteAsOf` null; do not manufacture a timestamp from the API response time.

- Market-closed is not the same as provider failure. Under the current strict 120-second live-metric gate, an old last-close quote is not counted as a fresh live observation and is hidden from live metrics. A future last-close view may display it only with an explicit market-close timestamp and a non-live label.
- A server health response is not an upstream provider health check.
- Partial quote batches must expose the unavailable symbols.
- Provider timeouts and rate limits should return bounded, explicit errors.
- Cache TTLs must be documented by endpoint and must not silently extend freshness claims.
- Do not calculate breadth or correlation from a mixture of stale and fresh observations without disclosing the exclusion rule.

## Release checklist for data features

- [ ] Source and retrieval timestamp visible or available in the API.
- [ ] Provider event timestamp used when available.
- [ ] Currency and unit included and normalized explicitly.
- [ ] Missing and stale observations represented as unavailable.
- [ ] Partial failures visible to the user.
- [ ] Corporate actions and adjusted/unadjusted prices handled consistently.
- [ ] Historical sample dates and interval disclosed.
- [ ] Formula and assumptions documented.
- [ ] Tests cover missing, invalid, duplicate, out-of-order, stale, and boundary observations.
- [ ] No synthetic fallback is labeled as live or historical provider data.


## UI anti-fabrication controls

- Screener comparison fields such as RSI, MACD, beta, dividend yield, P/B, EPS, ROE, debt-to-equity, current ratio, P/S, short interest, ATR, institutional ownership and free cash flow must display unavailable until a source-backed value or documented calculation is implemented. Ticker-symbol-derived placeholders are prohibited.
- The Screener must not use bundled market-cap or P/E defaults to rank or filter assets. Fundamental filters remain unavailable until verified instrument fundamentals are supplied.
- Heatmap RSI, dark-pool activity and AI-confidence fields must not use ticker-symbol-derived percentages or progress bars. Missing providers/models are shown as unavailable.
- A connected transport is not proof that every symbol has a fresh quote. Quote freshness is evaluated per asset.

## Portfolio valuation completeness

- A portfolio snapshot may report aggregate USD equity only when every open position has a fresh provider quote and every required currency conversion is available.
- Snapshots persist separate `quoteCoverageComplete` and `fxConversionComplete` flags. Quote completeness and currency-conversion completeness are distinct conditions.
- Historical risk analytics exclude legacy snapshots that lack explicit quote-completeness proof. Missing proof is treated as unavailable, not assumed complete.
- Current holdings, unrealized P&L, allocation charts and AI review context display unavailable when any open holding lacks a fresh quote; average entry cost is not substituted for a current market price.

## News provenance

- No bundled news headlines or invented source names are shipped as a fallback. News panels must display a provider-unavailable state until Finnhub returns actual articles.

## Market-wide proxy coverage thresholds

- Per-instrument values require a provider observation no older than 120 seconds (with a 60-second allowance for clock skew).
- Market-wide breadth and sentiment proxies require at least 20 fresh quote changes and at least 50% of the configured universe. The sentiment proxy additionally requires at least five equity/index observations, three crypto observations, and fresh gold plus S&P 500 quotes.
- Server intelligence endpoints apply the same provider-timestamp freshness rule. Cached fetch time is never substituted for the provider observation timestamp.


## FX conversion freshness

- Non-USD FX conversions used in portfolio snapshots require a provider observation timestamp no older than 120 seconds, with a 60-second allowance for provider clock skew.
- The FX endpoint returns per-currency rate, provider observation time, retrieval time and source. Missing or stale conversions are omitted and listed as unavailable.
- Portfolio snapshots persist the FX observation timestamp separately from the numerical conversion rate. USD-to-USD is an identity conversion and does not require an external quote.
- A present numerical FX rate without a fresh provider timestamp is not sufficient to mark conversion coverage complete.


## Bundled instrument definitions and AI context

- Bundled asset definitions contain instrument identity and classification metadata only. Runtime market fields start unavailable: price is zero with no provider timestamp, daily change is null, volume is null, 52-week range and previous close are null, and market-cap/P/E placeholders are not used for filtering or ranking.
- Synthetic random-walk price histories have been removed from the asset model. Historical charts and quantitative calculations must use provider-returned dated observations.
- The Financial Chatbot receives a sanitized asset context. An active quote is included only when its provider observation timestamp passes the same freshness validator used by the UI; otherwise the context explicitly says the quote is unavailable.
- Profile-based AI allocation suggestions are not backtested, performance-ranked, or validated as suitable investments. Provider failure must not trigger a local pseudo-model substitute.
- SIP calculations are illustrative compound-interest scenarios. The selected annual rate is a user assumption, not a forecast or claimed historical market average.
- Sentiment AI receives a heuristic proxy object with its component values and limitations; the proxy score must never be disguised as an asset price.
- Dashboard market breadth requires at least 20 fresh observations, 50% universe coverage, five equity/index observations, three crypto observations, and fresh S&P 500 and gold quotes. Sector leaders require at least three fresh observations in each displayed sector.


## Provider request reliability and observability

- Yahoo Finance quote, chart and fundamentals calls use bounded request timeouts. A timeout is treated as unavailable; the API must not substitute an older quote or server retrieval timestamp.
- Quote requests for the same symbol are coalesced while in flight, preventing concurrent dashboard consumers from duplicating upstream work. Quote cache hits and in-flight joins are counted separately from provider requests.
- The server exposes `GET /api/providers/status` with process-local request counts, successes, failures, timeout count, recent latency and last-success/last-failure timestamps. These counters reset on process restart and are diagnostic, not durable monitoring.
- A provider status of healthy means this process observed a recent successful upstream request with no subsequent consecutive failures. It does not mean all instruments are covered or the feed is licensed for redistribution.
- Yahoo Finance remains a single upstream for quotes, FX, historical OHLCV and fundamentals. There is no automatic secondary quote provider until one is selected, configured, mapped across asset classes, and validated for entitlement and licensing.


## Dependency security boundary

Build and test tooling is classified as development-only in `package.json` (Vite, its plugins, TypeScript, esbuild, Tailwind tooling, and tsx). These packages are required to build/test the frontend and server bundle, but are not required by the deployed Node runtime. The production runtime dependency tree is installed with `npm ci --omit=dev` in the availability monitor. Render's build should install build tools, run the full build/tests, then execute `npm prune --omit=dev` before starting the server. CI smoke-tests the server after the same prune, and the blocking audit uses `npm audit --omit=dev`.

The full development dependency tree is still audited and uploaded as an artifact. As of 18 November 2026, npm reports GHSA-fc5q-39xc-vjpf against Picomatch 4.x through 4.0.7, reached through Vite/fdir/tinyglobby. The currently published 4.x line has no fixed release visible in the registry at review time; Picomatch 3.0.2 has a backported fix but is outside the declared `^4` ranges of Vite/tinyglobby. Do not force an incompatible override. Keep this as a tracked development-toolchain advisory and upgrade once upstream publishes a compatible fix. It must not be included in the production runtime dependency tree.
