import React, { useState, useEffect } from 'react';
import { Asset, PortfolioItem } from '../types';
import { Pickaxe, TrendingUp, RefreshCw, Zap, Server, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface CryptoStakingRewardsProps {
  portfolio: PortfolioItem[];
  assets: Asset[];
}

export default function CryptoStakingRewards({ portfolio, assets }: CryptoStakingRewardsProps) {
  const [stakedAssets, setStakedAssets] = useState<{ symbol: string; quantity: number; apy: number; reward: number; startTime: number }[]>([]);

  // Find eligible crypto assets in portfolio
  const cryptoHoldings = portfolio.filter(item => {
    const asset = assets.find(a => a.symbol === item.symbol);
    return asset && asset.type === 'crypto' && item.quantity > 0;
  });

  const generateMockAPY = (symbol: string) => {
    // Generate a fixed mock APY between 3% and 15% based on symbol length and first char code
    const base = (symbol.charCodeAt(0) + symbol.length) % 12;
    return 3 + base + (0 * 2 - 1); // 3% to 15% +- 1%
  };

  const handleStake = (symbol: string, quantity: number) => {
    const apy = generateMockAPY(symbol);
    setStakedAssets(prev => [
      ...prev,
      { symbol, quantity, apy, reward: 0, startTime: Date.now() }
    ]);
  };

  const handleUnstake = (symbol: string) => {
    setStakedAssets(prev => prev.filter(s => s.symbol !== symbol));
  };

  // Simulate reward tick
  useEffect(() => {
    const interval = setInterval(() => {
      setStakedAssets(prev => prev.map(stake => {
        // Continuous compounding mock: (amount * apy/100) / (365*24*60*60) per second
        // But for visual effect, let's speed it up by 10000x
        const rewardPerSec = (stake.quantity * (stake.apy / 100)) / (365 * 24 * 60 * 60);
        return {
          ...stake,
          reward: stake.reward + (rewardPerSec * 10000)
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800/60 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700/80 transition-colors shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Crypto Staking Hub</h3>
            <p className="text-xs text-zinc-400">Lock assets to simulate high-yield node APY</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400 tracking-wider">NETWORK ACTIVE</span>
        </div>
      </div>

      {cryptoHoldings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <Pickaxe className="w-8 h-8 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400">No crypto holdings available for staking.</p>
          <p className="text-xs text-zinc-500 mt-1">Purchase crypto assets to participate in consensus.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Available to Stake */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-400" /> Eligible Assets</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {cryptoHoldings.map(item => {
                const isStaked = stakedAssets.some(s => s.symbol === item.symbol);
                if (isStaked) return null;
                return (
                  <div key={item.symbol} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div>
                      <span className="text-sm font-medium text-white">{item.symbol}</span>
                      <p className="text-xs text-zinc-500">{item.quantity.toFixed(4)} Available</p>
                    </div>
                    <button 
                      onClick={() => handleStake(item.symbol, item.quantity)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                    >
                      Stake Now
                    </button>
                  </div>
                );
              })}
              {cryptoHoldings.every(item => stakedAssets.some(s => s.symbol === item.symbol)) && (
                <div className="text-center py-4 text-xs text-zinc-500 italic">All eligible assets are currently staked.</div>
              )}
            </div>
          </div>

          {/* Active Staked Assets */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center"><Shield className="w-4 h-4 mr-2 text-indigo-400" /> Active Nodes</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {stakedAssets.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">No active stakes.</div>
              ) : (
                stakedAssets.map(stake => (
                  <div key={stake.symbol} className="p-3 bg-zinc-900 rounded-lg border border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="text-sm font-bold text-indigo-300">{stake.symbol} Node</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">+{stake.apy.toFixed(2)}% APY</span>
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Simulated Yield</p>
                        <p className="text-sm font-mono text-white flex items-center">
                          +{stake.reward.toFixed(6)} 
                          <RefreshCw className="w-3 h-3 ml-1 text-zinc-500 animate-spin" />
                        </p>
                      </div>
                      <button 
                        onClick={() => handleUnstake(stake.symbol)}
                        className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded transition-colors"
                      >
                        Unstake
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
