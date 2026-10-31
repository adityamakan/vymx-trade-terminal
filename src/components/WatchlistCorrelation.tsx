import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from 'recharts';
import { Asset } from '../types';

interface WatchlistCorrelationProps {
  watchlist: string[];
  assets: Asset[];
}

interface HistoricalClose {
  date: string;
  close: number;
}

interface CorrelationPoint {
  x: number;
  y: number;
  xSymbol: string;
  ySymbol: string;
  correlation: number;
}

function pearson(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 20) return null;
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < x.length; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  const denominator = Math.sqrt(varianceX * varianceY);
  return denominator > 0 ? covariance / denominator : null;
}

export default function WatchlistCorrelation({ watchlist, assets }: WatchlistCorrelationProps) {
  const activeAssets = useMemo(
    () => assets.filter((asset) => watchlist.includes(asset.symbol)).slice(0, 12),
    [watchlist, assets]
  );
  const symbolKey = activeAssets.map((asset) => asset.symbol).join('|');
  const [matrix, setMatrix] = useState<CorrelationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<{ source: string; observations: number; fetchedAt: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setMatrix([]);
      setCoverage(null);
      setError(null);
      if (activeAssets.length < 2) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const end = new Date();
        end.setUTCHours(0, 0, 0, 0);
        const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        const params = new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), interval: '1d' });

        const series = await Promise.all(activeAssets.map(async (asset) => {
          const response = await fetch(`/api/historical/${encodeURIComponent(asset.symbol)}?${params.toString()}`, {
            signal: controller.signal
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload?.success || !Array.isArray(payload.quotes)) {
            throw new Error(`${asset.symbol}: ${payload?.error || 'historical provider data unavailable'}`);
          }
          const closes: HistoricalClose[] = payload.quotes.flatMap((quote: any) => {
            const close = Number(quote?.close);
            const date = quote?.date ? new Date(quote.date) : null;
            if (!Number.isFinite(close) || close <= 0 || !date || !Number.isFinite(date.getTime())) return [];
            return [{ date: date.toISOString().slice(0, 10), close }];
          });
          return { symbol: asset.symbol, closes, source: String(payload.source || 'Yahoo Finance'), fetchedAt: String(payload.fetchedAt || new Date().toISOString()) };
        }));

        if (!active) return;
        const dateMaps = series.map((item) => new Map(item.closes.map((point) => [point.date, point.close])));
        const returns = dateMaps.map((prices) => {
          const sortedDates = [...prices.keys()].sort();
          const values = new Map<string, number>();
          for (let index = 1; index < sortedDates.length; index += 1) {
            const previous = prices.get(sortedDates[index - 1])!;
            const current = prices.get(sortedDates[index])!;
            if (previous > 0) values.set(sortedDates[index], current / previous - 1);
          }
          return values;
        });

        const points: CorrelationPoint[] = [];
        let minimumCoverage = Number.POSITIVE_INFINITY;
        for (let row = 0; row < activeAssets.length; row += 1) {
          for (let column = 0; column < activeAssets.length; column += 1) {
            const commonDates = [...returns[row].keys()].filter((date) => returns[column].has(date)).sort();
            minimumCoverage = Math.min(minimumCoverage, commonDates.length);
            const coefficient = row === column ? 1 : pearson(
              commonDates.map((date) => returns[column].get(date)!),
              commonDates.map((date) => returns[row].get(date)!)
            );
            if (coefficient == null) continue;
            points.push({
              x: column,
              y: row,
              xSymbol: activeAssets[column].symbol,
              ySymbol: activeAssets[row].symbol,
              correlation: Math.max(-1, Math.min(1, coefficient))
            });
          }
        }
        setMatrix(points);
        setCoverage({
          source: [...new Set(series.map((item) => item.source))].join(', '),
          observations: Number.isFinite(minimumCoverage) ? minimumCoverage : 0,
          fetchedAt: series.map((item) => item.fetchedAt).sort().at(-1) || new Date().toISOString()
        });
        if (!points.length) setError('At least 20 aligned daily return observations with non-zero variance are required for each pair.');
      } catch (cause) {
        if (active && !controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Historical correlation data unavailable.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [symbolKey]);

  if (activeAssets.length < 2) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Watchlist Correlation Matrix</h3>
        <p className="text-zinc-500 text-xs">Add at least two assets to your watchlist to calculate historical correlation.</p>
      </div>
    );
  }

  const tickFormatter = (value: number) => activeAssets[value]?.symbol || '';
  const CustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    const size = 35;
    const correlation = payload.correlation;
    const color = correlation > 0.8 ? '#10b981' : correlation > 0.4 ? '#34d399' : correlation < -0.8 ? '#f43f5e' : correlation < -0.4 ? '#fb7185' : '#3f3f46';
    return (
      <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
        <rect width={size} height={size} fill={payload.xSymbol === payload.ySymbol ? '#18181b' : color} rx={4} stroke="#27272a" strokeWidth={1} />
        <text x={size / 2} y={size / 2 + 3} textAnchor="middle" fill={payload.xSymbol === payload.ySymbol ? '#a1a1aa' : '#fff'} fontSize="10" fontWeight="bold">
          {correlation.toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 shadow-sm space-y-4 overflow-hidden">
      <div className="flex flex-col mb-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Watchlist Correlation Matrix</h3>
        <p className="text-xs text-zinc-500 mt-1">Pairwise Pearson correlations of daily close-to-close simple returns over approximately one year. Prices are aligned by UTC calendar date; at least 20 overlapping returns are required.</p>
      </div>
      {loading && <p className="text-xs text-indigo-300">Fetching provider historical candles for {activeAssets.length} watchlist assets…</p>}
      {error && <p className="text-xs text-amber-300">{error}</p>}
      {coverage && <p className="text-[10px] text-zinc-500">Source: {coverage.source} · Minimum pairwise observations: {coverage.observations} · Retrieved: {new Date(coverage.fetchedAt).toLocaleString()}</p>}
      {matrix.length > 0 && (
        <div className="w-full overflow-x-auto pb-4">
          <div style={{ width: Math.max(100 + activeAssets.length * 40, 300), height: Math.max(100 + activeAssets.length * 40, 300) }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" domain={[0, activeAssets.length - 1]} tickCount={activeAssets.length} tickFormatter={tickFormatter} interval={0} stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} orientation="top" />
                <YAxis type="number" dataKey="y" domain={[0, activeAssets.length - 1]} tickCount={activeAssets.length} tickFormatter={tickFormatter} interval={0} stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} reversed />
                <ZAxis type="number" dataKey="correlation" range={[100, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#E2E8F0' }} labelStyle={{ display: 'none' }} formatter={(value: number, name: string, props: any) => name === 'correlation' ? [value.toFixed(3), `${props.payload.xSymbol} vs ${props.payload.ySymbol}`] : []} />
                <Scatter data={matrix} shape={<CustomShape />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
