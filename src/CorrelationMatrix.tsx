import React, { useMemo } from 'react';
import { Asset } from '../types';

interface CorrelationMatrixProps {
  assets: Asset[];
}

export default function CorrelationMatrix({ assets }: CorrelationMatrixProps) {
  // Take top 15 assets by market cap to avoid massive grid
  const topAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 15);
  }, [assets]);

  // Generate deterministic mock correlation (-1 to 1)
  const getMockCorrelation = (assetA: Asset, assetB: Asset) => {
    if (assetA.symbol === assetB.symbol) return 1;
    
    // Base correlation on sector/type
    let base = 0;
    if (assetA.type === assetB.type) base += 0.4;
    if (assetA.sector === assetB.sector) base += 0.3;
    if (assetA.country === assetB.country) base += 0.2;
    
    // Add some deterministic noise based on symbols
    const noise = ((assetA.symbol.charCodeAt(0) + assetB.symbol.charCodeAt(0)) % 100) / 100 * 0.4 - 0.2;
    
    return Math.max(-1, Math.min(1, base + noise));
  };

  const getCorrelationColor = (val: number) => {
    if (val === 1) return 'bg-zinc-800 text-zinc-500'; // Self
    if (val > 0.7) return 'bg-emerald-500 text-white';
    if (val > 0.3) return 'bg-emerald-500/50 text-emerald-100';
    if (val > -0.3) return 'bg-zinc-800/50 text-zinc-400';
    if (val > -0.7) return 'bg-rose-500/50 text-rose-100';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="w-full h-full min-h-[500px] bg-zinc-950 rounded-3xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-6 overflow-auto">
      <div className="mb-6">
         <h3 className="text-sm font-bold text-zinc-100 mb-1">Asset Price Correlation Matrix</h3>
         <p className="text-xs text-zinc-500">Discover diversification opportunities by analyzing how different assets move in relation to one another. Green indicates positive correlation, red indicates inverse correlation.</p>
      </div>
      
      <div className="min-w-[800px]">
        <div className="flex mb-2">
          <div className="w-24 shrink-0"></div>
          {topAssets.map(asset => (
            <div key={`header-${asset.symbol}`} className="flex-1 text-center font-mono text-[10px] text-zinc-500 font-bold -roate-45 origin-bottom-left" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {asset.symbol}
            </div>
          ))}
        </div>
        
        {topAssets.map((rowAsset) => (
          <div key={`row-${rowAsset.symbol}`} className="flex gap-1 mb-1 items-center">
            <div className="w-24 shrink-0 font-mono text-[10px] text-zinc-400 font-bold truncate pr-4 text-right">
              {rowAsset.symbol}
            </div>
            {topAssets.map((colAsset) => {
              const corr = getMockCorrelation(rowAsset, colAsset);
              return (
                <div 
                  key={`cell-${rowAsset.symbol}-${colAsset.symbol}`}
                  className={`flex-1 aspect-square rounded-sm flex items-center justify-center text-[9px] font-mono font-medium transition-colors hover:ring-2 hover:ring-white z-10 relative cursor-pointer ${getCorrelationColor(corr)}`}
                  title={`${rowAsset.symbol} vs ${colAsset.symbol}: ${corr.toFixed(2)}`}
                >
                  {corr === 1 ? '-' : corr.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
        
        <div className="mt-8 flex items-center justify-center gap-6 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pt-6">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
               <div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Strong Positive
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
               <div className="w-3 h-3 rounded-sm bg-emerald-500/50"></div> Weak Positive
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
               <div className="w-3 h-3 rounded-sm bg-zinc-800/50 border border-zinc-700"></div> Uncorrelated
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
               <div className="w-3 h-3 rounded-sm bg-rose-500/50"></div> Weak Negative
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
               <div className="w-3 h-3 rounded-sm bg-rose-500"></div> Strong Negative
            </div>
        </div>
      </div>
    </div>
  );
}
