# Market-data provider selection and failover plan

**Review date:** 18 November 2026  
**Decision:** Do not enable a paid secondary provider until product display rights, asset coverage, and monthly budget are confirmed.

## 1. Current state

- Yahoo Finance via `yahoo-finance2` is the only quote, FX, historical OHLCV, and fundamentals upstream.
- Yahoo Finance does not provide an official developer API or service guarantee. The integration is useful for prototyping but must be treated as best-effort.
- FRED is a separate source for official US macroeconomic series when `FRED_API_KEY` is configured.
- Finnhub is currently used for news only. The presence of `FINNHUB_API_KEY` does not mean VYMX has a quote failover.
- No provider is considered a valid fallback until it returns a normalized observation with a source, provider timestamp, currency/unit, and entitlement-compatible display rights.

## 2. Candidate comparison

The table is an initial shortlist, not a vendor approval. Prices and entitlements must be reconfirmed in the vendor account and contract before implementation.

| Candidate | Relevant strengths | Important limitations for VYMX | Initial fit |
|---|---|---|---|
| Twelve Data | One REST/WebSocket product spans equities, FX, crypto, ETFs, funds, commodities and fixed income; broad international exchange catalog. Its individual Basic tier advertises 8 API credits/minute and 800/day, with real-time US equities, FX and crypto. | Exchange-level entitlement varies. Its exchange directory lists NSE and BSE as EOD, with Grow as the minimum individual tier; this is not live NSE/BSE backup. Individual plans are for personal/internal use and do not permit commercial third-party display or redistribution. | Strongest candidate for broad internal prototype coverage, subject to licensing and India EOD constraints. |
| Massive | Separate APIs for US stocks, indices, forex and crypto; official docs cover REST and WebSocket. Public individual pricing lists US stock delayed and real-time tiers, and distinct currency/index tiers. | Coverage and pricing are split by asset class. The published individual plans are non-professional/personal-use plans; public commercial display needs a separate business agreement. It is not an obvious NSE cash-equity failover. | Strong candidate for US-centric market infrastructure, weaker as a single global provider for VYMX. |
| Finnhub | Existing integration and credentials may reduce integration friction; useful for news and selected equity/forex/crypto data. | Current VYMX integration is news-only. Product entitlements, exchange coverage, data delay, and redistribution terms must be verified before quote use. | Do not promote the news key into a quote failover without a separate entitlement review. |
| NSE Data & Analytics | Official source for NSE real-time, EOD/historical, corporate, derivatives, currency and commodity market data. | Direct exchange data subscriptions and distribution terms are a different commercial/operational category from a hobby API. Costs and redistribution obligations need direct confirmation. | Correct authoritative path if licensed NSE data becomes a core public product requirement. |

## 3. Evidence links

- Twelve Data pricing: https://twelvedata.com/pricing
- Twelve Data API and asset-class documentation: https://twelvedata.com/docs
- Twelve Data exchange directory (includes NSE/BSE entitlement tiers): https://twelvedata.com/exchanges
- Twelve Data commercial vs personal use: https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- Massive API documentation: https://massive.com/docs
- Massive stocks pricing: https://massive.com/pricing?product=stocks
- Massive indices pricing: https://massive.com/pricing?product=indices
- Massive currencies pricing: https://massive.com/pricing?product=currencies
- NSE Data & Analytics data vending: https://www.nse.in/static/nse-data-and-analytics/data-information-vending
- Yahoo Finance integration library disclaimer and usage notes: https://github.com/gadicc/yahoo-finance2

## 4. Required decision inputs

Before enabling a provider, confirm:

1. **Audience and display rights:** private personal dashboard, internal organization tool, educational non-commercial app, or public/commercial display. Do not infer that a public URL grants redistribution rights.
2. **Required live markets:** NSE/BSE, US equities, global equities, indices, FX, crypto, commodities, fixed income.
3. **Freshness contract:** real-time, exchange-delayed, or end-of-day per asset class. These must be separate data states.
4. **Budget:** monthly subscription, exchange fees, redistribution fees, and expected API/WebSocket consumption.
5. **Historical requirements:** intraday retention, daily history, adjusted/unadjusted prices, splits, dividends, symbol changes and delisted instruments.
6. **Operational terms:** rate limits, SLA, support, WebSocket reconnect policy, maintenance notices and outage status.

## 5. Implementation gate

A second provider should be added only after the above is decided. The implementation must:

- Use a provider interface and per-asset-class symbol mapping rather than string substitution.
- Normalize price, absolute/percentage change, timestamp, currency, exchange, market state and adjustment basis.
- Preserve provider-native timestamps; never use retrieval time as observation time.
- Apply per-provider timeout, retry/backoff, rate-limit handling and circuit-breaker policy.
- Track source provenance and provider selection per observation.
- Fail over only when the secondary provider supports the same instrument and data semantics. Never silently compare an adjusted close from one source with an unadjusted last trade from another.
- Record whether the value came from primary, secondary, or a non-live historical cache.
- Test primary success, primary timeout, secondary success, both unavailable, stale secondary, unsupported symbol, currency mismatch and conflicting prices.
- Confirm the vendor license allows the intended display, storage, derived analytics and user audience.

## 6. Current engineering stance

Until a provider is approved, VYMX should prefer an explicit unavailable state over an unlicensed or semantically incompatible fallback. A second provider is not automatically better: two feeds with different exchange coverage, timestamp semantics, corporate-action treatment or display rights can make the terminal less trustworthy if blended without controls.
