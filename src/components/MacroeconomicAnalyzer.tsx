import React, { useState, useEffect } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  Bot,
  BarChart3,
  Layers,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Compass,
  Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import WorldMonitor from './EconomicCalendar';
import { streamMacroeconomicSummary, streamFinancialChat } from '../lib/gemini';

interface MacroIndicatorsData {
  centralBanks: Record<string, {
    rate: number;
    name: string;
    stance: string;
    nextMeeting: string;
    cutProb: number;
  }>;
  yieldCurve: {
    us10y: number;
    us2y: number;
    us30y: number;
    spread10y2y: number;
    status: string;
    leadTimeMonths: number;
  };
  macroPressures: {
    dxy: number;
    crudeOil: number;
    gold: number;
    vix: number;
    spx: number;
    globalM2YoY: number;
    coreCpiUs: number;
    realInterestRate: number;
  };
}

interface BacktestResult {
  success: boolean;
  regime: {
    id: string;
    name: string;
    description: string;
    duration_months: number;
    fed_funds_start: number;
    fed_funds_end: number;
    cpi_peak: number;
  };
  strategy: {
    id: string;
    name: string;
    description: string;
    weights: Record<string, number>;
  };
  metrics: {
    cagr: number;
    total_return: number;
    ann_vol: number;
    sharpe: number;
    sortino: number;
    max_drawdown: number;
    calmar: number;
    var_95_monthly: number;
    cvar_95_monthly: number;
    skewness: number;
    kurtosis: number;
    beta: number;
    alpha: number;
    correlation_to_benchmark: number;
    win_rate: number;
    wealth_curve: number[];
    drawdown_curve: number[];
  };
  benchmark_metrics: {
    cagr: number;
    total_return: number;
    ann_vol: number;
    sharpe: number;
    max_drawdown: number;
    wealth_curve: number[];
    drawdown_curve: number[];
  };
  asset_contributions: Array<{
    symbol: string;
    weight: number;
    cagr: number;
    vol: number;
    mdd: number;
  }>;
  correlation_matrix: Record<string, Record<string, number>>;
  yield_factors: {
    level: number;
    slope_10y_2y: number;
    curvature: number;
    interpretation: string;
  };
}

