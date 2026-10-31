import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, TrendingUp, TrendingDown, Activity, Newspaper, BarChart3, Globe2, Zap, Network, ShieldAlert, Ship, Coins, ThermometerSnowflake, ThermometerSun, Play, Pause, Rewind, FastForward, Volume2, Target, CloudLightning, Layers, ArrowRight, Database, RefreshCw } from 'lucide-react';
import VymxIntelligencePanel from './VymxIntelligencePanel';
import { useMarketState } from '../contexts/MarketStateContext';

const EXCHANGE_DETAILS: Record<string, { name: string }> = {
  NYSE: { name: 'New York Stock Exchange' },
  NSE: { name: 'National Stock Exchange of India' },
  LSE: { name: 'London Stock Exchange' },
  TSE: { name: 'Tokyo Stock Exchange' },
  HKEX: { name: 'Hong Kong Exchange' },
  SGX: { name: 'Singapore Exchange' },
  ASX: { name: 'Australian Securities Exchange' },
  DIFC: { name: 'Dubai Financial Market' },
  B3: { name: 'B3 - Brasil Bolsa Balcão' },
  JSE: { name: 'Johannesburg Stock Exchange' },
  TSX: { name: 'Toronto Stock Exchange' }
};

const MARKERS = [
  { label: 'NYSE', lat: 40.7128, lng: -74.0060 },
  { label: 'LSE', lat: 51.5074, lng: -0.1278 },
  { label: 'TSE', lat: 35.6895, lng: 139.6917 },
  { label: 'NSE', lat: 19.0760, lng: 72.8777 },
  { label: 'HKEX', lat: 22.3193, lng: 114.1694 },
  { label: 'SGX', lat: 1.3521, lng: 103.8198 },
  { label: 'ASX', lat: -33.8688, lng: 151.2093 },
  { label: 'DIFC', lat: 25.2048, lng: 55.2708 },
  { label: 'B3', lat: -23.5505, lng: -46.6333 },
  { label: 'JSE', lat: -26.2041, lng: 28.0473 },
  { label: 'TSX', lat: 43.6532, lng: -79.3832 }
].map((marker) => ({
  ...marker,
  risk: 'not assessed',
  isBullish: false,
  color: '#64748b'
}));

type GlobeMode = 'default' | 'capitalFlows' | 'geoRisk' | 'supplyChain' | 'commodities' | 'sectorRotation' | 'holdings' | 'earningsSeason' | 'timeMachine' | 'correlationWeb' | 'dominoQuiz' | 'currencySwap';

