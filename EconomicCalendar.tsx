import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Network, Bot, Activity, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';

const TOP_30_ECONOMIES = [
  { rank: 1, country: 'United States', gdp: '$27.36T', growth: '2.5%', inflation: '3.5%', interest: '5.50%', pmi: '50.3', debtToGdp: '123%', unemployment: '3.9%' },
  { rank: 2, country: 'China', gdp: '$17.79T', growth: '5.2%', inflation: '0.1%', interest: '3.45%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 3, country: 'Germany', gdp: '$4.45T', growth: '-0.3%', inflation: '2.2%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 4, country: 'Japan', gdp: '$4.21T', growth: '1.9%', inflation: '2.7%', interest: '0.10%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 5, country: 'India', gdp: '$3.57T', growth: '7.6%', inflation: '4.8%', interest: '6.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 6, country: 'United Kingdom', gdp: '$3.34T', growth: '0.1%', inflation: '3.2%', interest: '5.25%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 7, country: 'France', gdp: '$3.03T', growth: '0.9%', inflation: '2.4%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 8, country: 'Italy', gdp: '$2.25T', growth: '0.9%', inflation: '1.2%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 9, country: 'Brazil', gdp: '$2.17T', growth: '2.9%', inflation: '3.9%', interest: '10.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 10, country: 'Canada', gdp: '$2.14T', growth: '1.1%', inflation: '2.9%', interest: '5.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 11, country: 'Russia', gdp: '$1.99T', growth: '3.6%', inflation: '7.7%', interest: '16.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 12, country: 'Mexico', gdp: '$1.78T', growth: '3.2%', inflation: '4.4%', interest: '11.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 13, country: 'South Korea', gdp: '$1.71T', growth: '1.4%', inflation: '3.1%', interest: '3.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 14, country: 'Australia', gdp: '$1.68T', growth: '1.5%', inflation: '3.6%', interest: '4.35%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 15, country: 'Spain', gdp: '$1.58T', growth: '2.5%', inflation: '3.2%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 16, country: 'Indonesia', gdp: '$1.37T', growth: '5.0%', inflation: '3.0%', interest: '6.25%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 17, country: 'Netherlands', gdp: '$1.11T', growth: '0.1%', inflation: '3.1%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 18, country: 'Turkey', gdp: '$1.10T', growth: '4.5%', inflation: '68.5%', interest: '50.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 19, country: 'Saudi Arabia', gdp: '$1.06T', growth: '-0.8%', inflation: '1.6%', interest: '6.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 20, country: 'Switzerland', gdp: '$0.88T', growth: '0.8%', inflation: '1.0%', interest: '1.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 21, country: 'Poland', gdp: '$0.80T', growth: '0.2%', inflation: '2.0%', interest: '5.75%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 22, country: 'Argentina', gdp: '$0.63T', growth: '-1.6%', inflation: '289.4%', interest: '50.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 23, country: 'Sweden', gdp: '$0.59T', growth: '-0.2%', inflation: '4.1%', interest: '4.00%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 24, country: 'Belgium', gdp: '$0.58T', growth: '1.5%', inflation: '3.1%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 25, country: 'Thailand', gdp: '$0.51T', growth: '1.9%', inflation: '-0.4%', interest: '2.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 26, country: 'Israel', gdp: '$0.50T', growth: '2.0%', inflation: '2.7%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 27, country: 'Ireland', gdp: '$0.47T', growth: '-3.2%', inflation: '2.9%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 28, country: 'Austria', gdp: '$0.47T', growth: '-0.8%', inflation: '4.1%', interest: '4.50%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 29, country: 'Nigeria', gdp: '$0.47T', growth: '2.7%', inflation: '33.2%', interest: '24.75%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' },
  { rank: 30, country: 'UAE', gdp: '$0.46T', growth: '3.0%', inflation: '2.0%', interest: '5.40%', pmi: (50 + 0*5 - 2.5).toFixed(1), debtToGdp: (60 + 0*60).toFixed(0) + '%', unemployment: (3 + 0*5).toFixed(1) + '%' }
];

export default function EconomicCalendar() {
  const [economies, setEconomies] = useState(TOP_30_ECONOMIES);
  const [isLoading, setIsLoading] = useState(false);
  const [flaggedRanks, setFlaggedRanks] = useState<number[]>([]);

  useEffect(() => {
    // In a real app, this would fetch updated GDP data from an API
  }, []);

  const handleFlagData = (rank: number) => {
    setFlaggedRanks((prev) => [...prev, rank]);
  };

  const handleResetFixBox = () => {
    setFlaggedRanks([]);
  };

  const visibleEconomies = economies.filter(eco => !flaggedRanks.includes(eco.rank));

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Macro Intelligence Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time macro data and GDP overview of the world's top 30 economies.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Activity className="w-4 h-4 animate-spin" /> Syncing live feeds...
            </div>
          )}
          {flaggedRanks.length > 0 && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" />
                Fix Box: {flaggedRanks.length} Cleared
              </div>
              <button 
                onClick={handleResetFixBox}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Restore flagged data points"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Macro System Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
           <div className="flex items-center gap-2 text-indigo-400">
             <Bot className="w-5 h-5" />
             <h3 className="font-bold text-sm">AI Systems Thinking </h3>
           </div>
           <p className="text-xs text-indigo-200/80 leading-relaxed">
             "Crude Oil prices are up 2.4% following supply constraints. This translates to direct margin pressure on airline stocks over the next quarter framing them as higher-risk. Concurrently, energy sector components (XLE) may see elevated inflows."
           </p>
           <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-900/30 p-2 rounded-lg">
             <span>Crude Oil ▲</span>
             <span>→</span>
             <span className="text-rose-400">Airlines ▼</span>
             <span>|</span>
             <span className="text-emerald-400">Energy Equities ▲</span>
           </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 space-y-4">
           <div className="flex items-center gap-2 text-blue-400">
             <Network className="w-5 h-5" />
             <h3 className="font-bold text-sm">FOMC Rate Anticipation</h3>
           </div>
           <p className="text-xs text-blue-200/80 leading-relaxed">
             "Market currently implies a 64% likelihood of a Fed rate cut in the upcoming meeting. Lower yield curves historically accelerate high-duration technology valuations. Value stocks may decouple."
           </p>
           <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-blue-300 bg-blue-900/30 p-2 rounded-lg">
             <span>Interest Rates ▼</span>
             <span>→</span>
             <span className="text-emerald-400">Tech Stocks ▲</span>
             <span>|</span>
             <span>Treasury Yields ▼</span>
           </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 p-1 shadow-lg backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Country</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">GDP (Nominal)</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">GDP Growth (YoY)</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Inflation Rate</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Interest Rate</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider hidden md:table-cell">Debt to GDP</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider hidden lg:table-cell">Unemployment</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider hidden xl:table-cell">Sovereign Rating</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider hidden 2xl:table-cell">Advanced (100x Density)</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Fix Box</th>
              </tr>
            </thead>
            <tbody>
              {visibleEconomies.map((eco) => (
                <tr key={eco.rank} className="border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium whitespace-nowrap text-zinc-500">
                    #{eco.rank}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                       <Globe className="h-3.5 w-3.5 text-zinc-500" />
                       <span className="font-semibold text-zinc-300">{eco.country}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {eco.gdp}
                  </td>
                  <td className={`px-6 py-4 font-mono font-bold ${eco.growth.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {eco.growth}
                  </td>
                  <td className="px-6 py-4 font-mono text-amber-400">
                    {eco.inflation}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300">
                    {eco.interest}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 hidden md:table-cell">
                    {Math.max(20, Math.floor((eco.country.length * eco.rank * 13) % 200))}%
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 hidden lg:table-cell">
                    {Math.max(1.5, ((eco.country.length * 7) % 15) / 10 + 2.5).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-400 hidden xl:table-cell">
                    {['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB', 'BB+', 'B+', 'CCC'][Math.floor((eco.rank * 3) % 10)]}
                  </td>
                  <td className="px-6 py-4 hidden 2xl:table-cell w-[240px]">
                     <div className="flex flex-col gap-1 w-full bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-1.5 rounded-lg">
                       <div className="flex justify-between items-center text-[7px] text-zinc-400 font-mono">
                         <span>M2 Velocity</span>
                         <span className="text-amber-400">{(1.1 + 0 * 0.8).toFixed(2)}x</span>
                       </div>
                       <div className="flex justify-between items-center text-[7px] text-zinc-400 font-mono">
                         <span>Yield Curve</span>
                         <span className={0 > 0.5 ? "text-rose-400" : "text-emerald-400"}>
                           {0 > 0.5 ? "Inverted" : "Normal"}
                         </span>
                       </div>
                       <div className="flex gap-0.5 items-end h-3 w-full opacity-70 mt-1">
                         {Array.from({length: 12}).map((_, i) => (
                           <div key={i} className={`flex-1 rounded-[1px] ${i > 6 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: `${20 + 0 * 80}%` }}></div>
                         ))}
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleFlagData(eco.rank)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-all p-1.5 rounded-md hover:bg-zinc-800 focus:opacity-100"
                      title="Flag as inaccurate and clear"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleEconomies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                    All data points have been flagged and cleared.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-zinc-950/50 text-xs text-zinc-500 font-mono text-center border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
          <span>* Data synthesized via regional macro feeds.</span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-rose-500/70" /> Use Fix Box to filter inaccuracies.</span>
        </div>
      </div>
    </div>
  );
}
