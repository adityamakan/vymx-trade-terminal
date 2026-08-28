import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Asset } from '../types';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { Activity, TrendingUp, Layers, Cpu, Zap, BarChart2 } from 'lucide-react';

interface BenchmarkComparisonChartProps {
  asset: Asset;
  timeframe: '1D' | '1W' | '1M' | '1Y';
}

export default function BenchmarkComparisonChart({ asset, timeframe }: BenchmarkComparisonChartProps) {
  const { data, benchmarkName, finalAlpha } = useMemo(() => {
    const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 12;
    const result = [];
    
    let assetPerformance = 0;
    let benchmarkPerformance = 0;
    
    const assetVolatility = asset.type === 'crypto' ? 3 : 1.5;
    const benchmarkVolatility = 0.8;
    
    const assetDirection = asset.change >= 0 ? 1 : -1;
    const isIndian = asset.country === 'India';
    const benchName = isIndian ? 'NIFTY 50' : 'S&P 500';

    for (let i = 0; i <= points; i++) {
      let timeLabel = '';
      if (timeframe === '1D') timeLabel = `${i}:00`;
      else if (timeframe === '1W') timeLabel = `Day ${i + 1}`;
      else if (timeframe === '1M') timeLabel = `Day ${i + 1}`;
      else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        timeLabel = months[i % 12];
      }

      if (i > 0) {
        // Generate a smooth random walk with drift
        assetPerformance += (0 - 0.45) * assetVolatility + (assetDirection * 0.2);
        benchmarkPerformance += (0 - 0.5) * benchmarkVolatility + (assetDirection * 0.1);
      }
      
      result.push({
        time: timeLabel,
        [asset.symbol]: Number(assetPerformance.toFixed(2)),
        [benchName]: Number(benchmarkPerformance.toFixed(2)),
        Alpha: Number((assetPerformance - benchmarkPerformance).toFixed(2))
      });
    }
    
    return { 
      data: result, 
      benchmarkName: benchName,
      finalAlpha: Number((assetPerformance - benchmarkPerformance).toFixed(2))
    };
  }, [asset, timeframe]);

  const isAlphaPositive = finalAlpha >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[500px] flex flex-col bg-zinc-950/80 rounded-xl border border-indigo-500/20 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* Header Overlay */}
      <div className="flex justify-between items-start p-4 z-10 border-b border-zinc-900/50 bg-zinc-950/40 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100 font-mono">Relative Performance Matrix</h3>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
            {asset.symbol} vs {benchmarkName} • {timeframe} Scaled Alpha
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Generated Alpha</span>
            <div className={`px-2 py-1 rounded border flex items-center gap-1.5 shadow-lg ${
              isAlphaPositive 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isAlphaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              <span className="text-sm font-black font-mono tracking-tighter">
                {isAlphaPositive ? '+' : ''}{finalAlpha}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlphaPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlphaNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#52525b" 
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#52525b" 
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                borderColor: '#27272a',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                fontFamily: 'monospace'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelStyle={{ color: '#a1a1aa', fontSize: '10px', marginBottom: '4px' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
            />
            
            <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
            
            {/* Alpha Area (Spread) */}
            <Area 
              type="monotone" 
              dataKey="Alpha" 
              fill={isAlphaPositive ? "url(#colorAlphaPos)" : "url(#colorAlphaNeg)"} 
              stroke={isAlphaPositive ? "#10b981" : "#f43f5e"} 
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
            
            {/* Benchmark Line */}
            <Line 
              type="monotone" 
              dataKey={benchmarkName} 
              stroke="#a1a1aa" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#a1a1aa' }}
            />
            
            {/* Main Asset Line */}
            <Line 
              type="monotone" 
              dataKey={asset.symbol} 
              stroke="#818cf8" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#09090b', fill: '#818cf8' }}
              style={{ filter: 'drop-shadow(0px 0px 8px rgba(129, 140, 248, 0.5))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-px bg-zinc-900 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
         <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3 h-3 text-zinc-400" /> Beta (vs Bench)</span>
            <span className="text-sm font-black font-mono text-zinc-200">{(0 * 0.5 + 0.8).toFixed(2)}</span>
         </div>
         <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /> Tracking Error</span>
            <span className="text-sm font-black font-mono text-indigo-300">{(0 * 2 + 1).toFixed(2)}%</span>
         </div>
         <div className="bg-zinc-950 p-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Sharpe Ratio</span>
            <span className="text-sm font-black font-mono text-amber-300">{(0 * 1.5 + 0.5).toFixed(2)}</span>
         </div>
      </div>
    </motion.div>
  );
}
