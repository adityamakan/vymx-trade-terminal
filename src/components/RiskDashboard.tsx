import React, { useEffect, useMemo, useState } from 'react';
import { Asset, PortfolioItem } from '../types';
import { Activity, PieChart as PieChartIcon, Target, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from './ChartContainer';

interface RiskDashboardProps {
  portfolio: PortfolioItem[];
  assets: Asset[];
}

interface HistoricalQuote {
  date: string;
  close: number | null;
}

type ReturnSeries = Map<string, number>;

function toDailyReturns(rows: HistoricalQuote[]): ReturnSeries {
  const closes = rows
    .filter((row) => row.close != null && Number.isFinite(row.close) && row.close > 0 && row.date)
    .map((row) => ({ date: new Date(row.date).toISOString().slice(0, 10), close: row.close as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const returns: ReturnSeries = new Map();
  for (let index = 1; index < closes.length; index += 1) {
    const previous = closes[index - 1];
    const current = closes[index];
    if (previous.close > 0 && current.date !== previous.date) {
      returns.set(current.date, current.close / previous.close - 1);
    }
  }
  return returns;
}

function pearsonCorrelation(left: ReturnSeries, right: ReturnSeries): { value: number | null; observations: number } {
  const dates = [...left.keys()].filter((date) => right.has(date)).sort();
  if (dates.length < 20) return { value: null, observations: dates.length };
  const x = dates.map((date) => left.get(date) as number);
  const y = dates.map((date) => right.get(date) as number);
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < dates.length; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  if (varianceX <= 0 || varianceY <= 0) return { value: null, observations: dates.length };
  return { value: Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY))), observations: dates.length };
}

export default function RiskDashboard({ portfolio, assets }: RiskDashboardProps) {
  const { sectorData, totalValue } = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    let total = 0;
    portfolio.forEach((item) => {
      const asset = assets.find((candidate) => candidate.symbol === item.symbol);
      if (!asset || !Number.isFinite(asset.price) || asset.price <= 0) return;
      const currentValue = asset.price * item.quantity;
      const targetSector = asset.sector || 'Other';
      sectorMap[targetSector] = (sectorMap[targetSector] || 0) + currentValue;
      total += currentValue;
    });
    return {
      sectorData: Object.entries(sectorMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      totalValue: total
    };
  }, [portfolio, assets]);

  const holdings = useMemo(() => portfolio
    .filter((item) => assets.some((asset) => asset.symbol === item.symbol))
    .map((item) => ({ symbol: item.symbol, name: item.name })), [portfolio, assets]);
  const [returnSeries, setReturnSeries] = useState<Record<string, ReturnSeries>>({});
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [correlationError, setCorrelationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (holdings.length < 2) {
      setReturnSeries({});
      setCorrelationLoading(false);
      setCorrelationError(null);
      return;
    }
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    const query = new URLSearchParams({ interval: '1d', start: start.toISOString(), end: end.toISOString() });
    setCorrelationLoading(true);
    setCorrelationError(null);
    Promise.all(holdings.map(async (holding) => {
      const response = await fetch(`/api/historical/${encodeURIComponent(holding.symbol)}?${query.toString()}`, {
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) throw new Error(`Historical data unavailable for ${holding.symbol} (HTTP ${response.status}).`);
      const payload = await response.json();
      if (!Array.isArray(payload.quotes)) throw new Error(`Invalid historical response for ${holding.symbol}.`);
      return [holding.symbol, toDailyReturns(payload.quotes as HistoricalQuote[])] as const;
    })).then((entries) => {
      if (!cancelled) setReturnSeries(Object.fromEntries(entries));
    }).catch((error) => {
      if (!cancelled) {
        setReturnSeries({});
        setCorrelationError(error instanceof Error ? error.message : 'Historical return data could not be loaded.');
      }
    }).finally(() => {
      if (!cancelled) setCorrelationLoading(false);
    });
    return () => { cancelled = true; };
  }, [holdings]);

  const correlations = useMemo(() => holdings.map((row) => ({
    symbol: row.symbol,
    values: holdings.map((column) => {
      if (row.symbol === column.symbol) return { value: 1, observations: 0 };
      const left = returnSeries[row.symbol];
      const right = returnSeries[column.symbol];
      return left && right ? pearsonCorrelation(left, right) : { value: null, observations: 0 };
    })
  })), [holdings, returnSeries]);

  const COLORS = ['#34d399', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#fbbf24', '#f87171', '#9ca3af'];
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-xl text-xs font-mono">
          <p className="text-zinc-300 font-bold mb-1">{name}</p>
          <p className="text-emerald-400">Value: ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-indigo-400">Weight: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const correlationClass = (value: number) => {
    if (value >= 0.7) return 'bg-rose-500/20 text-rose-300';
    if (value >= 0.3) return 'bg-amber-500/20 text-amber-300';
    if (value <= -0.3) return 'bg-blue-500/20 text-blue-300';
    return 'bg-emerald-500/20 text-emerald-300';
  };

  if (portfolio.length === 0) return null;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-4.5 w-4.5 text-indigo-400" />
          <h2 className="text-sm font-bold text-zinc-100">Sector Exposure</h2>
        </div>
        {totalValue > 0 ? (
          <div className="w-full h-[300px] relative">
            <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="transparent">
                  {sectorData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] font-mono text-zinc-400">{value}</span>} />
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
              <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest font-bold">Total Val</span>
              <span className="text-sm font-black text-white font-mono mt-0.5">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">No valid market values available</div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-rose-400" />
            <h2 className="text-sm font-bold text-zinc-100">Historical Return Correlation</h2>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">1Y · Pearson r</span>
        </div>
        <p className="text-[10px] text-zinc-500 mb-3">Calculated from aligned daily close-to-close returns. At least 20 overlapping observations are required. Correlation is historical association, not causation or a hedge guarantee.</p>
        {correlationLoading ? (
          <div className="flex-1 min-h-[180px] flex items-center justify-center text-xs text-zinc-500">Loading historical price series…</div>
        ) : correlationError ? (
          <div role="status" className="flex-1 min-h-[180px] flex items-center justify-center text-center text-xs text-amber-300">{correlationError}</div>
        ) : holdings.length < 2 ? (
          <div className="flex-1 min-h-[180px] flex items-center justify-center text-xs text-zinc-500">Add at least two holdings to calculate correlation.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-[10px] font-mono border-separate border-spacing-1">
              <thead><tr><th className="p-2 text-left text-zinc-500">Asset</th>{holdings.map((holding) => <th key={holding.symbol} className="p-2 text-zinc-400">{holding.symbol}</th>)}</tr></thead>
              <tbody>{correlations.map((row) => <tr key={row.symbol}>
                <th className="p-2 text-left text-zinc-300">{row.symbol}</th>
                {row.values.map((cell, index) => <td key={holdings[index].symbol} title={cell.value == null ? `${cell.observations} overlapping observations; insufficient or constant series` : `${cell.observations || 'Diagonal'} aligned observations`} className={`p-2 text-center rounded ${cell.value == null ? 'bg-zinc-800/50 text-zinc-500' : correlationClass(cell.value)}`}>{cell.value == null ? 'N/A' : cell.value.toFixed(2)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[9px] text-zinc-600"><Target className="h-3 w-3" /> N/A means insufficient overlapping observations or zero return variance.</div>
      </div>
    </section>
  );
}
