export interface PortfolioValuationObservation {
  capturedAt: number;
  totalEquityUSD: number | null;
}

export interface PortfolioRiskMetrics {
  observations: number;
  dailyReturns: number;
  firstObservation: number | null;
  lastObservation: number | null;
  cumulativeReturnPct: number | null;
  cagrPct: number | null;
  annualizedVolatilityPct: number | null;
  sharpeAtZeroRiskFree: number | null;
  sortinoAtZeroTarget: number | null;
  maxDrawdownPct: number | null;
  historicalVaR95Pct: number | null;
  historicalCVaR95Pct: number | null;
  unavailableReason: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DAILY_RETURNS = 30;

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function percentile(sortedValues: number[], probability: number): number | null {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
}

/**
 * Derives risk statistics only from timestamped, USD-normalized observations.
 * Multiple intraday observations are collapsed to the last observation per UTC day.
 * The Sharpe output assumes a 0% annual risk-free rate and is labelled accordingly.
 * Historical VaR/CVaR use the empirical 5th percentile of daily simple returns.
 */
export function calculatePortfolioRiskMetrics(
  observations: PortfolioValuationObservation[]
): PortfolioRiskMetrics {
  const valid = observations
    .filter((item) => Number.isFinite(item.capturedAt) && item.capturedAt > 0
      && item.totalEquityUSD != null && Number.isFinite(item.totalEquityUSD) && item.totalEquityUSD > 0)
    .sort((a, b) => a.capturedAt - b.capturedAt);

  const daily = new Map<string, PortfolioValuationObservation>();
  for (const observation of valid) {
    daily.set(new Date(observation.capturedAt).toISOString().slice(0, 10), observation);
  }
  const points = [...daily.values()].sort((a, b) => a.capturedAt - b.capturedAt);
  const base: PortfolioRiskMetrics = {
    observations: valid.length,
    dailyReturns: Math.max(0, points.length - 1),
    firstObservation: points[0]?.capturedAt ?? null,
    lastObservation: points[points.length - 1]?.capturedAt ?? null,
    cumulativeReturnPct: null,
    cagrPct: null,
    annualizedVolatilityPct: null,
    sharpeAtZeroRiskFree: null,
    sortinoAtZeroTarget: null,
    maxDrawdownPct: null,
    historicalVaR95Pct: null,
    historicalCVaR95Pct: null,
    unavailableReason: null
  };

  if (points.length < 2) {
    return { ...base, unavailableReason: 'At least two daily USD-normalized valuations are required.' };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const cumulativeReturn = last.totalEquityUSD! / first.totalEquityUSD! - 1;
  const elapsedDays = (last.capturedAt - first.capturedAt) / DAY_MS;
  base.cumulativeReturnPct = cumulativeReturn * 100;
  if (elapsedDays >= 1) base.cagrPct = ((last.totalEquityUSD! / first.totalEquityUSD!) ** (365.25 / elapsedDays) - 1) * 100;

  const returns: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1].totalEquityUSD!;
    const current = points[index].totalEquityUSD!;
    if (previous > 0) returns.push(current / previous - 1);
  }

  const drawdowns: number[] = [];
  let peak = points[0].totalEquityUSD!;
  for (const point of points) {
    const value = point.totalEquityUSD!;
    peak = Math.max(peak, value);
    drawdowns.push(value / peak - 1);
  }
  base.maxDrawdownPct = Math.min(...drawdowns) * 100;

  if (returns.length < MIN_DAILY_RETURNS) {
    return { ...base, unavailableReason: `Risk statistics require at least ${MIN_DAILY_RETURNS} daily return observations; currently ${returns.length} are available.` };
  }

  const volatility = sampleStdDev(returns);
  const averageReturn = mean(returns);
  const downside = returns.filter((value) => value < 0);
  const downsideDeviation = downside.length
    ? Math.sqrt(downside.reduce((sum, value) => sum + value ** 2, 0) / returns.length)
    : 0;
  if (volatility != null) {
    base.annualizedVolatilityPct = volatility * Math.sqrt(252) * 100;
    base.sharpeAtZeroRiskFree = volatility > 0 ? averageReturn / volatility * Math.sqrt(252) : null;
    base.sortinoAtZeroTarget = downsideDeviation > 0 ? averageReturn / downsideDeviation * Math.sqrt(252) : null;
  }

  const sortedReturns = [...returns].sort((a, b) => a - b);
  const var95 = percentile(sortedReturns, 0.05);
  if (var95 != null) {
    const tail = returns.filter((value) => value <= var95);
    base.historicalVaR95Pct = -var95 * 100;
    base.historicalCVaR95Pct = tail.length ? -mean(tail) * 100 : null;
  }
  base.unavailableReason = null;
  return base;
}
