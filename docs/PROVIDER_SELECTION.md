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
| Twelve Data | One REST/WebSocket platform spans equities, FX, crypto, ETFs, funds, commodities and fixed income. Basic is free for testing/side projects; Grow is $79/month and Pro $229/month for individual use. The current exchange directory lists NSE and BSE as EOD from Grow; US equities, FX and crypto are real-time on the individual plans, subject to usage credits. | Individual plans are personal/internal only and do not permit public redistribution. Business plans are separate: Venture is listed at $499/month (annual billing $414/month) and permits client-facing apps subject to exchange licenses; external redistribution and some non-US data require additional approval/agreements. NSE/BSE remain EOD at the listed Grow/Venture tiers, not live India feeds. | Strongest broad-market candidate for an internal prototype; potentially a practical client-facing candidate only after Venture/business terms and exchange rights are confirmed. Not a live NSE/BSE solution. |
| Massive | Separate APIs for US stocks, indices, forex, crypto and futures; REST and WebSocket coverage is strong. US stocks, indices, currencies and futures have separate plan/entitlement schedules. | Individual plans are personal/non-professional. Any data visible to other users, including testers, requires a Business subscription; redistribution is subject to the commercial license. Asset-class subscriptions and exchange agreements are separate. It is not an obvious NSE cash-equity failover. | Strong candidate for US-centric market infrastructure if Business licensing is obtained; weaker as a single global provider for VYMX. |
| Finnhub | Existing integration and credentials may reduce integration friction; useful for news and selected equity/forex/crypto data. | Current VYMX integration is news-only. Product entitlements, exchange coverage, data delay, and redistribution terms must be verified before quote use. | Do not promote the news key into a quote failover without a separate entitlement review. |
| NSE Data & Analytics | Official source for NSE real-time, EOD/historical, corporate, derivatives, currency and commodity market data. | Direct exchange data subscriptions and distribution terms are a different commercial/operational category from a hobby API. Costs and redistribution obligations need direct confirmation. | Correct authoritative path if licensed NSE data becomes a core public product requirement. |

## 3. Evidence links

- Twelve Data individual pricing: https://twelvedata.com/pricing
- Twelve Data business pricing: https://twelvedata.com/pricing-business
- Twelve Data API and asset-class documentation: https://twelvedata.com/docs
- Twelve Data exchange directory (includes NSE/BSE entitlement tiers): https://twelvedata.com/exchanges
- Twelve Data commercial vs personal use and redistribution: https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- Twelve Data public attribution requirements: https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data
- Massive API documentation: https://massive.com/docs
- Massive stocks pricing and business-use notes: https://massive.com/stocks
- Massive Business licensing for public display/redistribution: https://massive.com/knowledge-base/article/how-can-i-redistribute-massives-market-data
- Massive indices pricing: https://massive.com/pricing?product=indices
- Massive currencies pricing: https://massive.com/pricing?product=currencies
- NSE Data & Analytics data vending: https://www.nse.in/static/nse-data-and-analytics/data-information-vending
- Yahoo Finance integration library disclaimer and usage notes: https://github.com/gadicc/yahoo-finance2

## 4. India-specific NSE option

NSE now exposes an official MCP surface with historical Bhavcopy data and a CM market feed described as approximately 1–3 minutes delayed. Its own disclaimer restricts this MCP access to educational/informational purposes and explicitly excludes commercial deployment. Treat it as a research/prototype integration only; it is not a production redistribution license. For production real-time or delayed display, use NSE Data & Analytics' paid subscription/data-vending route or an authorized vendor and execute the relevant agreement. Sources: https://www.nseindia.com/nse-mcp and https://www.nseindia.com/static/market-data/real-time-data-subscription.

## 4. Current licensing and cost conclusion

As of 18 November 2026, Twelve Data's published individual Grow ($79/month) and Pro ($229/month) plans are not suitable for public market-data display. Its Venture business tier is listed at $499/month billed monthly (or $414/month when billed annually); the vendor states client-facing display is possible subject to exchange licensing, with redistribution and some non-US market data requiring additional approval. Its exchange directory lists NSE and BSE as EOD on Grow/Venture, so it does not solve a live Indian-equities requirement by itself. Sources: https://twelvedata.com/pricing, https://twelvedata.com/pricing-business, https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage, https://twelvedata.com/exchanges.

Massive states that public display to anyone other than the subscriber requires a Business subscription; an individual subscription is not sufficient. Business data licensing is asset-class and exchange dependent. Sources: https://massive.com/knowledge-base/article/how-can-i-redistribute-massives-market-data and https://massive.com/knowledge-base/article/which-plan-do-i-need-to-show-massive-data-in-my-app.

These published prices are indicative only; exchange agreements, professional classification, user counts, redistribution, and data add-ons can materially change the quote. No subscription or API key has been purchased or enabled.

## 5. Required decision inputs

Before enabling a provider, confirm:

1. **Audience and display rights:** private personal dashboard, internal organization tool, educational non-commercial app, or public/commercial display. Do not infer that a public URL grants redistribution rights.
2. **Required live markets:** NSE/BSE, US equities, global equities, indices, FX, crypto, commodities, fixed income.
3. **Freshness contract:** real-time, exchange-delayed, or end-of-day per asset class. These must be separate data states.
4. **Budget:** monthly subscription, exchange fees, redistribution fees, and expected API/WebSocket consumption.
5. **Historical requirements:** intraday retention, daily history, adjusted/unadjusted prices, splits, dividends, symbol changes and delisted instruments.
6. **Operational terms:** rate limits, SLA, support, WebSocket reconnect policy, maintenance notices and outage status.

## 6. Implementation gate

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

## 7. Current engineering stance

Until a provider is approved, VYMX should prefer an explicit unavailable state over an unlicensed or semantically incompatible fallback. A second provider is not automatically better: two feeds with different exchange coverage, timestamp semantics, corporate-action treatment or display rights can make the terminal less trustworthy if blended without controls.
