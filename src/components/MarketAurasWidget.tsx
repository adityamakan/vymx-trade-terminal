import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function MarketAurasWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/market-auras');
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      // Silenced fallback;
      // Fallback local UI data rendering if fetch fails
      setData([
        { sector: 'Technology', score: 85, trend: 'growth' },
        { sector: 'Healthcare', score: 62, trend: 'neutral' },
        { sector: 'Energy', score: 30, trend: 'stress' },
        { sector: 'Financials', score: 45, trend: 'stress' },
        { sector: 'Consumer', score: 75, trend: 'growth' },
        { sector: 'Industrials', score: 55, trend: 'neutral' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAuraColor = (score: number) => {
    if (score >= 70) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400';
    if (score >= 50) return 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400';
    return 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400';
  };

  return (
    <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
           <Activity className="h-4 w-4 text-indigo-400" />
           <h2 className="text-sm font-semibold tracking-tight text-white">Market Auras</h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-zinc-500 font-mono">
              {lastUpdated.toLocaleTimeString()}
           </span>
           <button onClick={fetchData} className="text-zinc-500 hover:text-white transition-colors" disabled={loading}>
             <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((item, i) => (
          <div key={i} className={`p-3 rounded-xl border bg-gradient-to-br ${getAuraColor(item.score)} relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
             <div className="flex justify-between items-start mb-2">
               <span className="text-xs font-black uppercase tracking-wider opacity-90">{item.sector}</span>
               <span className="text-[10px] font-mono font-bold opacity-80 bg-zinc-950/40 px-1.5 py-0.5 rounded">{item.score}/100</span>
             </div>
             <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{item.trend} Phase</p>
             <div className="w-full h-1 bg-zinc-950/30 rounded-full overflow-hidden mt-3">
               <div className="h-full bg-current rounded-full transition-all duration-1000" style={{ width: `${item.score}%` }}></div>
             </div>
          </div>
        ))}
        {loading && data.length === 0 && (
           <div className="col-span-full text-center py-6 text-[10px] text-zinc-500 font-mono tracking-widest uppercase animate-pulse">
              Initializing AI Sector Telemetry...
           </div>
        )}
      </div>
    </div>
  );
}
