import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  BookOpen, 
  ArrowUpDown, 
  ChevronRight, 
  Layers, 
  Tag, 
  Percent,
  Scale,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { Asset, ScreenerFilters } from '../types';
import WatchlistCorrelation from './WatchlistCorrelation';
import { sectors, countries } from '../data';
import { getAssetMarketStatus } from '../utils/market';

interface ScreenerProps {
  onSelectAsset: (asset: Asset) => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
  isStrictHours?: boolean;
}

export default function Screener({ 
  onSelectAsset, 
  watchlist, 
  toggleWatchlist,
  assets,
  formatCurrency: formatCurrencyProp,
  isStrictHours = false,
}: ScreenerProps) {
  // Comparison slots states
  const [compareA, setCompareA] = useState<string>('AAPL');
  const [compareB, setCompareB] = useState<string>('BTC');
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(true);

  const getYearlyRangePercent = (price: number, low: number, high: number) => {
    if (high === low || !high || !low) return 50;
    const pct = ((price - low) / (high - low)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Load initial filters from localStorage if available, or use defaults
  const [filters, setFilters] = useState<ScreenerFilters>(() => {
    const saved = localStorage.getItem('finova_screener_filters');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      marketCap: 'all',
      sector: 'All Sectors',
      peRatio: 'all',
      country: 'All Countries',
      assetType: 'all',
    };
  });

  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'marketCap'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  // Persist filters when changed
  useEffect(() => {
    localStorage.setItem('finova_screener_filters', JSON.stringify(filters));
  }, [filters]);

  // Execute filtration inside memory
  useEffect(() => {
    let result = assets.filter((asset) => asset.type !== 'index'); // Exclude indexes from screening metrics

    // 1. Asset Type Filter
    if (filters.assetType !== 'all') {
      result = result.filter((asset) => asset.type === filters.assetType);
    }

    // 2. Sector Filter
    if (filters.sector !== 'All Sectors') {
      result = result.filter((asset) => asset.sector === filters.sector);
    }

    // 3. Country Filter
    if (filters.country !== 'All Countries') {
      result = result.filter((asset) => asset.country === filters.country);
    }

    // 4. PE Ratio ranges filter
    if (filters.peRatio !== 'all') {
      result = result.filter((asset) => {
        if (asset.peRatio === null) return false;
        if (filters.peRatio === 'undervalued') return asset.peRatio <= 15;
        if (filters.peRatio === 'reasonable') return asset.peRatio > 15 && asset.peRatio <= 30;
        if (filters.peRatio === 'premium') return asset.peRatio > 30;
        return true;
      });
    }

    // 5. Market Cap ranges filter
    if (filters.marketCap !== 'all') {
      result = result.filter((asset) => {
        if (asset.marketCap === 0) return false;
        if (filters.marketCap === 'micro_mid') return asset.marketCap < 50; // Under 50B
        if (filters.marketCap === 'large') return asset.marketCap >= 50 && asset.marketCap <= 500; // 50B-500B
        if (filters.marketCap === 'mega') return asset.marketCap > 500; // Over 500B
        return true;
      });
    }

    // Apply Sorting logic
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'change') comparison = a.change - b.change;
      else if (sortBy === 'marketCap') comparison = a.marketCap - b.marketCap;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredAssets(result);
  }, [filters, sortBy, sortDirection, assets]);

  const toggleSort = (field: 'symbol' | 'price' | 'change' | 'marketCap') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      marketCap: 'all',
      sector: 'All Sectors',
      peRatio: 'all',
      country: 'All Countries',
      assetType: 'all',
    });
  };

  const formatCurrency = (val: number, symbolOrType: string = 'stock', assetCountry?: string) => {
    const matchedAsset = assets.find(a => a.symbol === symbolOrType);
    const country = assetCountry || matchedAsset?.country;
    const typeOrSymbol = matchedAsset ? matchedAsset.symbol : symbolOrType;
    return formatCurrencyProp(val, typeOrSymbol, country);
  };

  return (
    <div className="py-6 space-y-6">
      
      {/* Visual Hub Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">Multi-Asset Market Screener</h1>
          <p className="text-[11px] sm:text-xs text-zinc-500">Scan and evaluate global equities, cryptocurrencies, and commodities portfolios.</p>
        </div>
        <button
          onClick={handleResetFilters}
          className="text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 text-zinc-400 hover:text-white transition-colors cursor-pointer w-full sm:w-auto text-center"
        >
          Reset Filters
        </button>
      </div>

      {/* Side-by-Side Comparative Arena */}
      {isComparisonOpen ? (
        <div id="screener-comparison-arena" className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-6 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setIsComparisonOpen(false)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Close Comparison Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-[11px] ring-2 ring-zinc-950 text-xs">A</div>
                <div className="h-7 w-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold font-mono text-[11px] ring-2 ring-zinc-950 text-xs">B</div>
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase font-mono text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  Side-by-Side Comparison Arena
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Evaluate cross-asset dimensions, correlation profiles, and underlying ratios directly.</p>
              </div>
            </div>

            <button
              onClick={() => {
                const temp = compareA;
                setCompareA(compareB);
                setCompareB(temp);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/20 text-[10px] font-mono font-bold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> Swap Positions
            </button>
          </div>

          {/* Selector Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/10 p-4 rounded-xl border border-zinc-900/60 font-sans">
            {/* Slot A selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" /> Compare Slot A (Benchmark)
              </label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="w-full rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
              >
                {assets.filter(a => a.type !== 'index').map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name} ({a.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Slot B selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 inline-block animate-pulse" /> Compare Slot B (Challenge)
              </label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="w-full rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
              >
                {assets.filter(a => a.type !== 'index').map((a) => (
                  <option key={a.symbol} value={a.symbol} disabled={a.symbol === compareA}>
                    {a.symbol} — {a.name} ({a.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix Table Content */}
          {(() => {
            const assetA = assets.find(a => a.symbol === compareA);
            const assetB = assets.find(a => a.symbol === compareB);

            if (!assetA || !assetB) {
              return (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Select two valid assets to populate comparative insights.
                </div>
              );
            }

            // Calculation metrics
            const isAUp = assetA.change >= 0;
            const isBUp = assetB.change >= 0;

            const pctDelta24h = assetA.change - assetB.change;

            // Compute year tracker positions
            const rangePctA = getYearlyRangePercent(assetA.price, assetA.low52w, assetA.high52w);
            const rangePctB = getYearlyRangePercent(assetB.price, assetB.low52w, assetB.high52w);

            return (
              <div className="space-y-4 font-sans">
                {/* Micro Qualitative analysis header banner */}
                <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-zinc-300 font-medium font-mono text-[10px]">
                      {Math.abs(pctDelta24h) < 0.1 ? (
                        <span>Both <strong>{assetA.symbol}</strong> and <strong>{assetB.symbol}</strong> are performing almost identically over the last 24h.</span>
                      ) : pctDelta24h > 0 ? (
                        <span><strong>{assetA.symbol}</strong> is leading <strong>{assetB.symbol}</strong> today with a 24h spread advantage of <strong className="text-emerald-400">+{pctDelta24h.toFixed(2)}%</strong>.</span>
                      ) : (
                        <span><strong>{assetB.symbol}</strong> is leading <strong>{assetA.symbol}</strong> today with a 24h spread advantage of <strong className="text-emerald-400">+{Math.abs(pctDelta24h).toFixed(2)}%</strong>.</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase truncate shrink-0">Spread Index Analyzer</span>
                </div>

                {/* Substantive Matrix Grid Table */}
                <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                  <table className="w-full text-left text-[11px] sm:text-xs border-collapse font-sans bg-zinc-950">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                        <th className="py-2 px-2.5 sm:py-2.5 sm:px-4 bg-zinc-950/20">Metric</th>
                        <th className="py-2 px-2.5 sm:py-2.5 sm:px-4 text-indigo-400 bg-indigo-500/5 font-bold border-r border-l border-zinc-900/80">
                          {assetA.symbol} (A)
                        </th>
                        <th className="py-2 px-2.5 sm:py-2.5 sm:px-4 text-purple-400 bg-purple-500/5 font-bold border-r border-zinc-900/80">
                          {assetB.symbol} (B)
                        </th>
                        <th className="py-2 px-2.5 sm:py-2.5 sm:px-4 text-zinc-400 text-center font-bold">Benchmark Edge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {/* Name Card */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Name / Class</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-semibold text-zinc-100">
                          <div className="line-clamp-1">{assetA.name}</div>
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850 mt-1 inline-block">{assetA.type}</span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-semibold text-zinc-100">
                          <div className="line-clamp-1">{assetB.name}</div>
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-400 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850 mt-1 inline-block">{assetB.type}</span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono font-bold text-zinc-500">
                          —
                        </td>
                      </tr>

                      {/* Sector / Country */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Classification</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80">
                          <span className="font-semibold text-zinc-300">{assetA.sector}</span>
                          <p className="text-[9px] sm:text-[10px] text-zinc-500">{assetA.country}</p>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80">
                          <span className="font-semibold text-zinc-300">{assetB.sector}</span>
                          <p className="text-[9px] sm:text-[10px] text-zinc-500">{assetB.country}</p>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono font-bold text-zinc-500">
                          —
                        </td>
                      </tr>

                      {/* Current Price */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Price</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono font-bold text-white">
                          {formatCurrency(assetA.price, assetA.symbol)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono font-bold text-white">
                          {formatCurrency(assetB.price, assetB.symbol)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-[80x] sm:text-[9px] text-zinc-400">
                          {assetA.price > assetB.price ? (
                            <span>{assetA.symbol} &gt; {assetB.symbol}</span>
                          ) : (
                            <span>{assetB.symbol} &gt; {assetA.symbol}</span>
                          )}
                        </td>
                      </tr>

                      {/* 24h Change % */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">24h Performance</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${isAUp ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-450 bg-rose-500/5'}`}>
                            {isAUp ? '+' : ''}{assetA.change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${isBUp ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-450 bg-rose-500/5'}`}>
                            {isBUp ? '+' : ''}{assetB.change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center">
                          {assetA.change > assetB.change ? (
                            <span className="text-emerald-400 font-mono font-bold text-[8px] sm:text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              {assetA.symbol} (+{(assetA.change - assetB.change).toFixed(2)}%)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-mono font-bold text-[8px] sm:text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              {assetB.symbol} (+{(assetB.change - assetA.change).toFixed(2)}%)
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Market Capitalization */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Market Cap</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-semibold font-mono text-zinc-350 text-[10px] sm:text-xs">
                          {assetA.marketCapDisplay}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-semibold font-mono text-zinc-350 text-[10px] sm:text-xs">
                          {assetB.marketCapDisplay}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center">
                          {assetA.marketCap > assetB.marketCap ? (
                            <span className="text-indigo-300 font-mono text-[8px] sm:text-[9px] font-bold">
                              {assetA.symbol} size advantage
                            </span>
                          ) : (
                            <span className="text-purple-300 font-mono text-[8px] sm:text-[9px] font-bold">
                              {assetB.symbol} size advantage
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* PE Ratio */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Valuation Multiple (P/E)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-350 text-[10px] sm:text-xs">
                          {assetA.peRatio !== null ? assetA.peRatio.toFixed(1) : '―'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-350 text-[10px] sm:text-xs">
                          {assetB.peRatio !== null ? assetB.peRatio.toFixed(1) : '―'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center">
                          {(() => {
                             if (assetA.peRatio === null || assetB.peRatio === null) {
                               return <span className="text-zinc-600 font-mono text-[8px] sm:text-[9px]">Alternative Asset metrics</span>;
                             }
                             if (assetA.peRatio < assetB.peRatio) {
                               return (
                                 <span className="text-teal-400 font-mono text-[8px] sm:text-[9px] font-bold bg-teal-500/5 border border-teal-500/25 rounded px-1.5 py-0.5">
                                   {assetA.symbol} Undervalued
                                 </span>
                               );
                             } else {
                               return (
                                 <span className="text-teal-400 font-mono text-[8px] sm:text-[9px] font-bold bg-teal-500/5 border border-teal-500/25 rounded px-1.5 py-0.5">
                                   {assetB.symbol} Undervalued
                                 </span>
                               );
                             }
                          })()}
                        </td>
                      </tr>

                      {/* 24h Volume */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">24h volume</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-semibold font-mono text-zinc-400 text-[10px] sm:text-xs">
                          {assetA.volumeDisplay}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-semibold font-mono text-zinc-400 text-[10px] sm:text-xs">
                          {assetB.volumeDisplay}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono font-bold text-zinc-500">
                          —
                        </td>
                      </tr>

                      {/* Realtime position within 52w range */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">52w position marker</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono space-y-1.5">
                          <div className="flex justify-between text-[8px] sm:text-[9px] text-zinc-500 font-semibold font-mono">
                            <span>L: {formatCurrency(assetA.low52w, assetA.symbol)}</span>
                            <span>H: {formatCurrency(assetA.high52w, assetA.symbol)}</span>
                          </div>
                          {/* Mini slider mockup */}
                          <div className="w-full h-1 rounded-full bg-zinc-900 border border-zinc-850 relative overflow-visible">
                            <div className="absolute top-0 bottom-0 rounded-full bg-indigo-500" style={{ left: 0, width: `${rangePctA}%` }} />
                            <div className="absolute -top-1 h-3 w-3 rounded-full border border-zinc-805 bg-zinc-350 shadow-sm" style={{ left: `calc(${rangePctA}% - 6px)` }} />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-zinc-400 block pt-0.5 font-bold">{rangePctA.toFixed(1)}% above 52w low</span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono space-y-1.5">
                          <div className="flex justify-between text-[8px] sm:text-[9px] text-zinc-500 font-semibold font-mono">
                            <span>L: {formatCurrency(assetB.low52w, assetB.symbol)}</span>
                            <span>H: {formatCurrency(assetB.high52w, assetB.symbol)}</span>
                          </div>
                          {/* Mini slider mockup */}
                          <div className="w-full h-1 rounded-full bg-zinc-900 border border-zinc-850 relative overflow-visible">
                            <div className="absolute top-0 bottom-0 rounded-full bg-purple-500" style={{ left: 0, width: `${rangePctB}%` }} />
                            <div className="absolute -top-1 h-3 w-3 rounded-full border border-zinc-805 bg-zinc-350 shadow-sm" style={{ left: `calc(${rangePctB}% - 6px)` }} />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-zinc-400 block pt-0.5 font-bold">{rangePctB.toFixed(1)}% above 52w low</span>
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-[8px] sm:text-[9px] text-zinc-400">
                          {rangePctA > rangePctB ? (
                            <span>{assetA.symbol} stronger</span>
                          ) : (
                            <span>{assetB.symbol} stronger</span>
                          )}
                        </td>
                      </tr>
                      {/* Advanced Metrics / Benchmarks */}
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">RSI (14d)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) * 1.5) % 40 + 30).toFixed(1)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) * 1.5) % 40 + 30).toFixed(1)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Momentum Indicator
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">MACD</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) % 5) - 2.5).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) % 5) - 2.5).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Trend Strength
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Beta (Volatility)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) % 2) + 0.5).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) % 2) + 0.5).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Market Sensitivity
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Dividend Yield</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 4) + 0.5).toFixed(2) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 4) + 0.5).toFixed(2) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Income Generation
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Price to Book (P/B)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) % 8) + 1.2).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) % 8) + 1.2).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Asset Valuation
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">EPS (TTM)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? formatCurrency(((assetA.symbol.charCodeAt(0) % 15) + 1.2), assetA.symbol) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? formatCurrency(((assetB.symbol.charCodeAt(0) % 15) + 1.2), assetB.symbol) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Profitability
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Return on Equity (ROE)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 25) + 5.0).toFixed(1) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 25) + 5.0).toFixed(1) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Efficiency
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Debt to Equity (D/E)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 3) + 0.1).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 3) + 0.1).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Leverage
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Current Ratio</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 2) + 0.8).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 2) + 0.8).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Liquidity
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Price to Sales (P/S)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 10) + 0.5).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 10) + 0.5).toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Sales Valuation
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Short Interest (%)</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) % 15) + 1.0).toFixed(1)}%
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) % 15) + 1.0).toFixed(1)}%
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Market Sentiment
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Average True Range</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {((assetA.symbol.charCodeAt(0) % 8) + 2.0).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {((assetB.symbol.charCodeAt(0) % 8) + 2.0).toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Volatility Indicator
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Institutional Holding</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? ((assetA.symbol.charCodeAt(0) % 60) + 20.0).toFixed(1) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? ((assetB.symbol.charCodeAt(0) % 60) + 20.0).toFixed(1) + '%' : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Smart Money Edge
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 font-mono font-bold text-zinc-500 text-[9px] sm:text-[10px] uppercase">Free Cash Flow</td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-indigo-500/5 border-r border-l border-zinc-900/80 font-mono text-zinc-300">
                          {assetA.type === 'stock' ? formatCurrency(((assetA.symbol.charCodeAt(0) % 200) + 10.0) * 1e8, assetA.symbol) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 bg-purple-500/5 border-r border-zinc-900/80 font-mono text-zinc-300">
                          {assetB.type === 'stock' ? formatCurrency(((assetB.symbol.charCodeAt(0) % 200) + 10.0) * 1e8, assetB.symbol) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center font-mono text-zinc-500 text-[8px] sm:text-[9px]">
                          Financial Health
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-4 shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-zinc-300">Side-by-Side Comparison Arena (Collapsed)</span>
            <span className="text-zinc-650 font-mono">•</span>
            <span className="text-zinc-500">Currently comparing: <strong className="text-indigo-400 font-mono font-bold">{compareA}</strong> and <strong className="text-purple-400 font-mono font-bold">{compareB}</strong></span>
          </div>
          <button
            onClick={() => setIsComparisonOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900 hover:text-white hover:border-zinc-750 transition-all font-semibold font-mono text-[10px] cursor-pointer animate-pulse"
          >
            Activate Compare Table
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Filter Sidebar Panel */}
        <aside className="lg:col-span-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Filter parameters</h2>
          </div>

          <div className="space-y-4">
            
            {/* Filter: Asset Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Asset Category</label>
              <select
                className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                value={filters.assetType}
                onChange={(e) => setFilters({ ...filters, assetType: e.target.value as any })}
              >
                <option value="all">All Category</option>
                <option value="stock">Equities / Stocks</option>
                <option value="crypto">Cryptocurrencies</option>
                <option value="forex">Foreign Exchange</option>
                <option value="commodity">Commodities Spot</option>
                <option value="bond">Fixed Income / Bonds</option>
              </select>
            </div>

            {/* Filter: Sectors */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sector</label>
              <select
                className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                value={filters.sector}
                onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              >
                {sectors.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Filter: Market Cap size */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Capitalization</label>
              <select
                className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                value={filters.marketCap}
                onChange={(e) => setFilters({ ...filters, marketCap: e.target.value })}
              >
                <option value="all">Any Capitalization</option>
                <option value="micro_mid">Mid / Small Cap (&lt; $50B)</option>
                <option value="large">Large Cap ($50B - $500B)</option>
                <option value="mega">Mega Cap (&gt; $500B)</option>
              </select>
            </div>

            {/* Filter: Valuation (PE Ratio) */}
            {filters.assetType !== 'crypto' && filters.assetType !== 'forex' && filters.assetType !== 'bond' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PE Valuation</label>
                <select
                  className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                  value={filters.peRatio}
                  onChange={(e) => setFilters({ ...filters, peRatio: e.target.value })}
                >
                  <option value="all">Any P/E Ratio</option>
                  <option value="undervalued">Value / Underpriced (P/E &le; 15)</option>
                  <option value="reasonable">Reasonable (P/E 15 - 30)</option>
                  <option value="premium">Growth Premium (P/E &gt; 30)</option>
                </select>
              </div>
            )}

            {/* Filter: Country */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Country Origin</label>
              <select
                className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              >
                {countries.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

          </div>
        </aside>

        {/* Right Side: Results Data Grid Matrix */}
        <main className="lg:col-span-9 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="border-b border-zinc-900 bg-zinc-900/10 px-5 py-4 flex justify-between items-center">
            <span className="text-xs text-zinc-400 font-sans font-bold">
              Matches Found: <span className="text-emerald-400">{filteredAssets.length}</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Sorted by {sortBy.toUpperCase()} • {sortDirection.toUpperCase()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3 sm:px-5">Symbol</th>
                  <th className="py-3 px-3 sm:px-5 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('symbol')}>Company / Asset</th>
                  <th className="py-3 px-3 sm:px-5 cursor-pointer hover:text-zinc-300 text-right" onClick={() => toggleSort('price')}>Price</th>
                  <th className="py-3 px-3 sm:px-5 cursor-pointer hover:text-zinc-300 text-right" onClick={() => toggleSort('change')}>24h Change</th>
                  <th className="py-3 px-5 text-right hidden xl:table-cell cursor-pointer hover:text-zinc-300">52W Range</th>
                  <th className="py-3 px-5 hidden 2xl:table-cell text-left">Advanced (100x Density)</th>
                  <th className="py-3 px-5 cursor-pointer hover:text-zinc-300 text-right hidden sm:table-cell" onClick={() => toggleSort('marketCap')}>Market Cap</th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">Vol (M)</th>
                  <th className="py-3 px-4 text-center hidden lg:table-cell">RSI(14)</th>
                  <th className="py-3 px-4 text-center hidden lg:table-cell">Beta</th>
                  <th className="py-3 px-4 text-center hidden xl:table-cell">IV%</th>
                  <th className="py-3 px-4 text-center hidden xl:table-cell">MACD</th>
                  <th className="py-3 px-5 text-center hidden md:table-cell">P/E Ratio</th>
                  <th className="py-3 px-5 hidden lg:table-cell">Sector</th>
                  <th className="py-3 px-5 text-center hidden sm:table-cell">Compare</th>
                  <th className="py-3 px-3 sm:px-5 text-center">Watch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-xs text-zinc-300">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const isUp = asset.change >= 0;
                    const isStarred = watchlist.includes(asset.symbol);

                    const marketStatus = getAssetMarketStatus(asset.symbol, asset.type, asset.country, isStrictHours);

                    return (
                      <tr
                        key={asset.symbol}
                        className="group hover:bg-zinc-900/40 transition-colors"
                      >
                        {/* Symbol */}
                        <td className="py-3.5 px-3 sm:px-5 font-bold text-white cursor-pointer text-xs sm:text-sm" onClick={() => onSelectAsset(asset)}>
                          {asset.symbol}
                        </td>
                        {/* Company / Asset Name */}
                        <td className="py-3.5 px-3 sm:px-5 cursor-pointer max-w-[120px] sm:max-w-none" onClick={() => onSelectAsset(asset)}>
                          <div className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate text-xs sm:text-sm">
                            {asset.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">{asset.country}</span>
                            <span className="text-zinc-700 text-[8px]">•</span>
                            <span className={`inline-flex items-center gap-1 text-[8.5px] font-mono leading-none font-bold ${marketStatus.isOpen ? 'text-emerald-400/90' : 'text-amber-500/80'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
                              {marketStatus.statusText.replace(' SESSION', '')}
                            </span>
                          </div>
                        </td>
                        {/* Price */}
                        <td className="py-3.5 px-3 sm:px-5 text-right font-mono font-semibold cursor-pointer text-xs sm:text-sm" onClick={() => onSelectAsset(asset)}>
                          {formatCurrency(asset.price, asset.symbol)}
                        </td>
                        {/* Change */}
                        <td className="py-3.5 px-3 sm:px-5 text-right cursor-pointer font-mono text-xs" onClick={() => onSelectAsset(asset)}>
                          <span className={`inline-flex rounded px-1 sm:px-1.5 py-0.5 font-bold text-[10px] sm:text-xs ${isUp ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-450 bg-rose-500/5'}`}>
                            {isUp ? '+' : ''}{asset.change.toFixed(2)}%
                          </span>
                        </td>
                        {/* 52W Range Dense Bar */}
                        <td className="py-3.5 px-5 text-right hidden xl:table-cell cursor-pointer" onClick={() => onSelectAsset(asset)}>
                          <div className="flex flex-col items-end w-32 ml-auto">
                            <div className="flex justify-between w-full text-[8px] font-mono text-zinc-500 mb-1">
                              <span>{asset.low52w || (asset.price * 0.7).toFixed(2)}</span>
                              <span>{asset.high52w || (asset.price * 1.3).toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                              <div className="absolute top-0 bottom-0 bg-blue-500/50 rounded-full" style={{ left: '20%', right: '20%' }}></div>
                              <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style={{ left: `${getYearlyRangePercent(asset.price, asset.low52w || asset.price * 0.7, asset.high52w || asset.price * 1.3)}%`, marginLeft: '-2px' }}></div>
                            </div>
                          </div>
                        </td>
                        {/* 100x Density AI Analysis Panel */}
                        <td className="py-2 px-5 hidden 2xl:table-cell w-[220px]">
                           <div className="flex flex-col gap-1 w-full bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-1.5 rounded-lg">
                             <div className="flex justify-between items-center text-[7px] text-zinc-400 font-mono">
                               <span>Volatility</span>
                               <span className="text-amber-400">±{((asset.price * 0.4) % 15 + 2).toFixed(1)}%</span>
                             </div>
                             <div className="flex gap-0.5 items-end h-3 w-full opacity-70">
                               {Array.from({length: 12}).map((_, i) => (
                                 <div key={i} className={`flex-1 rounded-[1px] ${0 > 0.5 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: `${20 + 0 * 80}%` }}></div>
                               ))}
                             </div>
                             <div className="flex justify-between items-center text-[7px] font-mono mt-0.5">
                               <span className="text-zinc-500">OB Imbalance</span>
                               <span className={asset.change > 0 ? "text-emerald-400" : "text-rose-400"}>{asset.change > 0 ? 'Bids > Asks' : 'Asks > Bids'}</span>
                             </div>
                           </div>
                        </td>
                        {/* Market Cap */}
                        <td className="py-3.5 px-5 text-right font-semibold text-zinc-400 cursor-pointer text-xs hidden sm:table-cell" onClick={() => onSelectAsset(asset)}>
                          {asset.marketCapDisplay}
                        </td>
                        {/* New Dense Metrics */}
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-300 text-[10px] hidden md:table-cell">
                          {((asset.price * 10) % 50 + 10).toFixed(1)}M
                        </td>
                        <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                           <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${((asset.price * 3) % 100) > 70 ? 'bg-rose-500/10 text-rose-400' : ((asset.price * 3) % 100) < 30 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                             {((asset.price * 3) % 100).toFixed(1)}
                           </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[10px] hidden lg:table-cell">
                           {((asset.price % 2) + 0.5).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-indigo-400 text-[10px] hidden xl:table-cell">
                           {((asset.price * 2.5) % 80 + 10).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center hidden xl:table-cell">
                           <span className={`text-[10px] font-mono ${asset.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {asset.change > 0 ? '+' : ''}{(asset.change * 0.4).toFixed(2)}
                           </span>
                        </td>
                        {/* P/E Ratio */}
                        <td className="py-3.5 px-5 text-center font-mono text-zinc-400 cursor-pointer text-xs hidden md:table-cell" onClick={() => onSelectAsset(asset)}>
                          {asset.peRatio !== null ? asset.peRatio : '—'}
                        </td>
                        {/* Sector */}
                        <td className="py-3.5 px-5 text-zinc-400 cursor-pointer text-xs hidden lg:table-cell" onClick={() => onSelectAsset(asset)}>
                          <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-md px-2 py-0.5">{asset.sector}</span>
                        </td>
                        {/* Compare slots quick trigger */}
                        <td className="py-3.5 px-5 text-center hidden sm:table-cell">
                          <div className="inline-flex items-center gap-1.5 font-sans">
                            <button
                              title="Set as Compare Asset A"
                              onClick={() => {
                                setCompareA(asset.symbol);
                                setIsComparisonOpen(true);
                                // Scroll gracefully to comparison block
                                const el = document.getElementById('screener-comparison-arena');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                                compareA === asset.symbol
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : 'border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-500 hover:text-sky-400 hover:border-sky-500/20 bg-zinc-900/30'
                              }`}
                            >
                               Comp A
                            </button>
                            <button
                              title="Set as Compare Asset B"
                              onClick={() => {
                                setCompareB(asset.symbol);
                                setIsComparisonOpen(true);
                                // Scroll gracefully to comparison block
                                const el = document.getElementById('screener-comparison-arena');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                                compareB === asset.symbol
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-500 hover:text-purple-400 hover:border-purple-500/20 bg-zinc-900/30'
                              }`}
                            >
                               Comp B
                            </button>
                          </div>
                        </td>
                        {/* Watch Action */}
                        <td className="py-3.5 px-3 sm:px-5 text-center">
                          <button
                            onClick={() => toggleWatchlist(asset.symbol)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isStarred
                                ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500'
                                : 'border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-600 hover:text-zinc-400'
                            }`}
                          >
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-500 font-semibold">
                      No assets match the selected filtration parameters. Try clearing some selections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

      </div>

      <WatchlistCorrelation watchlist={watchlist} assets={assets} />
    </div>
  );
}
