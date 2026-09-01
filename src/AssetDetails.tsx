import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Sparkles, RefreshCw, AlertCircle, ShoppingBag, TrendingUp, TrendingDown, Clock, ShieldAlert, CheckCircle2, Share2, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import TradingViewChart from './TradingViewChart';
import TradingChat from './TradingChat';
import { Asset, PortfolioItem } from '../types';
import { getAssetMarketStatus, detectMACrossover } from '../utils/market';

interface AssetDetailsProps {
  asset: Asset;
  virtualBalance: number;
  portfolio: PortfolioItem[];
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  onTradeSubmit: (type: 'BUY' | 'SELL', symbol: string, quantity: number, price: number) => { success: boolean; message: string };
  formatCurrency: (val: number, type?: string, assetCountry?: string) => string;
  currencyMode: 'AUTO' | 'USD' | 'INR';
  isStrictHours?: boolean;
  assets: Asset[];
}

type ResearchTabType = 'explain' | 'newsSentiment' | 'explainMove' | 'fundamentals';
type AiTabType = 'explain' | 'newsSentiment' | 'explainMove';

import Token3D from "./Token3D";
import AssetCorrelation from "./AssetCorrelation";

export default function AssetDetails({
  asset,
  virtualBalance,
  portfolio,
  watchlist,
  toggleWatchlist,
  onTradeSubmit,
  formatCurrency: formatCurrencyProp,
  currencyMode,
  isStrictHours = false,
  assets,
}: AssetDetailsProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [quantity, setQuantity] = useState<number>(1);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI research & Fundamentals states
  const [activeTab, setActiveTab] = useState<ResearchTabType>('fundamentals');
  const [aiInsights, setAiInsights] = useState<{ [key in AiTabType]?: string }>({});
  const [fundamentalsData, setFundamentalsData] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [hedgeSuggestions, setHedgeSuggestions] = useState<{name: string, symbol: string, reason: string}[] | null>(null);
  const [isGeneratingHedge, setIsGeneratingHedge] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareInsights = () => {
    const text = `Asset Insight: ${asset.name} (${asset.symbol})\n` +
                 `Current Price: ${formatCurrencyProp(asset.price, asset.type, asset.country)}\n` +
                 `24h Change: ${asset.change > 0 ? '+' : ''}${asset.change}%\n` +
                 `View full technical analysis and AI correlations on our platform!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // Fetch AI content or fundamentals from backend route
  const fetchTabData = async (tab: ResearchTabType, forceUpdate = false) => {
    if (tab === 'fundamentals') {
      if (fundamentalsData && !forceUpdate) return;
      setIsDataLoading(true);
      setDataError('');
      try {
        const response = await fetch(`/api/yahoo/financials/${asset.symbol}`);
        const data = await response.json();
        if (data.error) {
          setDataError(data.error);
        } else {
          setFundamentalsData(data.data);
        }
      } catch (err: any) {
        setDataError(`API error: ${err.message || 'Failed connecting to server side'}`);
      } finally {
        setIsDataLoading(false);
      }
      return;
    }

    // AI tabs handling
    if (aiInsights[tab as AiTabType] && !forceUpdate) return; // cache results

    setIsDataLoading(true);
    setDataError('');

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          price: asset.price,
          change: asset.change,
          analysisType: tab,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setDataError(data.error);
      } else {
        setAiInsights((prev) => ({
          ...prev,
          [tab as AiTabType]: data.content,
        }));
      }
    } catch (err: any) {
      setDataError(`API error: ${err.message || 'Failed connecting to server side'}`);
    } finally {
      setIsDataLoading(false);
    }
  };

  const generateHedge = async () => {
    setIsGeneratingHedge(true);
    setHedgeSuggestions(null);
    try {
      const response = await fetch('/api/ai/hedge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          change: asset.change
        })
      });
      const data = await response.json();
      if (data.suggestions) {
        setHedgeSuggestions(data.suggestions);
      } else {
        const { generateHedgeSuggestions } = await import('../utils/hedgeEngine');
        setHedgeSuggestions(generateHedgeSuggestions(asset));
      }
    } catch (err) {
      const { generateHedgeSuggestions } = await import('../utils/hedgeEngine');
      setHedgeSuggestions(generateHedgeSuggestions(asset));
    } finally {
      setIsGeneratingHedge(false);
    }
  };

  // Run initial fetch when asset or active tab changes
  useEffect(() => {
    fetchTabData(activeTab);
  }, [asset.symbol, activeTab]);

  // Clear messages when asset changes
  useEffect(() => {
    setQuantity(1);
    setTradeMessage(null);
    setFundamentalsData(null); // Clear cached data for new asset
    setAiInsights({});
  }, [asset.symbol]);

  // Find users currently held portfolio units
  const portfolioHolding = portfolio.find((p) => p.symbol === asset.symbol);
  const unitsHeld = portfolioHolding ? portfolioHolding.quantity : 0;

  // Calculate estimated totals for transactions
  const estimatedTotal = quantity * asset.price;
  const isStarred = watchlist.includes(asset.symbol);
  const isUp = asset.change >= 0;

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeMessage(null);

    if (quantity <= 0) {
      setTradeMessage({ type: 'error', text: 'Please specify a quantity greater than zero.' });
      return;
    }

    const res = onTradeSubmit(tradeType, asset.symbol, quantity, asset.price);
    if (res.success) {
      setTradeMessage({ type: 'success', text: res.message });
      setQuantity(1);
    } else {
      setTradeMessage({ type: 'error', text: res.message });
    }
  };

  const formatCurrency = (val: number, type: string = 'stock') => {
    return formatCurrencyProp(val, type, asset.country);
  };

  const marketStatus = getAssetMarketStatus(asset.symbol, asset.type, asset.country, isStrictHours);

  const trendSentiment = React.useMemo(() => {
    // Collect prices from history
    const hist = asset.history['6M'] || asset.history['1M'] || asset.history['1D'];
    if (!hist) return 'NEUTRAL';
    const prices = hist.map((p) => p.value);
    return detectMACrossover(prices, 5, 20);
  }, [asset.history]);

  return (
    <motion.div 
      className="py-6 space-y-6"
      key={asset.symbol}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      
      {/* 1. Header Segment with Core Price & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5 relative"><div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="flex h-24 w-24 items-center justify-center shrink-0">
            <Token3D assetType={asset.type} symbol={asset.symbol} />
          </div>
          <div>
            <div className="flex items-center gap-2 pt-2">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 tracking-tight drop-shadow-sm">{asset.name}</h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-400">{asset.symbol}</span>
              {trendSentiment !== 'NEUTRAL' && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${
                  trendSentiment === 'BULLISH' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {trendSentiment} TREND
                </span>
              )}
            </div>
            
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-sans font-medium">
              <span>{asset.sector}</span>
              <span>•</span>
              <span>{asset.country}</span>
              <span>•</span>
              <span className="uppercase text-[10px] font-bold tracking-wider rounded border border-zinc-850 px-1.5 py-0.5 text-zinc-400 bg-zinc-900/30">{asset.type}</span>
              <span>•</span>
              <span className={`text-[9px] uppercase font-mono font-black rounded-lg border px-2 py-0.5 ${marketStatus.className}`}>
                ● {marketStatus.statusText}
              </span>
              <span>•</span>
              <span className="text-zinc-600 font-mono text-[10.5px] bg-zinc-900/10 px-2 py-0.5 rounded border border-zinc-900/40" title={marketStatus.hoursDescription}>
                🕒 {marketStatus.currentTimeStr} {marketStatus.timezoneCode} ({marketStatus.currentDay})
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Price stats & Watchlist trigger */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight text-zinc-100">
              {formatCurrency(asset.price, asset.type)}
            </div>
            <div className={`text-xs font-bold font-mono tracking-tight flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{isUp ? '+' : ''}{asset.changeAbs >= 0 ? asset.changeAbs.toFixed(asset.type === 'forex' || asset.type === 'bond' ? 4 : 2) : asset.changeAbs.toFixed(asset.type === 'forex' || asset.type === 'bond' ? 4 : 2)} ({isUp ? '+' : ''}{asset.change.toFixed(2)}%)</span>
            </div>
          </div>

          <button
            onClick={() => toggleWatchlist(asset.symbol)}
            className={`flex items-center justify-center h-11 w-11 rounded-xl border transition-all cursor-pointer ${
              isStarred
                ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500'
                : 'border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 text-zinc-500 hover:text-white hover:border-zinc-700'
            }`}
            title={isStarred ? 'Tracked in Watchlist' : 'Add to Watchlist'}
          >
            <Star className={`h-5 w-5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShareInsights}
            className="flex items-center justify-center h-11 px-4 gap-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
            title="Share Insights"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">{copied ? 'Copied' : 'Share Insights'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Column: interactive chart & stats */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Interactive TradingView-style chart and indicators */}
          <TradingViewChart
            asset={asset}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            formatCurrency={formatCurrency}
          />

          <AssetCorrelation asset={asset} allAssets={assets} />

          {/* AI Qualitative Performance Analysis (Mock-driven Summary) */}
          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                </div>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-sans">AI Performance Analysis</h3>
              </div>
              
              <button
                onClick={() => {
                  const btn = document.getElementById('btn-re-analyze');
                  if (btn) btn.click();
                }}
                className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition font-mono"
              >
                <RefreshCw className="h-3 w-3" /> Quick Refresh
              </button>
            </div>

            {/* Qualitative analysis rendering */}
            {(() => {
              const [isScanning, setIsScanning] = useState(false);
              const [currentAssetSymbol, setCurrentAssetSymbol] = useState(asset.symbol);

              // Track symbol change to trigger brief re-scan
              useEffect(() => {
                if (asset.symbol !== currentAssetSymbol) {
                  setCurrentAssetSymbol(asset.symbol);
                  setIsScanning(true);
                  const t = setTimeout(() => setIsScanning(false), 700);
                  return () => clearTimeout(t);
                }
              }, [asset.symbol]);

              // Generate Qualitative summary from metrics
              const analysis = React.useMemo(() => {
                const isUp = asset.change >= 0;
                const pe = asset.peRatio;
                let recommendation: 'STRONG BUY' | 'ACCUMULATE' | 'HOLD' | 'REDUCE' | 'UNDER REVIEW' = 'HOLD';
                let sentimentScore = 52;
                let keyThemes: string[] = [];
                let summary = '';

                if (asset.type === 'crypto') {
                  sentimentScore = isUp ? 78 : 41;
                  recommendation = isUp ? 'ACCUMULATE' : 'HOLD';
                  keyThemes = isUp 
                    ? ['On-chain Wallet Accumulation', 'Meme & Layer2 Narrative Heat', 'DeFi Liquidity Pools Inflows']
                    : ['Macro Sentiment De-Risking', 'Derivatives Open-Interest Over-leveraging', 'Halving Post-Cycle Soft Floor'];
                  summary = `${asset.name} (${asset.symbol}) is showing a 24-hour displacement of ${asset.change.toFixed(2)}% to settle at ${formatCurrency(asset.price, asset.type)}. Lacking physical P/E ratios, blockchain activity indices and stablecoin buying metrics act as key drivers. Baseline support is establishing nicely near the 52-week low bounds of ${formatCurrency(asset.low52w, asset.type)}.`;
                } else if (asset.type === 'stock') {
                  if (isUp) {
                    if (pe && pe < 18) {
                      recommendation = 'STRONG BUY';
                      sentimentScore = 89;
                      keyThemes = ['Undervalued P/E Multiples', 'Institutional Buying Core Support', 'Robust Capital Allocations'];
                      summary = `${asset.name} is demonstrating exceptional capital resilience with a strong 24h change of ${asset.change.toFixed(2)}%. Trading at a highly attractive P/E valuation of ${pe}, it represents excellent defensive coverage. Indicators point toward heavy volume accumulation above the initial ${formatCurrency(asset.openPrice, asset.type)} floor.`;
                    } else {
                      recommendation = 'ACCUMULATE';
                      sentimentScore = 76;
                      keyThemes = ['Momentum Extension', 'Sector Headwinds Alleviation', 'High Capex Efficiency'];
                      summary = `${asset.name} is extending upward trajectories near ${formatCurrency(asset.price, asset.type)}. While its P/E multiple of ${pe || 'N/A'} indicates premium growth valuation expectations, the solid volume velocity suggests strong support structures from core asset baskets.`;
                    }
                  } else {
                    if (pe && pe > 32) {
                      recommendation = 'REDUCE';
                      sentimentScore = 31;
                      keyThemes = ['Premium P/E Multiple Compress', 'Technical Trend Support Break', 'Post-Earnings Capital Shift'];
                      summary = `${asset.name} is undergoing a minor consolidation pattern, dropping ${asset.change.toFixed(2)}%. The premium P/E valuation profile (${pe}) introduces intermediate valuation headwinds. Momentum shifts lean negative until consolidated baselines stabilize around ${formatCurrency(asset.low52w, asset.type)}.`;
                    } else {
                      recommendation = 'UNDER REVIEW';
                      sentimentScore = 47;
                      keyThemes = ['Dynamic Support Reinforcement', 'Range-Bound Distribution', 'Volatility Squeeze Pattern'];
                      summary = `${asset.name} is consolidating with a 24-hour movement of ${asset.change.toFixed(2)}%. Fundamental balance sheets are steady, but macro rates introduce a range-bound profile. Watch for breakout triggers above the 52-week peak high of ${formatCurrency(asset.high52w, asset.type)}.`;
                    }
                  }
                } else {
                  sentimentScore = isUp ? 68 : 45;
                  recommendation = isUp ? 'ACCUMULATE' : 'UNDER REVIEW';
                  keyThemes = isUp 
                    ? ['Sovereign Arbitrage Flows', 'Hedged Alternative Inbound', 'Global Trade Spread Widening']
                    : ['Capital Outflows to High Yields', 'Safehaven Assets Rotation', 'Demand Curve Readjustments'];
                  summary = `${asset.symbol} is responding dynamically to micro-rate revisions, currently priced at ${formatCurrency(asset.price, asset.type)}. Dynamic resistance stands near ${formatCurrency(asset.high52w, asset.type)}, guiding risk managers to maintain neutral exposure matrices.`;
                }

                let recommendationColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                if (recommendation === 'STRONG BUY') recommendationColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
                if (recommendation === 'ACCUMULATE') recommendationColor = 'text-teal-400 bg-teal-500/15 border-teal-500/20';
                if (recommendation === 'REDUCE') recommendationColor = 'text-rose-450 bg-rose-500/10 border-rose-550/20';

                return { recommendation, recommendationColor, sentimentScore, keyThemes, summary };
              }, [asset.symbol, asset.change, asset.price, asset.type]);

              return (
                <div className="space-y-4 relative min-h-[140px]">
                  {isScanning && (
                    <div className="absolute inset-0 bg-zinc-950/95 z-20 rounded-xl flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                      <span className="text-[10px] font-mono text-zinc-400">Scanning asset indicators...</span>
                    </div>
                  )}

                  {/* Top Stats: Gauge & Recommendation Badge */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/20 rounded-xl border border-zinc-900 p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Sentiment meter visual block */}
                      <div className="relative h-12 w-12 rounded-full border-2 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex items-center justify-center bg-zinc-950">
                        <span className="text-xs font-black font-mono text-indigo-300">{analysis.sentimentScore}</span>
                        <div className="absolute inset-0.5 rounded-full border border-dashed border-indigo-500/30 animate-spin" style={{ animationDuration: '6s' }} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Performance Core Score</h4>
                        <p className="text-xs font-bold text-zinc-200 mt-0.5">
                          {analysis.sentimentScore > 75 ? 'Strongly Bullish' : analysis.sentimentScore > 55 ? 'Moderately Bullish' : analysis.sentimentScore > 40 ? 'Neutral Momentum' : 'Bearish Tension'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold tracking-widest uppercase font-mono ${analysis.recommendationColor}`}>
                        {analysis.recommendation}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-1 font-mono">Dynamic Performance Signal</span>
                    </div>
                  </div>

                  {/* Summary qualitative text block */}
                  <div className="bg-zinc-900/5 border border-zinc-900/80 rounded-xl p-4">
                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      "{analysis.summary}"
                    </p>
                  </div>

                  {/* Dynamic Indicators checklist */}
                  <div className="space-y-2 pt-1">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Contributing Valuation Insights</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {analysis.keyThemes.map((theme, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-zinc-900/30 border border-zinc-900 px-3 py-2 text-[10px] text-zinc-300 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{theme}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hidden trigger click button for ref helper usage */}
                  <button
                    id="btn-re-analyze"
                    onClick={() => {
                      setIsScanning(true);
                      const t = setTimeout(() => setIsScanning(false), 900);
                      return () => clearTimeout(t);
                    }}
                    className="hidden"
                  />
                </div>
              );
            })()}
          </div>

          {/* Quick Metrics grid stats panel */}
          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Trading metrics & stats</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="Market Cap: Total dollar value of a company's outstanding shares. Formula: Share Price × Total Number of Shares.">Market Capitalization</p>
                <p className="text-sm font-bold text-white">{asset.marketCapDisplay}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="P/E Ratio: Price-to-Earnings. How much investors are willing to pay per dollar of earnings. High means growth expected or overvalued.">P/E Valuation Ratio</p>
                <p className="text-sm font-bold text-white">{asset.peRatio !== null ? asset.peRatio : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="Volume: The total number of shares/contracts traded in a single day. High volume indicates strong market interest.">Standard Volume</p>
                <p className="text-sm font-bold text-white">{asset.volumeDisplay}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="The highest price this asset has traded at over the past year.">52-Week Peak High</p>
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(asset.high52w, asset.type)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium font-sans border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="The lowest price this asset has traded at over the past year.">52-Week Valley Low</p>
                <p className="text-sm font-semibold text-rose-450">{formatCurrency(asset.low52w, asset.type)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-medium border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 border-dashed w-fit cursor-help" title="Opening Price: The first price at which this asset traded upon the market opening today.">Opening Price</p>
                <p className="text-sm font-bold text-white">{formatCurrency(asset.openPrice, asset.type)}</p>
              </div>
            </div>
            
            {/* 100x Information Density Advanced Metrics Matrix */}
            <div className="border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 mt-5 pt-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-4">
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">RSI(14)</p>
                 <p className={`text-xs font-bold font-mono ${20 + (asset.symbol.charCodeAt(0) * 7 % 60) > 65 ? 'text-rose-400' : 20 + (asset.symbol.charCodeAt(0) * 7 % 60) < 35 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                   {(20 + (asset.symbol.charCodeAt(0) * 7 % 60)).toFixed(2)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">MACD</p>
                 <p className={`text-xs font-bold font-mono ${asset.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {asset.change > 0 ? '+' : ''}{(asset.change * 0.42).toFixed(3)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Volat(IV)</p>
                 <p className="text-xs font-bold font-mono text-amber-400">
                   {(15 + (asset.symbol.charCodeAt(0) * 3 % 40)).toFixed(1)}%
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Beta</p>
                 <p className="text-xs font-bold font-mono text-zinc-300">
                   {(0.5 + (asset.symbol.charCodeAt(0) * 1.1 % 1.5)).toFixed(2)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">VWAP</p>
                 <p className="text-xs font-bold font-mono text-indigo-400">
                   {formatCurrency(asset.price * (1 - (asset.change * 0.001)), asset.type)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Dark Pool</p>
                 <div className="h-1.5 w-full bg-zinc-900 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${30 + (asset.symbol.charCodeAt(0) * 5 % 50)}%` }}></div>
                 </div>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Short Int</p>
                 <p className="text-xs font-bold font-mono text-zinc-300">
                   {(2 + (asset.symbol.charCodeAt(0) * 0.5 % 15)).toFixed(1)}%
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Inst Own</p>
                 <p className="text-xs font-bold font-mono text-emerald-400">
                   {(40 + (asset.symbol.charCodeAt(0) * 2 % 45)).toFixed(1)}%
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Sharpe</p>
                 <p className="text-xs font-bold font-mono text-zinc-300">
                   {(1.1 + (asset.symbol.charCodeAt(0) * 0.1 % 1.5)).toFixed(2)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Sortino</p>
                 <p className="text-xs font-bold font-mono text-zinc-300">
                   {(1.5 + (asset.symbol.charCodeAt(0) * 0.15 % 2.0)).toFixed(2)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Altman Z</p>
                 <p className={`text-xs font-bold font-mono ${(3.0 + (asset.symbol.charCodeAt(0) * 0.2 % 4.0)) > 2.99 ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {(3.0 + (asset.symbol.charCodeAt(0) * 0.2 % 4.0)).toFixed(2)}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Piotroski</p>
                 <p className="text-xs font-bold font-mono text-emerald-400">
                   {Math.floor(4 + (asset.symbol.charCodeAt(0) % 5))}/9
                 </p>
               </div>
            </div>
          </div>

          {/* AI Insights & Research Hub Panel */}
          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg shadow-lg overflow-hidden">
            <div className="bg-zinc-900/10 px-5 py-4 border-b border-zinc-900 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                <h3 className="text-sm font-semibold tracking-tight text-white">Research Terminal</h3>
              </div>
              
              {/* Trigger manual fresh update */}
              <button
                onClick={() => fetchTabData(activeTab, true)}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Refresh insights"
              >
                <RefreshCw className={`h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="border-b border-zinc-900 bg-zinc-900/30 flex text-xs overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => setActiveTab('fundamentals')}
                className={`px-4 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'fundamentals' ? 'border-amber-500 text-amber-400 bg-zinc-950/40' : 'border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Fundamentals (Live)
              </button>
              <button
                onClick={() => setActiveTab('explain')}
                className={`px-4 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'explain' ? 'border-blue-500 text-white bg-zinc-950/40' : 'border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Corporate Dossier
              </button>
              <button
                onClick={() => setActiveTab('newsSentiment')}
                className={`px-4 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'newsSentiment' ? 'border-blue-500 text-white bg-zinc-950/40' : 'border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Sentiment Matrix
              </button>
              <button
                onClick={() => setActiveTab('explainMove')}
                className={`px-4 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
                  activeTab === 'explainMove' ? 'border-blue-500 text-white bg-zinc-950/40' : 'border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Price Dynamics
              </button>
            </div>

            {/* Display space */}
            <div id="ai-research-container" className="p-5 text-zinc-300 leading-relaxed text-xs">
              {isDataLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <RefreshCw className="h-7 w-7 animate-spin text-emerald-400" />
                  <p className="text-[11px] text-zinc-400">Loading {activeTab === 'fundamentals' ? 'live financial data' : 'AI analysis'}...</p>
                </div>
              ) : dataError ? (
                <div className="py-6 rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 flex gap-3 text-xs text-rose-300">
                  <ShieldAlert className="h-5 w-5 text-rose-450 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Research connection stalled</p>
                    <p className="text-rose-400/80">{dataError}</p>
                  </div>
                </div>
              ) : activeTab === 'fundamentals' && fundamentalsData ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white border-b border-zinc-900 pb-2">Key Financial Metrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Trailing P/E</p>
                      <p className="text-sm font-mono text-zinc-100">{fundamentalsData.defaultKeyStatistics?.trailingPE?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Forward P/E</p>
                      <p className="text-sm font-mono text-zinc-100">{fundamentalsData.defaultKeyStatistics?.forwardPE?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Total Cash</p>
                      <p className="text-sm font-mono text-emerald-400">{fundamentalsData.financialData?.totalCash ? formatCurrency(fundamentalsData.financialData.totalCash, asset.type) : 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Total Debt</p>
                      <p className="text-sm font-mono text-rose-400">{fundamentalsData.financialData?.totalDebt ? formatCurrency(fundamentalsData.financialData.totalDebt, asset.type) : 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Total Revenue</p>
                      <p className="text-sm font-mono text-zinc-100">{fundamentalsData.financialData?.totalRevenue ? formatCurrency(fundamentalsData.financialData.totalRevenue, asset.type) : 'N/A'}</p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Profit Margins</p>
                      <p className="text-sm font-mono text-emerald-400">
                        {fundamentalsData.financialData?.profitMargins ? `${(fundamentalsData.financialData.profitMargins * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Gross Margins</p>
                      <p className="text-sm font-mono text-emerald-400">
                        {fundamentalsData.financialData?.grossMargins ? `${(fundamentalsData.financialData.grossMargins * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Return on Equity</p>
                      <p className="text-sm font-mono text-teal-400">
                        {fundamentalsData.financialData?.returnOnEquity ? `${(fundamentalsData.financialData.returnOnEquity * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-4 bg-zinc-900/20">
                     <h5 className="text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-wide">Analyst Consensus</h5>
                     <div className="flex justify-between items-center text-sm font-mono">
                        <span className="text-zinc-300">Recommendation: <span className="font-bold text-indigo-400 uppercase">{fundamentalsData.financialData?.recommendationKey || 'N/A'}</span></span>
                        <span className="text-zinc-500">Target Mean: <span className="text-zinc-100">{fundamentalsData.financialData?.targetMeanPrice ? formatCurrency(fundamentalsData.financialData.targetMeanPrice, asset.type) : 'N/A'}</span></span>
                     </div>
                  </div>

                  {/* Asset Profile Details */}
                  {fundamentalsData.assetProfile && (
                    <div className="mt-4 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-4 bg-zinc-900/20">
                       <h5 className="text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-wide">Company Profile & History</h5>
                       <div className="space-y-3 text-sm">
                          <p className="text-zinc-300 leading-relaxed font-serif tracking-tight text-[13px] opacity-90"><span className="text-zinc-500 text-xs font-mono mb-1 block uppercase">Business Summary</span>{fundamentalsData.assetProfile.longBusinessSummary || 'N/A'}</p>
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                             <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Industry</span>
                                <span className="text-zinc-200">{fundamentalsData.assetProfile.industry || 'N/A'}</span>
                             </div>
                             <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Sector</span>
                                <span className="text-zinc-200">{fundamentalsData.assetProfile.sector || 'N/A'}</span>
                             </div>
                             <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Employees</span>
                                <span className="text-zinc-200">{fundamentalsData.assetProfile.fullTimeEmployees?.toLocaleString() || 'N/A'}</span>
                             </div>
                             <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Website</span>
                                <a href={fundamentalsData.assetProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{fundamentalsData.assetProfile.website ? new URL(fundamentalsData.assetProfile.website).hostname : 'N/A'}</a>
                             </div>
                          </div>
                          
                          {fundamentalsData.assetProfile.companyOfficers && fundamentalsData.assetProfile.companyOfficers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                               <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-2">Key Executives</span>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {fundamentalsData.assetProfile.companyOfficers.slice(0, 4).map((officer: any, i: number) => (
                                     <div key={i} className="flex flex-col">
                                        <span className="text-zinc-300 font-semibold">{officer.name}</span>
                                        <span className="text-zinc-500">{officer.title}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                  )}

                  {/* 4-Quarter Balance Sheets Component */}
                  {fundamentalsData.fundamentalsTimeSeries && fundamentalsData.fundamentalsTimeSeries.length > 0 && (
                    <div className="mt-4 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-4 bg-zinc-900/20 overflow-x-auto scrollbar-hide">
                       <h5 className="text-[11px] font-bold text-zinc-400 mb-4 uppercase tracking-wide">Balance Sheet History (Latest 4 Periods)</h5>
                       <table className="w-full text-left text-xs whitespace-nowrap min-w-[500px]">
                          <thead>
                             <tr className="border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-500 uppercase tracking-wider text-[10px]">
                                <th className="pb-2 font-medium">Metric</th>
                                {fundamentalsData.fundamentalsTimeSeries.slice(0, 4).map((stmt: any, i: number) => {
                                   const dateObj = new Date(stmt.endDate);
                                   const quarter = Math.floor((dateObj.getMonth() + 3) / 3);
                                   return (
                                     <th key={i} className="pb-2 font-medium text-right px-2">
                                        Q{quarter} '{dateObj.getFullYear().toString().slice(-2)}
                                     </th>
                                   );
                                })}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/30">
                             <tr>
                                <td className="py-2 text-zinc-400">Total Assets</td>
                                {fundamentalsData.fundamentalsTimeSeries.slice(0, 4).map((stmt: any, i: number) => (
                                   <td key={i} className="py-2 text-right font-mono text-zinc-300 px-2">{stmt.totalAssets ? formatCurrency(stmt.totalAssets, asset.type) : 'N/A'}</td>
                                ))}
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-400">Total Liabilities</td>
                                {fundamentalsData.fundamentalsTimeSeries.slice(0, 4).map((stmt: any, i: number) => (
                                   <td key={i} className="py-2 text-right font-mono text-zinc-300 px-2">{stmt.totalLiab ? formatCurrency(stmt.totalLiab, asset.type) : 'N/A'}</td>
                                ))}
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-400">Total Equity</td>
                                {fundamentalsData.fundamentalsTimeSeries.slice(0, 4).map((stmt: any, i: number) => (
                                   <td key={i} className="py-2 text-right font-mono text-zinc-300 px-2">{stmt.totalStockholderEquity ? formatCurrency(stmt.totalStockholderEquity, asset.type) : 'N/A'}</td>
                                ))}
                             </tr>
                             <tr>
                                <td className="py-2 text-zinc-400">Cash & Equivalents</td>
                                {fundamentalsData.fundamentalsTimeSeries.slice(0, 4).map((stmt: any, i: number) => (
                                   <td key={i} className="py-2 text-right font-mono text-zinc-300 px-2">{stmt.cash ? formatCurrency(stmt.cash, asset.type) : 'N/A'}</td>
                                ))}
                             </tr>
                          </tbody>
                       </table>
                    </div>
                  )}
                </div>
              ) : activeTab !== 'fundamentals' && aiInsights[activeTab as AiTabType] ? (
                <div id="ai-content-box" className="space-y-4 markdown-body prose prose-invert prose-sm max-w-none prose-headings:text-white prose-h4:text-xs prose-h4:mt-4 prose-h4:border-b prose-h4:border-zinc-900 prose-h4:pb-1 prose-h5:text-[11px] prose-h5:text-zinc-200 prose-h5:mt-2 prose-li:ml-4 prose-li:list-disc prose-li:mt-1 prose-p:mt-1">
                  <Markdown>{aiInsights[activeTab as AiTabType] || ''}</Markdown>
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-10">No research reports indexed for this range.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side Column: Trade Terminal Executer */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Trading Console</h3>
            </div>

            {/* Trading Position details */}
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 p-3 flex justify-between items-center text-xs text-zinc-400">
              <div>
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Current holdings</p>
                <p className="text-sm font-bold text-white mt-0.5">{unitsHeld.toLocaleString()} units</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Available cash</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(virtualBalance)}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteTrade} className="space-y-4">
              
              {/* Buy/Sell Selector tags */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-900 bg-zinc-900/20 p-1">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`rounded py-2 text-xs font-bold transition-all ${
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
                  className={`rounded py-2 text-xs font-bold transition-all ${
                    tradeType === 'SELL'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Input shares quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Shares / Quantity</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-zinc-805 bg-zinc-900 px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              {/* Price detail projection */}
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Standard Price per unit</span>
                  <span className="font-mono text-zinc-250">{formatCurrency(asset.price, asset.type)}</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Est. total value</span>
                  <span className="text-xl font-extrabold font-mono text-white">{formatCurrency(estimatedTotal)}</span>
                </div>
              </div>

              {/* Exec button */}
              <button
                type="submit"
                id="btn-execute-trade"
                className={`w-full py-3 rounded-xl border font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 hover:bg-emerald-400'
                    : 'bg-rose-500 text-white border-rose-400 hover:bg-rose-400'
                }`}
              >
                SUBMIT {tradeType} SIMULATION
              </button>
            </form>

            {/* Validation indicators */}
            {tradeMessage && (
              <div className={`p-4.5 rounded-xl border flex gap-3 text-xs ${
                tradeMessage.type === 'success'
                   ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
                   : 'border-rose-500/10 bg-rose-500/5 text-rose-400'
              }`}>
                {tradeMessage.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{tradeMessage.type === 'success' ? 'Transaction Confirmed' : 'Safety Check Triggered'}</p>
                  <p className="text-[11px] leading-relaxed opacity-90">{tradeMessage.text}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 backdrop-blur-lg p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">Hedge Suggestions</h3>
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-400">Generate a 3-asset paper trading hedge to offset the risk of a severe downturn in {asset.name}.</p>
            
            <button
              onClick={generateHedge}
              disabled={isGeneratingHedge}
              className="w-full py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeneratingHedge ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              {isGeneratingHedge ? 'Analyzing Risk...' : 'Generate Hedge'}
            </button>

            {hedgeSuggestions && (
              <div className="space-y-3 pt-2">
                {hedgeSuggestions.map((hedge, idx) => (
                  <div key={idx} className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-white">{hedge.name}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">{hedge.symbol}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{hedge.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* TradingView Chat System */}
      <div className="pt-2">
        <TradingChat 
          activeAsset={asset}
          currencyMode={currencyMode}
          formatCurrency={formatCurrencyProp}
        />
      </div>

    </motion.div>
  );
}
