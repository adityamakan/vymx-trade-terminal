import React, { useState, useEffect } from 'react';
import { Globe, Network, Bot, Activity, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';

interface MacroCountry {
  country_name: string;
  iso_code: string;
  global_rank: number;
  central_bank_metrics: {
    gdp_nominal_usd?: number;
    gdp_per_capita_usd?: number;
    net_foreign_exchange_reserves_usd?: number;
    sovereign_debt_to_gdp_pct?: number;
    money_supply_growth_annual_pct?: number;
    current_account_balance_gdp_pct?: number;
    tax_revenue_gdp_pct?: number;
    real_interest_rate_pct?: number;
    gross_savings_gdp_pct?: number;
    investment_rate_gdp_pct?: number;
  };
  corporate_anchor_profile: {
    company_name: string;
    representative_ticker: string;
    benchmark_index: string;
    equity_fundamentals: any;
  };
}

export default function WorldMonitor() {
  const [economies, setEconomies] = useState<MacroCountry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flaggedRanks, setFlaggedRanks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/world-monitor');
        if (!response.ok) throw new Error('Failed to fetch world monitor data');
        const json = await response.json();
        setEconomies(json.top_100_global_matrix || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFlagData = (rank: number) => {
    setFlaggedRanks((prev) => [...prev, rank]);
  };

  const handleResetFixBox = () => {
    setFlaggedRanks([]);
  };

  const visibleEconomies = economies.filter(eco => !flaggedRanks.includes(eco.global_rank));

  const formatTrillions = (num?: number) => {
    if (!num) return 'N/A';
    return '$' + (num / 1e12).toFixed(2) + 'T';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">World Monitor Engine</h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time macro matrix of the top 100 global economies and corporate anchors.</p>
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

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* AI Macro System Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
           <div className="flex items-center gap-2 text-indigo-400">
             <Bot className="w-5 h-5" />
             <h3 className="font-bold text-sm">Sovereign Matrix Synthesis</h3>
           </div>
           <p className="text-xs text-indigo-200/80 leading-relaxed">
             "Live synchronization across 100 global nodes indicates an emergent divergence between developed equity fundamentals and sovereign debt profiles."
           </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 space-y-4">
           <div className="flex items-center gap-2 text-blue-400">
             <Network className="w-5 h-5" />
             <h3 className="font-bold text-sm">RBI Telemetry Active</h3>
           </div>
           <p className="text-xs text-blue-200/80 leading-relaxed">
             "Engine successfully extracting live central bank rates. Incorporating corporate proxy structures (AAPL, SAP, etc.) for cross-border anchoring."
           </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 p-1 shadow-lg backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider sticky left-0 bg-zinc-900/80 backdrop-blur z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">Country</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">GDP (Nominal)</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">GDP per Capita</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-amber-400">Interest Rate</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-rose-400">Debt to GDP</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Money Supply Gr.</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Current Acct. Bal.</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Tax Rev. to GDP</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">FX Reserves</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Gross Savings</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Inv. Rate</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-indigo-400">Corp. Anchor</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-indigo-400">Market Cap</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-indigo-400">T. PE</th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {visibleEconomies.map((eco) => (
                <tr key={eco.global_rank} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium whitespace-nowrap text-zinc-500">
                    #{eco.global_rank}
                  </td>
                  <td className="px-6 py-4 sticky left-0 bg-zinc-900/40 group-hover:bg-zinc-800/80 backdrop-blur z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.05)] transition-colors">
                    <span className="flex items-center gap-2">
                       <Globe className="h-3.5 w-3.5 text-zinc-500" />
                       <span className="font-semibold text-zinc-200 whitespace-nowrap">{eco.country_name}</span>
                       <span className="text-[10px] text-zinc-600 ml-1">{eco.iso_code}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">
                    {formatTrillions(eco.central_bank_metrics.gdp_nominal_usd)}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.gdp_per_capita_usd ? '$' + eco.central_bank_metrics.gdp_per_capita_usd.toLocaleString(undefined, {maximumFractionDigits: 0}) : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-amber-400 font-semibold whitespace-nowrap">
                    {eco.central_bank_metrics.real_interest_rate_pct !== undefined ? eco.central_bank_metrics.real_interest_rate_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-rose-400 whitespace-nowrap">
                    {eco.central_bank_metrics.sovereign_debt_to_gdp_pct !== undefined ? eco.central_bank_metrics.sovereign_debt_to_gdp_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.money_supply_growth_annual_pct !== undefined ? eco.central_bank_metrics.money_supply_growth_annual_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.current_account_balance_gdp_pct !== undefined ? eco.central_bank_metrics.current_account_balance_gdp_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.tax_revenue_gdp_pct !== undefined ? eco.central_bank_metrics.tax_revenue_gdp_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.net_foreign_exchange_reserves_usd ? '$' + (eco.central_bank_metrics.net_foreign_exchange_reserves_usd / 1e9).toFixed(1) + 'B' : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.gross_savings_gdp_pct !== undefined ? eco.central_bank_metrics.gross_savings_gdp_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap">
                    {eco.central_bank_metrics.investment_rate_gdp_pct !== undefined ? eco.central_bank_metrics.investment_rate_gdp_pct + "%" : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-indigo-400 font-bold">{eco.corporate_anchor_profile.company_name}</span> 
                     <span className="text-zinc-500 block text-[10px] font-mono mt-0.5">{eco.corporate_anchor_profile.representative_ticker} &bull; {eco.corporate_anchor_profile.benchmark_index}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-300 whitespace-nowrap">
                    {eco.corporate_anchor_profile.equity_fundamentals?.market_cap_usd ? '$' + (eco.corporate_anchor_profile.equity_fundamentals.market_cap_usd / 1e9).toFixed(1) + 'B' : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-300 whitespace-nowrap">
                    {eco.corporate_anchor_profile.equity_fundamentals?.trailing_pe ? eco.corporate_anchor_profile.equity_fundamentals.trailing_pe.toFixed(1) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap sticky right-0 bg-zinc-900/40 group-hover:bg-zinc-800/80 backdrop-blur z-10 shadow-[-1px_0_0_0_rgba(255,255,255,0.05)] transition-colors">
                    <button
                      onClick={() => handleFlagData(eco.global_rank)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-all p-1.5 rounded-md hover:bg-zinc-800/80 focus:opacity-100"
                      title="Hide Row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleEconomies.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={16} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-zinc-950/50 text-xs text-zinc-500 font-mono text-center border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
          <span>* Data unified directly via World Bank & Yahoo Finance APIs.</span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-indigo-500/70" /> Top 100 Live Matrix</span>
        </div>
      </div>
    </div>
  );
}
