import React, { useState, useMemo } from 'react';
import { 
  Star, 
  ArrowUpRight, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  CircleAlert,
  SlidersHorizontal,
  Binary,
  Bell,
  BellRing,
  X,
  Bot
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { Asset, NewsArticle, PortfolioItem, PriceAlert } from '../types';
import { newsArticles } from '../data';
import SentimentGauge from './SentimentGauge';
import PrecisionMetrics from './PrecisionMetrics';
import { useMarketState } from '../contexts/MarketStateContext';

interface DashboardProps {
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  onSelectAsset: (asset: Asset) => void;
  setView: (view: 'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows') => void;
  portfolio: PortfolioItem[];
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
  isStrictHours: boolean;
  setIsStrictHours: React.Dispatch<React.SetStateAction<boolean>>;
  priceAlerts: PriceAlert[];
  setPriceAlerts: React.Dispatch<React.SetStateAction<PriceAlert[]>>;
}

import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import MarketGlobe3D from './MarketGlobe3D';
import SectorBreakdown from './SectorBreakdown';
import EventShockwave from './EventShockwave';
import MarketAurasWidget from './MarketAurasWidget';
import DashboardNewsWidget from './DashboardNewsWidget';
import MarketTicker from './MarketTicker';
import DataIntegrityWidget from './DataIntegrityWidget';

// Mathematical utility to calculate the Pearson Correlation coefficient (r) between two arrays
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// Elegant custom dark theme tooltip for our scatter visual points
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950/95 p-3 shadow-xl text-[10px] font-mono leading-normal max-w-[210px] space-y-1">
        <p className="text-zinc-500 border-b border-zinc-900 pb-1 mb-1 font-bold">{data.date}</p>
        <p className="text-emerald-400 font-bold flex justify-between gap-4">
          <span>{data.assetXName}:</span>
          <span>{data.xValFormatted}</span>
        </p>
        <p className="text-indigo-400 font-bold flex justify-between gap-4">
          <span>{data.assetYName}:</span>
          <span>{data.yValFormatted}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Platform-independent timezone component parser to avoid localization split bugs
function getPartsInTimezone(timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const day = parts.find(p => p.type === 'weekday')?.value || 'Monday';
    let hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return { day, hour, minute, totalMins: hour * 60 + minute };
  } catch (e) {
    const now = new Date();
    return { 
      day: now.toLocaleDateString('en-US', { weekday: 'long' }), 
      hour: now.getHours(), 
      minute: now.getMinutes(), 
      totalMins: now.getHours() * 60 + now.getMinutes() 
    };
  }
}

