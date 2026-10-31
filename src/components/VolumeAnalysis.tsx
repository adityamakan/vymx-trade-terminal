import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Asset } from '../types';
import { BarChart3 } from 'lucide-react';
import { useHistoricalData } from '../hooks/useHistoricalData';

interface VolumeAnalysisProps {
  asset: Asset;
}

export default function VolumeAnalysis({ asset }: VolumeAnalysisProps) {
  const { data: history, loading, error } = useHistoricalData(asset.symbol, '1M');
  const volumeData = useMemo(() => history
    .filter((point) => point.volume != null && Number.isFinite(point.volume))
    .map((point) => ({
      date: new Date(point.date).toLocaleDateString(),
      price: point.value,
      volume: point.volume as number
    })), [history]);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4 mt-6">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <BarChart3 className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Provider Trading Volume</h3>
      </div>
      <p className="text-xs text-zinc-400">
        Yahoo Finance historical volume is plotted with closing price. Volume alone does not prove accumulation, distribution or an upcoming breakout.
      </p>

      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading provider volume history…</div>
        ) : error || volumeData.length === 0 ? (
          <div className="h-full flex items-center justify-center px-6 text-center text-xs text-amber-300">
            Volume history unavailable: {error || 'the provider did not return volume observations for this instrument'}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickMargin={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={10} />
              <YAxis yAxisId="left" orientation="left" stroke="#52525b" fontSize={10} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#e4e4e7' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              />
              <Bar yAxisId="left" dataKey="volume" fill="#4f46e5" opacity={0.3} name="Provider volume" />
              <Line yAxisId="right" type="monotone" dataKey="price" stroke="#34d399" dot={false} strokeWidth={2} name="Close" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