export default function MacroeconomicAnalyzer() {
  const [activeTab, setActiveTab] = useState<'indicators' | 'backtest' | 'sovereign' | 'ai_strategist'>('backtest');
  const [indicators, setIndicators] = useState<MacroIndicatorsData | null>(null);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);

  // Backtester states
  const [selectedRegime, setSelectedRegime] = useState('2022_2024_hikes');
  const [selectedStrategy, setSelectedStrategy] = useState('all_weather');
  const [isCustomAllocation, setIsCustomAllocation] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({
    SPY: 30,
    TLT: 35,
    GLD: 15,
    DBC: 10,
    DXY: 10,
    BTC: 0
  });

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);

  // AI Strategist & Indicator Summary States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [indicatorSummary, setIndicatorSummary] = useState<string>('');
  const [isGeneratingIndicatorSummary, setIsGeneratingIndicatorSummary] = useState(false);

  // Generate real-time indicator AI synthesis
  const generateMacroSummary = async (indData?: MacroIndicatorsData) => {
    const targetData = indData || indicators;
    if (!targetData) return;

    try {
      setIsGeneratingIndicatorSummary(true);
      setIndicatorSummary('');
      await streamMacroeconomicSummary(targetData, (accumulated) => {
        setIndicatorSummary(accumulated);
      });
    } catch (err: any) {
      console.warn('Indicator summary error:', err);
    } finally {
      setIsGeneratingIndicatorSummary(false);
    }
  };

  // Fetch Macro Indicators
  const fetchIndicators = async () => {
    try {
      setIsLoadingIndicators(true);
      const res = await fetch('/api/macro/indicators');
      if (res.ok) {
        const data = await res.json();
        setIndicators(data);
        // Automatically initiate real-time AI macroeconomic summary
        generateMacroSummary(data);
      }
    } catch (err) {
      console.error('Failed to load macro indicators', err);
    } finally {
      setIsLoadingIndicators(false);
    }
  };

  // Run Econometric Backtest via Python backend
  const executeBacktest = async () => {
    try {
      setIsRunningBacktest(true);
      let payloadWeights = null;
      if (isCustomAllocation) {
        const sum = Object.values(customWeights).reduce((a, b) => a + b, 0);
        payloadWeights = Object.fromEntries(
          Object.entries(customWeights).map(([k, v]) => [k, sum > 0 ? v / sum : 0])
        );
      }

      const res = await fetch('/api/macro/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: isCustomAllocation ? 'custom' : selectedStrategy,
          regime: selectedRegime,
          weights: payloadWeights
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBacktestResult(data);
      }
    } catch (err) {
      console.error('Backtest error', err);
    } finally {
      setIsRunningBacktest(false);
    }
  };

  // Run AI Macro Analysis with real-time token streaming
  const handleAskAiStrategist = async (customQ?: string) => {
    const query = customQ || aiPrompt;
    if (!query.trim()) return;

    try {
      setIsAiGenerating(true);
      setAiResponse('');

      const promptContext = `Analyze this macroeconomic scenario with institutional rigor, referencing interest rate transmission channels, sovereign debt dynamics, cross-asset correlations, and optimal multi-asset hedging:\n"${query}"\n\nProvide your assessment in structured sections:\n1. EXECUTIVE MACRO THESIS\n2. TRANSMISSION CHANNELS (Bonds, Equities, Commodities, FX)\n3. HISTORICAL REGIME PRECEDENTS\n4. QUANTITATIVE ALLOCATION & HEDGING RECOMMENDATIONS`;

      await streamFinancialChat(
        promptContext,
        [],
        'Technical Analyst',
        null,
        (partialText) => {
          setAiResponse(partialText);
        }
      );
    } catch (err: any) {
      setAiResponse(`Failed to contact Macro Intelligence Core: ${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
    executeBacktest();
  }, []);

  // Format Recharts wealth and drawdown data
  const chartData = React.useMemo(() => {
    if (!backtestResult?.metrics?.wealth_curve) return [];
    const stratW = backtestResult.metrics.wealth_curve;
    const benchW = backtestResult.benchmark_metrics?.wealth_curve || [];
    const stratD = backtestResult.metrics.drawdown_curve || [];

    return stratW.map((val, idx) => ({
      month: `M${idx + 1}`,
      portfolio: val,
      benchmark: benchW[idx] ?? 100,
      drawdown: stratD[idx] ?? 0
    }));
  }, [backtestResult]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 font-sans text-zinc-100">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Python Econometric Core Active
            </span>
            <span className="text-xs text-zinc-500 font-mono">NumPy · SciPy · Statsmodels · Pandas · yFinance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-indigo-400" />
            VYMXTRADER Macroeconomic Analyzer
          </h1>
          <p className="text-sm text-zinc-400">
            Institutional-grade macroeconomic regime viewer, central bank policy radar, and proven econometric backtesting.
          </p>
        </div>

        {/* Top-level View Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('backtest')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'backtest'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Econometric Backtesting
          </button>
          <button
            onClick={() => setActiveTab('indicators')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'indicators'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Macro Indicators
          </button>
          <button
            onClick={() => setActiveTab('ai_strategist')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ai_strategist'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Macro Strategist
          </button>
          <button
            onClick={() => setActiveTab('sovereign')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'sovereign'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Sovereign Monitor
          </button>
        </div>
      </div>

      {/* TAB 1: ECONOMETRIC REGIME BACKTESTING */}
      {activeTab === 'backtest' && (
        <div className="space-y-6">

          {/* Controls Bar: Regime + Strategy Selection */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Regime Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Historical Macroeconomic Regime
                </label>
                <select
                  value={selectedRegime}
                  onChange={(e) => setSelectedRegime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="2022_2024_hikes">2022-2024 Fed Tightening (+525bps) & Inflation Shock</option>
                  <option value="2020_2021_liquidity_flood">2020-2021 Pandemic Liquidity Flood (QE Infinity)</option>
                  <option value="2008_2009_gfc">2008-2009 Global Financial Crisis & Credit Freeze</option>
                  <option value="stagflation_simulation">1970s Style Structural Stagflation & Supply Shock</option>
                  <option value="2025_2026_ai_capex_tariffs">2025-2026 AI Capex Boom & Tariff / Deglobalization</option>
                </select>
              </div>

              {/* Strategy Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Macro Allocation Strategy
                </label>
                <div className="flex gap-2">
                  <select
                    disabled={isCustomAllocation}
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                  >
                    <option value="all_weather">Ray Dalio All-Weather (30/40/15/7.5/7.5)</option>
                    <option value="macro_60_40">Traditional 60/40 Equity/Bond Benchmark</option>
                    <option value="stagflation_resilient">Stagflation Hard Asset Hedge (Gold/Oil/DXY)</option>
                    <option value="macro_growth_tech">Global Liquidity & Growth (SPY/BTC/Gold)</option>
                  </select>
                  <button
                    onClick={() => setIsCustomAllocation(!isCustomAllocation)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isCustomAllocation
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Execute Action */}
              <div className="flex items-end">
                <button
                  onClick={executeBacktest}
                  disabled={isRunningBacktest}
                  className="w-full h-[38px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isRunningBacktest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Computing Econometrics...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Run Python Econometric Backtest
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Custom Weight Sliders (If enabled) */}
            {isCustomAllocation && (
              <div className="mt-5 pt-4 border-t border-zinc-800/80">
                <div className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Custom Cross-Asset Allocation Weights (Normalized to 100%)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(customWeights).map(([sym, val]) => (
                    <div key={sym} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                        <span>{sym}</span>
                        <span className="text-zinc-200 font-mono">{val}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={val}
                        onChange={(e) => setCustomWeights({ ...customWeights, [sym]: Number(e.target.value) })}
                        className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Regime Overview Details */}
          {backtestResult?.regime && (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Active Macroeconomic Stress Environment</span>
                <h3 className="text-base font-bold text-white mt-0.5">{backtestResult.regime.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-3xl">{backtestResult.regime.description}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono bg-zinc-950/80 px-4 py-2 rounded-lg border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Fed Funds Start/End</span>
                  <span className="text-zinc-200 font-bold">{backtestResult.regime.fed_funds_start}% → {backtestResult.regime.fed_funds_end}%</span>
                </div>
                <div className="border-l border-zinc-800 pl-4">
                  <span className="text-zinc-500 block">CPI Peak</span>
                  <span className="text-rose-400 font-bold">{backtestResult.regime.cpi_peak}%</span>
                </div>
                <div className="border-l border-zinc-800 pl-4">
                  <span className="text-zinc-500 block">Duration</span>
                  <span className="text-zinc-200 font-bold">{backtestResult.regime.duration_months} Months</span>
                </div>
              </div>
            </div>
          )}

          {/* Econometric Key Performance Indicators Grid */}
          {backtestResult?.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

              {/* CAGR */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">CAGR (Annualized)</span>
                <div className={`text-xl font-black mt-1 ${backtestResult.metrics.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {backtestResult.metrics.cagr > 0 ? '+' : ''}{backtestResult.metrics.cagr}%
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">SPY Bench: {backtestResult.benchmark_metrics?.cagr}%</span>
              </div>

              {/* Sharpe Ratio */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">Sharpe Ratio (Rf=4.25%)</span>
                <div className={`text-xl font-black mt-1 ${backtestResult.metrics.sharpe >= 1.0 ? 'text-emerald-400' : backtestResult.metrics.sharpe >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {backtestResult.metrics.sharpe}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">Sortino: {backtestResult.metrics.sortino}</span>
              </div>

              {/* Max Drawdown */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">Max Drawdown (MDD)</span>
                <div className="text-xl font-black text-rose-400 mt-1">
                  {backtestResult.metrics.max_drawdown}%
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">Calmar: {backtestResult.metrics.calmar}</span>
              </div>

              {/* Annualized Volatility */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">Annual Volatility (σ)</span>
                <div className="text-xl font-black text-zinc-200 mt-1">
                  {backtestResult.metrics.ann_vol}%
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">SPY Vol: {backtestResult.benchmark_metrics?.ann_vol}%</span>
              </div>

              {/* Value at Risk (VaR 95%) */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">Monthly VaR (95%)</span>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {backtestResult.metrics.var_95_monthly}%
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">CVaR (Expected Shortfall): {backtestResult.metrics.cvar_95_monthly}%</span>
              </div>

              {/* Beta & Alpha */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-medium">Beta / Jensen's Alpha</span>
                <div className="text-xl font-black text-indigo-400 mt-1">
                  β {backtestResult.metrics.beta}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">Alpha: {backtestResult.metrics.alpha > 0 ? '+' : ''}{backtestResult.metrics.alpha}%</span>
              </div>

            </div>
          )}

          {/* Interactive Recharts: Normalized Wealth Path vs SPY Benchmark */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Wealth & Drawdown Chart */}
            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Cumulative Wealth Growth Path (Base = 100)</h4>
                  <p className="text-xs text-zinc-400">Backtested regime trajectory comparing strategy against broad equities</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-zinc-300">Macro Strategy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-zinc-500 inline-block" />
                    <span className="text-zinc-400">SPY Benchmark</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line type="monotone" dataKey="portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Macro Portfolio" />
                    <Line type="monotone" dataKey="benchmark" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="SPY Benchmark" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Underwater Drawdown Chart */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="text-xs font-semibold text-zinc-400 mb-2">Historical Drawdown Trajectory (%)</div>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} domain={['auto', 0]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="drawdown" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} name="Drawdown %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Asset Decomposition & Yield Curve PCA Factor */}
            <div className="space-y-6">

              {/* Asset Allocation & Contribution */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3">Asset Allocation & Stress Metrics</h4>
                <div className="space-y-2.5">
                  {backtestResult?.asset_contributions?.map((asset) => (
                    <div key={asset.symbol} className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{asset.symbol}</span>
                        <span className="text-zinc-500 font-mono ml-2">{asset.weight}% weight</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className={asset.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {asset.cagr > 0 ? '+' : ''}{asset.cagr}%
                        </span>
                        <span className="text-zinc-500">MDD: {asset.mdd}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yield Curve PCA Factor Analysis */}
              {backtestResult?.yield_factors && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1">Yield Curve PCA Factor Analysis</h4>
                  <p className="text-xs text-zinc-400 mb-3">{backtestResult.yield_factors.interpretation}</p>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Level (Shift)</span>
                      <span className="text-sm font-bold text-zinc-200">{backtestResult.yield_factors.level}%</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Slope (10Y-2Y)</span>
                      <span className={`text-sm font-bold ${backtestResult.yield_factors.slope_10y_2y < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {backtestResult.yield_factors.slope_10y_2y}
                      </span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Curvature</span>
                      <span className="text-sm font-bold text-indigo-400">{backtestResult.yield_factors.curvature}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Cross-Asset Correlation Heatmap Matrix */}
          {backtestResult?.correlation_matrix && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Cross-Asset Correlation Matrix (Under Regime Stress)</h4>
                  <p className="text-xs text-zinc-400">Pairwise Pearson correlation coefficients calculated via NumPy and SciPy</p>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Range: -1.00 (Inversion) to +1.00 (Co-movement)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-zinc-500">Asset</th>
                      {Object.keys(backtestResult.correlation_matrix).map(col => (
                        <th key={col} className="p-2 text-zinc-300 font-bold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(backtestResult.correlation_matrix).map(([rowKey, rowValues]) => (
                      <tr key={rowKey} className="border-t border-zinc-800/60">
                        <td className="p-2 text-left font-bold text-white">{rowKey}</td>
                        {Object.entries(rowValues).map(([colKey, corrVal]) => {
                          const val = Number(corrVal);
                          let bg = 'bg-zinc-900/40 text-zinc-400';
                          if (val === 1.0) bg = 'bg-indigo-950/60 text-indigo-200 font-bold';
                          else if (val > 0.5) bg = 'bg-emerald-950/40 text-emerald-300';
                          else if (val < -0.4) bg = 'bg-rose-950/40 text-rose-300';
                          else if (val < 0) bg = 'bg-amber-950/30 text-amber-300';

                          return (
                            <td key={colKey} className={`p-2 rounded ${bg}`}>
                              {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: LIVE MACROECONOMIC INDICATORS & CENTRAL BANK RADAR */}
      {activeTab === 'indicators' && (
        <div className="space-y-6">

          {/* AI Real-Time Indicator Synthesis */}
          <div className="bg-zinc-900/60 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    AI Macroeconomic Synthesis
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                      Gemini 3.8 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Institutional regime diagnosis generated live from current indicator matrices</p>
                </div>
              </div>

              <button
                onClick={() => generateMacroSummary()}
                disabled={isGeneratingIndicatorSummary}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingIndicatorSummary ? 'animate-spin text-indigo-400' : ''}`} />
                {isGeneratingIndicatorSummary ? 'Synthesizing...' : 'Re-synthesize Regime'}
              </button>
            </div>

            {indicatorSummary ? (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-5 text-xs font-sans text-zinc-300 leading-relaxed whitespace-pre-line relative z-10 shadow-inner">
                {indicatorSummary}
              </div>
            ) : isGeneratingIndicatorSummary ? (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-6 text-center text-xs text-zinc-400 space-y-2 relative z-10">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                <p>Synthesizing yield curve slope, central bank policy divergence, and liquidity factors...</p>
              </div>
            ) : (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-400 relative z-10 flex items-center justify-between">
                <span>Click "Re-synthesize Regime" to generate an updated macroeconomic diagnosis from live telemetry.</span>
                <button
                  onClick={() => generateMacroSummary()}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Generate Now
                </button>
              </div>
            )}
          </div>

          {/* Yield Curve Inversion Radar */}
          {indicators?.yieldCurve && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">US Treasury Yield Curve Radar</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    10Y-2Y Spread: {indicators.yieldCurve.spread10y2y > 0 ? '+' : ''}{indicators.yieldCurve.spread10y2y}%
                  </h3>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                  indicators.yieldCurve.spread10y2y < 0
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {indicators.yieldCurve.status}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 block">US 2Y Yield (Short-End)</span>
                  <span className="text-xl font-bold text-zinc-100">{indicators.yieldCurve.us2y}%</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 block">US 10Y Benchmark</span>
                  <span className="text-xl font-bold text-zinc-100">{indicators.yieldCurve.us10y}%</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 block">US 30Y Long-End</span>
                  <span className="text-xl font-bold text-zinc-100">{indicators.yieldCurve.us30y}%</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 block">Recession Lead Time</span>
                  <span className="text-xl font-bold text-amber-400">~{indicators.yieldCurve.leadTimeMonths} Months</span>
                </div>
              </div>
            </div>
          )}

          {/* Central Banks Policy Matrix */}
          {indicators?.centralBanks && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-base font-bold text-white mb-4">G6 Central Bank Policy Rates & Stances</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(indicators.centralBanks).map(([code, bank]) => (
                  <div key={code} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white uppercase">{bank.name}</span>
                        <span className="text-lg font-black text-indigo-400 font-mono">{bank.rate}%</span>
                      </div>
                      <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 mb-3">
                        {bank.stance}
                      </span>
                    </div>
                    <div className="border-t border-zinc-850 pt-2 flex justify-between text-xs font-mono text-zinc-500">
                      <span>Next Meeting: {bank.nextMeeting}</span>
                      <span className="text-emerald-400 font-semibold">{bank.cutProb}% Cut Prob</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Asset Macro Pressures */}
          {indicators?.macroPressures && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono">
                <span className="text-xs text-zinc-500 block">US Dollar Index (DXY)</span>
                <span className="text-xl font-bold text-white">{indicators.macroPressures.dxy}</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono">
                <span className="text-xs text-zinc-500 block">WTI Crude Oil ($/bbl)</span>
                <span className="text-xl font-bold text-amber-400">${indicators.macroPressures.crudeOil}</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono">
                <span className="text-xs text-zinc-500 block">Gold Spot ($/oz)</span>
                <span className="text-xl font-bold text-yellow-400">${indicators.macroPressures.gold}</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono">
                <span className="text-xs text-zinc-500 block">Real Fed Interest Rate</span>
                <span className="text-xl font-bold text-emerald-400">+{indicators.macroPressures.realInterestRate}%</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: AI MACRO STRATEGIST (Gemini 3.8 Flash) */}
      {activeTab === 'ai_strategist' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">AI Macroeconomic Scenario & Regime Reasoning</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Powered by Gemini 3.8 Flash. Ask complex questions regarding interest rate cycles, tariff impacts, monetary policy transmission, or sovereign debt crises.
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Evaluate stagflation risk given tariff escalation and crude oil spikes",
                "How will the Fed 2026 terminal rate affect emerging market debt?",
                "Analyze yield curve steepening impact on commercial banking net interest margins",
                "Construct an optimal cross-asset portfolio for an aggressive rate-cutting regime"
              ].map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => { setAiPrompt(qp); handleAskAiStrategist(qp); }}
                  className="text-xs bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg px-3 py-1.5 transition-all text-left"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAiStrategist()}
                placeholder="Ask any macroeconomic scenario question..."
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleAskAiStrategist()}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {isAiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Analyze
              </button>
            </div>
          </div>

          {/* AI Response Output */}
          {aiResponse && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-3 uppercase tracking-wider">
                <Bot className="w-4 h-4" />
                VYMXTRADER Macro Intelligence Assessment
              </div>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-zinc-200">
                {aiResponse}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SOVEREIGN WORLD MONITOR */}
      {activeTab === 'sovereign' && (
        <WorldMonitor />
      )}

    </div>
  );
}