export default function Dashboard({
  watchlist,
  toggleWatchlist,
  onSelectAsset,
  setView,
  portfolio,
  assets,
  formatCurrency: formatCurrencyProp,
  isStrictHours,
  setIsStrictHours,
  priceAlerts,
  setPriceAlerts,
}: DashboardProps) {
  const [timeTick, setTimeTick] = useState<number>(0);

  const [activeAlertInput, setActiveAlertInput] = useState<string | null>(null);
  const [alertInputValue, setAlertInputValue] = useState<string>('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

  const handleAddAlert = (symbol: string) => {
    if (!alertInputValue) return;
    const targetPrice = parseFloat(alertInputValue);
    if (isNaN(targetPrice)) return;

    setPriceAlerts(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        symbol,
        targetPrice,
        direction: alertDirection,
        active: true
      }
    ]);
    setActiveAlertInput(null);
    setAlertInputValue('');
  };

  const removeAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  };


  const handleToggleStrictHours = () => {
    const nextVal = !isStrictHours;
    setIsStrictHours(nextVal);
    localStorage.setItem('finova_strict_hours', String(nextVal));
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const kolkataTime = useMemo(() => getPartsInTimezone('Asia/Kolkata'), [timeTick]);
  const nyTime = useMemo(() => getPartsInTimezone('America/New_York'), [timeTick]);

  const isKolkataOpen = useMemo(() => {
    const isWeekend = kolkataTime.day === 'Saturday' || kolkataTime.day === 'Sunday';
    return !isWeekend && (kolkataTime.totalMins >= 555 && kolkataTime.totalMins <= 930);
  }, [kolkataTime]);

  const isNyOpen = useMemo(() => {
    const isWeekend = nyTime.day === 'Saturday' || nyTime.day === 'Sunday';
    return !isWeekend && (nyTime.totalMins >= 570 && nyTime.totalMins <= 960);
  }, [nyTime]);

  const isForexOpen = useMemo(() => {
    const isWeekend = kolkataTime.day === 'Saturday' || kolkataTime.day === 'Sunday';
    return !isWeekend;
  }, [kolkataTime]);

  const formatTimeStr = (hour: number, minute: number) => {
    const hStr = hour.toString().padStart(2, '0');
    const mStr = minute.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  // --- MARKET SENTIMENT CALCULATIONS ---
  const advCount = useMemo(() => assets.filter(a => a.change > 0).length, [assets]);
  const decCount = useMemo(() => assets.filter(a => a.change < 0).length, [assets]);
  const flatCount = useMemo(() => assets.filter(a => a.change === 0).length, [assets]);

  const sentimentScore = useMemo(() => {
    const activeCount = advCount + decCount;
    if (activeCount === 0) return 50;

    const ratioScore = (advCount / activeCount) * 100;
    
    const avgAssetChange = assets
      .reduce((sum, a) => sum + Math.max(-4, Math.min(4, a.change)), 0);
    const avgChg = assets.length > 0 ? (avgAssetChange / assets.length) : 0;
    
    const finalScore = Math.max(5, Math.min(95, ratioScore * 0.7 + (50 + avgChg * 11) * 0.3));
    return Math.round(finalScore);
  }, [assets, advCount, decCount]);

  const sectorStats = useMemo(() => {
    const sectorsMap: { [sec: string]: { sumChange: number; count: number } } = {};
    assets.forEach(a => {
      const sectorName = a.sector || 'Other';
      if (!sectorsMap[sectorName]) {
        sectorsMap[sectorName] = { sumChange: 0, count: 0 };
      }
      sectorsMap[sectorName].sumChange += a.change;
      sectorsMap[sectorName].count += 1;
    });
    
    const list = Object.entries(sectorsMap).map(([name, data]) => ({
      name,
      avgChange: data.sumChange / data.count,
      count: data.count
    }));
    list.sort((a, b) => b.avgChange - a.avgChange);
    return {
      topSector: list[0] || { name: 'N/A', avgChange: 0 },
      bottomSector: list[list.length - 1] || { name: 'N/A', avgChange: 0 },
      list
    };
  }, [assets]);

  const [news, setNews] = useState<NewsArticle[]>(newsArticles);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [showBriefing, setShowBriefing] = useState(true);
  const [aiBriefingContent, setAiBriefingContent] = useState<string | null>(null);

  // Generate basic mock AI briefing
  React.useEffect(() => {
    const adv = assets.filter(a => a.change > 0).length;
    const dec = assets.filter(a => a.change < 0).length;
    const isBull = adv > dec;
    let b = `Good morning. The market is currently **${isBull ? 'positive' : 'negative'}**, with ${adv} advancing and ${dec} declining assets.\n\n`;
    if (assets.find(a => a.symbol === 'AAPL')?.change > 0) {
      b += `US tech stocks demonstrated resilience as AAPL drives momentum.\n`;
    }
    b += `The critical event tomorrow is the Fed's preliminary inflation data rate reading.`;
    setAiBriefingContent(b);
  }, [assets]);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Timeframe and assets setup for correlation analyzer
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y'>('1M');
  
  // Dynamic defaults based on portfolio values
  const [symbolA, setSymbolA] = useState<string>(() => {
    if (portfolio && portfolio.length > 0) return portfolio[0].symbol;
    return 'AAPL';
  });

  const [symbolB, setSymbolB] = useState<string>(() => {
    if (portfolio && portfolio.length > 1) return portfolio[1].symbol;
    // Find first high quality asset that isn't symbolA
    const next = ['BTC', 'MSFT', '.SPX', 'GC=F'].find(s => s !== symbolA);
    return next || 'BTC';
  });

  // Group assets for display segments
  const majorIndices = assets.filter((a) => a.type === 'index');
  const marketCryptos = assets.filter((a) => a.type === 'crypto');
  const marketCommodities = assets.filter((a) => a.type === 'commodity');
  const popularStocks = assets.filter((a) => a.type === 'stock').slice(0, 4);

  // Filter watchlist assets
  const watchlistAssets = assets.filter((a) => watchlist.includes(a.symbol));

  const formatCurrency = (val: number, type: string = 'stock', country?: string) => {
    return formatCurrencyProp(val, type, country);
  };

  const getFormatValueForAsset = (symbol: string, value: number) => {
    const currentAsset = assets.find((a) => a.symbol === symbol);
    const type = currentAsset ? currentAsset.type : 'stock';
    return formatCurrencyProp(value, type, currentAsset?.country);
  };

  // List of selectable assets prioritizing User's Portfolio first, then Watchlist, then default major assets
  const selectableAssets = useMemo(() => {
    const portfolioSymbols = portfolio.map(item => item.symbol);
    const watchlistSymbols = watchlist.filter(ws => !portfolioSymbols.includes(ws));
    
    const combined = [...portfolioSymbols, ...watchlistSymbols];
    const defaultPool = ['AAPL', 'MSFT', 'NVDA', 'BTC', 'ETH', '.SPX', 'GC=F', 'RELIANCE', 'TCS', 'HDFCBANK'];
    
    defaultPool.forEach(sym => {
      if (!combined.includes(sym) && assets.some(a => a.symbol === sym)) {
        combined.push(sym);
      }
    });

    return assets.filter(a => combined.includes(a.symbol));
  }, [portfolio, watchlist]);

  // Calculated coordinates data for correlation
  const correlationData = useMemo(() => {
    const assetX = assets.find(a => a.symbol === symbolA);
    const assetY = assets.find(a => a.symbol === symbolB);

    if (!assetX || !assetY) return [];

    const historyX = assetX.history[timeframe] || [];
    const historyY = assetY.history[timeframe] || [];

    const points: any[] = [];
    const minLength = Math.min(historyX.length, historyY.length);

    for (let i = 0; i < minLength; i++) {
      points.push({
        date: historyX[i].date,
        xVal: historyX[i].value,
        yVal: historyY[i].value,
        xValFormatted: getFormatValueForAsset(symbolA, historyX[i].value),
        yValFormatted: getFormatValueForAsset(symbolB, historyY[i].value),
        assetXName: symbolA,
        assetYName: symbolB,
      });
    }

    return points;
  }, [symbolA, symbolB, timeframe]);

  // Pearson logic computed memo
  const pearsonCoefficient = useMemo(() => {
    if (correlationData.length < 2) return 0;
    const xValues = correlationData.map(d => d.xVal);
    const yValues = correlationData.map(d => d.yVal);
    return calculateCorrelation(xValues, yValues);
  }, [correlationData]);

  // Trigger News Summarizer via Gemini on the server side
  const handleSummarizeNews = async (article: NewsArticle) => {
    setSelectedNews(article);
    setAiSummary('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: article.symbolAffected || 'GLOBAL',
          name: article.title,
          type: 'market article',
          analysisType: 'newsSentiment',
        }),
      });

      const data = await response.json();
      if (data.error) {
        setAiSummary(`Could not formulate AI summary: ${data.error}`);
      } else {
        setAiSummary(data.content);
      }
    } catch (err: any) {
      setAiSummary(`Communication failed. Detail: ${err.message || 'Server offline'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, staggerChildren: 0.1 }}
      className="space-y-8 py-6"
    >
      {/* Real-time Ticker */}
      <MarketTicker />
      
      {/* 0. Central Intelligence Globe Hero */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-0 shadow-2xl flex flex-col items-center justify-center min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] w-full group bg-grid-pattern"
      >
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950/90 to-zinc-950 pointer-events-none"></div>
        
        {/* Top Overlay Stats */}
        <div className="absolute top-6 left-6 right-6 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-zinc-950/80 p-3 rounded-xl border border-indigo-500/20 backdrop-blur-md shadow-2xl">
               <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse-slow">
                 <div className="h-2 w-2 rounded-full bg-red-500"></div>
               </div>
               <div className="flex flex-col">
                 <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-zinc-400 font-mono uppercase tracking-[0.2em] shadow-sm">Global Telemetry Hub</div>
                 <div className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">Synchronized 3D Node Intelligence</div>
               </div>
            </div>
            
            {/* System Diagnostic Overlay */}
            <div className="hidden lg:flex flex-col gap-1.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 backdrop-blur-md">
               <div className="flex items-center justify-between gap-6">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Neural Pipeline</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">OPTIMAL</span>
               </div>
               <div className="flex items-center justify-between gap-6">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Data Resonance</span>
                  <span className="text-[9px] font-mono text-indigo-400 font-bold">99.98%</span>
               </div>
               <div className="w-full h-0.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                  <div className="w-[95%] h-full bg-indigo-500 shadow-[0_0_5px_#6366f1]"></div>
               </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 backdrop-blur-md shadow-2xl transition-transform duration-500 group-hover:scale-105">
             <div className="flex flex-col text-right">
               <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Macro Risk Engine</span>
               <span className="text-2xl font-black text-amber-500 font-mono tracking-tighter leading-none">6.4<span className="text-xs text-zinc-500 ml-1">/10.0</span></span>
             </div>
             <div className="h-8 w-px bg-zinc-800"></div>
             <div className="flex flex-col text-left justify-end">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Vector Shift (48H)</span>
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 w-fit">
                  <ArrowUpRight className="w-3 h-3" /> NORMALIZED
                </span>
             </div>
          </div>
        </div>

        {/* The 3D Globe */}
        <div className="absolute inset-0 z-10">
           <MarketGlobe3D />
           <EventShockwave />
        </div>

        {/* Bottom Overlay Features */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col sm:flex-row items-end justify-end pointer-events-none">
          <button
            id="btn-goto-heatmap-banner"
            onClick={() => setView('heatmap')}
            className="pointer-events-auto rounded-xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md px-5 py-3 text-xs font-black text-white uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 border border-indigo-400/30 hover:scale-105 hover:shadow-indigo-500/20"
          >
            <span>Initialize 2D Command Heatmap</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Dynamic Institutional Real-World Timezone Market Status Segment */}
      <section id="realworld-timezone-status-bridge" className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900/60">
          <div>
            <h3 className="text-xs font-black tracking-widest text-zinc-400 font-mono uppercase">Global Exchange Trading Hours Status</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Real-world institutional exchange session state synchronized with live clock</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 font-mono block sm:inline">Sandbox Setting:</span>
            <button
              id="btn-toggle-strict-hours"
              onClick={handleToggleStrictHours}
              className={`rounded px-2 md:px-3 py-1 text-[10px] font-extrabold transition-all duration-300 flex items-center gap-1 border cursor-pointer uppercase ${
                isStrictHours
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-mono'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-mono'
              }`}
            >
              <span>{isStrictHours ? '🔒 Enforcing True Exchange Hours' : '⚡ 24/7 Sandbox Continuous Tick'}</span>
              <span className="text-[8px] underline opacity-80">(click to toggle)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Indian Segment */}
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100">NSE & BSE India</h4>
                <p className="text-[9px] text-zinc-500 font-mono">NIFTY50, Sensex, Bluechips</p>
              </div>
              {isKolkataOpen ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
                  ● LIVE SESSION
                </span>
              ) : isStrictHours ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-amber-500/10 text-amber-500 border-amber-500/20">
                  ● CLOSED (FROZEN)
                </span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  ● SANDBOX DEMO
                </span>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-zinc-400 font-mono text-xs">{kolkataTime.day}</span>
              <span className="text-sm font-black font-mono text-zinc-100">
                {formatTimeStr(kolkataTime.hour, kolkataTime.minute)}{' '}
                <span className="text-[9px] text-zinc-500 font-extrabold">IST</span>
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 leading-normal border-t border-zinc-900/50 pt-2 font-mono">
              Trading hours: Mon-Fri 09:15 AM to 03:30 PM IST (GMT +5.5).
            </p>
          </div>

          {/* US Segment */}
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100">NYSE & Nasdaq US</h4>
                <p className="text-[9px] text-zinc-500 font-mono">AAPL, MSFT, Tech Giants</p>
              </div>
              {isNyOpen ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
                  ● LIVE SESSION
                </span>
              ) : isStrictHours ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-amber-500/10 text-amber-500 border-amber-500/20">
                  ● CLOSED (FROZEN)
                </span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  ● SANDBOX DEMO
                </span>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-zinc-400 font-mono text-xs">{nyTime.day}</span>
              <span className="text-sm font-black font-mono text-zinc-100">
                {formatTimeStr(nyTime.hour, nyTime.minute)}{' '}
                <span className="text-[9px] text-zinc-500 font-extrabold">EST</span>
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 leading-normal border-t border-zinc-900/50 pt-2 font-mono">
              Trading hours: Mon-Fri 09:30 AM to 04:00 PM EST (GMT -5.0).
            </p>
          </div>

          {/* Crypto segment */}
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100">Cryptocurrency</h4>
                <p className="text-[9px] text-zinc-500 font-mono">Bitcoin, Ethereum, Altcoins</p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
                ● LIVE 24/7
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-zinc-400 font-mono text-xs">Everyday</span>
              <span className="text-sm font-black font-mono text-zinc-100">24/7/365 <span className="text-[9px] text-zinc-500 font-extrabold">UTC</span></span>
            </div>
            <p className="text-[9.5px] text-zinc-500 leading-normal border-t border-zinc-900/50 pt-2 font-mono">
              Cryptocurrency token markets operate continuously without daily session closures.
            </p>
          </div>

          {/* Forex & Commodities */}
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100">Forex & Commodities</h4>
                <p className="text-[9px] text-zinc-500 font-mono">USD/INR, Gold, Crude Oil</p>
              </div>
              {isForexOpen ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
                  ● LIVE SESSION
                </span>
              ) : isStrictHours ? (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-amber-500/10 text-amber-500 border-amber-500/20">
                  ● CLOSED (FROZEN)
                </span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black font-mono border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  ● SANDBOX DEMO
                </span>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-zinc-400 font-mono text-xs">{kolkataTime.day}</span>
              <span className="text-sm font-black font-mono text-zinc-100">
                {formatTimeStr(kolkataTime.hour, kolkataTime.minute)}{' '}
                <span className="text-[9px] text-zinc-500 font-extrabold">IST</span>
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 leading-normal border-t border-zinc-900/50 pt-2 font-mono">
              Liquidity pools and commodity futures trade continuous on weekdays in IST.
            </p>
          </div>

        </div>
      </section>

      {/* Real-time Market Sentiment Aggregate Meter */}
      <section id="market-sentiment-aggregator" className="rounded-xl border border-zinc-850 bg-gradient-to-br from-zinc-900/40 to-zinc-950/80 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-black tracking-widest text-zinc-400 font-mono uppercase">Live Market Sentiment Aggregate Indicator</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Real-time bullish vs bearish sentiment score calculated dynamically across active indices and stocks</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Computed (IST Clock)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Sentiment Meter Gauge (Col span 5) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 bg-zinc-950/30 p-4 border border-zinc-900 rounded-xl">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Fear & Greed Index Scale</span>
              <span className="text-xl font-extrabold text-zinc-100 font-mono flex items-baseline gap-1">
                {sentimentScore}
                <span className="text-xs font-bold text-zinc-500">/ 100</span>
              </span>
            </div>

            {/* Premium segmented linear progress bar */}
            <div className="relative w-full h-4 bg-zinc-950 rounded-full flex overflow-hidden border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
              <div className="w-[20%] h-full bg-gradient-to-r from-red-600/90 to-red-500 border-r border-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBMMTAgME0tNSAxMEw1IDBNNSAxNUwxNSAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
              </div>
              <div className="w-[20%] h-full bg-gradient-to-r from-orange-500/90 to-amber-500 border-r border-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBMMTAgME0tNSAxMEw1IDBNNSAxNUwxNSAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
              </div>
              <div className="w-[20%] h-full bg-gradient-to-r from-yellow-500/90 to-yellow-400 border-r border-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBMMTAgME0tNSAxMEw1IDBNNSAxNUwxNSAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
              </div>
              <div className="w-[20%] h-full bg-gradient-to-r from-emerald-400/90 to-emerald-500 border-r border-zinc-950/50 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBMMTAgME0tNSAxMEw1IDBNNSAxNUwxNSAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
              </div>
              <div className="w-[20%] h-full bg-gradient-to-r from-emerald-500/90 to-green-600 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBMMTAgME0tNSAxMEw1IDBNNSAxNUwxNSAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-20"></div>
              </div>

              {/* Advanced Tracking Pointer */}
              <motion.div
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-10"
                initial={{ left: 0 }}
                animate={{ left: `${sentimentScore}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                 <div className="absolute -top-2 -ml-[3px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                 <div className="absolute -bottom-2 -ml-[3px] w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-white"></div>
              </motion.div>
            </div>
            
            <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-widest px-1">
              <span className="text-red-500">Extreme Fear</span>
              <span className="text-zinc-500">Neutral</span>
              <span className="text-green-500">Extreme Greed</span>
            </div>

            {/* Sentiment assessment label */}
            <div className="pt-2 text-center border-t border-zinc-900/60 font-sans">
              <p className="text-[10.5px] font-bold text-zinc-450 font-sans">
                Market Sentiment is currently{' '}
                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase inline-block ${
                  sentimentScore >= 75
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : sentimentScore >= 55
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : sentimentScore >= 45
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
                    : sentimentScore >= 25
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {sentimentScore >= 75
                    ? '🚀 Extreme Greed'
                    : sentimentScore >= 55
                    ? '📈 Greed (Bullish)'
                    : sentimentScore >= 45
                    ? '⚖️ Neutral'
                    : sentimentScore >= 25
                    ? '📉 Fear (Bearish)'
                    : '🔥 Extreme Fear'}
                </span>
              </p>
            </div>
          </div>

          {/* Market Breadth & Advancers/Decliners stats (Col span 7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Breadth Progress Bars */}
            <div className="bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl space-y-3 font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">Market Breadth</span>
              
              <div className="space-y-2 font-mono text-xs">
                {/* Advancers */}
                <div>
                  <div className="flex justify-between text-[10px] pb-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">▲ Advancers ({advCount})</span>
                    <span className="text-zinc-400 font-semibold">{Math.round((advCount / (assets.length || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${(advCount / (assets.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Decliners */}
                <div>
                  <div className="flex justify-between text-[10px] pb-1">
                    <span className="text-rose-400 font-bold flex items-center gap-1">▼ Decliners ({decCount})</span>
                    <span className="text-zinc-400 font-semibold">{Math.round((decCount / (assets.length || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-400 rounded-full transition-all duration-300"
                      style={{ width: `${(decCount / (assets.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Unchanged */}
                <div>
                  <div className="flex justify-between text-[10px] pb-1">
                    <span className="text-zinc-500 font-semibold flex items-center gap-1">■ Neutral / Flat ({flatCount})</span>
                    <span className="text-zinc-500">{Math.round((flatCount / (assets.length || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900/55 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-700 rounded-full transition-all duration-300"
                      style={{ width: `${(flatCount / (assets.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Lead & Summary */}
            <div className="bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-2">Sector Velocity Leaders</span>
                
                <div className="space-y-2 font-sans">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 font-sans">Top Leading Segment:</span>
                    <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10">
                      {sectorStats.topSector.name} ({sectorStats.topSector.avgChange >= 0 ? '+' : ''}{sectorStats.topSector.avgChange.toFixed(2)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 font-sans">Underperforming:</span>
                    <span className="text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/10 font-sans">
                      {sectorStats.bottomSector.name} ({sectorStats.bottomSector.avgChange >= 0 ? '+' : ''}{sectorStats.bottomSector.avgChange.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 font-mono text-[9.5px] leading-relaxed text-zinc-500">
                {sentimentScore >= 55 
                  ? "Overall momentum is bullish, driven by strong gains in the top outperforming sector. Consider momentum strategies." 
                  : sentimentScore <= 45 
                  ? "Downside velocity exceeds bullish support. Consider risk-hedging configurations."
                  : "Markets exhibit strong consolidation. Directionless movement makes rangebound trading ideal."}
              </div>
            </div>

          </div>
        </div>
      </section>

      { /* 1. Major Indices Ticker Board */ }
      <PrecisionMetrics />
      <section id="market-tickers-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {majorIndices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => onSelectAsset(idx)}
                className="group relative overflow-hidden rounded-xl border border-zinc-850 bg-zinc-900/40 p-4 transition-all duration-350 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{idx.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold font-mono tracking-tight text-white">{idx.price.toLocaleString()}</h3>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{isUp ? '+' : ''}{idx.change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1.2 Portfolio Sector Diversity Breakdown */}
      <section id="portfolio-sector-analytics-dashboard">
        <SectorBreakdown portfolio={portfolio} assets={assets} />
      </section>

      {/* AI Stock Comparison Matrix */}
      <section id="portfolio-correlation-analytics-dashboard" className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
               <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 p-1.5 rounded-md">
                 <Bot className="h-4 w-4" />
               </span>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/10 uppercase tracking-wider font-mono">Statistical Co-Movement</span>
              <span className="text-zinc-600 text-xs font-mono">• Interactive Scatter</span>
            </div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-100 mt-2 flex items-center gap-2">
              <Binary className="h-4.5 w-4.5 text-indigo-400" />
              AI Stock Comparison Matrix
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Select any two assets in your portfolio or watchlist to evaluate historical correlation ratios ($r$) and assess asset dispersion. AI engine interprets diversification properties.
            </p>
          </div>
          
          {/* Timeframe switch */}
          <div className="flex items-center gap-1 border border-zinc-900 bg-zinc-900/20 p-0.5 rounded-lg shrink-0">
            {(['1W', '1M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-zinc-900 text-white shadow font-black border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tf === '1W' ? '1W' : tf === '1M' ? '1M' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Segment */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 space-y-3.5">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal className="h-3 w-3 text-zinc-500" /> Options Setup
              </span>

              {/* Symbol A Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 font-mono block">Asset X (Horizontal):</label>
                <select
                  value={symbolA}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSymbolA(chosen);
                    if (chosen === symbolB) {
                      const backupName = selectableAssets.find(a => a.symbol !== chosen);
                      if (backupName) setSymbolB(backupName.symbol);
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                >
                  {selectableAssets.map(asset => {
                    const inPortfolio = portfolio.some(p => p.symbol === asset.symbol);
                    return (
                      <option key={asset.symbol} value={asset.symbol}>
                        {inPortfolio ? '💼 ' : ''}{asset.symbol} — {asset.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Symbol B Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 font-mono block">Asset Y (Vertical):</label>
                <select
                  value={symbolB}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSymbolB(chosen);
                    if (chosen === symbolA) {
                      const backupName = selectableAssets.find(a => a.symbol !== chosen);
                      if (backupName) setSymbolA(backupName.symbol);
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                >
                  {selectableAssets.map(asset => {
                    const inPortfolio = portfolio.some(p => p.symbol === asset.symbol);
                    return (
                      <option key={asset.symbol} value={asset.symbol} disabled={asset.symbol === symbolA}>
                        {inPortfolio ? '💼 ' : ''}{asset.symbol} — {asset.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Pearson correlation summary information table */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 space-y-3 font-mono">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Correlation Analysis</span>
              
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-900 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase">Pearson Ratio (r)</span>
                  <div className="text-sm font-black text-white mt-0.5">{pearsonCoefficient.toFixed(4)}</div>
                </div>
                <div className={`text-[10px] font-extrabold px-2 py-1 rounded border ${
                  Math.abs(pearsonCoefficient) >= 0.7
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : Math.abs(pearsonCoefficient) >= 0.3
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'
                }`}>
                  {(() => {
                    const r = Math.abs(pearsonCoefficient);
                    if (r >= 0.7) return 'STRONG';
                    if (r >= 0.3) return 'MODERATE';
                    return 'WEAK';
                  })()}
                </div>
              </div>

              <div className="space-y-1 text-[10px] leading-relaxed text-zinc-400">
                <span className="font-bold text-zinc-300 block">Interpretation Matrix:</span>
                <p className="italic">
                  {(() => {
                    const r = pearsonCoefficient;
                    if (r >= 0.7) return `Strong positive correlation detected. ${symbolA} and ${symbolB} trade in tight unison. High concentration risk.`;
                    if (r >= 0.3) return `Moderate co-movement. ${symbolA} and ${symbolB} show alignment, but decouple during localized micro-economic updates.`;
                    if (r > -0.3) return `Weaker co-movement. ${symbolA} and ${symbolB} are nearly independent, which is ideal to establish balanced risk limits.`;
                    if (r > -0.7) return `Moderate opposite co-movement. Potential hedge structures are present.`;
                    return `Strong inverse correlation detected. Trades act as automated opposite hedge protections.`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Core Scatter Plot Matrix Visual Canvas */}
          <div className="lg:col-span-8 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 h-80 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest pl-1">
              Scatter Plot: {symbolA} Price vs {symbolB} Price Over Time
            </span>

            {correlationData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-center">
                <CircleAlert className="h-6 w-6 text-zinc-650" />
                <span className="text-xs text-zinc-500">Error rendering chart framework</span>
              </div>
            ) : (
              <div className="flex-1 w-full mt-3">
                <ChartContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <ScatterChart
                    margin={{ top: 8, right: 16, bottom: 20, left: 16 }}
                  >
                    <CartesianGrid stroke="#141416" strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="xVal" 
                      name={symbolA} 
                      stroke="#52525b" 
                      tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                      domain={['auto', 'auto']}
                      label={{ 
                        value: `${symbolA} (X-Axis price USD)`, 
                        position: 'insideBottom', 
                        offset: -12, 
                        fill: '#a1a1aa', 
                        fontSize: 9, 
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif' 
                      }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="yVal" 
                      name={symbolB} 
                      stroke="#52525b" 
                      tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                      domain={['auto', 'auto']}
                      label={{ 
                        value: `${symbolB} (Y-Axis price USD)`, 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -2, 
                        fill: '#a1a1aa', 
                        fontSize: 9, 
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif' 
                      }}
                    />
                    <ChartTooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#27272a' }} />
                    <Scatter 
                      name={`${symbolA} vs ${symbolB}`} 
                      data={correlationData} 
                      fill="#6366f1"
                      stroke="#818cf8"
                      strokeWidth={1.5}
                    />
                  </ScatterChart>
                </ChartContainer>
              </div>
            )}
            <div className="flex items-center justify-between text-[9px] text-zinc-600 font-mono mt-1 border-t border-zinc-900 pt-1">
              <span>Points mapped: {correlationData.length} records</span>
              <span>Visualizing correlation factor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Watchlist on Left, Categorized Discoveries on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid: Watchlist Management */}
        <div className="lg:col-span-4 space-y-6" id="watchlist-section">
          {/* Market Sentiment Gauge */}
          <SentimentGauge 
            assets={assets}
            onSelectAssetBySymbol={(sym) => {
              const matching = assets.find(a => a.symbol === sym);
              if (matching) onSelectAsset(matching);
            }} 
          />

          <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-yellow-500">
                  <Star className="h-4 w-4 fill-current animate-pulse" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight text-white">Your Watchlist</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500 font-bold">{watchlistAssets.length} tracked</span>
            </div>

            {watchlistAssets.length > 0 ? (
              <div className="divide-y divide-zinc-900">
                {watchlistAssets.map((asset) => {
                  const isUp = asset.change >= 0;
                  const assetAlerts = priceAlerts.filter(a => a.symbol === asset.symbol && a.active);
                  const isAlertInputActive = activeAlertInput === asset.symbol;

                  return (
                    <div key={asset.symbol} className="py-3 px-1">
                      <div className="group flex items-center justify-between transition-colors hover:bg-zinc-900/20 rounded-md">
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectAsset(asset)}>
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 font-bold text-xs text-zinc-300">
                            {asset.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-100">{asset.symbol}</div>
                            <div className="text-[10px] text-zinc-500 max-w-[120px] truncate">{asset.name}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right cursor-pointer" onClick={() => onSelectAsset(asset)}>
                            <div className="text-xs font-bold font-mono text-zinc-100">{formatCurrency(asset.price, asset.symbol, asset.country)}</div>
                            <div className={`text-[10px] font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? '+' : ''}{asset.change}%
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 border-l border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 pl-3">
                            <button
                              onClick={() => isAlertInputActive ? setActiveAlertInput(null) : setActiveAlertInput(asset.symbol)}
                              className={`${assetAlerts.length > 0 ? 'text-indigo-400' : 'text-zinc-500'} hover:text-indigo-300 transition-colors`}
                              title="Set Price Alert"
                            >
                              {assetAlerts.length > 0 ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => toggleWatchlist(asset.symbol)}
                              className="text-yellow-500 hover:text-zinc-600 transition-colors ml-1"
                              title="Remove from watchlist"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Alert Rules */}
                      {isAlertInputActive && (
                        <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 flex flex-col gap-3 animate-fade-in">
                          <div className="flex items-center gap-2">
                             <select
                               value={alertDirection}
                               onChange={(e) => setAlertDirection(e.target.value as 'above' | 'below')}
                               className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
                             >
                               <option value="above">Above</option>
                               <option value="below">Below</option>
                             </select>
                             <input 
                               type="number"
                               placeholder="Target Price"
                               value={alertInputValue}
                               onChange={(e) => setAlertInputValue(e.target.value)}
                               className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 outline-none w-24 focus:border-indigo-500 font-mono"
                             />
                             <button
                               onClick={() => handleAddAlert(asset.symbol)}
                               className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
                             >
                               Set
                             </button>
                          </div>
                          
                          {/* Active Alerts List */}
                          {assetAlerts.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Active Alerts</p>
                              {assetAlerts.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between text-xs bg-zinc-900/50 rounded px-2 py-1 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                                  <span className="text-zinc-400">
                                    IF <strong className={alert.direction === 'above' ? 'text-emerald-400' : 'text-rose-400'}>{alert.direction.toUpperCase()}</strong>: <span className="font-mono text-zinc-200">{alert.targetPrice}</span>
                                  </span>
                                  <button onClick={() => removeAlert(alert.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-850 rounded-xl space-y-2">
                <p>Your watchlist is currently empty.</p>
                <button
                  onClick={() => setView('screener')}
                  className="text-emerald-400 hover:underline font-semibold font-sans text-[11px]"
                >
                  Discover assets in Screener →
                </button>
              </div>
            )}

            {/* Watchlist Intelligence */}
            {watchlistAssets.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex gap-3">
                <div className="text-indigo-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-300">Watchlist Intelligence</p>
                  <p className="text-[10px] text-indigo-200/70 mt-1 leading-relaxed">
                    {watchlistAssets.filter(a => a.change > 2).length > 0 
                      ? `${watchlistAssets.filter(a => a.change > 2).length} assets in your watchlist are showing unusually high bullish momentum today. Consider setting up price alerts.` 
                      : `Your tracked assets are showing standard market correlation. No unusual earnings or volatility detected today.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Informational Hub Widget */}
          <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CircleAlert className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">MVP Sandbox Environment</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Welcome to the **Vymx Trade MVP**. Trade safely with an initial **$100,000 in Virtual USD**. 
              Search any asset to open the financial visual chart and prompt the server-side **Gemini API** for an immediate, professional analysis of market operations.
            </p>
          </div>
        </div>

        {/* Right Grid: Hot Assets Lists */}
        <div className="lg:col-span-8 space-y-6">
          <MarketAurasWidget />
          <DashboardNewsWidget />
        
          <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <h2 className="text-sm font-semibold tracking-tight text-white">Global Markets Discovery</h2>
              <span className="text-zinc-500 text-[11px] font-sans font-medium">Real-time mock feed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Hot Stocks segment */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Popular Equities</span>
                <div className="space-y-2">
                  {popularStocks.map((stk) => {
                    const isUp = stk.change >= 0;
                    return (
                      <div
                        key={stk.symbol}
                        onClick={() => onSelectAsset(stk)}
                        className="flex items-center justify-between p-2 rounded-lg border border-zinc-900/60 bg-zinc-900/10 hover:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-zinc-300">{stk.symbol}</div>
                          <span className="text-[11px] text-zinc-500 max-w-[130px] truncate">{stk.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-zinc-200">{formatCurrency(stk.price, stk.symbol, stk.country)}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isUp ? '+' : ''}{stk.change}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hot Cryptos segment */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Crypto Assets</span>
                <div className="space-y-2">
                  {marketCryptos.map((cry) => {
                    const isUp = cry.change >= 0;
                    return (
                      <div
                        key={cry.symbol}
                        onClick={() => onSelectAsset(cry)}
                        className="flex items-center justify-between p-2 rounded-lg border border-zinc-900/60 bg-zinc-900/10 hover:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-zinc-300">{cry.symbol}</div>
                          <span className="text-[11px] text-zinc-500 max-w-[130px] truncate">{cry.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-zinc-200">{formatCurrency(cry.price, cry.symbol, cry.country)}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isUp ? '+' : ''}{cry.change}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Commodities section */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Benchmark Commodities & Futures</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {marketCommodities.map((comm) => {
                  const isUp = comm.change >= 0;
                  return (
                    <div
                      key={comm.symbol}
                      onClick={() => onSelectAsset(comm)}
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{comm.name}</div>
                        <p className="text-[10px] text-zinc-500">COMEX Spot Futures</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-zinc-200">{formatCurrency(comm.price, comm.symbol, comm.country)}</span>
                        <div className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span>{isUp ? '+' : ''}{comm.change}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      <DataIntegrityWidget />

      {/* 3. Global News Feed with Embedded AI Summarizer */}
      <section id="global-news-section" className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-md p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Vymx Intelligent News Feed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {news.map((n) => (
            <div
              key={n.id}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 hover:bg-zinc-900/30 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                  <span className="text-zinc-500">{n.source}</span>
                  <span className="text-zinc-500">{n.time}</span>
                </div>
                
                <h3 className="text-xs font-bold text-white tracking-normal group-hover:text-emerald-400 transition-colors">
                  {n.title}
                </h3>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {n.summary}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-900 pt-3">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                    n.sentiment === 'positive' 
                    ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
                    : n.sentiment === 'negative'
                    ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                    : 'bg-zinc-500/5 text-zinc-400 border-zinc-500/10'
                }`}>
                  {n.sentiment.toUpperCase()}
                </span>

                <button
                  onClick={() => handleSummarizeNews(n)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/15 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Summary
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* news summarizer modal / overlay detail */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950/60 backdrop-blur-3xl p-6 shadow-2xl shadow-indigo-900/10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider">AI NEWS BRIEF TERMINAL</span>
                <h3 className="text-sm font-bold text-zinc-100">{selectedNews.title}</h3>
                <p className="text-[10px] text-zinc-500">{selectedNews.source} • {selectedNews.time}</p>
              </div>
              <button
                onClick={() => { setSelectedNews(null); setAiSummary(''); }}
                className="rounded-lg bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="prose prose-invert max-h-[300px] overflow-y-auto rounded-xl bg-zinc-900/50 border border-zinc-850 p-4 text-xs text-zinc-300 leading-relaxed">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-450" />
                  <p className="text-[11px] text-zinc-400">Consulting Gemini financial models...</p>
                </div>
              ) : (
                <div className="space-y-4 markdown-body prose prose-invert prose-sm max-w-none prose-headings:text-white prose-h4:text-xs prose-h4:mt-4 prose-li:ml-4 prose-li:list-disc prose-li:mt-1 prose-p:mt-1">
                  <Markdown>{aiSummary || ''}</Markdown>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setSelectedNews(null); setAiSummary(''); }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-950/20"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
