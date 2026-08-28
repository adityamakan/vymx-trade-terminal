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
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Capital Flows
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">US Inflows</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">+${realtimeData.capitalInflows.us.toFixed(1)}B</span>
                <span className="text-[9px] text-emerald-500 mt-1 block">Accelerating +4.2%</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">EU Outflows</span>
                <span className="text-lg font-bold text-rose-400 font-mono">-${realtimeData.capitalOutflows.eu.toFixed(1)}B</span>
                <span className="text-[9px] text-rose-500 mt-1 block">Decelerating -1.1%</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Asia Emerging</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">+${realtimeData.capitalInflows.in.toFixed(1)}B</span>
                <span className="text-[9px] text-emerald-500 mt-1 block">Surging +12.4%</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Dark Pool Liq</span>
                <span className="text-lg font-bold text-purple-400 font-mono">$4.2T</span>
                <span className="text-[9px] text-purple-500 mt-1 block">Steady State</span>
             </div>
          </div>
          
          <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-3">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
              Cross-Border Liquidity Heatmap
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400">US Treasuries ↔ JPY Yields</span>
                <div className="flex gap-1"><span className="w-12 h-1.5 bg-emerald-500 rounded-full"></span><span className="w-4 h-1.5 bg-emerald-700 rounded-full"></span></div>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400">Eurodollars ↔ CHF</span>
                <div className="flex gap-1"><span className="w-8 h-1.5 bg-rose-500 rounded-full"></span><span className="w-8 h-1.5 bg-rose-700 rounded-full"></span></div>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400">Emerging Markets ↔ USD</span>
                <div className="flex gap-1"><span className="w-10 h-1.5 bg-amber-500 rounded-full"></span><span className="w-6 h-1.5 bg-amber-700 rounded-full"></span></div>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">M2 Money Velocity</span>
            <span className="text-sm font-mono font-black text-blue-400">1.442x</span>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-3">
             <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
               Sovereign Wealth Funds (Real-time)
             </span>
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-300">Norway GPFG</span>
                 <span className="text-[10px] font-mono text-emerald-400 font-bold">+$1.2B (Tech)</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-300">Saudi PIF</span>
                 <span className="text-[10px] font-mono text-rose-400 font-bold">-$800M (Energy)</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-300">Singapore GIC</span>
                 <span className="text-[10px] font-mono text-emerald-400 font-bold">+$400M (REITs)</span>
               </div>
             </div>
          </div>

          <div className="bg-black/60 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[9px] uppercase text-zinc-500 font-mono tracking-widest block mb-2">Central Bank Balance Sheets</span>
            <div className="grid grid-cols-2 gap-2 text-center">
               <div className="p-2 bg-zinc-900 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                  <span className="text-[8px] text-zinc-500 uppercase block mb-1">Fed Reserve</span>
                  <span className="text-xs font-mono font-bold text-rose-400">-$42.1B (QT)</span>
               </div>
               <div className="p-2 bg-zinc-900 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                  <span className="text-[8px] text-zinc-500 uppercase block mb-1">PBOC (China)</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">+$124.5B (QE)</span>
               </div>
               <div className="p-2 bg-zinc-900 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                  <span className="text-[8px] text-zinc-500 uppercase block mb-1">ECB (Europe)</span>
                  <span className="text-xs font-mono font-bold text-zinc-400">Neutral</span>
               </div>
               <div className="p-2 bg-zinc-900 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                  <span className="text-[8px] text-zinc-500 uppercase block mb-1">BOJ (Japan)</span>
                  <span className="text-xs font-mono font-bold text-rose-400">-$15.2B</span>
               </div>
            </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "sectorRotation") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Activity className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Sector Rotation
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-between">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Macro Phase</span>
                <span className="text-sm font-bold text-purple-400">Late Bull Market</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-between">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Risk Appetite</span>
                <span className="text-sm font-bold text-emerald-400">Risk-On (High)</span>
             </div>
          </div>

          <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-3">
              Sector Momentum & Alpha
            </span>
            {[
              { name: "Technology", momentum: `+${realtimeData.sectorMomentum.tech.toFixed(0)}%`, color: "bg-emerald-500", alpha: "+1.2" },
              { name: "Financials", momentum: `+${realtimeData.sectorMomentum.fin.toFixed(0)}%`, color: "bg-emerald-400", alpha: "+0.8" },
              { name: "Utilities", momentum: `${realtimeData.sectorMomentum.util.toFixed(0)}%`, color: "bg-rose-400", alpha: "-0.5" },
              { name: "Real Estate", momentum: `${realtimeData.sectorMomentum.real.toFixed(0)}%`, color: "bg-rose-500", alpha: "-1.1" },
            ].map((sec) => (
              <div key={sec.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-300 font-medium">{sec.name}</span>
                  <div className="flex gap-3">
                    <span className="text-zinc-500 font-mono">α: {sec.alpha}</span>
                    <span className="text-zinc-400 font-mono font-bold w-10 text-right">{sec.momentum}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sec.color} transition-all duration-300`}
                    style={{ width: Math.max(0, parseInt(sec.momentum)) + "%" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-2">
            <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Institutional vs Retail Positioning</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
               <span className="w-12 text-zinc-400">Inst.</span>
               <div className="flex-1 h-2 bg-emerald-500/20 rounded"><div className="h-full bg-emerald-500 rounded" style={{width: '78%'}}></div></div>
               <span className="text-emerald-400">78%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
               <span className="w-12 text-zinc-400">Retail</span>
               <div className="flex-1 h-2 bg-purple-500/20 rounded"><div className="h-full bg-purple-500 rounded" style={{width: '42%'}}></div></div>
               <span className="text-purple-400">42%</span>
            </div>
          </div>

          {/* Additional 100x Density Sector Breakdown */}
          <div className="bg-black/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-3 rounded-lg">
             <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest block mb-3">Sub-Sector Velocity</span>
             <div className="grid grid-cols-2 gap-x-4 gap-y-3">
               <div>
                 <div className="flex justify-between items-center text-[10px] mb-1">
                   <span className="text-zinc-300">Semiconductors</span>
                   <span className="font-mono text-emerald-400">+14.2%</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full"><div className="w-11/12 h-full bg-emerald-500 rounded-full"></div></div>
               </div>
               <div>
                 <div className="flex justify-between items-center text-[10px] mb-1">
                   <span className="text-zinc-300">Cloud Infra</span>
                   <span className="font-mono text-emerald-400">+8.4%</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full"><div className="w-3/4 h-full bg-emerald-500 rounded-full"></div></div>
               </div>
               <div>
                 <div className="flex justify-between items-center text-[10px] mb-1">
                   <span className="text-zinc-300">Regional Banks</span>
                   <span className="font-mono text-rose-400">-5.2%</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full"><div className="w-1/4 h-full bg-rose-500 rounded-full"></div></div>
               </div>
               <div>
                 <div className="flex justify-between items-center text-[10px] mb-1">
                   <span className="text-zinc-300">Defense Aero</span>
                   <span className="font-mono text-amber-400">+1.2%</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full"><div className="w-1/2 h-full bg-amber-500 rounded-full"></div></div>
               </div>
             </div>
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-xs text-zinc-400 leading-relaxed">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Vymx Sector AI</span>
            Current factor rotation heavily favors large-cap quality growth. Deep value and small-cap segments are experiencing sustained outflows due to liquidity constraints and high debt refinance rates.
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "geoRisk") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-amber-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Geo Risk Dashboard
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-center bg-zinc-950/50 p-4 rounded-lg border border-rose-500/30">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Global Risk Index</span>
              <span className="text-3xl font-black text-amber-400 leading-none">ELEV</span>
              <span className="text-[9px] text-rose-400 mt-1 uppercase">94th Percentile</span>
            </div>
            <div className="flex flex-col justify-center bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-right">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">VIX Eqv / Skew</span>
              <span className="text-2xl font-bold font-mono text-zinc-200 leading-none">22.4</span>
              <span className="text-[9px] text-emerald-400 mt-1 uppercase font-mono">C/P: 0.82</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 rounded-lg p-4 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-2">
              Active Flashpoints & Contagion Risk
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-200 font-medium">Middle East Tensions</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30 tracking-widest">SEVERE (92%)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-200 font-medium">Taiwan Strait</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30 tracking-widest">MODERATE (45%)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-200 font-medium">Eastern Europe</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30 tracking-widest">HIGH (78%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Resource Constraint Monitors</span>
            <div className="flex flex-wrap gap-2">
               <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-2 py-1 rounded font-mono">Oil +4.2% Risk</span>
               <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-1 rounded font-mono">Semis -2.1% Risk</span>
               <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] px-2 py-1 rounded font-mono">Rare Earths Neutral</span>
            </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "supplyChain") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-teal-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Ship className="w-5 h-5 text-teal-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Supply Chain
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="flex justify-between items-end bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Global Freight Index</span>
              <span className="text-3xl font-black text-teal-400 leading-none">2,450</span>
              <span className="text-[9px] text-teal-500 mt-1 uppercase">Baltic Dry / TEU Avg</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold font-mono text-rose-400 block">+12% (MoM)</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Costs Escalating</span>
            </div>
          </div>

          <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-2">
              Chokepoint Congestion & Delay Matrix
            </span>
            {[
              { name: "Panama Canal", load: 85, status: "Restricted", delay: "14 days", trend: "+2d" },
              { name: "Suez Canal", load: 92, status: "Critical", delay: "21 days", trend: "+5d" },
              { name: "Strait of Malacca", load: 45, status: "Normal", delay: "2 days", trend: "Flat" },
            ].map((point) => (
              <div key={point.name} className="flex flex-col gap-1.5 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 last:border-0">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-200 font-medium">{point.name}</span>
                  <div className="flex gap-3">
                    <span className="text-zinc-500 font-mono">Wait: {point.delay} ({point.trend})</span>
                    <span className={`font-bold w-16 text-right ${point.load > 90 ? "text-rose-400" : point.load > 80 ? "text-amber-400" : "text-teal-400"}`}>
                      {point.status}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${point.load > 90 ? "bg-rose-500" : point.load > 80 ? "bg-amber-500" : "bg-teal-500"}`}
                    style={{ width: `${point.load}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Inv-to-Sales</span>
              <span className="text-sm font-mono font-black text-rose-400">1.12 (Low)</span>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Port Backlog</span>
              <span className="text-sm font-mono font-black text-amber-400">Moderate</span>
            </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "earningsSeason") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-indigo-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Earnings Season
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-widest">Beat Rate</span>
              <span className="text-xl font-black text-emerald-400 leading-none">76%</span>
              <span className="text-[9px] text-zinc-400 mt-1 uppercase">Hist Avg: 68%</span>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-widest">Surprise %</span>
              <span className="text-xl font-black text-indigo-400 leading-none">+4.2%</span>
              <span className="text-[9px] text-zinc-400 mt-1 uppercase">Above Est</span>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
              <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-widest">Guidance</span>
              <span className="text-xl font-black text-amber-400 leading-none">Mixed</span>
              <span className="text-[9px] text-zinc-400 mt-1 uppercase">Weak Q4</span>
            </div>
          </div>

          <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-2">
              Upcoming High-Impact & Implied Vol
            </span>
            {[
              { ticker: "NVDA", date: "Tomorrow", time: "AMC", impact: "High", impVol: "±8.4%", sentiment: "Bullish" },
              { ticker: "WMT", date: "Thu", time: "BMO", impact: "High", impVol: "±3.2%", sentiment: "Neutral" },
              { ticker: "CRWD", date: "Fri", time: "AMC", impact: "Medium", impVol: "±6.1%", sentiment: "Bullish" },
            ].map((e) => (
              <div key={e.ticker} className="flex justify-between items-center text-[10px] border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-200 w-8">{e.ticker}</span>
                  <span className="text-zinc-500">{e.date} <span className="text-zinc-600">{e.time}</span></span>
                </div>
                <div className="flex gap-3 text-right">
                   <span className="text-zinc-400 font-mono">IV: {e.impVol}</span>
                   <span className={`font-bold w-12 ${e.impact === "High" ? "text-rose-400" : "text-amber-400"}`}>{e.impact}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">AI Sentiment Analysis (Earnings Calls)</span>
             <div className="flex gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-1 rounded font-mono">"AI Capex" mentions +42%</span>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-2 py-1 rounded font-mono">"Margin Pressure" +18%</span>
             </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "commodities") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-orange-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Layers className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Commodities
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Supercycle Status</span>
                <span className="text-sm font-bold text-orange-400">Active</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Broad Index (BCOM)</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">104.2</span>
             </div>
          </div>

          <div className="space-y-2">
            {[
              { name: "Crude Oil (WTI)", price: "$82.45", trend: "+1.2%", up: true, structure: "Backwardation", oi: "2.4M" },
              { name: "Gold (COMEX)", price: "$2,350.10", trend: "+0.8%", up: true, structure: "Contango", oi: "520K" },
              { name: "Copper", price: "$4.12", trend: "-0.5%", up: false, structure: "Backwardation", oi: "185K" },
              { name: "Uranium", price: "$92.50", trend: "+2.4%", up: true, structure: "Flat", oi: "42K" },
            ].map((c) => (
              <div key={c.name} className="flex flex-col bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-zinc-300">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-zinc-200">{c.price}</span>
                    <span className={`text-[10px] font-mono font-bold w-10 text-right ${c.up ? "text-emerald-400" : "text-rose-400"}`}>{c.trend}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-mono border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pt-2">
                   <span className="text-zinc-500">Curve: <span className={c.structure === 'Backwardation' ? 'text-emerald-400/70' : 'text-zinc-400'}>{c.structure}</span></span>
                   <span className="text-zinc-500">Open Int: <span className="text-orange-400/80">{c.oi}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "currencySwap") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Coins className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Currency Swaps
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Global USD Liq</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">Constrained</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">SOFR-OIS Spread</span>
                <span className="text-xl font-bold text-zinc-200 font-mono">12 bps</span>
             </div>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-3">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
              Central Bank Swap Lines & Balances
            </span>
            <div className="space-y-2">
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-300">USD/EUR (ECB)</span>
                 <div className="flex gap-3 font-mono">
                    <span className="text-zinc-500">Rate: 5.45%</span>
                    <span className="text-cyan-400 font-bold w-12 text-right">$12.4B</span>
                 </div>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-300">USD/JPY (BOJ)</span>
                 <div className="flex gap-3 font-mono">
                    <span className="text-zinc-500">Rate: 5.42%</span>
                    <span className="text-cyan-400 font-bold w-12 text-right">$8.1B</span>
                 </div>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-300">USD/GBP (BOE)</span>
                 <div className="flex gap-3 font-mono">
                    <span className="text-zinc-500">Rate: 5.48%</span>
                    <span className="text-cyan-400 font-bold w-12 text-right">$2.1B</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-2 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">
              FX Volatility Smile / Skew
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                 { pair: "USD/JPY", vol: "High", skew: "Calls Premium" },
                 { pair: "EUR/USD", vol: "Low", skew: "Puts Premium" },
                 { pair: "GBP/USD", vol: "Med", skew: "Neutral" },
                 { pair: "USD/CHF", vol: "High", skew: "Calls Premium" }
              ].map((p) => (
                <div key={p.pair} className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                  <span className="text-[9px] font-mono text-zinc-300 block mb-1">{p.pair}</span>
                  <div className="flex justify-between text-[8px] uppercase">
                     <span className={p.vol === 'High' ? 'text-rose-400' : p.vol === 'Med' ? 'text-amber-400' : 'text-emerald-400'}>Vol: {p.vol}</span>
                     <span className="text-zinc-500">{p.skew}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "holdings") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            My Holdings Map
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Portfolio VaR (95%)</span>
                <span className="text-xl font-bold text-rose-400 font-mono">$42.5K</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Sharpe Ratio</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">1.84</span>
             </div>
          </div>

          <div className="space-y-3 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Geographic Exposure</span>
             </div>
            {[
              { region: "North America", exposure: 65, color: "bg-emerald-500", beta: "1.1" },
              { region: "Europe", exposure: 20, color: "bg-blue-500", beta: "0.8" },
              { region: "Asia Pacific", exposure: 15, color: "bg-indigo-500", beta: "1.4" },
            ].map((reg) => (
              <div key={reg.region} className="flex flex-col gap-1.5 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-200 font-medium">{reg.region}</span>
                  <div className="flex gap-3">
                     <span className="text-zinc-500 font-mono">β: {reg.beta}</span>
                     <span className="font-bold text-zinc-300 font-mono w-8 text-right">{reg.exposure}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${reg.color}`}
                    style={{ width: `${reg.exposure}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 space-y-2">
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">Stress Test Scenarios</span>
             <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-300">SPX -10% Shock</span>
                <span className="text-rose-400 font-mono">-14.2% (Underperform)</span>
             </div>
             <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-300">Rates +50bps Shock</span>
                <span className="text-emerald-400 font-mono">+2.1% (Outperform)</span>
             </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
      </div>
    );
  }

  if (mode === "correlationWeb") {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-pink-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/5 opacity-50"></div>
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <Zap className="w-5 h-5 text-pink-400" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Correlations
          </span>
        </div>

        <div className="space-y-4 relative z-10 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Contagion Risk</span>
                <span className="text-xl font-bold text-amber-400 font-mono">Elevated</span>
             </div>
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">Regime Shifts</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">Stable</span>
             </div>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Advanced Detail')}>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 mb-2">
              Cross-Asset Rolling Correlation Matrix
            </span>
            <div className="space-y-2">
              {[
                { pair: "Equities ↔ USD", val: -0.82, prev: -0.75, type: "Inverse" },
                { pair: "Gold ↔ Real Yields", val: -0.91, prev: -0.88, type: "Inverse" },
                { pair: "Bitcoin ↔ NDX", val: +0.76, prev: +0.82, type: "Positive" },
                { pair: "Oil ↔ Defensives", val: -0.45, prev: -0.21, type: "Diverging" }
              ].map((c) => (
                <div key={c.pair} className="flex justify-between items-center text-[10px] border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2 last:border-0 last:pb-0">
                  <span className="text-zinc-300 font-medium">{c.pair}</span>
                  <div className="flex items-center gap-3">
                     <span className="text-zinc-500 font-mono text-[9px]">{c.type}</span>
                     <span className={`font-mono font-bold w-10 text-right ${c.val > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {c.val > 0 ? '+' : ''}{c.val}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setDeepDiveTile('Detail View')}>
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2 border-b border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pb-2">Principal Component Analysis (PCA)</span>
             <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono"><span className="text-zinc-400">PC1: Global Growth Factor</span><span className="text-zinc-300">42.5% variance</span></div>
                <div className="flex justify-between text-[9px] font-mono"><span className="text-zinc-400">PC2: Inflation Surprise</span><span className="text-zinc-300">28.1% variance</span></div>
                <div className="flex justify-between text-[9px] font-mono"><span className="text-zinc-400">PC3: Liquidity Premium</span><span className="text-zinc-300">14.2% variance</span></div>
             </div>
          </div>
        </div>
        {renderAdvancedInsights()}
        {advancedBtn}
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
