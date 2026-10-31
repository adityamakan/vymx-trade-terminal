import React, { useMemo } from 'react';
import { useHistoricalData } from '../hooks/useHistoricalData';
import { Asset } from '../types';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface TrendPredictionChartProps {
  asset: Asset;
  timeframe: '1D' | '1W' | '1M' | '1Y';
}

export default function TrendPredictionChart({ asset, timeframe }: TrendPredictionChartProps) {
  const { data: history, loading, error } = useHistoricalData(asset.symbol, timeframe);

  const chartData = useMemo(() => {
    if (!history.length) return [];
    const recentStartIndex = Math.max(0, history.length - 30);
    const recentHistory = history.slice(recentStartIndex);
    if (recentHistory.length < 2) {
      return history.map((point) => ({ date: point.date, actual: point.value, predicted: null as number | null }));
    }

    // Least-squares linear regression over the most recent provider-backed closes.
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = recentHistory.length;
    recentHistory.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumXX += index * index;
    });

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      return history.map((point) => ({ date: point.date, actual: point.value, predicted: null as number | null }));
    }
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const data = history.map((point, index) => {
      const isRecent = index >= recentStartIndex;
      const x = index - recentStartIndex;
      return {
        date: point.date,
        actual: point.value,
        predicted: isRecent ? slope * x + intercept : null as number | null
      };
    });

    const forecastUnit = timeframe === '1D' ? 'h' : timeframe === '1Y' ? 'w' : 'd';
    for (let step = 1; step <= 5; step++) {
      const x = recentHistory.length - 1 + step;
      data.push({
        date: `Forecast +${step}${forecastUnit}`,
        actual: null as any,
        predicted: slope * x + intercept
      });
    }
    return data;
  }, [history, timeframe]);

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-xs font-mono text-zinc-500">Loading provider-backed historical closes…</div>;
  }
  if (error || chartData.length === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-6 text-center text-xs text-amber-300">Historical regression unavailable: {error || 'no valid observations returned'}.</div>;
  }

  const plottedValues = chartData.flatMap((point) => [point.actual, point.predicted].filter((value): value is number => typeof value === 'number' && Number.isFinite(value)));
  const minVal = Math.min(...plottedValues);
  const maxVal = Math.max(...plottedValues);

  return (
    <div className="w-full h-full bg-zinc-950 p-4">
      <div className="mb-4">
         <h3 className="text-white text-sm font-bold">5-Step Linear Regression Extrapolation</h3>
         <p className="text-xs text-amber-400">Fit to Yahoo Finance historical closes. This statistical extrapolation is not a price target or investment forecast.</p>
      </div>
      <div className="w-full h-[calc(100%-60px)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2E37" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[minVal * 0.98, maxVal * 1.02]}
              tickFormatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#E2E8F0' }}
              labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Historical Price"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Linear Regression & Forecast"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

