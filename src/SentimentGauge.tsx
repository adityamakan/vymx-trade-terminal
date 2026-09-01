import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Sparkles, 
  Info, 
  Activity, 
  HelpCircle, 
  DollarSign, 
  Layers, 
  TrendingUp as BulletUp,
  X,
  Gauge
} from 'lucide-react';
import { assets as staticAssets } from '../data';
import { Asset } from '../types';
import Markdown from 'react-markdown';

interface SentimentGaugeProps {
  onSelectAssetBySymbol?: (symbol: string) => void;
  assets?: Asset[];
}

export default function SentimentGauge({ onSelectAssetBySymbol, assets = staticAssets }: SentimentGaugeProps) {
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'standard' | 'risk_off'>('standard');
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [newsClickOverlayText, setNewsClickOverlayText] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [sentimentExplanation, setSentimentExplanation] = useState<string>('');

  // Suffix/Trageting dynamic state for simulation
  const [simulationMultiplier, setSimulationMultiplier] = useState<number>(1.0); // Allow manual calibration!

  // 1. Dynamic Sentiment Calculator based on current live prices/changes of different asset classes
  const computedSentiment = useMemo(() => {
    // A. Indices & Stock Momentum Sub-indicator
    const equitiesSubset = assets.filter(a => a.type === 'stock' || a.type === 'index');
    const eqAvgChange = equitiesSubset.length > 0 
      ? equitiesSubset.reduce((sum, item) => sum + item.change, 0) / equitiesSubset.length 
      : 0;
    // Map avg change % to score (0 - 100). Avg change around 0% is 50. +2% or more is Extreme Greed.
    // eqScore = 50 + (avgChange * 15). Clamped 5-95
    let eqScore = 50 + (eqAvgChange * 18 * simulationMultiplier);
    eqScore = Math.max(5, Math.min(95, eqScore));

    // B. Crypto Velocity Sub-indicator
    const cryptoSubset = assets.filter(a => a.type === 'crypto');
    const cryptoAvgChange = cryptoSubset.length > 0 
      ? cryptoSubset.reduce((sum, item) => sum + item.change, 0) / cryptoSubset.length 
      : 0;
    // Cryptocurrencies are 3x more volatile, so scale appropriately:
    // score = 50 + (avgChange * 6). Clamped 5-95
    let cryptoScore = 50 + (cryptoAvgChange * 7 * simulationMultiplier);
    cryptoScore = Math.max(5, Math.min(95, cryptoScore));

    // C. Safe Haven Hedge Premium Sub-indicator (Gold Spot)
    const goldAsset = assets.find(a => a.symbol === 'GC=F');
    const spxAsset = assets.find(a => a.symbol === '.SPX');
    const goldChange = goldAsset ? goldAsset.change : 0;
    const spxChange = spxAsset ? spxAsset.change : 0;
    
    // Inverse relationship: standard stock outperformance over safe-havens signals greed.
    // Gold outperformance over stocks signals fear/protective capital allocation.
    const safeHavenGap = (spxChange - goldChange);
    let safeHavenScore = 50 + (safeHavenGap * 15 * simulationMultiplier);
    safeHavenScore = Math.max(5, Math.min(95, safeHavenScore));

    // D. Market Volume Breadth Sub-indicator (Advance vs. Decline Index)
    const totalAssetsCount = assets.length;
    const advancingAssets = assets.filter(a => a.change > 0).length;
    const advancingRatio = totalAssetsCount > 0 ? advancingAssets / totalAssetsCount : 0.5;
    
    // E. Top 5 Assets Volatility & Volume Sub-indicator
    // We sort the top 5 most volatile/traded assets (using change as a proxy for volatility)
    const sortedAssets = [...assets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
    const top5AvgVolatility = sortedAssets.reduce((sum, item) => sum + Math.abs(item.change), 0) / 5;
    
    // Convert volatility (e.g., 0-5% avg) into a 0-100 score. High volatility + high volume = extreme fear or greed
    // We'll map it such that higher volatility increases the extreme nature of the score.
    let top5VolScore = (top5AvgVolatility * 20 * simulationMultiplier);
    top5VolScore = Math.max(5, Math.min(95, top5VolScore));
    
    // Add volume breadth to the mix
    let volumeBreadthScore = advancingRatio * 100 * simulationMultiplier;

    volumeBreadthScore = Math.max(5, Math.min(95, volumeBreadthScore));

    // Combined index weighted
    let finalScore = 50;
    if (activeAnalysisMode === 'standard') {
      // Balanced portfolio weight
      finalScore = (eqScore * 0.25) + (cryptoScore * 0.15) + (safeHavenScore * 0.20) + (volumeBreadthScore * 0.20) + (top5VolScore * 0.20);
    } else {
      // Risk-Off / Safe Haven Heavy formula: heavily penalizes standard stock/crypto growth to highlight gold hedges
      finalScore = (safeHavenScore * 0.45) + (eqScore * 0.15) + (cryptoScore * 0.10) + (volumeBreadthScore * 0.15) + (top5VolScore * 0.15);
    }

    // Clamp absolute limits
    finalScore = Math.round(Math.max(1, Math.min(99, finalScore)));

    // Categorization
    let statusText = 'Neutral';
    let colorClass = 'text-yellow-400';
    let strokeColor = '#eab308';
    let gradientFrom = 'from-yellow-450';
    let adviceText = 'Markets remain in dynamic equilibrium with minimal momentum outliers.';

    if (finalScore <= 25) {
      statusText = 'Extreme Fear';
      colorClass = 'text-rose-500';
      strokeColor = '#ef4444';
      gradientFrom = 'from-rose-500';
      adviceText = 'Severe protective hedging detected. Potential systematic accumulation discounts are opening up.';
    } else if (finalScore <= 45) {
      statusText = 'Fear';
      colorClass = 'text-amber-550';
      strokeColor = '#f97316';
      gradientFrom = 'from-amber-500';
      adviceText = 'Traders are actively trimming high-beta exposure. Conservative cash reserves are expanding.';
    } else if (finalScore <= 55) {
      statusText = 'Neutral';
      colorClass = 'text-yellow-450';
      strokeColor = '#eab308';
      gradientFrom = 'from-yellow-500';
      adviceText = 'Consolidation phase. Wait for breakout confirmations on high volume.';
    } else if (finalScore <= 75) {
      statusText = 'Greed';
      colorClass = 'text-lime-400';
      strokeColor = '#84cc16';
      gradientFrom = 'from-lime-400';
      adviceText = 'Bullish accumulation momentum. Be careful of buying highly overextended parabolic peaks.';
    } else {
      statusText = 'Extreme Greed';
      colorClass = 'text-emerald-400';
      strokeColor = '#10b981';
      gradientFrom = 'from-emerald-400';
      adviceText = 'Unchecked speculative volume. Consider taking structured profits into high strength.';
    }

    return {
      score: finalScore,
      status: statusText,
      color: colorClass,
      stroke: strokeColor,
      gradient: gradientFrom,
      advice: adviceText,
      metrics: {
        equities: Math.round(eqScore),
        crypto: Math.round(cryptoScore),
        safeHaven: Math.round(safeHavenScore),
        top5: Math.round(top5VolScore),
        breadth: Math.round(volumeBreadthScore)
      },
      advancingCount: advancingAssets,
      decliningCount: totalAssetsCount - advancingAssets,
      totalCount: totalAssetsCount
    };
  }, [activeAnalysisMode, simulationMultiplier, assets]);

  // Recalculating simulation
  const handleRecalculate = () => {
    setIsRecalculating(true);
    // Mimic deep database network sweep
    setTimeout(() => {
      setIsRecalculating(false);
    }, 900);
  };

  // Custom simulation adjusters for playground engagement!
  const adjustSentiment = (direction: 'up' | 'down') => {
    setSimulationMultiplier(prev => {
      let next = direction === 'up' ? prev + 0.15 : prev - 0.15;
      if (next < 0.2) next = 0.2;
      if (next > 2.0) next = 2.0;
      return parseFloat(next.toFixed(2));
    });
  };

  const handleResetMultiplier = () => {
    setSimulationMultiplier(1.0);
  };

  // AI Sentiment briefing using real server-side prompt!
  const handleConsultAiSentiment = async () => {
    setShowExplanationModal(true);
    setSentimentExplanation('');
    setIsAiLoading(true);

    try {
      // Trigger Gemini content creator proxy
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: 'FGI-INDEX',
          name: `Vymx Sentiment Gauge (${computedSentiment.status})`,
          type: 'complex macroeconomic sentiment indices',
          price: computedSentiment.score,
          change: parseFloat(((computedSentiment.score - 50) / 50 * 100).toFixed(2)),
          analysisType: 'newsSentiment'
        }),
      });

      const data = await response.json();
      if (data.error) {
        setSentimentExplanation(`AI strategist is currently unavailable: ${data.error}`);
      } else {
        setSentimentExplanation(data.content);
      }
    } catch (err: any) {
      setSentimentExplanation(`Connectivity issue: ${err.message || 'Server timeout'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Needle angle for SVG: map 0 to -90deg and 100 to +90deg (or from -85 to +85 to keep in bonds)
  const needleAngle = useMemo(() => {
    const minAngle = -90;
    const maxAngle = 90;
    return minAngle + (computedSentiment.score / 100) * (maxAngle - minAngle);
  }, [computedSentiment.score]);

  return (
    <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-5 space-y-4 shadow-xl" id="sentiment-gauge-card">
      
      {/* 1. Header with Recalculator */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3" id="sentiment-gauge-header">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-100">Fear & Greed Index</h2>
            <span className="text-[9px] font-mono text-zinc-550 block">Market Breadth Pulse</span>
          </div>
        </div>
        
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="p-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-400 transition-all flex items-center gap-1 text-[9px] font-mono uppercase border border-zinc-850 cursor-pointer disabled:opacity-50"
          title="Recalculate live financial parameters"
        >
          <RefreshCw className={`h-3 w-3 text-emerald-400 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>{isRecalculating ? 'Evaluating' : 'Recalc'}</span>
        </button>
      </div>

      {/* 2. Graphical Gauging Ring Box */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1 relative" id="gauge-display-arena">
        
        {/* Arc representation SVG */}
        <div className="w-56 h-32 relative">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" /> {/* Red / Fear */}
                <stop offset="30%" stopColor="#f97316" /> {/* Orange */}
                <stop offset="50%" stopColor="#eab308" /> {/* Yellow */}
                <stop offset="70%" stopColor="#84cc16" /> {/* Lime */}
                <stop offset="100%" stopColor="#10b981" /> {/* Emerald / Greed */}
              </linearGradient>
            </defs>

            {/* Inner background track arc */}
            <path 
              d="M 10,48 A 40,40 0 0,1 90,48" 
              fill="none" 
              stroke="#1b1b1f" 
              strokeWidth="10" 
              strokeLinecap="round" 
            />

            {/* Colored gradient overlay track */}
            <path 
              d="M 10,48 A 40,40 0 0,1 90,48" 
              fill="none" 
              stroke="url(#gaugeGradient)" 
              strokeWidth="9" 
              strokeLinecap="round" 
              className="opacity-90"
            />

            {/* Indicator tick landmarks */}
            <circle cx="10" cy="48" r="1.5" fill="#ef4444" />
            <circle cx="50" cy="8" r="1.5" fill="#eab308" />
            <circle cx="90" cy="48" r="1.5" fill="#10b981" />

            {/* Center Pivot Point anchor */}
            <circle cx="50" cy="48" r="4.5" fill="#52525b" />
            <circle cx="50" cy="48" r="1.5" fill="#fafafa" />

            {/* Pivot Needle Indicator */}
            <g transform={`rotate(${needleAngle}, 50, 48)`}>
              <line 
                x1="50" 
                y1="48" 
                x2="50" 
                y2="12" 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="transition-transform duration-700 ease-out drop-shadow-lg"
              />
              <polygon points="48.5,42 51.5,42 50,8" fill="#ffffff" />
            </g>
          </svg>
          
          {/* Centered Absolute values readouthub */}
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black font-mono tracking-tight text-white">{computedSentiment.score}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${computedSentiment.color} mt-0.5 leading-none`}>
              {computedSentiment.status}
            </span>
          </div>
        </div>

        {/* Dynamic description of current range */}
        <p className="text-[10px] text-zinc-400 text-center px-4 font-sans leading-relaxed mt-2.5">
          {computedSentiment.advice}
        </p>

        {/* Mode options */}
        <div className="flex bg-zinc-900/60 border border-zinc-850 p-1 rounded-lg w-full mt-4 text-[9px] font-mono">
          <button 
            onClick={() => setActiveAnalysisMode('standard')}
            className={`flex-1 py-1 text-center rounded-md font-bold transition-all cursor-pointer ${
              activeAnalysisMode === 'standard' ? 'bg-zinc-950 text-white shadow border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300' : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            Terminal Standard Weights
          </button>
          <button 
            onClick={() => setActiveAnalysisMode('risk_off')}
            className={`flex-1 py-1 text-center rounded-md font-bold transition-all cursor-pointer ${
              activeAnalysisMode === 'risk_off' ? 'bg-zinc-950 text-white shadow border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300' : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            Safe-Haven Outperformance
          </button>
        </div>
      </div>

      {/* 3. Sub-indicator breakdown meters */}
      <div className="space-y-2 border-t border-zinc-900 pt-3" id="sentiment-breakdown-panel">
        <span className="text-[8.5px] font-bold font-mono text-zinc-500 uppercase tracking-widest block">
          Sector Sentiment Velocities
        </span>

        {/* Meter row: Equities Strength */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-zinc-400">1. Equities Momentum</span>
            <span className="font-bold text-zinc-200">{computedSentiment.metrics.equities} / 100</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${computedSentiment.metrics.equities}%` }} 
              className={`h-full transition-all duration-500 bg-amber-500`}
            />
          </div>
        </div>

        {/* Meter row: Crypto Velocity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-zinc-400">2. Crypto Volatility Velocity</span>
            <span className="font-bold text-zinc-200">{computedSentiment.metrics.crypto} / 100</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${computedSentiment.metrics.crypto}%` }} 
              className="h-full transition-all duration-500 bg-violet-500"
            />
          </div>
        </div>

        {/* Meter row: Gold Safe-Haven gap */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-zinc-400">3. Metal Hedge Gap Ratio</span>
            <span className="font-bold text-zinc-200">{computedSentiment.metrics.safeHaven} / 100</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${computedSentiment.metrics.safeHaven}%` }} 
              className="h-full transition-all duration-500 bg-cyan-500"
            />
          </div>
        </div>

        
        <div className="flex items-center justify-between mt-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Top 5 Volatility & Volume</p>
              <p className="text-xs text-zinc-500">Gauge uses top 5 asset momentum.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{computedSentiment.metrics.top5}<span className="text-xs text-zinc-500 font-normal">/100</span></p>
          </div>
        </div>
        
        {/* Meter row: Volume breadth index */}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-zinc-400">4. Market Advance/Decline Rate</span>
            <span className="font-bold text-zinc-200">{computedSentiment.metrics.breadth} / 100</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${computedSentiment.metrics.breadth}%` }} 
              className="h-full transition-all duration-500 bg-indigo-500"
            />
          </div>
        </div>

        {/* Advancing/Declining ratio numbers */}
        <div className="text-[8px] font-mono text-zinc-600 flex items-center justify-between pt-1">
          <span>Advancing tickers: {computedSentiment.advancingCount}</span>
          <span>Declining: {computedSentiment.decliningCount}</span>
        </div>
      </div>

      {/* 4. AI Strategic Consultation & Playground Sliders */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-3 space-y-3" id="sentiment-strategic-adviser">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[8.5px] font-bold text-zinc-550 font-mono uppercase tracking-wider">
            <Activity className="h-3 w-3 text-emerald-400" /> Sentiment Simulator
          </div>
          {simulationMultiplier !== 1.0 && (
            <button 
              onClick={handleResetMultiplier} 
              className="text-[8px] text-zinc-500 hover:text-rose-450 underline cursor-pointer"
            >
              Reset Scale
            </button>
          )}
        </div>

        {/* Playground controls to force simulated crash or pump to show state responsiveness! */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustSentiment('down')}
            className="flex-1 py-1 rounded bg-zinc-950 hover:bg-zinc-900 text-[10px] font-bold font-mono text-rose-500 border border-zinc-850 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 transition cursor-pointer flex items-center justify-center gap-0.5"
            title="Simulate fear/panic market dump"
          >
            <TrendingDown className="h-3 w-3" /> Simulate Dump
          </button>
          <button
            onClick={() => adjustSentiment('up')}
            className="flex-1 py-1 rounded bg-zinc-950 hover:bg-zinc-900 text-[10px] font-bold font-mono text-emerald-500 border border-zinc-850 hover:border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 transition cursor-pointer flex items-center justify-center gap-0.5"
            title="Simulate greed/parabolic market pump"
          >
            <TrendingUp className="h-3 w-3" /> Simulate Pump
          </button>
        </div>

        {/* Consult AI Button */}
        <button
          onClick={handleConsultAiSentiment}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-600 text-[10px] font-bold font-mono uppercase tracking-wider text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500/20"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
          Consult AI Strategist Brief
        </button>
      </div>

      {/* --- AI Sentiment consultation modal --- */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in select-text">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider font-mono">VYMX AI PORTFOLIO STRATEGIST</span>
                <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2 mt-0.5">
                  <Gauge className="h-4 w-4 text-indigo-400" />
                  Dynamic Market Sentiment Assessment Brief
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Index Score: <span className="font-bold text-white">{computedSentiment.score}</span>/100 • Zone: <strong className={computedSentiment.color}>{computedSentiment.status.toUpperCase()}</strong>
                </p>
              </div>
              <button
                onClick={() => { setShowExplanationModal(false); setSentimentExplanation(''); }}
                className="rounded-lg bg-zinc-900 p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto rounded-xl bg-zinc-900/50 border border-zinc-850 p-4 text-xs text-zinc-300 leading-relaxed font-sans">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                  <p className="text-[11px] text-zinc-400 font-mono">Aggregating index parameters & consulting Gemini models...</p>
                </div>
              ) : (
                <div className="space-y-4 markdown-body prose prose-invert prose-sm max-w-none prose-headings:text-white prose-h4:text-xs prose-h4:mt-4 prose-h4:border-b prose-h4:border-zinc-900 prose-h4:pb-1 prose-li:ml-4 prose-li:list-disc prose-li:mt-1 prose-p:mt-1">
                  <Markdown>{sentimentExplanation || ''}</Markdown>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <button
                onClick={() => { setShowExplanationModal(false); setSentimentExplanation(''); }}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 transition"
              >
                Acknowledge Strategy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
