import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Wallet, 
  Percent, 
  ArrowUpRight 
} from 'lucide-react';
import { Asset, PortfolioItem } from '../types';

import Token3D from './Token3D';

interface QuickTradeProps {
  virtualBalance: number;
  portfolio: PortfolioItem[];
  onTradeSubmit: (
    type: 'BUY' | 'SELL',
    symbol: string,
    quantity: number,
    price: number
  ) => { success: boolean; message: string };
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
}

export default function QuickTrade({ 
  virtualBalance, 
  portfolio, 
  onTradeSubmit,
  assets,
  formatCurrency: formatCurrencyProp,
}: QuickTradeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(1);
  const [tradeResult, setTradeResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear query and results when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTradeResult(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // Sync / Reset quantity bounds when selected stock / asset changes or tradeType changes
  useEffect(() => {
    setTradeResult(null);
  }, [selectedSymbol, tradeType]);

  // Find currently selected Asset
  const currentAsset = useMemo(() => {
    return assets.find(a => a.symbol === selectedSymbol) || assets[0];
  }, [selectedSymbol]);

  // Format currencies locally
  const formatCurrency = (val: number, symbolOrType: string = 'stock', assetCountry?: string) => {
    const matchedAsset = assets.find(a => a.symbol === symbolOrType);
    const country = assetCountry || matchedAsset?.country || currentAsset?.country;
    const typeOrSymbol = matchedAsset ? matchedAsset.symbol : symbolOrType;
    return formatCurrencyProp(val, typeOrSymbol, country);
  };

  // Find matching assets under search filter
  const filteredAssets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      // Return top liquid tradeable assets if empty
      return assets.filter(a => a.type !== 'index').slice(0, 5);
    }
    return assets
      .filter(a => a.type !== 'index')
      .filter(a => 
        a.symbol.toLowerCase().includes(query) || 
        a.name.toLowerCase().includes(query) ||
        a.sector.toLowerCase().includes(query)
      );
  }, [searchQuery]);

  // Get current portfolio holding item for calculating user limits
  const currentHolding = useMemo(() => {
    return portfolio.find(item => item.symbol === selectedSymbol);
  }, [portfolio, selectedSymbol]);

  const heldQuantity = currentHolding ? currentHolding.quantity : 0;
  const assetPrice = currentAsset ? currentAsset.price : 0;
  const estimatedCost = quantity * assetPrice;

  // Check validations
  const isAffordable = tradeType === 'BUY' ? virtualBalance >= estimatedCost : true;
  const hasEnoughHoldings = tradeType === 'SELL' ? heldQuantity >= quantity : true;
  const isValidQuantity = quantity > 0;

  const canExecute = isValidQuantity && isAffordable && hasEnoughHoldings;

  // Handle Preset Percentages
  const applyPresetPercentage = (pct: number) => {
    if (!currentAsset) return;
    if (tradeType === 'BUY') {
      // Buy based on virtual balance portion
      const budget = virtualBalance * pct;
      const targetQty = Math.max(0, budget / currentAsset.price);
      // For stock-like, floor to whole units, for crypto allow up to 4 decimals
      if (currentAsset.type === 'crypto') {
        setQuantity(parseFloat(targetQty.toFixed(4)));
      } else {
        setQuantity(Math.floor(targetQty));
      }
    } else {
      // Sell based on holding quantity portion
      const targetQty = heldQuantity * pct;
      if (currentAsset.type === 'crypto') {
        setQuantity(parseFloat(targetQty.toFixed(4)));
      } else {
        setQuantity(Math.floor(targetQty));
      }
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset || !canExecute) return;

    const res = onTradeSubmit(tradeType, currentAsset.symbol, quantity, currentAsset.price);
    
    if (res.success) {
      setTradeResult({ type: 'success', text: res.message });
      // Clear out the input or reset trade volume state
      if (tradeType === 'SELL' && heldQuantity - quantity <= 0) {
        setQuantity(0);
      }
    } else {
      setTradeResult({ type: 'error', text: res.message });
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        id="quick-trade-fab"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-zinc-950 font-sans font-bold text-xs shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 border border-emerald-400 cursor-pointer"
        style={{ originY: '50%', originX: '100%' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900"></span>
        </span>
        <ArrowUpRight className="h-4 w-4" />
        <span>Quick Trade</span>
      </motion.button>

      {/* Modern Overlay backdrop and Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Main Modal Container card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden font-sans z-10"
            >
              {/* Core header header */}
              <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/15">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Quick Trade Terminal</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Simulate immediate market executions</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Internal transaction panel container */}
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Available virtual Cash Indicator */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-zinc-900 bg-zinc-900/10">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-emerald-500" /> Virtual Capital
                    </span>
                    <p className="text-xs font-black font-mono text-emerald-400">{formatCurrency(virtualBalance)}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Position Holdings
                    </span>
                    <p className="text-xs font-black font-mono text-zinc-200">
                      {heldQuantity > 0 ? `${heldQuantity} units` : 'None'}
                    </p>
                  </div>
                </div>

                {/* Simulated Target Search / Class select list */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex justify-between">
                    <span>Select Trade Asset</span>
                    {currentAsset && (
                      <span className="text-[9px] font-mono lowercase text-zinc-500">
                        ({currentAsset.type} asset class)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search ticker, name, or industry..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition"
                    />
                  </div>

                  {/* Filtering dropdown selections */}
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl overflow-hidden z-20 max-h-40 overflow-y-auto divide-y divide-zinc-900 hidden group-focus-within:block group-hover:block empty:hidden">
                    {/* Handled explicitly via a beautiful mini visual list selector */}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.symbol}
                        onClick={() => {
                          setSelectedSymbol(asset.symbol);
                          setSearchQuery('');
                        }}
                        className={`px-2 py-1.5 rounded-md border text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                          selectedSymbol === asset.symbol
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                            : 'bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:text-white'
                        }`}
                      >
                        <span>{asset.symbol}</span>
                        <span className="text-[8px] text-zinc-600 font-normal">|</span>
                        <span className="text-zinc-500 font-sans">{formatCurrency(asset.price, asset.symbol, asset.country)}</span>
                      </button>
                    ))}
                    {filteredAssets.length === 0 && (
                      <span className="text-[10px] text-zinc-500 py-1 pl-1">No matching active asset types found.</span>
                    )}
                  </div>
                </div>

                {/* Primary Card View of Selected Asset info */}
                {currentAsset && (
                  <div className="border border-zinc-900 bg-zinc-900/20 rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-4 -top-8 w-32 h-32 opacity-30 pointer-events-none">
                       <Token3D assetType={currentAsset.type} symbol={currentAsset.symbol} />
                    </div>
                    <div className="space-y-0.5 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black font-mono text-white">{currentAsset.symbol}</span>
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-400 font-mono font-bold uppercase px-1 py-0.25 rounded">
                          {currentAsset.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[180px]">{currentAsset.name}</p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="text-xs font-bold font-mono text-white">
                        {formatCurrency(currentAsset.price, currentAsset.symbol, currentAsset.country)}
                      </div>
                      <div className={`text-[10px] font-bold font-mono flex items-center justify-end gap-0.5 ${
                        currentAsset.change >= 0 ? 'text-emerald-400' : 'text-rose-450'
                      }`}>
                        {currentAsset.change >= 0 ? (
                          <TrendingUp className="h-2.5 w-2.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5" />
                        )}
                        <span>{currentAsset.change >= 0 ? '+' : ''}{currentAsset.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Core Trade Config Form */}
                <form onSubmit={handleExecuteTrade} className="space-y-4">
                  {/* Trade Action direction toggles */}
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-900 bg-zinc-905 p-1">
                    <button
                      type="button"
                      onClick={() => setTradeType('BUY')}
                      className={`rounded-md py-2 text-xs font-bold font-mono transition-all cursor-pointer ${
                        tradeType === 'BUY'
                          ? 'bg-emerald-500 text-zinc-950 shadow-md'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType('SELL')}
                      className={`rounded-md py-2 text-xs font-bold font-mono transition-all cursor-pointer ${
                        tradeType === 'SELL'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      SELL
                    </button>
                  </div>

                  {/* Quantity input fields */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Order Shares / Quantity
                      </label>
                      {tradeType === 'SELL' && (
                        <span className="text-[9px] font-mono text-zinc-500">
                          Hold: <strong className="text-zinc-300">{heldQuantity}</strong> units
                        </span>
                      )}
                    </div>
                    
                    <div className="relative">
                      <input
                        type="number"
                        min={currentAsset?.type === 'crypto' ? 0.0001 : 1}
                        step={currentAsset?.type === 'crypto' ? 0.0001 : 1}
                        value={quantity === 0 ? '' : quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setQuantity(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-full rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900 px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-700 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                        {currentAsset?.symbol}
                      </span>
                    </div>

                    {/* Presets shortcut buttons */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 pt-0.5 text-xs">
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-zinc-500">
                        <Percent className="h-3 w-3" /> Quick Presets
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => applyPresetPercentage(0.25)}
                          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-mono text-[9px] cursor-pointer"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetPercentage(0.50)}
                          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-mono text-[9px] cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetPercentage(1.00)}
                          className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-mono text-[9px] cursor-pointer"
                        >
                          100%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial calculation projections */}
                  <div className="border-t border-zinc-900 pt-3 space-y-2 text-xs font-medium font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Execution Price</span>
                      <span className="font-mono text-zinc-300">{formatCurrency(assetPrice, currentAsset?.symbol, currentAsset?.country)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-dotted border-zinc-900">
                      <span className="text-zinc-400">Estimated Transaction value</span>
                      <span className="font-mono text-white text-base font-extrabold">{formatCurrency(estimatedCost)}</span>
                    </div>

                    {/* Remaining Sandbox cash Projection */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                      <span>Sandbox Balance (Post-Trade)</span>
                      {tradeType === 'BUY' ? (
                        <span className={isAffordable ? 'text-zinc-400' : 'text-rose-400 font-bold'}>
                          {formatCurrency(Math.max(0, virtualBalance - estimatedCost))}
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          {formatCurrency(virtualBalance + estimatedCost)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operational warnings */}
                  {!isAffordable && tradeType === 'BUY' && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-450 rounded-xl flex gap-2 text-[11px] leading-relaxed font-sans font-medium">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="font-bold">Overdraft Warning:</span> Available Virtual Capital is insufficient for this trade.
                      </div>
                    </div>
                  )}

                  {!hasEnoughHoldings && tradeType === 'SELL' && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-450 rounded-xl flex gap-2 text-[11px] leading-relaxed font-sans font-medium">
                      <AlertCircle className="h-4 w-4 text-rose-550 shrink-0" />
                      <div>
                        <span className="font-bold">Short-Sell Warning:</span> Held holdings portfolio units are insufficient to commit standard liquidation.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!canExecute}
                    className={`w-full py-3 rounded-xl border font-bold text-xs shadow-lg transition-all cursor-pointer select-none font-mono tracking-wider ${
                      canExecute
                        ? tradeType === 'BUY'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 hover:bg-emerald-400'
                          : 'bg-rose-500 text-white border-rose-400 hover:bg-rose-400'
                        : 'bg-zinc-900 text-zinc-650 border-zinc-850 cursor-not-allowed'
                    }`}
                  >
                    SUBMIT {tradeType} SIMULATION
                  </button>
                </form>

                {/* Dynamic alert logs ticker result after submit execution */}
                {tradeResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex gap-3 text-xs font-sans ${
                      tradeResult.type === 'success'
                        ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-450'
                        : 'border-rose-500/10 bg-rose-500/5 text-rose-450'
                    }`}
                  >
                    {tradeResult.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">
                        {tradeResult.type === 'success' ? 'Simulated Order Settled' : 'Order Rejected'}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">{tradeResult.text}</p>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Close footer button */}
              <div className="p-3 border-t border-zinc-900 flex justify-end gap-2 bg-zinc-900/10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:border-zinc-700 bg-zinc-900 text-[10px] font-mono text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Close Terminal
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
