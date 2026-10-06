import React, { useMemo } from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface CompetitorDashboardProps {
  asset: Asset;
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
}

export default function CompetitorDashboard({ asset, assets, formatCurrency }: CompetitorDashboardProps) {
  const topCompetitors = useMemo(() => {
    return assets
      .filter((a) => a.sector === asset.sector && a.symbol !== asset.symbol)
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 3);
  }, [asset, assets]);

  if (topCompetitors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4 mt-6">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <Users className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Sector Competitors ({asset.sector})</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCompetitors.map((comp) => (
          <div key={comp.symbol} className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-white">{comp.symbol}</p>
                <p className="text-[10px] text-zinc-400 line-clamp-1">{comp.name}</p>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${comp.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {comp.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(comp.change).toFixed(2)}%
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Price</p>
                <p className="text-sm font-semibold text-zinc-200">{formatCurrency(comp.price, comp.type, comp.country)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mkt Cap</p>
                <p className="text-xs font-medium text-zinc-400">{comp.marketCapDisplay}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
