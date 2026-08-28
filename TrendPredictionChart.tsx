import React, { useMemo } from 'react';
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
  const chartData = useMemo(() => {
    // We only take the last 30 data points for linear regression calculation to capture recent trend
    const history = asset.history[timeframe];
    if (!history || history.length === 0) return [];

    const recentHistory = history.slice(-30);
    if (recentHistory.length < 2) return history.map(d => ({ date: d.date, actual: d.value, predicted: null }));

    // Linear Regression Formula: y = mx + b
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = recentHistory.length;
    
    recentHistory.forEach((point, i) => {
      sumX += i;
      sumY += point.value;
      sumXY += i * point.value;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const data = history.map((point, index) => {
      // Find relative index for regression line, only show line for the recent points
      const recentIdx = history.length - 30;
      const isRecent = index >= recentIdx;
      
      let predicted = null;
      if (isRecent) {
        const x = index - recentIdx;
        predicted = slope * x + intercept;
      }
      
      return {
        date: point.date,
        actual: point.value,
        predicted: predicted
      };
    });

    // Add 5-day forecast
    const lastPoint = history[history.length - 1];
    let lastDate = new Date();
    // Try to parse the last date, if it's "10:00 AM", we can't easily, but let's just append "+X"
    for (let i = 1; i <= 5; i++) {
      const x = (history.length - (history.length - 30)) - 1 + i;
      const predictedVal = slope * x + intercept;
      data.push({
        date: `Forecast +${i}`,
        actual: null as any,
        predicted: predictedVal
      });
    }

    return data;
  }, [asset, timeframe]);

  if (!chartData || chartData.length === 0) return null;

  const minVal = Math.min(...chartData.map(d => Math.min(d.actual || Infinity, d.predicted || Infinity)));
  const maxVal = Math.max(...chartData.map(d => Math.max(d.actual || -Infinity, d.predicted || -Infinity)));

  return (
    <div className="w-full h-full bg-zinc-950 p-4">
      <div className="mb-4">
         <h3 className="text-white text-sm font-bold">5-Day Linear Regression Forecast</h3>
         <p className="text-xs text-zinc-400">Based on recent 30-period momentum</p>
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
