import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, TrendingUp, TrendingDown, Activity, Newspaper, BarChart3, Globe2, Zap, Network, ShieldAlert, Ship, Coins, ThermometerSnowflake, ThermometerSun, Play, Pause, Rewind, FastForward, Volume2, Target, CloudLightning, Layers, ArrowRight, Database, RefreshCw } from 'lucide-react';
import VymxIntelligencePanel from './VymxIntelligencePanel';
import { useMarketState } from '../contexts/MarketStateContext';

const EXCHANGE_DETAILS: Record<string, any> = {
  'NYSE': {
    name: 'New York Stock Exchange',
    indices: [{ name: 'S&P 500', value: '5,123.41', change: '+1.2%' }],
    sentiment: 'Bullish (Risk On)',
    fearAndGreed: 76,
    gainers: ['NVDA (+4.2%)', 'MSFT (+1.8%)', 'META (+2.1%)'],
    news: 'Fed signals potential rate cut in upcoming quarter.',
    volume: '3.8B Shares',
    topSector: 'Technology'
  },
  'NSE': {
    name: 'National Stock Exchange (India)',
    indices: [{ name: 'Nifty 50', value: '22,514.65', change: '+0.8%' }],
    sentiment: 'Cautiously Optimistic',
    fearAndGreed: 62,
    gainers: ['RELIANCE (+2.3%)', 'TCS (+1.1%)', 'HDFCBANK (+0.9%)'],
    news: 'Indian GDP growth exceeds expectations at 8.4%.',
    volume: '2.1B Shares',
    topSector: 'Financials'
  },
  'LSE': {
    name: 'London Stock Exchange',
    indices: [{ name: 'FTSE 100', value: '7,952.62', change: '-0.3%' }],
    sentiment: 'Neutral',
    fearAndGreed: 51,
    gainers: ['AZN (+1.2%)', 'SHEL (+0.5%)'],
    news: 'Bank of England maintains interest rates at 5.25%.',
    volume: '950M Shares',
    topSector: 'Energy'
  },
  'TSE': {
    name: 'Tokyo Stock Exchange',
    indices: [{ name: 'Nikkei 225', value: '39,120.50', change: '+2.1%' }],
    sentiment: 'Strongly Bullish',
    fearAndGreed: 84,
    gainers: ['TOYOTA (+3.5%)', 'SONY (+2.1%)'],
    news: 'BOJ hints at ending negative interest rate policy.',
    volume: '1.4B Shares',
    topSector: 'Consumer Cyclical'
  },
  'HKEX': {
    name: 'Hong Kong Exchange',
    indices: [{ name: 'Hang Seng', value: '16,589.44', change: '-1.5%' }],
    sentiment: 'Bearish',
    fearAndGreed: 35,
    gainers: ['TENCENT (+0.8%)', 'ALIBABA (-2.1%)'],
    news: 'Tech sector faces renewed regulatory pressures.',
    volume: '1.2B Shares',
    topSector: 'Technology'
  },
  'SGX': {
    name: 'Singapore Exchange',
    indices: [{ name: 'STI', value: '3,137.66', change: '+0.4%' }],
    sentiment: 'Neutral',
    fearAndGreed: 55,
    gainers: ['DBS (+1.1%)', 'SINGTEL (+0.6%)'],
    news: 'Monetary Authority of Singapore targets core inflation.',
    volume: '300M Shares',
    topSector: 'Financials'
  },
  'ASX': {
    name: 'Australian Securities Exchange',
    indices: [{ name: 'ASX 200', value: '7,733.50', change: '+0.7%' }],
    sentiment: 'Moderate Bullish',
    fearAndGreed: 65,
    gainers: ['BHP (+1.4%)', 'RIO (+1.1%)'],
    news: 'Commodity prices boost mining sector performance.',
    volume: '600M Shares',
    topSector: 'Basic Materials'
  },
  'DIFC': {
    name: 'Dubai Financial Market',
    indices: [{ name: 'DFMGI', value: '4,215.11', change: '+0.9%' }],
    sentiment: 'Optimistic',
    fearAndGreed: 68,
    gainers: ['EMIRATES NBD (+1.5%)', 'EMAAR (+1.2%)'],
    news: 'Real estate sector drives market rally to multi-year highs.',
    volume: '450M Shares',
    topSector: 'Real Estate'
  },
  'B3': {
    name: 'B3 - Brasil Bolsa Balcão',
    indices: [{ name: 'Ibovespa', value: '128,100.20', change: '-0.5%' }],
    sentiment: 'Neutral Bearish',
    fearAndGreed: 45,
    gainers: ['PETR4 (+0.5%)', 'VALE3 (-1.2%)'],
    news: 'Fiscal concerns weigh on investor sentiment.',
    volume: '750M Shares',
    topSector: 'Energy'
  },
  'JSE': {
    name: 'Johannesburg Stock Exchange',
    indices: [{ name: 'JSE Top 40', value: '68,200.40', change: '+0.2%' }],
    sentiment: 'Neutral',
    fearAndGreed: 50,
    gainers: ['NPN (+0.8%)', 'FSR (+0.4%)'],
    news: 'Precious metals seeing increased tracking volume.',
    volume: '250M Shares',
    topSector: 'Mining'
  },
  'TSX': {
    name: 'Toronto Stock Exchange',
    indices: [{ name: 'S&P/TSX', value: '21,450.31', change: '+0.6%' }],
    sentiment: 'Bullish',
    fearAndGreed: 70,
    gainers: ['RY (+0.9%)', 'ABX (+1.4%)'],
    news: 'Bank earnings exceed analyst estimates.',
    volume: '550M Shares',
    topSector: 'Financials'
  }
};

