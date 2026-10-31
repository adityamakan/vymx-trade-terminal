import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Asset } from '../types';
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Activity, Layers, Cpu, Zap, TrendingUp } from 'lucide-react';
import { useHistoricalData } from '../hooks/useHistoricalData';

interface BenchmarkComparisonChartProps {
  asset: Asset;
  timeframe: '1D' | '1W' | '1M' | '1Y';
}

export default function BenchmarkComparisonChart({ asset, timeframe }: BenchmarkComparisonChartProps) {
  const benchmarkSymbol = asset.country === 'India' ? 'NIFTY50' : '.SPX';
  const benchmarkName = asset.country === 'India' ? 'NIFTY 50' : 'S&P 500';
  const { data: assetHistory, loading: assetLoading, error: assetError } = useHistoricalData(asset.symbol, timeframe);
  const { data: benchmarkHistory, loading: benchmarkLoading, error: benchmarkError } = useHistoricalData(benchmarkSymbol, timeframe);

  const comparison = useMemo(() => {
    const benchmarkByDate = new Map(benchmarkHistory.map((point) => [point.date, point.value]));
    const aligned = assetHistory.flatMap((point) => {
      const benchmarkValue = benchmarkByDate.get(point.date);
      return benchmarkValue != null && benchmarkValue > 0
        ? [{ date: point.date, assetValue: point.value, benchmarkValue }]
        : [];
    });

    if (aligned.length < 3) {
      return {
        data: [] as Array<Record<string, string | number | null>>,
        finalAlpha: null as number | null,
        beta: null as number | null,
        trackingError: null as number | null,
        sharpe: null as number | null,
        observations: aligned.length
      };
    }

    const assetBase = aligned[0].assetValue;
    const benchmarkBase = aligned[0].benchmarkValue;
    const data = aligned.map((point) => {
      const assetReturn = (point.assetValue / assetBase - 1) * 100;
      const benchmarkReturn = (point.benchmarkValue / benchmarkBase - 1) * 100;
      return {
        time: point.date,
        [asset.symbol]: Number(assetReturn.toFixed(3)),
        [benchmarkName]: Number(benchmarkReturn.toFixed(3)),
        Alpha: Number((assetReturn - benchmarkReturn).toFixed(3))
      };
    });

    const assetReturns = aligned.slice(1).map((point, index) => point.assetValue / aligned[index].assetValue - 1);
    const benchmarkReturns = aligned.slice(1).map((point, index) => point.benchmarkValue / aligned[index].benchmarkValue - 1);
    const activeReturns = assetReturns.map((value, index) => value - benchmarkReturns[index]);
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const standardDeviation = (values: number[]) => {
      if (values.length < 2) return null;
      const average = mean(values);
      return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
    };

    let beta: number | null = null;
    let trackingError: number | null = null;
    let sharpe: number | null = null;
    if (aligned.length >= 10) {
      const meanAsset = mean(assetReturns);
      const meanBenchmark = mean(benchmarkReturns);
      const benchmarkVariance = benchmarkReturns.reduce((sum, value) => sum + (value - meanBenchmark) ** 2, 0);
      const covariance = assetReturns.reduce((sum, value, index) => sum + (value - meanAsset) * (benchmarkReturns[index] - meanBenchmark), 0);
      beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : null;
      const activeVolatility = standardDeviation(activeReturns);
      const assetVolatility = standardDeviation(assetReturns);
      const periodsPerYear = timeframe === '1Y' ? 52 : timeframe === '1D' ? 252 * 6 : 252;
      trackingError = activeVolatility == null ? null : activeVolatility * Math.sqrt(periodsPerYear) * 100;
      sharpe = assetVolatility == null || assetVolatility === 0 ? null : (meanAsset / assetVolatility) * Math.sqrt(periodsPerYear);
    }

    return {
      data,
      finalAlpha: data[data.length - 1].Alpha as number,
      beta,
      trackingError,
      sharpe,
      observations: aligned.length
    };
  }, [assetHistory, benchmarkHistory, asset.symbol, benchmarkName, timeframe]);

  const isLoading = assetLoading || benchmarkLoading;
  const error = assetError || benchmarkError;
  const isAlphaPositive = comparison.finalAlpha != null && comparison.finalAlpha >= 0;
  const metric = (value: number | null, suffix = '') => value == null ? 'N/A' : `${value.toFixed(2)}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[500px] flex flex-col bg-zinc-950/80 rounded-xl border border-indigo-500/20 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none mix-blend-screen" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex justify-between items-start p-4 z-10 border-b border-zinc-900/50 bg-zinc-950/40 backdrop-blur-sm gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100 font-mono">Relative Performance Matrix</h3>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
            {asset.symbol} vs {benchmarkName} • Yahoo Finance closing prices • {comparison.observations} overlapping observations
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className={`text-[9px] font-mono font-bold tracking-widest rounded px-2 py-1 border ${isLoading ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : error || comparison.data.length < 3 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
            {isLoading ? 'LOADING PROVIDER DATA' : error || comparison.data.length < 3 ? 'INSUFFICIENT HISTORY' : 'PROVIDER HISTORY'}
          </span>
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Relative return spread</span>
            <div className={`px-2 py-1 rounded border flex items-center gap-1.5 shadow-lg ${isAlphaPositive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {isAlphaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              <span className="text-sm font-black font-mono tracking-tighter">
                {comparison.finalAlpha == null ? 'N/A' : `${isAlphaPositive ? '+' : ''}${comparison.finalAlpha.toFixed(2)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 relative z-10 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">Loading provider-backed historical candles…</div>
        ) : error || comparison.data.length < 3 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-amber-300 px-8">
            Relative performance unavailable: {error || 'not enough overlapping provider observations'}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={comparison.data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAlphaPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAlphaNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: '#27272a', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', fontFamily: 'monospace' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', fontSize: '10px', marginBottom: '4px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
              <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="Alpha" fill={isAlphaPositive ? 'url(#colorAlphaPos)' : 'url(#colorAlphaNeg)'} stroke={isAlphaPositive ? '#10b981' : '#f43f5e'} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              <Line type="monotone" dataKey={benchmarkName} stroke="#a1a1aa" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#a1a1aa' }} />
              <Line type="monotone" dataKey={asset.symbol} stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2, stroke: '#09090b', fill: '#818cf8' }} style={{ filter: 'drop-shadow(0px 0px 8px rgba(129, 140, 248, 0.5))' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px bg-zinc-900 border-t border-zinc-800/60">
        <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3 h-3 text-zinc-400" /> Beta (vs Bench)</span>
          <span className="text-sm font-black font-mono text-zinc-200">{metric(comparison.beta)}</span>
        </div>
        <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /> Tracking Error</span>
          <span className="text-sm font-black font-mono text-indigo-300">{metric(comparison.trackingError, '%')}</span>
        </div>
        <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Sharpe Ratio</span>
          <span className="text-sm font-black font-mono text-amber-300">{metric(comparison.sharpe)}</span>
        </div>
      </div>
      <p className="px-3 py-2 text-[9px] text-zinc-600 border-t border-zinc-900">
        Metrics use overlapping provider closes; Sharpe assumes a zero risk-free rate. At least 10 observations are required for beta, tracking error and Sharpe.
      </p>
    </motion.div>
  );
}
