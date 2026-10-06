import React, { useEffect, useRef, useState } from 'react';
import { Asset } from '../types';
import BenchmarkComparisonChart from './BenchmarkComparisonChart';
import TrendPredictionChart from './TrendPredictionChart';
import html2canvas from 'html2canvas';
import { Layers, Camera, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TradingViewChartProps {
  asset: Asset;
  timeframe: '1D' | '1W' | '1M' | '1Y';
  setTimeframe: (tf: '1D' | '1W' | '1M' | '1Y') => void;
  formatCurrency: (val: number, type: string) => string;
}

const mapSymbolToTV = (asset: Asset): string => {
  if (asset.type === 'crypto') {
    return `CRYPTO:${asset.symbol}USD`;
  }
  if (asset.type === 'forex') {
    return `FX_IDC:${asset.symbol.replace('/', '')}`;
  }
  if (asset.country === 'India') {
    if (asset.symbol === 'NIFTY50') return 'NSE:NIFTY';
    if (asset.symbol === 'SENSEX') return 'BSE:SENSEX';
    if (asset.symbol === 'BANKNIFTY') return 'NSE:BANKNIFTY';
    return `NSE:${asset.symbol}`;
  }
  
  // US and Global Indices
  if (asset.symbol === '.SPX') return 'SP:SPX';
  if (asset.symbol === '.IXIC') return 'NASDAQ:IXIC';
  if (asset.symbol === '.DJI') return 'DJ:DJI';
  if (asset.symbol === '.FTSE') return 'TVC:UKX';
  if (asset.symbol === '.N225') return 'TVC:NI225';
  
  // Bonds
  if (asset.symbol === 'US10Y') return 'TVC:US10Y';
  if (asset.symbol === 'US2Y') return 'TVC:US02Y';
  if (asset.symbol === 'UK10Y') return 'TVC:GB10Y';
  if (asset.symbol === 'DE10Y') return 'TVC:DE10Y';
  if (asset.symbol === 'JP10Y') return 'TVC:JP10Y';
  
  // Commodities
  if (asset.type === 'commodity') {
     if (asset.symbol === 'GC=F') return 'COMEX:GC1!';
     if (asset.symbol === 'CL=F') return 'NYMEX:CL1!';
     if (asset.symbol === 'SI=F') return 'COMEX:SI1!';
     if (asset.symbol === 'NG=F') return 'NYMEX:NG1!';
     if (asset.symbol === 'COPPER') return 'COMEX:HG1!';
  }
  
  // International Stocks
  if (asset.symbol === 'MC.PA') return 'EURONEXT:MC';
  if (asset.symbol === '7203.T') return 'TSE:7203';
  if (asset.symbol === 'SAP.DE') return 'XETR:SAP';
  if (asset.symbol === '005930.KS') return 'KRX:005930';
  if (asset.symbol === 'BRK.B') return 'NYSE:BRK.B';

  return asset.symbol; // Default for US stocks
};


const AVAILABLE_STUDIES = [
  { id: "MASimple@tv-basicstudies", label: "SMA" },
  { id: "MACD@tv-basicstudies", label: "MACD" },
  { id: "RSI@tv-basicstudies", label: "RSI" },
  { id: "BollingerBands@tv-basicstudies", label: "Bollinger" }
];

const TVWidget = ({ asset, timeframe, tvSymbol, activeStudies }: { asset: Asset, timeframe: string, tvSymbol: string, activeStudies: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `tv_chart_${asset.symbol.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const initWidget = () => {
        if (typeof window !== 'undefined' && (window as any).TradingView) {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: tvSymbol,
            interval: timeframe === '1D' ? '5' : timeframe === '1W' ? '60' : timeframe === '1M' ? 'D' : 'W',
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            backgroundColor: "#09090b", // Match zinc-950
            gridColor: "#18181b", // zinc-900
            hide_top_toolbar: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            studies: activeStudies,
            hide_legend: false,
            save_image: false,
            container_id: containerId
          });
        }
      };

      if ((window as any).TradingView) {
        initWidget();
      } else {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = initWidget;
        document.head.appendChild(script);
      }
    }
  }, [tvSymbol, timeframe, containerId, activeStudies]);

  return <div id={containerId} ref={containerRef} className="tradingview-widget-container h-full w-full absolute inset-0" />;
};


export default function TradingViewChart({
  asset,
  timeframe,
  setTimeframe,
}: TradingViewChartProps) {
  
  const tvSymbol = mapSymbolToTV(asset);
  const [viewMode, setViewMode] = useState<'tv' | 'benchmark' | 'prediction'>('tv');
  const [activeStudies, setActiveStudies] = useState<string[]>(["MASimple@tv-basicstudies"]);
  const [showStudiesMenu, setShowStudiesMenu] = useState(false);

  const toggleStudy = (studyId: string) => {
    setActiveStudies(prev => 
      prev.includes(studyId) ? prev.filter(id => id !== studyId) : [...prev, studyId]
    );
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-1 shadow-lg w-full relative" id="tradingview-chart-arena" ref={chartContainerRef}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950 rounded-t-xl mb-1">
         <div className="flex flex-wrap items-center gap-4 font-sans text-xs w-full">
           
           <button
             onClick={() => setViewMode(viewMode === 'benchmark' ? 'tv' : 'benchmark')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 font-bold text-[10px] uppercase tracking-widest font-mono ${
               viewMode === 'benchmark'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
             }`}
           >
             <Layers className={`w-3.5 h-3.5 ${viewMode === 'benchmark' ? 'text-indigo-400' : 'text-zinc-500'}`} />
             {viewMode === 'benchmark' ? 'Hide Benchmark' : 'Compare Benchmark'}
           </button>
           <button 
             onClick={() => setViewMode(viewMode === 'prediction' ? 'tv' : 'prediction')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 font-bold text-[10px] uppercase tracking-widest font-mono ${
               viewMode === 'prediction'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
             }`}
           >
             {viewMode === 'prediction' ? 'Hide Forecast' : 'Trend Prediction'}
           
           </button>

           <div className="flex flex-1 items-center justify-end gap-2">
             <div className="flex items-center rounded-lg border border-zinc-900 bg-zinc-900/50 p-1">
              <span className="text-zinc-500 font-mono text-[10px] mr-3 uppercase tracking-widest hidden sm:inline-block">&bull; Scaling Period</span>
              {(['1D', '1W', '1M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`relative rounded px-3 py-1.5 text-xs font-mono font-bold select-none transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {timeframe === tf && (
                    <motion.div
                      layoutId="timeframe-indicator"
                      className="absolute inset-0 bg-indigo-600 shadow-lg shadow-indigo-900/40 border border-indigo-500/30 rounded"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tf}</span>
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
    if (chartContainerRef.current) {
      try {
        const canvas = await html2canvas(chartContainerRef.current, { backgroundColor: '#09090b', scale: 2 });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${asset.symbol}-technical-analysis.png`;
        link.href = url;
        link.click();
      } catch (err) {
        console.error("Export failed", err);
      }
    }
  }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-zinc-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300 transition-all cursor-pointer"
              title="Capture High-Res Image"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="w-full relative min-h-[500px] overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <BenchmarkComparisonChart asset={asset} timeframe={timeframe} />
            </motion.div>
          )}
          {viewMode === 'prediction' && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-10"
            >
              <TrendPredictionChart asset={asset} timeframe={timeframe} />
            </motion.div>
          )}
          {viewMode === 'tv' && (
            <motion.div
              key="tradingview"
              initial={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-10"
            >
              <TVWidget key={asset.symbol} asset={asset} timeframe={timeframe} tvSymbol={tvSymbol} activeStudies={activeStudies} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