const MARKERS = [
  { label: 'NYSE', lat: 40.7128, lng: -74.0060, risk: 'extreme' },
  { label: 'LSE', lat: 51.5074, lng: -0.1278, risk: 'high' },
  { label: 'TSE', lat: 35.6895, lng: 139.6917, risk: 'medium' },
  { label: 'NSE', lat: 19.0760, lng: 72.8777, risk: 'low' },
  { label: 'HKEX', lat: 22.3193, lng: 114.1694, risk: 'high' },
  { label: 'SGX', lat: 1.3521, lng: 103.8198, risk: 'low' },
  { label: 'ASX', lat: -33.8688, lng: 151.2093, risk: 'medium' },
  { label: 'DIFC', lat: 25.2048, lng: 55.2708, risk: 'high' },
  { label: 'B3', lat: -23.5505, lng: -46.6333, risk: 'medium' },
  { label: 'JSE', lat: -26.2041, lng: 28.0473, risk: 'low' },
  { label: 'TSX', lat: 43.6532, lng: -79.3832, risk: 'low' },
].map(m => {
  const isBullish = EXCHANGE_DETAILS[m.label]?.indices[0]?.change.startsWith('+');
  return {
    ...m,
    isBullish,
    color: isBullish ? '#10b981' : '#ef4444' // Green for bullish, Red for bearish
  };
});

type GlobeMode = 'default' | 'capitalFlows' | 'geoRisk' | 'supplyChain' | 'commodities' | 'sectorRotation' | 'holdings' | 'earningsSeason' | 'timeMachine' | 'correlationWeb' | 'dominoQuiz' | 'currencySwap';

