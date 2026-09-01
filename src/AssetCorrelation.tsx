import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Asset } from '../types';

interface AssetCorrelationProps {
  asset: Asset;
  allAssets: Asset[];
}

export default function AssetCorrelation({ asset, allAssets }: AssetCorrelationProps) {
  const defaultBenchmark = useMemo(() => {
    if (asset.type === 'crypto') return 'BTC';
    if (asset.country === 'India') return 'NIFTY50';
    return '.SPX';
  }, [asset]);

  const [compareSymbol, setCompareSymbol] = useState(defaultBenchmark);

  const benchmarkAsset = allAssets.find(a => a.symbol === compareSymbol);

  const chartData = useMemo(() => {
    if (!benchmarkAsset) return [];
    const timeframe = '1Y';
    const assetHistory = asset.history[timeframe];
    const benchHistory = benchmarkAsset.history[timeframe];
    
    if (!assetHistory || !benchHistory) return [];

    // Assuming same length for simplicity, we map over the asset history
    return assetHistory.map((pt, i) => {
      const benchPt = benchHistory[i];
      if (!benchPt) return null;
      
      // Normalize values to percentage change from start (index 0)
      const baseAsset = assetHistory[0].value;
      const baseBench = benchHistory[0].value;
      
      return {
        date: pt.date,
        assetValue: ((pt.value - baseAsset) / baseAsset) * 100,
        benchValue: ((benchPt.value - baseBench) / baseBench) * 100,
        assetActual: pt.value,
        benchActual: benchPt.value,
      };
    }).filter(Boolean);
  }, [asset, benchmarkAsset]);

  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            Asset Correlation (1Y Return %)
          </h3>
          <p className="text-xs text-zinc-400">
            Comparing {asset.symbol} against {compareSymbol}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 font-mono uppercase">Correlation Toggle:</label>
          <select 
            value={compareSymbol}
            onChange={(e) => setCompareSymbol(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-200 px-2 py-1 outline-none focus:border-indigo-500 transition-colors"
          >
            {allAssets.filter(a => a.symbol !== asset.symbol).map(a => (
              <option key={a.symbol} value={a.symbol}>{a.symbol} - {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2E37" vertical={false} />
            <XAxis 
               dataKey="date" 
               stroke="#71717A" 
               fontSize={10} 
               tickLine={false} 
               axisLine={false} 
             />
            <YAxis 
               stroke="#71717A" 
               fontSize={10} 
               tickLine={false} 
               axisLine={false}
              tickFormatter={(val) => `${val.toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#2A2E37', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#E2E8F0' }}
              labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
              formatter={(value, name) => [
                `${Number(value).toFixed(2)}%`, 
                 name === 'assetValue' ? asset.symbol : compareSymbol
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line 
               type="monotone" 
               dataKey="assetValue" 
               name={asset.symbol} 
               stroke="#10b981" 
               strokeWidth={2} 
               dot={false}
              activeDot={{ r: 4 }}
            />
            <Line 
               type="monotone" 
               dataKey="benchValue" 
               name={compareSymbol} 
               stroke="#3b82f6" 
               strokeWidth={2} 
               dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
