import React, { useMemo } from 'react';
import { Asset, PortfolioItem } from '../types';
import { Activity, PieChart as PieChartIcon, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from './ChartContainer';

interface RiskDashboardProps {
  portfolio: PortfolioItem[];
  assets: Asset[];
}

export default function RiskDashboard({ portfolio, assets }: RiskDashboardProps) {
  // Sector exposure data
  const { sectorData, totalValue } = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    let total = 0;
    portfolio.forEach(item => {
      const asset = assets.find(a => a.symbol === item.symbol);
      if (asset) {
        const currentValue = asset.price * item.quantity;
        const targetSector = asset.sector || 'Other';
        sectorMap[targetSector] = (sectorMap[targetSector] || 0) + currentValue;
        total += currentValue;
      }
    });

    const chartData = Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { sectorData: chartData, totalValue: total };
  }, [portfolio, assets]);

  // Correlation is intentionally unavailable until aligned provider-backed
  // historical return series are supplied to this component.
  const correlationData: Array<Record<string, number | string>> | null = null;

  const COLORS = [
    '#34d399', '#60a5fa', '#818cf8', '#a78bfa',
    '#f472b6', '#fbbf24', '#f87171', '#9ca3af',
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
      return (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/95 p-3 shadow-xl leading-normal text-xs font-mono">
          <p className="text-zinc-300 font-bold mb-1 border-b border-zinc-800/60 pb-1">{name}</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center gap-4 text-emerald-400">
              <span className="text-zinc-500">Value:</span>
              <span>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center gap-4 text-indigo-400">
              <span className="text-zinc-500">Weight:</span>
              <span>{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getCorrelationColor = (val: number) => {
    if (val === 1) return 'bg-indigo-500/20 text-indigo-300';
    if (val > 0.7) return 'bg-rose-500/20 text-rose-300';
    if (val > 0.3) return 'bg-amber-500/20 text-amber-300';
    return 'bg-emerald-500/20 text-emerald-300';
  };

  if (portfolio.length === 0) return null;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Sector Exposure */}
      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-4.5 w-4.5 text-indigo-400" />
          <h2 className="text-sm font-bold tracking-tight text-zinc-100">Sector Exposure</h2>
        </div>

        {totalValue > 0 ? (
          <div className="w-full h-[300px] relative">
            <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="transparent"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[10px] font-mono text-zinc-400">{value}</span>
                  )}
                />
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
              <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest font-bold">Total Val</span>
              <span className="text-sm font-black text-white font-mono mt-0.5">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">
            No value available
          </div>
        )}
      </div>

      {/* Asset Correlation Matrix */}
      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-rose-400" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">Correlation Risk Matrix</h2>
          </div>
          <div className="flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded text-[9px] font-mono text-rose-400 border border-rose-500/20">
            <AlertTriangle size={10} /> High &gt; 0.7
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-xs text-zinc-500 font-mono text-center max-w-[300px] mx-auto space-y-2 py-8">
          <Target className="h-8 w-8 text-zinc-700" />
          <p>Correlation is unavailable until validated historical returns for each holding can be aligned.</p>
          <p className="text-[10px] text-zinc-600">No sector-based or synthetic correlation values are displayed.</p>
        </div>
      </div>
    </section>
  );
}

