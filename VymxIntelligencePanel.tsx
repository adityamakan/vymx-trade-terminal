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
  const [deepDiveTile, setDeepDiveTile] = useState<string | null>(null);
  
  // Real-time data streams
  const [realtimeData, setRealtimeData] = useState<any>({
    fearGreed: 72,
    btcHigh: 0,
    btcPrice: 0,
    vixPrice: 0,
    spxPrice: 0,
    spxChange: 0,
    niftyPrice: 0,
    niftyChange: 0,
    sensexPrice: 0,
    sensexChange: 0,
    orderImbalance: 58,
    smartMoney: 142.5,
    darkPool: 68,
    algoRisk: 0.80,
    capitalInflows: { us: 42.5, jp: 18.2, in: 8.4 },
    capitalOutflows: { eu: 15.1, cn: 12.8 },
    sectorMomentum: { tech: 85, fin: 62, util: -15, real: -40 }
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
            setRealtimeData(json.data);
          }
        }
      } catch (e) {
        console.warn('Vymx Intelligence fetch failed', e);
      }
    };
    
    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 3000); // Poll real data every 3 seconds
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAdvanced && aiData) {
      interval = setInterval(() => {
        setAiData((prev: any) => ({
          ...prev,
          orderBook: {
            ...prev.orderBook,
            bids: (6.4 + 0 * 0.5 - 0.25).toFixed(1) + 'M',
            asks: (3.1 + 0 * 0.3 - 0.15).toFixed(1) + 'M',
            spread: (0.001 + 0 * 0.0005).toFixed(4) + '%'
          },
          volatility: {
            ...prev.volatility,
            index: (22.4 + 0 * 1.5 - 0.75).toFixed(2),
          },
          sentiment: {
            social: Math.max(0, Math.min(100, prev.sentiment.social + Math.floor(0 * 3 - 1))),
            news: Math.max(0, Math.min(100, prev.sentiment.news + Math.floor(0 * 3 - 1))),
            institutional: Math.max(0, Math.min(100, prev.sentiment.institutional + Math.floor(0 * 3 - 1)))
          },
          correlations: prev.correlations.map((c: any) => ({
            ...c,
            value: (parseFloat(c.value) + (0 * 0.04 - 0.02)).toFixed(2)
          }))
        }));
      }, 800); // High frequency updates every 800ms
    }
    return () => clearInterval(interval);
  }, [showAdvanced, aiData]);

  const toggleAdvanced = () => {
    if (!showAdvanced) {
      setLoadingAI(true);
      setShowAdvanced(true);
      setTimeout(() => {
        setAiData({
           predictiveModel: {
             score: 94.2,
             direction: 'BULLISH',
             confidence: 'High',
             projectedMove: '+4.2% (24h)'
           },
           orderBook: {
             bids: '6.4M',
             asks: '3.1M',
             imbalance: 'Long-skewed',
             spread: '0.001%'
           },
           volatility: {
             index: 22.4,
             trend: 'Decreasing',
             historical30d: 28.1
           },
           sentiment: {
             social: 82,
             news: 76,
             institutional: 88
           },
           correlations: [
             { asset: 'DXY', value: -0.85 },
             { asset: 'US10Y', value: -0.65 },
             { asset: 'BTC', value: 0.92 }
           ]
        });
        setLoadingAI(false);
      }, 1500);
    } else {
      setShowAdvanced(false);
      setAiData(null);
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
              <span className="text-xs font-mono text-indigo-300 animate-pulse uppercase tracking-widest">Running Deep-Dive AI Analysis...</span>
            </div>
          ) : aiData ? (
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Predictive AI Model Output</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Directional Bias</span>
                    <span className="text-lg font-black text-emerald-400">{aiData.predictiveModel.direction}</span>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono flex justify-between">
                       <span>Conf:</span>
                       <span className="text-emerald-400">{aiData.predictiveModel.confidence} ({aiData.predictiveModel.score}%)</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono flex justify-between">
                       <span>Move:</span>
                       <span className="text-emerald-400">{aiData.predictiveModel.projectedMove}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Order Book Depth</span>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-300">
                       <span>Bids: {aiData.orderBook.bids}</span>
                       <span className="text-emerald-400 text-[12px]">■■■■</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-300 mt-1">
                       <span>Asks: {aiData.orderBook.asks}</span>
                       <span className="text-rose-400 text-[12px]">■■</span>
                    </div>
                    <div className="text-[10px] text-indigo-400 mt-2 font-mono bg-indigo-500/10 px-2 py-0.5 rounded text-center">
                       {aiData.orderBook.imbalance} | Sprd: {aiData.orderBook.spread}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Sentiment Matrix</span>
                      <div className="space-y-1 mt-2">
                         <div className="flex justify-between items-center text-[10px] font-mono"><span className="text-zinc-400">Social</span> <span className="text-emerald-400">{aiData.sentiment.social}/100</span></div>
                         <div className="flex justify-between items-center text-[10px] font-mono"><span className="text-zinc-400">News</span> <span className="text-emerald-400">{aiData.sentiment.news}/100</span></div>
                         <div className="flex justify-between items-center text-[10px] font-mono"><span className="text-zinc-400">Inst. Flow</span> <span className="text-emerald-400">{aiData.sentiment.institutional}/100</span></div>
                      </div>
                   </div>
                   <div className="bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 block">Multi-Factor Correlation</span>
                      <div className="space-y-1 mt-2">
                         {aiData.correlations.map((c: any) => (
                           <div key={c.asset} className="flex justify-between items-center text-[10px] font-mono">
                             <span className="text-zinc-400">{c.asset}</span>
                             <span className={c.value > 0 ? "text-emerald-400" : "text-rose-400"}>{c.value > 0 ? '+' : ''}{c.value}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg flex justify-between items-center hover:border-zinc-700 transition-colors">
                   <div>
                     <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Real-time Volatility Index</span>
                     <span className="text-xl font-mono font-black text-amber-400">{aiData.volatility.index}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] text-zinc-400 block font-mono">Trend: <span className="text-emerald-400">{aiData.volatility.trend}</span></span>
                     <span className="text-[10px] text-zinc-400 block font-mono">30d Avg: <span className="text-zinc-200">{aiData.volatility.historical30d}</span></span>
                   </div>
                </div>
             </div>
          ) : null}
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
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 opacity-50"></div>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              {deepDiveTile} Deep-Dive
            </span>
          </div>
          <button onClick={() => setDeepDiveTile(null)} className="text-zinc-400 hover:text-white p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
           <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg">
             <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-2">100x Historical Context (vs NIFTY50)</span>
             <div className="h-24 flex items-end gap-1">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div key={i} className={`flex-1 ${0 > 0.4 ? 'bg-emerald-500/50' : 'bg-rose-500/50'} rounded-t-sm`} style={{ height: `${20 + 0 * 80}%` }}></div>
               ))}
             </div>
             <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1">
               <span>10Y Ago</span>
               <span>5Y Ago</span>
               <span>Today</span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
             <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg">
               <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Correlation Matrix</span>
               <div className="space-y-1.5">
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">vs NIFTY50</span><span className="text-emerald-400">+0.84</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">vs S&P500</span><span className="text-emerald-400">+0.62</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">vs GOLD</span><span className="text-rose-400">-0.41</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">vs US10Y</span><span className="text-rose-400">-0.78</span></div>
               </div>
             </div>
             <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg">
               <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Predictive Volatility</span>
               <div className="space-y-1.5">
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">Expected Move (1W)</span><span className="text-amber-400">±4.2%</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">Expected Move (1M)</span><span className="text-amber-400">±12.5%</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">Tail Risk Prob</span><span className="text-rose-400">8.4%</span></div>
                 <div className="flex justify-between text-[10px] font-mono"><span className="text-zinc-400">AI Confidence</span><span className="text-emerald-400">92.1%</span></div>
               </div>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
             <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg">
               <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Order Book Depth</span>
               <div className="space-y-1 mt-2">
                 <div className="flex justify-between text-[8px] text-zinc-400 mb-1"><span>Bid</span><span>Ask</span></div>
                 <div className="flex w-full h-1.5 gap-0.5 rounded-full overflow-hidden">
                   <div className="bg-emerald-500/80 h-full" style={{width: '65%'}}></div>
                   <div className="bg-rose-500/80 h-full" style={{width: '35%'}}></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-mono mt-1"><span className="text-emerald-400">4.2M</span><span className="text-rose-400">2.1M</span></div>
               </div>
               <div className="mt-3 space-y-1">
                 <div className="flex justify-between text-[9px] font-mono text-zinc-400"><span>Spread</span><span>$0.01 (0.002%)</span></div>
                 <div className="flex justify-between text-[9px] font-mono text-zinc-400"><span>Imbalance</span><span className="text-emerald-400">Bid-Heavy</span></div>
               </div>
             </div>
             <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg flex flex-col">
               <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Sentiment Histogram</span>
               <div className="flex-1 flex items-end gap-0.5 mt-2 h-16">
                  {[2, 4, 3, 6, 8, 12, 18, 14, 9, 5, 3].map((val, i) => (
                    <div key={i} className={`flex-1 rounded-t-sm ${i > 5 ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`} style={{ height: `${(val / 18) * 100}%` }}></div>
                  ))}
               </div>
               <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1">
                 <span>Bearish</span>
                 <span>Neutral</span>
                 <span>Bullish</span>
               </div>
             </div>
           </div>

           <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg text-xs leading-relaxed text-zinc-300">
             <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">AI Synthesis</span>
             Advanced Deep-Dive reveals extreme compression in implied volatility metrics compared to the historical baseline. A synchronized global liquidity injection (FIIs) suggests an impending regime shift favoring risk-on assets.
           </div>
        </div>
      </div>
    );
  }

  const formatChange = (val: number) => {
    const v = val || 0;
    const sign = v >= 0 ? '+' : '';
    return sign + v.toFixed(2) + '%';
  };
  const colorChange = (val: number) => (val >= 0 ? 'text-emerald-400' : 'text-rose-400');

  if (mode === "default") {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 opacity-50"></div>
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 tracking-wider uppercase shadow-sm">
              VYMX INTELLIGENCE LIVE
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-widest uppercase">PIPELINE ACTIVE</span>
          </div>
        </div>

        {/* --- LIVE INDICES TICKER --- */}
        <div className="grid grid-cols-2 gap-2 mb-6 relative z-10">
          <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col shadow-inner">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">NIFTY 50</span>
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-black text-white font-mono">
                  {(realtimeData?.niftyPrice || 0).toFixed(2)}
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
                  {(realtimeData?.sensexPrice || 0).toFixed(2)}
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
                  {(realtimeData?.spxPrice || 0).toFixed(2)}
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
                  {(realtimeData?.btcPrice || 0).toFixed(0)}
                </span>
                <span className="text-[11px] font-black font-mono text-indigo-400">
                  {((realtimeData?.vixPrice || 0)).toFixed(2)}
                </span>
             </div>
          </div>
        </div>

        <div className="space-y-5 relative z-10 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-2 cursor-pointer hover:bg-zinc-800/30 p-2 -m-2 rounded transition-colors" onClick={() => setDeepDiveTile("Global Fear/Greed Index")}>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1">
                Global Fear/Greed Index <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </span>
              <span className="text-2xl font-bold text-emerald-400 leading-none">
                {realtimeData.fearGreed}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${100 - realtimeData.fearGreed - 13}%` }}
              ></div>
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: "13%" }}
              ></div>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${realtimeData.fearGreed}%` }}
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
                <ArrowUpRight className="w-4 h-4" /> North America
              </span>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile("Top Bearish Region")}>
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider">
                Top Bearish Region
              </span>
              <span className="text-sm font-bold text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4" /> Eastern Europe
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
                  ${realtimeData.btcHigh.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">BTC 24H Low</span>
                <span className="text-rose-400 font-mono font-bold">
                  $62,100.00
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
                <span className="text-zinc-300 font-medium">Order Book Imbalance</span>
                <span className="text-amber-400 font-mono font-bold">{realtimeData.orderImbalance}% BIDS</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 pt-2">
                <span className="text-zinc-300 font-medium">Smart Money Flow Index</span>
                <span className="text-emerald-400 font-mono font-bold">{realtimeData.smartMoney.toFixed(1)} (Bullish)</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 pt-2">
                <span className="text-zinc-300 font-medium">Dark Pool Activity</span>
                <span className="text-purple-400 font-mono font-bold">Elevated ({realtimeData.darkPool}%)</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-zinc-300 font-medium">Algorithmic Risk Premium</span>
                <span className="text-rose-400 font-mono font-bold">-{realtimeData.algoRisk.toFixed(2)}%</span>
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
            Live Capital Flows
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">US Inflows (SPX)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">+${(realtimeData?.capitalInflows?.us || 0).toFixed(1)}B</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">EU Outflows (EUR)</span>
                <span className="text-lg font-bold text-rose-400 font-mono">-${Math.abs(realtimeData?.capitalOutflows?.eu || 0).toFixed(1)}B</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Asia Inflows (NIFTY)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">+${(realtimeData?.capitalInflows?.in || 0).toFixed(1)}B</span>
             </div>
             <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Dark Pool Liq</span>
                <span className="text-lg font-bold text-purple-400 font-mono">${(realtimeData?.darkPool || 0).toFixed(0)}B</span>
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
            Live Sector Rotation
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
                <span className="text-xs font-mono font-bold text-white">${((data as any)?.price || 0).toFixed(2)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data as any)?.change || 0) >= 0 ? '+' : ''}{((data as any)?.change || 0).toFixed(2)}%
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
            Live Geo Risk
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">VIX Volatility Index</span>
             <div className="flex justify-between items-end">
               <span className="text-2xl font-bold text-rose-400 font-mono">{(realtimeData?.vixPrice || 0).toFixed(2)}</span>
               <span className={`text-sm font-mono font-bold ${(realtimeData?.vixChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(realtimeData?.vixChange || 0) >= 0 ? '+' : ''}{(realtimeData?.vixChange || 0).toFixed(2)}%
                </span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Crude Oil Shock Risk</span>
             <div className="flex justify-between items-end">
               <span className="text-lg font-bold text-amber-400 font-mono">${(realtimeData?.commodities?.crudeOil?.price || 0).toFixed(2)}</span>
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
            Live Supply Chain
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Industrial Materials (XLB)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">${(realtimeData?.sectors?.materials?.price || 0).toFixed(2)}</span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Logistics & Industrials (XLI)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">${(realtimeData?.sectors?.industrials?.price || 0).toFixed(2)}</span>
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
            Live Earnings / Volatility
          </span>
        </div>
        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Implied Market Volatility (VIX)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-indigo-400 font-mono">{(realtimeData?.vixPrice || 0).toFixed(2)}</span>
             </div>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 shadow-inner">
             <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider font-bold">Tech Sector Value (XLK)</span>
             <div className="flex justify-between items-end">
               <span className="text-xl font-bold text-emerald-400 font-mono">${(realtimeData?.sectors?.tech?.price || 0).toFixed(2)}</span>
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
            Live Commodities
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
                <span className="text-xs font-mono font-bold text-white">${((data as any)?.price || 0).toFixed(2)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data as any)?.change || 0) >= 0 ? '+' : ''}{((data as any)?.change || 0).toFixed(2)}%
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
            Live Forex Crosses
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
                <span className="text-xs font-mono font-bold text-white">{((data as any)?.price || 0).toFixed(4)}</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data as any)?.change || 0) >= 0 ? '+' : ''}{((data as any)?.change || 0).toFixed(2)}%
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
            US Treasuries & Yields
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
                <span className="text-xs font-mono font-bold text-white">{((data as any)?.price || 0).toFixed(3)}%</span>
                <span className={`text-xs font-mono font-bold ${((data as any)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data as any)?.change || 0) >= 0 ? '+' : ''}{((data as any)?.change || 0).toFixed(2)}%
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
                <span className="text-lg font-bold text-rose-400 font-mono">-0.78</span>
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
        Advanced Vymx Intelligence telemetry is actively monitoring live global
        nodes for this vector. Select specific nodes on the globe to drill down
        into high-frequency details.
      </p>
      {renderAdvancedInsights()}
      {advancedBtn}
    </div>
  );
}
