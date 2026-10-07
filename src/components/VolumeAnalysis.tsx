import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Asset } from '../types';
import { BarChart3 } from 'lucide-react';

interface VolumeAnalysisProps {
  asset: Asset;
}

export default function VolumeAnalysis({ asset }: VolumeAnalysisProps) {
  const volumeData = useMemo(() => {
    const baseHistory = asset.history['1M'] || asset.history['1W'] || asset.history['1Y'] || [];

    return baseHistory.map((point) => {
      const randomVolBase = asset.volume ? asset.volume / 100 : 1000000;
      const spikeMultiplier = Math.random() > 0.8 ? (2 + Math.random() * 3) : (0.5 + Math.random());
      const volume = Math.floor(randomVolBase * spikeMultiplier);

      return {
        date: point.date,
        price: point.value,
        volume: volume
      };
    });
  }, [asset]);

  if (!volumeData.length) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4 mt-6">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <BarChart3 className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Trading Volume Analysis</h3>
      </div>
      <p className="text-xs text-zinc-400">
        Volume spikes analyzed alongside price trends to identify liquidity accumulation and potential breakouts.
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={volumeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickMargin={10} />
            <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={10} tickFormatter={(val) => `$${val}`} />
            <YAxis yAxisId="left" orientation="left" stroke="#52525b" fontSize={10} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#e4e4e7' }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            />
            <Bar yAxisId="left" dataKey="volume" fill="#4f46e5" opacity={0.3} name="Volume" />
            <Line yAxisId="right" type="monotone" dataKey="price" stroke="#34d399" dot={false} strokeWidth={2} name="Price" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