export default function MarketGlobe3D() {
  const globeRef = useRef<GlobeMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Initialize with sensible dimensions to prevent container dimension collapse
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? Math.max(window.innerHeight - 200, 500) : 600
  }));
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [mode, setMode] = useState<GlobeMode>('default');
  const [showPanel, setShowPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [countries, setCountries] = useState({ features: [] });
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowPanel(false);
        setShowLeftPanel(false);
      } else {
        setShowPanel(true);
        setShowLeftPanel(true);
      }
    };
    handleResize(); // Initialize on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Market and event data are loaded by the dedicated provider-backed endpoints below.

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(() => {});
  }, []);
  
  const { 
    timeplay, setTimeplay, 
    isPlaying, setIsPlaying, 
    weatherPlaying, setWeatherPlaying,
    globalWeatherState
  } = useMarketState();

  const [quizActive, setQuizActive] = useState(false);
  const [chainReaction, setChainReaction] = useState<string | null>(null);
  
  const [quizData, setQuizData] = useState<any>(null);
  const quizRequestStarted = useRef(false);
  const [narrativeText, setNarrativeText] = useState('Waiting for a provider-backed market quote snapshot.');
  const [liveExchangeData, setLiveExchangeData] = useState<any>(null);
  const [loadingExchangeData, setLoadingExchangeData] = useState(false);

  useEffect(() => {
    if (quizActive && !quizData && !quizRequestStarted.current) {
      quizRequestStarted.current = true;
      fetch('/api/ai/quiz').then(r => r.json()).then(data => setQuizData(data?.success && Array.isArray(data.options) ? data : null)).catch(() => setQuizData(null));
    }
  }, [quizActive, quizData]);

  useEffect(() => {
    fetch('/api/ai/narrative').then(r => r.json()).then(data => setNarrativeText(data?.success && data.text ? data.text : 'Market narrative unavailable — no verified event feed is configured.')).catch(() => setNarrativeText('Market narrative unavailable — provider request failed.'));
  }, []);

  const activeExchangeData = selectedExchange ? EXCHANGE_DETAILS[selectedExchange] : null;
  const exchangeIndices = Array.isArray(liveExchangeData?.indices) ? liveExchangeData.indices : [];
  const fearGreedValue = typeof liveExchangeData?.fearAndGreed === 'number' ? liveExchangeData.fearAndGreed : null;

  useEffect(() => {
     if (selectedExchange) {
        setLoadingExchangeData(true);
        setLiveExchangeData(null);
        fetch(`/api/ai/exchange-latest?exchange=${selectedExchange}`)
          .then(r => r.json())
          .then(data => {
            setLiveExchangeData(data?.success ? data : null);
            setLoadingExchangeData(false);
          })
          .catch(() => setLoadingExchangeData(false));
     }
  }, [selectedExchange]);

  // Generate dynamic data based on active mode
  const { points, arcs, rings } = useMemo(() => {
    let p: any[] = [];
    let a: any[] = [];
    let r: any[] = [];

    // Base specific mode points/rings
    if (mode === 'geoRisk') {
      const risks = [
        { label: 'Israel/Gaza', lat: 31.5, lng: 34.4, risk: 'extreme', color: '#fbbf24' },
        { label: 'Ukraine', lat: 48.3794, lng: 31.1656, risk: 'high', color: '#fbbf24' },
        { label: 'Taiwan Strait', lat: 24.5, lng: 119.5, risk: 'extreme', color: '#fbbf24' },
        { label: 'Red Sea', lat: 18.0, lng: 40.0, risk: 'high', color: '#ef4444' },
      ];
      risks.forEach(m => {
        p.push({ ...m, size: 0.2 });
        r.push({ ...m, maxR: 12, propagationSpeed: 0.8, repeatPeriod: 800 });
      });
      MARKERS.forEach(m => p.push({ ...m, size: 0.05, opacity: 0.3 }));
    } else if (mode === 'supplyChain') {
      const chokepoints = [
        { label: 'Panama Canal', lat: 9.1440, lng: -79.9047, color: '#f97316' },
        { label: 'Suez Canal', lat: 30.5852, lng: 32.2654, color: '#f97316' },
        { label: 'Strait of Malacca', lat: 3.5, lng: 99.5, color: '#f97316' },
      ];
      chokepoints.forEach(m => {
        p.push({ ...m, size: 0.15 });
        r.push({ ...m, maxR: 8, propagationSpeed: 0.5, repeatPeriod: 1200 });
      });
      MARKERS.forEach(m => p.push({ ...m, size: 0.05, opacity: 0.3 }));
    } else if (mode === 'commodities') {
      const comms = [
         { label: 'Oil (Saudi Arabia)', lat: 23.8859, lng: 45.0792, color: '#f8fafc' },
         { label: 'Copper (Chile)', lat: -35.6751, lng: -71.5430, color: '#b87333' },
         { label: 'Lithium (Australia)', lat: -25.2744, lng: 133.7751, color: '#e2e8f0' },
      ];
      comms.forEach(m => {
        p.push({ ...m, size: 0.15 });
        r.push({ ...m, maxR: 5, propagationSpeed: 1, repeatPeriod: 2000 });
      });
      MARKERS.forEach(m => p.push({ ...m, size: 0.05, opacity: 0.3 }));
    } else if (mode === 'holdings') {
      const userHoldings = ['NYSE', 'NSE', 'LSE'];
      MARKERS.forEach(m => {
        const isHeld = userHoldings.includes(m.label);
        p.push({ ...m, size: isHeld ? 0.2 : 0.05, color: isHeld ? '#10b981' : '#4b5563' });
        if (isHeld) {
           r.push({ ...m, maxR: 4, propagationSpeed: 2, repeatPeriod: 1000, color: '#10b981' });
        }
      });
    } else if (mode === 'earningsSeason') {
       MARKERS.forEach(m => {
         p.push({ ...m, size: 0.1 });
         if (['NYSE', 'TSE', 'LSE'].includes(m.label)) {
            // scatter small dots around
            for(let i=0; i<10; i++) {
               p.push({
                 label: 'Earn',
                 lat: m.lat + (Math.random() - 0.5) * 5,
                 lng: m.lng + (Math.random() - 0.5) * 5,
                 size: 0.02,
                 color: '#fef08a'
               });
            }
         }
       });
    } else if (mode === 'timeMachine') {
       MARKERS.forEach(m => {
         p.push({ ...m, size: 0.1 });
         if (timeplay < 30) {
            r.push({ ...m, maxR: 8, propagationSpeed: 2, repeatPeriod: 800, color: '#ef4444' }); // 2008 crash
         } else if (timeplay > 45 && timeplay < 60) {
            r.push({ ...m, maxR: 12, propagationSpeed: 3, repeatPeriod: 500, color: '#ef4444' }); // 2020 crash
         } else {
            r.push({ ...m, maxR: 4, propagationSpeed: 1, repeatPeriod: 2000, color: '#10b981' }); // bull run
         }
       });
    } else if (mode === 'sectorRotation') {
       MARKERS.forEach(m => {
         p.push({ ...m, size: 0.1 });
         if (['NYSE', 'TSE', 'HKEX'].includes(m.label)) {
            // Shrinking sectors (Tech leaving)
            r.push({ ...m, maxR: 6, propagationSpeed: -1, repeatPeriod: 1000, color: '#ef4444' }); 
            p.push({ label: 'Tech Outflow', lat: m.lat+2, lng: m.lng+2, size: 0.05, color: '#ef4444' });
         } else if (['DIFC', 'LSE', 'JSE'].includes(m.label)) {
            // Swelling sectors (Energy/Materials coming in)
            r.push({ ...m, maxR: 10, propagationSpeed: 1, repeatPeriod: 1200, color: '#10b981' }); 
            p.push({ label: 'Energy Inflow', lat: m.lat+2, lng: m.lng+2, size: 0.05, color: '#10b981' });
         }
       });
    } else if (mode === 'dominoQuiz') {
       const targets = [
          { label: 'Suez Canal', lat: 30.5852, lng: 32.2654, color: '#f97316', risk: 'extreme' },
          { label: 'Energy (Europe)', lat: 50.11, lng: 8.68, color: '#f8fafc', risk: 'high' },
          { label: 'Semis (Taiwan)', lat: 24.5, lng: 119.5, color: '#3b82f6', risk: 'high' },
       ];
       targets.forEach(m => {
          p.push({...m, size: 0.15});
          r.push({...m, maxR: 10, propagationSpeed: 2, repeatPeriod: 1000});
       });
       MARKERS.forEach(m => p.push({ ...m, size: 0.05, opacity: 0.3 }));
    } else {
      MARKERS.forEach(m => {
        p.push({ ...m, size: 0.1 });
        // Sentiment Auras: Rings with different speeds and colors
        if (mode === 'default') {
           r.push({ 
             ...m, 
             maxR: m.isBullish ? 25 : 18, 
             propagationSpeed: m.isBullish ? 2.5 : 1.5, 
             repeatPeriod: m.isBullish ? 600 : 1000 
           });
        }
      });
    }

    // Capital Flows, Currency Swaps, Sector Rotation, Correlation Webs, Chain Reactions
    if (mode === 'capitalFlows' || mode === 'currencySwap') {
      const flowPairs = [['HKEX', 'TSE'], ['LSE', 'NYSE'], ['B3', 'NYSE'], ['DIFC', 'LSE']];
      flowPairs.forEach(pair => {
         const start = MARKERS.find(m => m.label === pair[0]);
         const end = MARKERS.find(m => m.label === pair[1]);
         if(start && end) {
            a.push({
              startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng,
              color: mode === 'currencySwap' ? ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'] : ['rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.8)'],
              dashLength: mode === 'currencySwap' ? 0.2 : 0.6,
              altitude: 0.3
            });
         }
      });
    }

    if (mode === 'correlationWeb') {
       MARKERS.forEach((m1, i) => {
         MARKERS.forEach((m2, j) => {
            if (i > j && 0 > 0.8) {
               a.push({
                 startLat: m1.lat, startLng: m1.lng, endLat: m2.lat, endLng: m2.lng,
                 color: ['rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.4)'],
                 dashLength: 0.1,
                 altitude: 0.15
               });
            }
         });
       });
    }

    // Chain Reaction Arc mode (triggered from popup)
    if (chainReaction) {
      const start = MARKERS.find(m => m.label === chainReaction);
      if (start) {
         MARKERS.forEach(end => {
           if (start.label !== end.label && 0 > 0.5) {
             a.push({
                startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng,
                color: ['#ef4444', 'rgba(239, 68, 68, 0.1)'],
                dashLength: 0.5,
                altitude: 0.2
             });
             r.push({ ...end, maxR: 15, propagationSpeed: 3, repeatPeriod: 400, color: '#ef4444' }); // Even shockwave
           }
         });
         r.push({ ...start, maxR: 30, propagationSpeed: 5, repeatPeriod: 600, color: '#ef4444' }); // massive shockwave
      }
    }


    return { points: p, arcs: a, rings: r };
  }, [mode, chainReaction, timeplay]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Immediate initial measurement
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({
        width: Math.max(rect.width, 320),
        height: Math.max(rect.height, 450)
      });
    }

    const observer = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        for (let entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            setDimensions({
              width: Math.max(entry.contentRect.width, 320),
              height: Math.max(entry.contentRect.height, 450)
            });
          }
        }
      });
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      // WebGL Renderer cleanup for React 19 Strict Mode to prevent context leaks
      if (globeRef.current) {
        try {
          const renderer = (globeRef.current as any).renderer?.();
          if (renderer) {
            renderer.dispose?.();
            renderer.forceContextLoss?.();
          }
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls() as any;
      if (controls) {
        controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
      }
      if(!selectedExchange) {
        globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 1000);
      }
    }
  }, [isPlaying]);

  // Handle focus on exchange click
  useEffect(() => {
     if (globeRef.current && selectedExchange) {
        const target = MARKERS.find(m => m.label === selectedExchange);
        if (target) {
           globeRef.current.pointOfView({ lat: target.lat, lng: target.lng, altitude: 1.2 }, 1500);
        }
     }
  }, [selectedExchange]);

  // Mock timeplay progression if time machine mode
  useEffect(() => {
     if (mode === 'timeMachine' && isPlaying) {
        const int = setInterval(() => {
           setTimeplay(t => (t + 1) % 100);
        }, 1000);
        return () => clearInterval(int);
     }
  }, [mode, isPlaying]);

  const effectiveWidth = Math.max(dimensions.width || 800, 320);
  const effectiveHeight = Math.max(dimensions.height || 500, 450);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[450px] relative cursor-grab active:cursor-grabbing font-sans bg-zinc-950 overflow-hidden">
      {/* 4. Solar Terminator - CSS Overlay representation */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black pointer-events-none" />
      <div className="absolute top-0 right-1/4 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none mix-blend-overlay"></div>

      <Globe
        ref={globeRef as any}
        width={effectiveWidth}
        height={effectiveHeight}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          
          polygonsData={countries.features}
          polygonCapColor={() => 'rgba(0,0,0,0)'}
          polygonSideColor={() => 'rgba(0,0,0,0)'}
          polygonStrokeColor={() => '#cccccc'}
          
          ringsData={rings}
          ringColor={(t: any) => t.color || '#10b981'}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          arcsData={arcs}
          arcColor={(t: any) => t.color}
          arcDashLength={(t:any) => t.dashLength || 0.4}
          arcDashGap={2}
          arcDashInitialGap={() => Math.random() * 5}
          arcDashAnimateTime={2000}
          arcAltitudeAutoScale={(t:any) => t.altitude || 0.3}

          htmlElementsData={points}
          htmlElement={(d: any) => {
            const el = document.createElement('div');
            // Hide custom styling for tiny 'earnings' particles
            if(d.label === 'Earn') {
               el.innerHTML = `<div class="w-1.5 h-1.5 rounded-full" style="background-color: ${d.color}; box-shadow: 0 0 5px ${d.color};"></div>`;
               return el;
            }

            // Normal Exchanges & Custom nodes
            const isCustom = ['Israel/Gaza', 'Ukraine', 'Taiwan Strait', 'Red Sea', 'Panama Canal', 'Suez Canal', 'Strait of Malacca', 'Oil (Saudi Arabia)', 'Copper (Chile)', 'Lithium (Australia)'].includes(d.label);
            const exchangeData = EXCHANGE_DETAILS[d.label];
            const changeStr = exchangeData ? exchangeData.indices[0]?.change : null;
            const isBullish = changeStr?.startsWith('+');

            el.innerHTML = `
              <div class="flex flex-col items-center cursor-pointer group" style="pointer-events: auto;">
                <div class="w-3 h-3 rounded-full shadow-[0_0_15px_${d.color || '#fff'}] border-[2px] border-zinc-950 transition-transform duration-300 group-hover:scale-150" style="background-color: ${d.color || '#fff'};"></div>
                <div class="mt-2 px-2.5 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border ${isCustom ? 'border-amber-500/30' : 'border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300'} shadow-xl flex flex-col items-center transition-all duration-300 group-hover:-translate-y-1">
                  <span class="text-[10px] font-bold ${isCustom ? 'text-amber-400' : 'text-zinc-100'} whitespace-nowrap tracking-wider">${d.label}</span>
                  ${changeStr ? `<span class="text-[9px] font-mono font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'} mt-0.5">${changeStr}</span>` : ''}
                </div>
              </div>
            `;
            el.onclick = (e) => {
              e.stopPropagation();
              if(EXCHANGE_DETAILS[d.label] || isCustom) {
                 setSelectedExchange(d.label);
              }
            };
            return el;
          }}
        />

      {/* OVERLAYS & UI CONTROLS */}
      
      {/* Top Left: Mode Selector */}
      {showLeftPanel ? (
         <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto custom-scrollbar pointer-events-auto pr-2">
            <div className="bg-zinc-900/60 backdrop-blur-md px-3 py-2 rounded-xl flex items-center justify-between border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>
                <h2 className="text-white font-bold tracking-tight flex items-center gap-2 relative z-10">
                   <Globe2 className="w-5 h-5 text-indigo-400" />
                   Vymx Intelligence
                </h2>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">PRO</span>
                   <button onClick={() => setShowLeftPanel(false)} className="text-zinc-400 hover:text-white p-0.5 rounded bg-zinc-800/50 hover:bg-zinc-700 transition-colors">
                      <X className="w-3 h-3" />
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900/60 backdrop-blur-md p-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 w-full sm:w-64 shadow-xl">
               {[
                 { id: 'default', label: 'Market Intelligence', icon: Globe2 },
                 { id: 'capitalFlows', label: 'Flows (not connected)', icon: Network },
                 { id: 'currencySwap', label: 'FX quote proxies', icon: Coins },
                 { id: 'sectorRotation', label: 'Sector Rotation', icon: Activity },
                 { id: 'earningsSeason', label: 'Earnings data (not connected)', icon: BarChart3 },
                 { id: 'geoRisk', label: 'Geo-risk scenarios', icon: ShieldAlert },
                 { id: 'supplyChain', label: 'Supply-chain locations', icon: Ship },
                 { id: 'commodities', label: 'Commodities', icon: Layers },
                 { id: 'holdings', label: 'Treasury yields / reference nodes', icon: Target },
                 { id: 'correlationWeb', label: 'Correlations (not computed)', icon: Zap },
                 { id: 'timeMachine', label: 'Time Machine (simulation)', icon: Rewind },
                 { id: 'dominoQuiz', label: 'Domino Quiz (educational)', icon: Activity },
               ].map(m => (
                  <button
                     key={m.id}
                     onClick={() => { setMode(m.id as GlobeMode); setChainReaction(null); }}
                     className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                        mode === m.id ? 'bg-indigo-500 text-white shadow-lg border border-indigo-400/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
                     }`}
                  >
                     <m.icon className={`w-3 h-3 ${mode === m.id ? 'text-indigo-200' : 'text-zinc-500'}`} />
                     <span className="truncate">{m.label}</span>
                  </button>
               ))}
            </div>
         </div>
      ) : (
         <button 
            onClick={() => setShowLeftPanel(true)}
            className="absolute top-4 left-4 z-40 pointer-events-auto p-2.5 bg-zinc-900/90 backdrop-blur border border-indigo-500/30 text-indigo-400 rounded-xl shadow-2xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
         >
            <Globe2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Modes</span>
         </button>
      )}

      {(mode === 'geoRisk' || mode === 'supplyChain' || mode === 'commodities' || mode === 'holdings' || mode === 'correlationWeb' || mode === 'capitalFlows' || mode === 'earningsSeason' || mode === 'timeMachine' || mode === 'currencySwap') && (
        <div className="absolute bottom-4 left-4 z-40 max-w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-amber-500/30 bg-zinc-950/90 px-3 py-2 text-[9px] leading-relaxed text-amber-200 shadow-xl pointer-events-none">
          {mode === 'geoRisk'
            ? 'Illustrative geopolitical scenario locations only. This map is not connected to a live conflict, incident or risk-monitoring feed.'
            : mode === 'supplyChain'
              ? 'Reference supply-chain chokepoint locations only. No live disruption, vessel, freight or logistics feed is connected.'
              : mode === 'commodities'
                ? 'Illustrative commodity production locations only. These markers do not represent live production, inventory or shipping flows.'
                : mode === 'holdings'
                  ? 'Exchange markers are reference locations, not your linked brokerage holdings or positions.'
                  : mode === 'correlationWeb'
                    ? 'Correlation arcs are illustrative only; no synchronized historical correlation model is connected.'
                    : mode === 'capitalFlows'
                      ? 'Capital-flow lines are illustrative only. No verified FII/DII, block-deal or cross-border flow dataset is connected.'
                      : mode === 'earningsSeason'
                        ? 'No verified earnings calendar is connected. These markers are not live earnings announcements.'
                        : mode === 'timeMachine'
                          ? 'Historical scenario animation only. This is not a verified historical replay or a backtest.'
                          : 'FX quote proxies only. This view does not provide swap points, forward curves or executable FX pricing.'}
        </div>
      )}

      {/* Top Right: Provider Quote Snapshot & Intelligence Panels */}
      {showPanel ? (
         <div className="absolute top-4 right-4 z-40 max-w-[calc(100vw-2rem)] w-[420px] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-3 pointer-events-auto pr-2">
            {/* AI Narrative Mode Overlay */}
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-3 shadow-2xl relative overflow-hidden group hover:border-indigo-500/60 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50"></div>
               <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                     <Zap className="w-3.5 h-3.5" /> Provider Quote Snapshot
                  </span>
                  <div className="flex items-center gap-2">
                     <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                     <button onClick={() => setShowPanel(false)} className="text-zinc-400 hover:text-white p-0.5 rounded bg-zinc-800/50 hover:bg-zinc-700 transition-colors">
                        <X className="w-3 h-3" />
                     </button>
                  </div>
               </div>
               <p className="text-white text-sm font-semibold leading-tight relative z-10">
                  "{narrativeText}"
               </p>
               <div className="mt-3 flex gap-2 relative z-10">
                  <button className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-600 transition-colors w-full">
                     Trace Flow <ArrowRight className="w-3 h-3" />
                  </button>
               </div>
            </div>

            {/* Economic Sentiment Ticker Tape */}
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-lg overflow-hidden flex relative group h-8 shadow-2xl shrink-0">
               <div className="absolute left-0 top-0 bottom-0 bg-zinc-900 z-10 px-2 flex items-center justify-center border-r border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
                 <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                   <Activity className="w-3 h-3 text-amber-500" /> Feed
                 </span>
               </div>
               <div className="flex animate-marquee whitespace-nowrap items-center px-4 pl-16">
                 <div className="flex items-center gap-6 text-[10px] font-mono">
                   <span className="text-zinc-300"><span className="text-amber-400 font-bold">FED</span> RATE EXPECTATIONS: NOT CONNECTED</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-amber-400 font-bold">COMMODITY NEWS</span>: NOT CONNECTED</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-amber-400 font-bold">FII/DII FLOWS</span>: NOT CONNECTED</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-indigo-400 font-bold">GOLD</span>: SEE PROVIDER QUOTE PANEL</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-amber-400 font-bold">VIX</span>: SEE PROVIDER QUOTE PANEL</span>
                 </div>
               </div>
            </div>

            <VymxIntelligencePanel mode={mode} />
         </div>
      ) : (
         <button 
            onClick={() => setShowPanel(true)}
            className="absolute top-4 right-4 z-40 pointer-events-auto p-2.5 bg-zinc-900/90 backdrop-blur border border-indigo-500/30 text-indigo-400 rounded-xl shadow-2xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
         >
            <Info className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Intel</span>
         </button>
      )}

      {/* Bottom Center: Time Machine Scrubber Overlay */}
      {mode === 'timeMachine' && (
         <div className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-auto animate-in slide-in-from-bottom-5">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
               <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Rewind className="w-3 h-3 text-indigo-400"/> Time Machine</span>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                     {timeplay < 30 ? '2008 Financial Crisis' : timeplay < 60 ? 'COVID-19 Crash (March 2020)' : '2023 Tech Bull Run'}
                  </span>
               </div>
               <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-400">
                     {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <div className="flex-1 flex items-center gap-3">
                     <span className="text-[10px] font-mono text-zinc-500 px-1">1990</span>
                     <div className="relative flex-1 flex items-center">
                         <div className="absolute left-0 right-0 h-1 bg-zinc-800 rounded-full"></div>
                         <div className="absolute left-[30%] w-0.5 h-2 bg-rose-500/50"></div>
                         <div className="absolute left-[60%] w-0.5 h-2 bg-rose-500/50"></div>
                         <input 
                            type="range" 
                            min="0" max="100" 
                            value={timeplay} 
                            onChange={(e) => setTimeplay(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-transparent appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                         />
                     </div>
                     <span className="text-[10px] font-mono text-zinc-500 px-1">Today</span>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Bottom Left: Market Weather */}
      <div className="absolute bottom-6 left-4 z-40 w-64 pointer-events-auto">
         <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 relative overflow-hidden group">
            {weatherPlaying && (
               <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '45%' }}></div>
            )}
            <div className="flex items-start gap-3">
               <button 
                  onClick={() => setWeatherPlaying(!weatherPlaying)}
                  className={`p-2.5 rounded-full transition-colors flex-shrink-0 border ${weatherPlaying ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 group-hover:bg-zinc-700'}`}
               >
                  {weatherPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
               </button>
               <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest flex items-center gap-1.5 mb-1">
                    <CloudLightning className="w-3.5 h-3.5 text-blue-400" /> Market Weather
                  </span>
                  <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug">
                    "{globalWeatherState.summary}"
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Bottom Center: Chain Reaction / Shockwave overlay */}
      <AnimatePresence>
         {chainReaction && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 20 }}
             className="absolute bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-auto"
           >
              <div className="bg-rose-950/80 backdrop-blur-xl border border-rose-500/50 rounded-2xl p-4 shadow-2xl">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 flex items-center gap-1.5"><Network className="w-3.5 h-3.5" /> AI Chain Reaction</span>
                    <button onClick={() => setChainReaction(null)} className="text-rose-500 hover:text-rose-400"><X className="w-4 h-4"/></button>
                 </div>
                 <p className="text-xs text-rose-100/90 leading-relaxed font-medium">
                   {`Scenario selection: ${chainReaction}. This is an educational scenario only; no live event attribution, causal relationship, or 48-hour forecast is available from the connected data.`}
                 </p>
                 <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] font-bold py-1.5 rounded transition-colors uppercase tracking-widest">Generate Hedge Portfolio</button>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Bottom Center: Domino Quiz Interactive Mode */}
      <AnimatePresence>
         {mode === 'dominoQuiz' && quizData && (
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 30 }}
             className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-full max-w-lg pointer-events-auto"
           >
              <div className="bg-amber-950/80 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                 <div className="flex justify-between items-start mb-2">
                   <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-amber-400">
                      Scenario: {quizData.scenarioTitle}
                   </span>
                   <button onClick={() => { setMode('default'); setChainReaction(null); }} className="hover:bg-amber-900 rounded p-0.5 transition-colors"><X className="w-4 h-4 text-amber-500" /></button>
                 </div>
                 <p className="text-amber-50 text-xs font-medium leading-relaxed mb-3">
                    "{quizData.scenarioText}"
                 </p>
                 <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     {quizData.options && quizData.options.map((opt: any, i: number) => (
                       <button key={i} onClick={() => setChainReaction(opt.label)} className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 text-[10px] font-bold py-1.5 rounded hover:bg-zinc-700 transition-colors flex flex-col items-center gap-1">
                         {opt.label}
                       </button>
                     ))}
                   </div>
                   {chainReaction && (
                     <div className="mt-2 p-2 rounded bg-zinc-900/50 border border-amber-500/30">
                        <p className="text-xs text-amber-200">
                          {quizData.options && quizData.options.find((o: any) => o.label === chainReaction)?.correct 
                             ? "Correct! " + quizData.options.find((o: any) => o.label === chainReaction)?.reason 
                             : "Incorrect. " + (quizData.options.find((o: any) => o.label === chainReaction)?.reason || '')}
                        </p>
                     </div>
                   )}
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Info Overlay (Exchange Popup) */}
      <AnimatePresence>
        {selectedExchange && activeExchangeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-96 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl p-5 shadow-2xl z-50 pointer-events-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Globe2 className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono tracking-wider">{selectedExchange} {loadingExchangeData && <span className="text-[9px] text-zinc-500 animate-pulse ml-2">(Fetching Live Data...)</span>}</span>
                </div>
                <h3 className="text-base font-bold text-white leading-tight">{activeExchangeData.name}</h3>
                <span className={`mt-1 inline-flex rounded border px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest ${liveExchangeData ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-amber-500/20 bg-amber-500/5 text-amber-300'}`}>{liveExchangeData ? 'PROVIDER INDEX QUOTE' : 'INDEX QUOTE UNAVAILABLE'}</span>
              </div>
              <button 
                onClick={() => { setSelectedExchange(null); setChainReaction(null); }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 bg-zinc-950/50 border border-zinc-700/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Indices */}
              <div className="space-y-2">
                {exchangeIndices.map((idx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-inner">
                    <span className="text-xs font-semibold text-zinc-300">{idx.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-100">{idx.value}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${idx.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {idx.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <button 
                    onClick={() => setChainReaction(selectedExchange)}
                    className="flex flex-col items-center justify-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 py-2.5 rounded-xl transition-all group"
                 >
                    <Network className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Simulate Shock</span>
                 </button>
                 <button className="flex flex-col items-center justify-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl transition-all group">
                    <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Generate Hedge</span>
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Sentiment (not supplied)</span>
                  <span className="font-bold tracking-tight text-amber-400">
                    {liveExchangeData?.sentiment || 'Not calculated from index quotes'}
                  </span>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Fear / Greed (not supplied)</span>
                  <div className="flex items-center gap-1.5">
                    {fearGreedValue !== null && fearGreedValue > 70 ? <ThermometerSun className="w-3.5 h-3.5 text-emerald-400" /> : <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-400" />}
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                       <div className={`h-full ${fearGreedValue !== null && fearGreedValue > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${fearGreedValue ?? 0}%` }}></div>
                    </div>
                    <span className="font-mono font-bold text-zinc-300 text-[10px]">{fearGreedValue == null ? 'Not supplied' : fearGreedValue}</span>
                  </div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Daily Volume</span>
                  <span className="font-mono font-bold text-zinc-200">{liveExchangeData?.volume || 'Not supplied'}</span>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Leading Sector</span>
                  <span className="font-bold text-zinc-200 truncate">{liveExchangeData?.topSector || 'Not supplied'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Top gainers (not supplied)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(liveExchangeData?.gainers) ? liveExchangeData.gainers : []).map((gainer: string, i: number) => (
                    <span key={i} className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1.5 rounded-md shadow-sm">
                      {gainer}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded w-fit">
                  <Newspaper className="w-3 h-3" /> Exchange news (not connected)
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 mt-2">
                  "{liveExchangeData?.news || 'No verified exchange-specific news feed is connected.'}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Simple Fallback for generic nodes */}
        {selectedExchange && !activeExchangeData && (
          <motion.div
             initial={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(5px)' }}
             animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
             exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(5px)' }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl p-5 shadow-2xl z-50 pointer-events-auto"
          >
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-2 text-indigo-400">
                  <Globe2 className="w-4 h-4" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{selectedExchange} {loadingExchangeData && <span className="text-[9px] text-zinc-500 animate-pulse ml-2">(Fetching Live Data...)</span>}</span>
               </div>
               <button 
                  onClick={() => setSelectedExchange(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
               >
                  <X className="w-4 h-4" />
               </button>
             </div>
             
             {liveExchangeData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 font-medium">Sentiment</span>
                      <span className="font-bold tracking-tight text-white">Not calculated from index quotes</span>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 font-medium">Leading sector</span>
                      <span className="font-bold text-white truncate">Not supplied by this feed</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded w-fit">
                      <Newspaper className="w-3 h-3" /> Exchange news unavailable
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 mt-2">
                      "No verified exchange-specific news provider is connected."
                    </p>
                  </div>
                  <button onClick={() => setChainReaction(selectedExchange)} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-indigo-600 transition-colors uppercase tracking-widest">
                    <Network className="w-4 h-4" /> Trace Shockwave
                  </button>
                </div>
             ) : (
                <>
                  <p className="text-xs text-zinc-400 mt-4 leading-relaxed bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-medium">
                    No verified quote or exchange-specific data is available for this exchange. The marker shows location only.
                  </p>
                </>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

