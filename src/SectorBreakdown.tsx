import React, { useMemo } from 'react';
import { Asset, PortfolioItem } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { PieChart as PieChartIcon } from 'lucide-react';

interface SectorBreakdownProps {
  portfolio: PortfolioItem[];
  assets: Asset[];
}

export default function SectorBreakdown({ portfolio, assets }: SectorBreakdownProps) {
  const { data, totalValue } = useMemo(() => {
    // We want to calculate the total current value of the portfolio for each sector
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

    // Formatting for Recharts
    const chartData = Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort biggest sectors first

    return { data: chartData, totalValue: total };
  }, [portfolio, assets]);

  // Elegant predefined palette to color the sectors dynamically
  const COLORS = [
    '#34d399', // emerald-400
    '#60a5fa', // blue-400
    '#818cf8', // indigo-400
    '#a78bfa', // violet-400
    '#f472b6', // pink-400
    '#fbbf24', // amber-400
    '#f87171', // red-400
    '#9ca3af', // gray-400
  ];

  // Custom tooltips to adhere to the dark elegant theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, payload: itemPayload } = payload[0];
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
      return (
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950/95 p-3 shadow-xl leading-normal text-xs font-mono">
          <p className="text-zinc-300 font-bold mb-1 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-1">{name}</p>
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

  if (portfolio.length === 0 || totalValue === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 min-h-[300px] flex flex-col justify-center items-center text-center">
        <PieChartIcon className="w-8 h-8 text-zinc-700 mb-3" />
        <h3 className="text-sm font-bold text-zinc-400">Sector Exposure Breakdown</h3>
        <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">Add assets to your portfolio to unlock diversification analytics.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 flex flex-col shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="h-4.5 w-4.5 text-indigo-400" />
        <h2 className="text-sm font-bold tracking-tight text-zinc-100">Portfolio Sector Exposure</h2>
      </div>
      
      <div className="w-full h-[300px] relative">
        <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value, entry, index) => (
                <span className="text-[10px] font-mono text-zinc-400">{value}</span>
              )}
            />
          </PieChart>
        </ChartContainer>

        {/* Central overlay text of total portfolio value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
          <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest font-bold">Total Val</span>
          <span className="text-sm font-black text-white font-mono mt-0.5">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  );
}
