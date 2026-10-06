import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from 'recharts';
import { Asset } from '../types';

interface WatchlistCorrelationProps {
  watchlist: string[];
  assets: Asset[];
}

export default function WatchlistCorrelation({ watchlist, assets }: WatchlistCorrelationProps) {
  const chartData = useMemo(() => {
    const activeAssets = assets.filter(a => watchlist.includes(a.symbol));
    if (activeAssets.length < 2) return null;

    // Use a 6M timeframe for correlation
    const timeframe = '1Y';

    // Build data points
    const matrix = [];
    const minSize = 200;
    const maxSize = 800;

    for (let i = 0; i < activeAssets.length; i++) {
      for (let j = 0; j < activeAssets.length; j++) {
        const assetA = activeAssets[i];
        const assetB = activeAssets[j];

        const historyA = assetA.history[timeframe];
        const historyB = assetB.history[timeframe];

        if (!historyA || !historyB) continue;

        let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
        const n = Math.min(historyA.length, historyB.length);
        
        for (let k = 0; k < n; k++) {
          const valA = historyA[k].value;
          const valB = historyB[k].value;
          sumA += valA;
          sumB += valB;
          sumAB += valA * valB;
          sumA2 += valA * valA;
          sumB2 += valB * valB;
        }

        const numerator = n * sumAB - sumA * sumB;
        const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
        const correlation = denominator === 0 ? 0 : numerator / denominator;

        matrix.push({
          x: j, // map column
          y: i, // map row
          xSymbol: assetB.symbol,
          ySymbol: assetA.symbol,
          correlation: isNaN(correlation) ? 0 : correlation,
        });
      }
    }

    return {
      activeAssets,
      matrix
    };
  }, [watchlist, assets]);

  if (!chartData) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-sans">Watchlist Correlation Matrix</h3>
        <p className="text-zinc-500 text-xs italic">Add at least two assets to your watchlist to view their correlation heatmap.</p>
      </div>
    );
  }

  const { activeAssets, matrix } = chartData;
  const tickFormatter = (val: number) => activeAssets[val]?.symbol || '';

  const CustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    const size = 35; 
    const correlation = payload.correlation;
    
    let color = '#3b82f6'; // neutral/low
    if (correlation > 0.8) color = '#10b981'; // high positive (emerald)
    else if (correlation > 0.4) color = '#34d399'; // mild positive
    else if (correlation < -0.8) color = '#f43f5e'; // high negative (rose)
    else if (correlation < -0.4) color = '#fb7185'; // mild negative
    else color = '#3f3f46'; // zinc-700 for near zero

    if (payload.xSymbol === payload.ySymbol) color = '#18181b'; // self

    return (
      <g transform={`translate(${cx - size / 2},${cy - size / 2})`}>
        <rect width={size} height={size} fill={color} rx={4} stroke="#27272a" strokeWidth={1} />
        <text 
          x={size/2} 
          y={size/2 + 3} 
          textAnchor="middle" 
          fill={payload.xSymbol === payload.ySymbol ? '#52525b' : '#fff'} 
          fontSize="10" 
          fontWeight="bold"
        >
          {correlation.toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 shadow-sm space-y-4 overflow-hidden">
      <div className="flex flex-col mb-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-sans">Watchlist Correlation Matrix</h3>
        <p className="text-xs text-zinc-500 mt-1">Measures the historical 1Y Pearson correlation coefficient between your starred assets.</p>
      </div>
      <div className="w-full overflow-x-auto pb-4">
        <div style={{ width: Math.max(100 + activeAssets.length * 40, 300), height: Math.max(100 + activeAssets.length * 40, 300) }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis 
                type="number" 
                dataKey="x" 
                domain={[0, activeAssets.length - 1]} 
                tickCount={activeAssets.length} 
                tickFormatter={tickFormatter}
                interval={0}
                stroke="#71717A" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                orientation="top"
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                domain={[0, activeAssets.length - 1]} 
                tickCount={activeAssets.length} 
                tickFormatter={tickFormatter}
                interval={0}
                stroke="#71717A" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                reversed
              />
              <ZAxis type="number" dataKey="correlation" range={[100, 100]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#E2E8F0' }}
                labelStyle={{ display: 'none' }}
                formatter={(val: number, name: string, props: any) => {
                  if (name === 'correlation') {
                    return [val.toFixed(3), `${props.payload.xSymbol} vs ${props.payload.ySymbol}`];
                  }
                  return [];
                }}
              />
              <Scatter data={matrix} shape={<CustomShape />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
