# Market and portfolio data quality contract

This document describes what VYMX may claim about its data. A visualized value is not automatically a verified value.

## Observation states

Every provider-backed observation should be treated as one of:

- **Available:** a provider returned a finite, valid observation with a source and retrieval timestamp.
- **Stale:** the observation exists but is older than the consuming feature's freshness threshold.
- **Partial:** some requested symbols or fields were returned while others failed or were omitted.
- **Unavailable:** no valid observation exists, the provider is not configured, or the request failed.
- **Illustrative:** a static geographic reference, educational example, or scenario overlay that is not a live market observation.

Never convert missing values to zero. Never fill missing observations with random, synthetic, or stale values while labeling the result live.

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

A consumer must define a freshness threshold appropriate to the instrument and market session. A quote retrieved recently can still contain an old provider market timestamp, particularly outside market hours. Prefer provider event timestamps when supplied; distinguish them from the server retrieval timestamp.

- Market-closed is not the same as stale.
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
