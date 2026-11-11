import assert from 'node:assert/strict';
import { calculatePortfolioRiskMetrics } from '../src/utils/financialAnalytics';
import { normalizeProviderTimestamp } from '../src/utils/providerTimestamp';
import { isVerifiedProviderQuote, isSubmittedPriceCurrent } from '../src/utils/providerQuote';

const start = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;
const rising = Array.from({ length: 40 }, (_, index) => ({
  capturedAt: start + index * 24 * 60 * 60 * 1000,
  totalEquityUSD: 100_000 * (1 + index * 0.001)
}));
const metrics = calculatePortfolioRiskMetrics(rising);
assert.equal(metrics.dailyReturns, 39);
assert.ok(metrics.cumulativeReturnPct != null && metrics.cumulativeReturnPct > 0);
assert.ok(metrics.cagrPct != null && metrics.cagrPct > 0);
assert.ok(metrics.annualizedVolatilityPct != null);
assert.ok(metrics.maxDrawdownPct != null && metrics.maxDrawdownPct <= 0);
assert.ok(metrics.historicalVaR95Pct != null);
assert.ok(metrics.historicalCVaR95Pct != null);

const shortWindow = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: 100 },
  { capturedAt: start + 2 * 86400000, totalEquityUSD: 110 }
]);
assert.equal(shortWindow.cagrPct, null, 'CAGR must not annualize a two-day sample');

const thirtyDayWindow = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: 100 },
  { capturedAt: start + 30 * 86400000, totalEquityUSD: 110 }
]);
assert.ok(thirtyDayWindow.cagrPct != null && thirtyDayWindow.cagrPct > 0);

const insufficient = calculatePortfolioRiskMetrics(rising.slice(0, 10));
assert.equal(insufficient.annualizedVolatilityPct, null);
assert.match(insufficient.unavailableReason || '', /30 daily return observations/);

const invalid = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: null },
  { capturedAt: start + 86400000, totalEquityUSD: Number.NaN }
]);
assert.equal(invalid.cumulativeReturnPct, null);
assert.match(invalid.unavailableReason || '', /two daily USD-normalized valuations/);

const sameDay = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: 100 },
  { capturedAt: start + 1000, totalEquityUSD: 105 }
]);
assert.equal(sameDay.dailyReturns, 0);
assert.equal(sameDay.cumulativeReturnPct, null);


assert.equal(normalizeProviderTimestamp(null), null);
assert.equal(normalizeProviderTimestamp(Number.NaN), null);
assert.equal(normalizeProviderTimestamp('not-a-date'), null);
assert.equal(normalizeProviderTimestamp(new Date(start)), new Date(start).toISOString());
assert.equal(normalizeProviderTimestamp(start / 1000), new Date(start).toISOString());
assert.equal(normalizeProviderTimestamp(start), new Date(start).toISOString());
assert.equal(normalizeProviderTimestamp(new Date(Date.now() + 10 * 60_000)), null);


// Input order must not affect results; duplicate UTC-day observations collapse
// to the last timestamped observation for that day.
const duplicateDay = calculatePortfolioRiskMetrics([
  { capturedAt: start + 86400000, totalEquityUSD: 105 },
  { capturedAt: start, totalEquityUSD: 100 },
  { capturedAt: start + 3600000, totalEquityUSD: 102 }
]);
assert.equal(duplicateDay.dailyReturns, 1);
assert.equal(duplicateDay.firstObservation, start + 3600000);
assert.ok(Math.abs((duplicateDay.cumulativeReturnPct ?? 0) - ((105 / 102 - 1) * 100)) < 1e-10);

// Invalid/non-positive valuations are excluded instead of poisoning statistics.
const mixedValidity = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: 100 },
  { capturedAt: start + 86400000, totalEquityUSD: 0 },
  { capturedAt: start + 2 * 86400000, totalEquityUSD: -10 },
  { capturedAt: start + 3 * 86400000, totalEquityUSD: 103 }
]);
assert.equal(mixedValidity.observations, 2);
assert.equal(mixedValidity.dailyReturns, 1);
assert.ok(Math.abs((mixedValidity.cumulativeReturnPct ?? 0) - 3) < 1e-10);

// Equal-valued observations produce zero volatility; Sharpe remains unavailable
// because dividing by zero volatility would be undefined.
const flat = calculatePortfolioRiskMetrics(Array.from({ length: 40 }, (_, index) => ({
  capturedAt: start + index * DAY_MS,
  totalEquityUSD: 100
})));
assert.equal(flat.cumulativeReturnPct, 0);
assert.equal(flat.annualizedVolatilityPct, 0);
assert.equal(flat.sharpeAtZeroRiskFree, null);

// A one-observation series must not manufacture a return or risk statistic.
const singleton = calculatePortfolioRiskMetrics([
  { capturedAt: start, totalEquityUSD: 100 }
]);
assert.equal(singleton.dailyReturns, 0);
assert.equal(singleton.cumulativeReturnPct, null);
assert.equal(singleton.maxDrawdownPct, null);

console.log('Financial analytics and provider timestamp tests passed.');


// Provider quote verification rejects bundled demo values, missing timestamps,
// stale observations and timestamps implausibly far in the future.
const quoteNow = Date.UTC(2026, 10, 11, 12, 0, 0);
assert.equal(isVerifiedProviderQuote({ price: 100, asOf: new Date(quoteNow).toISOString() }, quoteNow), true);
assert.equal(isVerifiedProviderQuote({ price: 100, quoteAsOf: new Date(quoteNow).toISOString() }, quoteNow), true, 'Asset quoteAsOf timestamps must be accepted');
assert.equal(isVerifiedProviderQuote({ price: 100 }, quoteNow), false);
assert.equal(isVerifiedProviderQuote({ price: 100, asOf: new Date(quoteNow - 121_000).toISOString() }, quoteNow), false);
assert.equal(isVerifiedProviderQuote({ price: 100, asOf: new Date(quoteNow - 119_000).toISOString() }, quoteNow), true);
assert.equal(isVerifiedProviderQuote({ price: 0, asOf: new Date(quoteNow).toISOString() }, quoteNow), false);
assert.equal(isVerifiedProviderQuote({ price: 100, asOf: new Date(quoteNow + 6 * 60_000).toISOString() }, quoteNow), false);
assert.equal(isSubmittedPriceCurrent(100, { price: 100, asOf: new Date(quoteNow).toISOString() }, quoteNow), true);
assert.equal(isSubmittedPriceCurrent(100, { price: 100, quoteAsOf: new Date(quoteNow).toISOString() }, quoteNow), true, 'Simulated orders must accept the Asset quoteAsOf field');
assert.equal(isSubmittedPriceCurrent(100.01, { price: 100, asOf: new Date(quoteNow).toISOString() }, quoteNow), false);
assert.equal(isSubmittedPriceCurrent(100, { price: 100, asOf: new Date(quoteNow - 121_000).toISOString() }, quoteNow), false);
assert.equal(isSubmittedPriceCurrent(0, { price: 100, asOf: new Date(quoteNow).toISOString() }, quoteNow), false);

console.log('Financial analytics, provider timestamp and quote verification tests passed.');
