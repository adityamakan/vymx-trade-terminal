import assert from 'node:assert/strict';
import { calculatePortfolioRiskMetrics } from '../src/utils/financialAnalytics';

const start = Date.UTC(2026, 0, 1);
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

console.log('Financial analytics tests passed.');
