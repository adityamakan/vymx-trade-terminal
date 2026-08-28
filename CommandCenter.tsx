import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe2, LayoutDashboard, BarChart2, PieChart, BookOpen, Bot, Network, Command, TrendingUp } from 'lucide-react';
import { Asset } from '../types';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: 'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows') => void;
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard & Globe', icon: Globe2, view: 'dashboard' },
  { id: 'screener', label: 'Asset Screener', icon: BarChart2, view: 'screener' },
  { id: 'portfolio', label: 'My Portfolio', icon: PieChart, view: 'portfolio' },
  { id: 'heatmap', label: 'Market Heatmap', icon: LayoutDashboard, view: 'heatmap' },
  { id: 'macro', label: 'Macro Intelligence', icon: Network, view: 'macro' },
  { id: 'institutional-flows', label: 'Institutional Flows', icon: TrendingUp, view: 'institutional-flows' },
  { id: 'academy', label: 'Wealth Academy', icon: BookOpen, view: 'academy' },
  { id: 'advisor', label: 'AI Advisor', icon: Bot, view: 'advisor' }
] as const;

export default function CommandCenter({ isOpen, onClose, setView, assets, onSelectAsset }: CommandCenterProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredModules = MODULES.filter(m => 
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(query.toLowerCase()) || 
    a.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const totalResults = filteredModules.length + filteredAssets.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelection();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalResults, filteredModules, filteredAssets]);

  const executeSelection = () => {
    if (selectedIndex < filteredModules.length) {
      setView(filteredModules[selectedIndex].view as any);
    } else {
      const asset = filteredAssets[selectedIndex - filteredModules.length];
      if (asset) {
        onSelectAsset(asset);
        setView('details');
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
              <Search className="w-5 h-5 text-zinc-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-600"
                placeholder="Search modules, tickers, or commands..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <Command className="w-3 h-3" /> K
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filteredModules.length > 0 && (
                <div className="px-3 mb-4">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Modules & Views</div>
                  {filteredModules.map((mod, idx) => {
                    const isSelected = selectedIndex === idx;
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.id}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-indigo-600/10 text-indigo-400' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => executeSelection()}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredAssets.length > 0 && (
                <div className="px-3">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Assets & Tickers</div>
                  {filteredAssets.map((asset, idx) => {
                    const globalIdx = filteredModules.length + idx;
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <button
                        key={asset.symbol}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-indigo-600/10 text-indigo-400' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => executeSelection()}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center font-bold text-xs border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                            {asset.symbol.slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-sm">{asset.symbol}</div>
                            <div className="text-xs text-zinc-500 truncate max-w-[200px]">{asset.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">${asset.price.toLocaleString()}</div>
                          <div className={`text-xs ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change >= 0 ? '+' : ''}{asset.change}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {totalResults === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