export default function MarketGlobe3D() {
  const globeRef = useRef<GlobeMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
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

  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState(new Date());

  const refreshGlobalData = () => {
    setIsDataRefreshing(true);
    // Simulate complex background data routing for Capital Flows, Currency Swaps, etc.
    setTimeout(() => {
       setDataLastUpdated(new Date());
       setIsDataRefreshing(false);
    }, 1500);
  };

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
  const [narrativeText, setNarrativeText] = useState("AI Hardware Setup: Aggressive rotation from US Software into Asian Semiconductor manufacturing detected.");
  const [liveExchangeData, setLiveExchangeData] = useState<any>(null);
  const [loadingExchangeData, setLoadingExchangeData] = useState(false);

  useEffect(() => {
    if (quizActive && !quizData) {
      fetch('/api/ai/quiz').then(r => r.json()).then(setQuizData).catch(() => {});
    }
  }, [quizActive, quizData]);

  useEffect(() => {
    fetch('/api/ai/narrative').then(r => r.json()).then(data => setNarrativeText(data.text)).catch(() => {});
  }, []);

  const activeExchangeData = selectedExchange ? EXCHANGE_DETAILS[selectedExchange] : null;

  useEffect(() => {
     if (selectedExchange) {
        setLoadingExchangeData(true);
        setLiveExchangeData(null);
        fetch(`/api/ai/exchange-latest?exchange=${selectedExchange}`)
          .then(r => r.json())
          .then(data => {
            setLiveExchangeData(data);
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
                 lat: m.lat + (0 - 0.5) * 5,
                 lng: m.lng + (0 - 0.5) * 5,
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

    // Whale Tracker sporadic random massive rings
    if (mode === 'default' && timeplay % 15 === 0) { // Using timeplay as a simple counter mock
       const whale = MARKERS[Math.floor(0 * MARKERS.length)];
       r.push({ ...whale, maxR: 25, propagationSpeed: 4, repeatPeriod: 1000, color: '#a855f7' });
    }

    return { points: p, arcs: a, rings: r };
  }, [mode, chainReaction, timeplay]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
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
  }, [globeRef.current, isPlaying]);

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

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing font-sans bg-zinc-950 overflow-hidden">
      {/* 4. Solar Terminator - CSS Overlay representation */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black pointer-events-none" />
      <div className="absolute top-0 right-1/4 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none mix-blend-overlay"></div>

      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef as any}
          width={dimensions.width}
          height={dimensions.height}
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
          arcDashInitialGap={() => 0 * 5}
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
      )}

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
                 { id: 'capitalFlows', label: 'Capital Flows', icon: Network },
                 { id: 'currencySwap', label: 'Currency Swaps', icon: Coins },
                 { id: 'sectorRotation', label: 'Sector Rotation', icon: Activity },
                 { id: 'earningsSeason', label: 'Earnings Season', icon: BarChart3 },
                 { id: 'geoRisk', label: 'Geo Risk', icon: ShieldAlert },
                 { id: 'supplyChain', label: 'Supply Chain', icon: Ship },
                 { id: 'commodities', label: 'Commodities', icon: Layers },
                 { id: 'holdings', label: 'My Holdings', icon: Target },
                 { id: 'correlationWeb', label: 'Correlations', icon: Zap },
                 { id: 'timeMachine', label: 'Time Machine', icon: Rewind },
                 { id: 'dominoQuiz', label: 'Domino Quiz', icon: Activity },
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

      {/* Top Right: AI Narrative & Detailed Intelligence Panels */}
      {showPanel ? (
         <div className="absolute top-4 right-4 z-40 max-w-[calc(100vw-2rem)] w-[420px] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-3 pointer-events-auto pr-2">
            {/* AI Narrative Mode Overlay */}
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-3 shadow-2xl relative overflow-hidden group hover:border-indigo-500/60 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50"></div>
               <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                     <Zap className="w-3.5 h-3.5" /> Macro Narrative
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
                   <Activity className="w-3 h-3 text-amber-500" /> Live
                 </span>
               </div>
               <div className="flex animate-marquee whitespace-nowrap items-center px-4 pl-16">
                 <div className="flex items-center gap-6 text-[10px] font-mono">
                   <span className="text-zinc-300"><span className="text-emerald-400 font-bold">FED</span> RATE CUT PROB +12.4%</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-rose-400 font-bold">CRUDE</span> BREAKS $85/BBL (-2.1%)</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-amber-400 font-bold">NIFTY50</span> FII INFLOWS +$2.4B</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-indigo-400 font-bold">GOLD</span> ALL-TIME HIGH IMMINENT</span>
                   <span className="text-zinc-600">•</span>
                   <span className="text-zinc-300"><span className="text-emerald-400 font-bold">VIX</span> CRUSH TO 13.2</span>
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
                   "A massive shock originating in {chainReaction} is generating correlated drawdowns across emerging markets. Predict: Severe capital flight hurting Brazilian Real and Indian IT exports over the next 48 hours."
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
                {activeExchangeData.indices.map((idx: any, i: number) => (
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
                  <span className="text-[10px] text-zinc-500 font-medium">Sentiment Aura</span>
                  <span className={`font-bold tracking-tight ${activeExchangeData.sentiment.includes('Bullish') ? 'text-emerald-400' : activeExchangeData.sentiment.includes('Bearish') ? 'text-rose-400' : 'text-amber-400'}`}>
                    {liveExchangeData ? liveExchangeData.sentiment : activeExchangeData.sentiment}
                  </span>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Fear / Greed</span>
                  <div className="flex items-center gap-1.5">
                    {activeExchangeData.fearAndGreed > 70 ? <ThermometerSun className="w-3.5 h-3.5 text-emerald-400" /> : <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-400" />}
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                       <div className={`h-full ${activeExchangeData.fearAndGreed > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${activeExchangeData.fearAndGreed}%` }}></div>
                    </div>
                    <span className="font-mono font-bold text-zinc-300 text-[10px]">{activeExchangeData.fearAndGreed}</span>
                  </div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Daily Volume</span>
                  <span className="font-mono font-bold text-zinc-200">{activeExchangeData.volume}</span>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">Leading Sector</span>
                  <span className="font-bold text-zinc-200 truncate">{liveExchangeData ? liveExchangeData.topSector : activeExchangeData.topSector}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Top Gainers
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeExchangeData.gainers.map((gainer: string, i: number) => (
                    <span key={i} className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1.5 rounded-md shadow-sm">
                      {gainer}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded w-fit">
                  <Newspaper className="w-3 h-3" /> {liveExchangeData ? 'Live Event Intelligence' : 'Event Intelligence'}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 mt-2">
                  "{liveExchangeData ? liveExchangeData.news : activeExchangeData.news}"
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
                      <span className="text-[10px] text-zinc-500 font-medium">Live Sentiment</span>
                      <span className="font-bold tracking-tight text-white">{liveExchangeData.sentiment}</span>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-2.5 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 font-medium">Impacted Sector</span>
                      <span className="font-bold text-white truncate">{liveExchangeData.topSector}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300">
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded w-fit">
                      <Newspaper className="w-3 h-3" /> Live Event Alert
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 mt-2">
                      "{liveExchangeData.news}"
                    </p>
                  </div>
                  <button onClick={() => setChainReaction(selectedExchange)} className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-indigo-600 transition-colors uppercase tracking-widest">
                    <Network className="w-4 h-4" /> Trace Shockwave
                  </button>
                </div>
             ) : (
                <>
                  <p className="text-xs text-zinc-400 mt-4 leading-relaxed bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-medium">
                    Waiting for Vymx Intelligence to lock onto region data flow...
                  </p>
                </>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
