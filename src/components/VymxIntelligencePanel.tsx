import React, { useState, useEffect } from "react";
import {
  Network,
  Coins,
  Activity,
  BarChart3,
  ShieldAlert,
  Ship,
  Layers,
  Target,
  Zap,
  Rewind,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  BrainCircuit,
  Radar,
  Eye,
  BarChart,
  LineChart,
  PieChart,
  X
} from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  mode: string;
}

export default function VymxIntelligencePanel({ mode }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [deepDiveTile, setDeepDiveTile] = useState<string | null>(null);
  const [quoteFeedStatus, setQuoteFeedStatus] = useState<'connecting' | 'connected' | 'unavailable'>('connecting');

  // Real-time data streams
  const [realtimeData, setRealtimeData] = useState<any>({
    fearGreed: null,
    btcHigh: null,
    btcLow: null,
    btcPrice: null,
    vixPrice: null,
    vixChange: null,
    spxPrice: null,
    spxChange: null,
    niftyPrice: null,
    niftyChange: null,
    sensexPrice: null,
    sensexChange: null,
    orderImbalance: null,
    smartMoney: null,
    darkPool: null,
    algoRisk: null,
    capitalInflows: null,
    capitalOutflows: null,
    sectors: {},
    commodities: {},
    currencies: {},
    bonds: {}
  });

  // Fetch real data from our new pipeline
  useEffect(() => {
    let isActive = true;
    const fetchLiveIntelligence = async () => {
      try {
        const res = await fetch('/api/ai/vymx-intelligence');
        if (res.ok) {
          const json = await res.json();
          if (json.success && isActive) {
            setRealtimeData((previous: any) => ({ ...previous, ...json.data }));
            setQuoteFeedStatus('connected');
          } else if (isActive) {
            setQuoteFeedStatus('unavailable');
          }
        } else if (isActive) {
          setQuoteFeedStatus('unavailable');
        }
      } catch (e) {
        setQuoteFeedStatus('unavailable');
        console.warn('Vymx Intelligence fetch failed', e);
      }
    };

    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 30_000); // Match the upstream quote refresh cadence
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);



  const toggleAdvanced = async () => {
    if (showAdvanced) {
      setShowAdvanced(false);
      setAiData(null);
      setAiError(null);
      return;
    }

    setShowAdvanced(true);
    setLoadingAI(true);
    setAiData(null);
    setAiError(null);
    const quoteContext = {
      provider: 'Yahoo Finance',
      S_P_500: { price: realtimeData?.spxPrice ?? null, changePercent: realtimeData?.spxChange ?? null },
      NIFTY_50: { price: realtimeData?.niftyPrice ?? null, changePercent: realtimeData?.niftyChange ?? null },
      SENSEX: { price: realtimeData?.sensexPrice ?? null, changePercent: realtimeData?.sensexChange ?? null },
      Bitcoin: { price: realtimeData?.btcPrice ?? null, dayHigh: realtimeData?.btcHigh ?? null, dayLow: realtimeData?.btcLow ?? null },
      VIX: { price: realtimeData?.vixPrice ?? null, changePercent: realtimeData?.vixChange ?? null }
    };

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Analyze this market snapshot for an educational research dashboard. Separate observed quote data from interpretation, state which important datasets are missing, do not infer institutional flows, order-book depth, dark-pool activity, sentiment scores, or future returns, and do not give a trade instruction.',
          contextData: quoteContext,
          systemInstruction: 'You are a cautious financial research assistant. Use only supplied observations. Explicitly state uncertainty and missing data.'
        }),
        signal: AbortSignal.timeout(25_000)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `AI analysis unavailable (HTTP ${response.status})`);
      }
      setAiData({ summary: payload.answer || payload.text || payload.reply || '' });
    } catch (error: any) {
      setAiError(error?.message || 'AI analysis is currently unavailable.');
    } finally {
      setLoadingAI(false);
    }
  };

  const renderAdvancedInsights = () => (
    <AnimatePresence>
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 border-t border-indigo-500/30 pt-4 relative overflow-hidden"
        >
          {loadingAI ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
              <span className="text-xs font-mono text-indigo-300 animate-pulse uppercase tracking-widest">Analyzing verified quote snapshot...</span>
            </div>
          ) : aiData?.summary ? (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-indigo-300">
                <BrainCircuit className="h-3.5 w-3.5" /> AI-generated research commentary
              </div>
              {aiData.summary}
              <p className="mt-3 border-t border-zinc-800 pt-2 text-[9px] text-zinc-500">Generated commentary, not a verified market signal or investment recommendation.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200">
              {aiError || 'AI analysis is unavailable. Configure a server-side Gemini API key to enable this feature.'}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const advancedBtn = (
    <button onClick={toggleAdvanced} className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
      {showAdvanced ? <Eye className="w-4 h-4" /> : <Radar className="w-4 h-4 animate-pulse" />}
      {showAdvanced ? "Hide Advanced Insights" : "Trigger Deep-Dive AI Insights"}
    </button>
  );

  if (deepDiveTile) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">{deepDiveTile} Deep-Dive</span>
          </div>
          <button onClick={() => setDeepDiveTile(null)} className="text-zinc-400 hover:text-white p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative z-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-zinc-300">
          This analysis module is not connected to a validated historical, order-book, sentiment, or institutional-flow dataset yet. VYMX will not display synthetic correlations, predictive probabilities, or fabricated transaction signals as research output.
        </div>
      </div>
    );
  }

  const formatChange = (val: number | null | undefined) => {
    if (val == null || !Number.isFinite(val)) return '—';
    const sign = val >= 0 ? '+' : '';
    return sign + val.toFixed(2) + '%';
  };
  const colorChange = (val: number | null | undefined) => val == null ? 'text-zinc-500' : (val >= 0 ? 'text-emerald-400' : 'text-rose-400');

  if (mode === "default") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 opacity-50"></div>
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 tracking-wider uppercase shadow-sm">
              VYMX INTELLIGENCE
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${quoteFeedStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>{quoteFeedStatus === 'connected' ? 'QUOTE FEED CONNECTED' : quoteFeedStatus === 'connecting' ? 'CONNECTING' : 'QUOTE FEED UNAVAILABLE'}</span>
          </div>
        </div>

        <div className="relative z-10 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[9px] leading-relaxed text-amber-200/80">
          Index, crypto, VIX, sector ETF, commodity, FX and US 10Y quotes are fetched from Yahoo Finance. Sentiment, regional-flow, order-book, dark-pool and institutional-flow datasets are not connected and are shown as unavailable.
        </div>

        {/* --- PROVIDER-QUOTED MARKET SNAPSHOT --- */}
        <div className="grid grid-cols-2 gap-2 mb-6 relative z-10">
          <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col shadow-inner">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">NIFTY 50</span>
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-black text-white font-mono">
                  {realtimeData?.niftyPrice == null ? '—' : realtimeData.niftyPrice.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold font-mono ${colorChange(realtimeData?.niftyChange)}`}>
                  {formatChange(realtimeData?.niftyChange)}
                </span>
             </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col shadow-inner">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">SENSEX</span>
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-black text-white font-mono">
                  {realtimeData?.sensexPrice == null ? '—' : realtimeData.sensexPrice.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold font-mono ${colorChange(realtimeData?.sensexChange)}`}>
                  {formatChange(realtimeData?.sensexChange)}
                </span>
             </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col shadow-inner">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">S&P 500</span>
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-black text-white font-mono">
                  {realtimeData?.spxPrice == null ? '—' : realtimeData.spxPrice.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold font-mono ${colorChange(realtimeData?.spxChange)}`}>
                  {formatChange(realtimeData?.spxChange)}
                </span>
             </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col shadow-inner">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">BTC / VIX</span>
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-black text-white font-mono">
                  {realtimeData?.btcPrice == null ? '—' : realtimeData.btcPrice.toFixed(0)}
                </span>
                <span className="text-[11px] font-black font-mono text-indigo-400">
                  {realtimeData?.vixPrice == null ? '—' : realtimeData.vixPrice.toFixed(2)}
                </span>
             </div>
          </div>
        </div>

        <div className="space-y-5 relative z-10 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-2 cursor-pointer hover:bg-zinc-800/30 p-2 -m-2 rounded transition-colors" onClick={() => setDeepDiveTile("Global Fear/Greed Index")}>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1">
                Fear / Greed Index (provider not connected) <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </span>
              <span className="text-2xl font-bold text-emerald-400 leading-none">
                {realtimeData.fearGreed == null ? 'N/A' : realtimeData.fearGreed}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${realtimeData.fearGreed == null ? 0 : 100 - realtimeData.fearGreed - 13}%` }}
              ></div>
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${realtimeData.fearGreed == null ? 0 : 13}%` }}
              ></div>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${realtimeData.fearGreed == null ? 0 : realtimeData.fearGreed}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
              <span>Extreme Fear</span>
              <span>Extreme Greed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile("Top Bullish Region")}>
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider">
                Top Bullish Region
              </span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> Not available
              </span>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile("Top Bearish Region")}>
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider">
                Top Bearish Region
              </span>
              <span className="text-sm font-bold text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" /> Not available
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile("Market Volatility Pulse")}>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-3 mb-3">
              Market Volatility Pulse
            </span>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">BTC 24H High</span>
                <span className="text-emerald-400 font-mono font-bold">
                  ${realtimeData.btcHigh == null ? '—' : realtimeData.btcHigh.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">BTC 24H Low</span>
                <span className="text-rose-400 font-mono font-bold">
                  {realtimeData?.btcLow == null ? '—' : '$' + realtimeData.btcLow.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
                <span className="text-zinc-300 font-medium">Order Book Imbalance</span>
                <span className="text-amber-400 font-mono font-bold">{realtimeData.orderImbalance == null ? 'Not connected' : `${realtimeData.orderImbalance}% BIDS`}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 pt-2">
                <span className="text-zinc-300 font-medium">Smart Money Flow Index</span>
                <span className="text-emerald-400 font-mono font-bold">{realtimeData.smartMoney == null ? 'Not connected' : realtimeData.smartMoney.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 pt-2">
                <span className="text-zinc-300 font-medium">Dark Pool Activity</span>
                <span className="text-purple-400 font-mono font-bold">{realtimeData.darkPool == null ? 'Not connected' : `Elevated (${realtimeData.darkPool}%)`}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-zinc-300 font-medium">Algorithmic Risk Premium</span>
                <span className="text-rose-400 font-mono font-bold">{realtimeData.algoRisk == null ? 'Not connected' : `-${realtimeData.algoRisk.toFixed(2)}%`}</span>
              </div>
            </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "capitalFlows") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-blue-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-widest uppercase">
            Capital Flows — provider not connected
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">US Inflows (SPX)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{realtimeData?.capitalInflows?.us == null ? 'Not connected' : `+$${realtimeData.capitalInflows.us.toFixed(1)}B`}</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">EU Outflows (EUR)</span>
                <span className="text-lg font-bold text-rose-400 font-mono">{realtimeData?.capitalOutflows?.eu == null ? 'Not connected' : `-$${Math.abs(realtimeData.capitalOutflows.eu).toFixed(1)}B`}</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Asia Inflows (NIFTY)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{realtimeData?.capitalInflows?.in == null ? 'Not connected' : `+$${realtimeData.capitalInflows.in.toFixed(1)}B`}</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Dark Pool Liq</span>
                <span className="text-lg font-bold text-purple-400 font-mono">{realtimeData?.darkPool == null ? 'Not connected' : `$${realtimeData.darkPool.toFixed(0)}B`}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "sectorRotation") {
    const s = realtimeData?.sectors || {};
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-purple-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Layers className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-widest uppercase">
            Sector ETF Momentum (provider quotes)
          </span>
        </div>
        <div className="space-y-2 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {Object.entries({
            'Technology (XLK)': s.tech,
            'Financials (XLF)': s.financial,
            'Healthcare (XLV)': s.healthcare,
            'Energy (XLE)': s.energy,
            'Cons Discretionary (XLY)': s.consumerDiscretionary
          }).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
              <span className="text-xs font-bold text-zinc-300">{name}</span>
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold text-white">{(data as any)?.price == null ? '—' : '$' + (data as any).price.toFixed(2)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(data as any)?.change == null ? '—' : `${(data as any).change >= 0 ? '+' : ''}${(data as any).change.toFixed(2)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "geoRisk") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-rose-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-red-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400 tracking-widest uppercase">
            Volatility & Commodity Proxies
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">VIX Volatility Index</span>
             <div className="flex justify-between items-end">
               <span className="text-2xl font-bold text-rose-400 font-mono">{realtimeData?.vixPrice == null ? '—' : realtimeData.vixPrice.toFixed(2)}</span>
               <span className={`text-sm font-mono font-bold ${(realtimeData?.vixChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {realtimeData?.vixChange == null ? '—' : `${realtimeData.vixChange >= 0 ? '+' : ''}${realtimeData.vixChange.toFixed(2)}%`}
                </span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Crude Oil Shock Risk</span>
             <div className="flex justify-between items-end">
               <span className="text-lg font-bold text-amber-400 font-mono">{realtimeData?.commodities?.crudeOil?.price == null ? '—' : '$' + realtimeData.commodities.crudeOil.price.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "supplyChain") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-teal-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Ship className="w-5 h-5 text-teal-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 tracking-widest uppercase">
            Sector ETF Proxies — not supply-chain telemetry
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Industrial Materials (XLB)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">{realtimeData?.sectors?.materials?.price == null ? '—' : '$' + realtimeData.sectors.materials.price.toFixed(2)}</span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Logistics & Industrials (XLI)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">{realtimeData?.sectors?.industrials?.price == null ? '—' : '$' + realtimeData.sectors.industrials.price.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "earningsSeason") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 tracking-widest uppercase">
            Market Volatility Proxies
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Implied Market Volatility (VIX)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-indigo-400 font-mono">{realtimeData?.vixPrice == null ? '—' : realtimeData.vixPrice.toFixed(2)}</span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Tech Sector Value (XLK)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">{realtimeData?.sectors?.tech?.price == null ? '—' : '$' + realtimeData.sectors.tech.price.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "commodities") {
    const c = realtimeData?.commodities || {};
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-amber-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Database className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 tracking-widest uppercase">
            Commodity Futures Quotes
          </span>
        </div>
        <div className="space-y-2 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {Object.entries({
            'Gold (GC=F)': c.gold,
            'WTI Crude (CL=F)': c.crudeOil,
            'Brent (BZ=F)': c.brentOil,
            'Silver (SI=F)': c.silver,
            'Copper (HG=F)': c.copper,
            'Nat Gas (NG=F)': c.naturalGas
          }).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
              <span className="text-xs font-bold text-zinc-300">{name}</span>
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold text-white">{(data as any)?.price == null ? '—' : '$' + (data as any).price.toFixed(2)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(data as any)?.change == null ? '—' : `${(data as any).change >= 0 ? '+' : ''}${(data as any).change.toFixed(2)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "currencySwap") {
    const c = realtimeData?.currencies || {};
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-emerald-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Coins className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-widest uppercase">
            FX Cross Quotes
          </span>
        </div>
        <div className="space-y-2 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {Object.entries({
            'EUR/USD': c.eurUsd,
            'USD/JPY': c.usdJpy,
            'GBP/USD': c.gbpUsd,
            'USD/INR': c.usdInr,
            'AUD/USD': c.audUsd,
            'USD/CAD': c.usdCad
          }).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
              <span className="text-xs font-bold text-zinc-300">{name}</span>
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold text-white">{(data as any)?.price == null ? '—' : (data as any).price.toFixed(4)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(data as any)?.change == null ? '—' : `${(data as any).change >= 0 ? '+' : ''}${(data as any).change.toFixed(2)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "holdings") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-widest uppercase">
            US Treasury Yield Proxies
          </span>
        </div>
        <div className="space-y-2 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {Object.entries({
            'US 10Y Yield': realtimeData?.bonds?.us10y,
            'US 2Y Yield': realtimeData?.bonds?.us2y,
            'US 30Y Yield': realtimeData?.bonds?.us30y,
          }).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
              <span className="text-xs font-bold text-zinc-300">{name}</span>
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold text-white">{(data as any)?.price == null ? '—' : (data as any).price.toFixed(3) + '%'}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(data as any)?.change == null ? '—' : `${(data as any).change >= 0 ? '+' : ''}${(data as any).change.toFixed(2)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "correlationWeb") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-rose-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-red-500/10 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Network className="w-5 h-5 text-rose-400" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400 tracking-widest uppercase">
            Live Market Dynamics
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner text-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">SPX / VIX Divergence</span>
                <span className="text-lg font-bold text-rose-400 font-mono">Not computed</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner text-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">S&P 500 Daily</span>
                <span className={`text-lg font-bold ${(realtimeData?.spxChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
                  {(realtimeData?.spxChange || 0) >= 0 ? '+' : ''}{(realtimeData?.spxChange || 0).toFixed(2)}%
                </span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "timeMachine" || mode === "dominoQuiz") {
    return null; // Handled directly in MarketGlobe3D with center-bottom overlays
  }

  // Generic fallback for other modes
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-indigo-400" />
        <span className="text-sm font-bold text-white uppercase tracking-widest">
          {mode.replace(/([A-Z])/g, " $1").trim()} Analysis
        </span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
        This analysis view does not yet have a verified data adapter. Connect a suitable provider before treating any output as live telemetry.
      </p>
      {renderAdvancedInsights()}
      {advancedBtn}
    </div>
  );
}

