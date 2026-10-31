import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Asset } from '../types';
import { useHistoricalData } from '../hooks/useHistoricalData';

interface AssetCorrelationProps {
  asset: Asset;
  allAssets: Asset[];
}

export default function AssetCorrelation({ asset, allAssets }: AssetCorrelationProps) {
  const defaultBenchmark = useMemo(() => {
    if (asset.type === 'crypto') return asset.symbol === 'BTC' ? 'ETH' : 'BTC';
    return asset.country === 'India' ? 'NIFTY50' : '.SPX';
  }, [asset.type, asset.country, asset.symbol]);
  const [compareSymbol, setCompareSymbol] = useState(defaultBenchmark);
  useEffect(() => { setCompareSymbol(defaultBenchmark); }, [defaultBenchmark]);
  const { data: assetHistory, loading: assetLoading, error: assetError } = useHistoricalData(asset.symbol, '1Y');
  const { data: benchmarkHistory, loading: benchmarkLoading, error: benchmarkError } = useHistoricalData(compareSymbol, '1Y');

  const chartData = useMemo(() => {
    const benchmarkByDate = new Map(benchmarkHistory.map((point) => [point.date.slice(0, 10), point.value]));
    const aligned = assetHistory.flatMap((point) => {
      const benchmarkValue = benchmarkByDate.get(point.date.slice(0, 10));
      return benchmarkValue != null && benchmarkValue > 0
        ? [{ date: point.date, assetValue: point.value, benchmarkValue }]
        : [];
    });
    if (aligned.length < 2) return [];
    const assetBase = aligned[0].assetValue;
    const benchmarkBase = aligned[0].benchmarkValue;
    return aligned.map((point) => ({
      date: new Date(point.date).toLocaleDateString(),
      assetValue: ((point.assetValue / assetBase) - 1) * 100,
      benchValue: ((point.benchmarkValue / benchmarkBase) - 1) * 100
    }));
  }, [assetHistory, benchmarkHistory]);

  const isLoading = assetLoading || benchmarkLoading;
  const error = assetError || benchmarkError;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Provider-backed 1Y Relative Returns</h3>
          <p className="text-xs text-zinc-400">Cumulative close-to-close return: {asset.symbol} vs {compareSymbol}</p>
          <p className="text-[9px] text-zinc-600 mt-1">This is a relative-return chart, not a correlation coefficient or hedge signal.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 font-mono uppercase">Compare:</label>
          <select
            value={compareSymbol}
            onChange={(event) => setCompareSymbol(event.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-200 px-2 py-1 outline-none focus:border-indigo-500 transition-colors"
          >
            {allAssets.filter((item) => item.symbol !== asset.symbol).map((item) => (
              <option key={item.symbol} value={item.symbol}>{item.symbol} - {item.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[250px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading Yahoo Finance history…</div>
        ) : error || chartData.length < 2 ? (
          <div className="h-full flex items-center justify-center px-6 text-center text-xs text-amber-300">
            Relative return data unavailable: {error || 'not enough overlapping provider observations'}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2E37" vertical={false} />
              <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#E2E8F0' }}
                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === 'assetValue' ? asset.symbol : compareSymbol]}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="assetValue" name={asset.symbol} stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="benchValue" name={compareSymbol} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
