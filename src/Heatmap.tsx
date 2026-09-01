import React, { useState, useEffect, useMemo, Suspense } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  Search,
  Info,
  RefreshCw,
  Globe,
  Zap,
  IndianRupee,
  Coins,
  Flame,
  ArrowRight,
  Layers,
  LineChart as LineChartIcon,
  Box,
  ShoppingCart,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Asset } from "../types";
import { assets as initialAssets } from "../data";
import Heatmap3D from "./Heatmap3D";
import CorrelationMatrix from "./CorrelationMatrix";

// Color spectrum utilities for performance heatmap cells
// From extreme loss (-5%+) to moderate loss (-1%) to flat to moderate gain (+1%) to extreme gain (+5%+)
const getChangeBgColor = (
  change: number,
  scheme: "redgreen" | "blueorange" | "classic",
) => {
  if (scheme === "blueorange") {
    if (change <= -3) return "bg-amber-950 text-amber-300 border-amber-800/40";
    if (change < -1)
      return "bg-amber-900/60 text-amber-200 border-amber-800/30";
    if (change < -0.1) return "bg-amber-950/30 text-amber-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    if (Math.abs(change) <= 0.1)
      return "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    if (change <= 1) return "bg-blue-950/40 text-blue-300 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    if (change < 3) return "bg-blue-900/50 text-blue-200 border-blue-800/30";
    return "bg-blue-600 text-white border-blue-400";
  }

  // default / classic greenred
  if (change <= -3) return "bg-rose-950 text-rose-300 border-rose-800/60";
  if (change < -1) return "bg-rose-900/40 text-rose-300 border-rose-800/30";
  if (change < -0.1) return "bg-rose-950/20 text-rose-400 border-zinc-900";
  if (Math.abs(change) <= 0.1)
    return "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
  if (change <= 1) return "bg-emerald-950/30 text-emerald-400 border-zinc-900";
  if (change < 3)
    return "bg-emerald-900/40 text-emerald-300 border-emerald-800/30";
  return "bg-emerald-600 text-emerald-50 border-emerald-400";
};

interface HeatmapProps {
  onTradeSubmit?: (type: 'BUY' | 'SELL', symbol: string, quantity: number, price: number) => { success: boolean; message: string };
  onSelectAsset: (asset: Asset) => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  assets?: Asset[];
}

export default function Heatmap({
  onSelectAsset,
  watchlist,
  toggleWatchlist,
  assets,
  onTradeSubmit,
}: HeatmapProps) {
  // Live asset prices simulator state
  const [liveAssets, setLiveAssets] = useState<Asset[]>(
    () => assets || [...initialAssets],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [colorScheme, setColorScheme] = useState<"redgreen" | "blueorange">(
    "redgreen",
  );
  const [groupBy, setGroupBy] = useState<
    "sector" | "country" | "type" | "none"
  >("sector");
  const [selectedRegion, setSelectedRegion] = useState<
    "all" | "india" | "united_states" | "global_alt"
  >("all");
  const [heatmapTimeframe, setHeatmapTimeframe] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const [expandedTile, setExpandedTile] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<{ [symbol: string]: number }>({});
  const [metricView, setMetricView] = useState<
    "change" | "volume" | "range52w" | "flowVelocity" | "volatility"
  >("change");
  const [densityMode, setDensityMode] = useState<"standard" | "high">("standard");
  const [timeframe, setTimeframe] = useState<"15m" | "1H" | "4H" | "1D" | "1W">(
    "1D",
  );
  const [simSpeed, setSimSpeed] = useState<
    "slow" | "normal" | "fast" | "paused"
  >("normal");
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);
  const [flashUpdateSym, setFlashUpdateSym] = useState<{
    [key: string]: "up" | "down" | null;
  }>({});
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "correlation">("2d");

  // Sync with prop assets from main app ticking stream
  useEffect(() => {
    if (assets) {
      setLiveAssets(assets);
    }
  }, [assets]);

  // Simulated ticks logic - makes prices fluctuate to demonstrate real-time discovery!
  useEffect(() => {
    if (simSpeed === "paused") return;

    const intervalTime =
      simSpeed === "fast" ? 1200 : simSpeed === "slow" ? 4500 : 2500;

    const priceUpdater = setInterval(() => {
      // Pick random assets to fluctuate
      const updateCount = Math.floor(0 * 4) + 1;
      setLiveAssets((prevAssets) => {
        const nextAssets = [...prevAssets];
        const newFlashes: { [key: string]: "up" | "down" | null } = {};

        for (let k = 0; k < updateCount; k++) {
          const randomIndex = Math.floor(0 * nextAssets.length);
          const asset = nextAssets[randomIndex];

          // Determine fluctuation pct
          const changeWeight =
            asset.type === "crypto"
              ? 0.012
              : asset.type === "forex"
                ? 0.0008
                : 0.005;
          const delta = (0 - 0.49) * changeWeight; // slight positive bias
          const isUp = delta >= 0;

          const updatedPrice = parseFloat(
            (asset.price * (1 + delta)).toFixed(
              asset.type === "forex" || asset.type === "bond" ? 4 : 2,
            ),
          );

          // Validation Wrapper: Ensure calculated price data is valid
          if (
            updatedPrice === null || 
            updatedPrice === undefined || 
            isNaN(updatedPrice) || 
            !isFinite(updatedPrice) ||
            updatedPrice < 0
          ) {
            console.error(`[Data Integrity Error] Simulated Market Data Update Failed: Invalid price calculated for ${asset.symbol} - Price: ${updatedPrice}`);
            continue;
          }

          const tickPctChange = delta * 100;
          const updatedChangePct = parseFloat(
            (asset.change + tickPctChange).toFixed(2),
          );
          
          if (isNaN(updatedChangePct) || !isFinite(updatedChangePct)) {
            console.error(`[Data Integrity Error] Simulated Market Data Update Failed: Invalid change calculated for ${asset.symbol} - Change: ${updatedChangePct}`);
            continue;
          }

          const updatedChangeAbs = parseFloat(
            (asset.changeAbs + asset.price * delta).toFixed(
              asset.type === "forex" || asset.type === "bond" ? 4 : 2,
            ),
          );
          
          if (isNaN(updatedChangeAbs) || !isFinite(updatedChangeAbs)) {
            console.error(`[Data Integrity Error] Simulated Market Data Update Failed: Invalid absolute change calculated for ${asset.symbol} - ChangeAbs: ${updatedChangeAbs}`);
            continue;
          }

          // Calculate new limits
          const high52w = Math.max(asset.high52w, updatedPrice);
          const low52w = Math.min(asset.low52w, updatedPrice);

          nextAssets[randomIndex] = {
            ...asset,
            price: updatedPrice,
            change: updatedChangePct,
            changeAbs: updatedChangeAbs,
            high52w,
            low52w,
          };

          newFlashes[asset.symbol] = isUp ? "up" : "down";
        }

        setFlashUpdateSym((prev) => ({ ...prev, ...newFlashes }));

        // Auto clear flashes
        setTimeout(() => {
          setFlashUpdateSym((prev) => {
            const cleared = { ...prev };
            Object.keys(newFlashes).forEach((sym) => {
              cleared[sym] = null;
            });
            return cleared;
          });
        }, 850);

        return nextAssets;
      });
    }, intervalTime);

    return () => clearInterval(priceUpdater);
  }, [simSpeed]);

  // Handle Search & Regional filtering
  const filteredAssets = useMemo(() => {
    return liveAssets.filter((asset) => {
      // Filter by Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.sector.toLowerCase().includes(query);

      // Filter by Region
      if (!matchesSearch) return false;
      if (selectedRegion === "india") {
        return asset.country === "India";
      }
      if (selectedRegion === "united_states") {
        return asset.country === "United States";
      }
      if (selectedRegion === "global_alt") {
        return (
          asset.country === "Global" ||
          asset.type === "crypto" ||
          asset.type === "commodity"
        );
      }
      return true;
    });
  }, [liveAssets, searchQuery, selectedRegion]);

  // Grouping assets by selected criteria (Sectors, Country or type)
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Asset[] } = {};

    filteredAssets.forEach((asset) => {
      let key = "";
      if (groupBy === "none") {
        key = "Global Market Overview";
      } else if (groupBy === "sector") {
        key = asset.sector;
      } else if (groupBy === "country") {
        key = asset.country;
      } else {
        key = asset.type.toUpperCase() + "S";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(asset);
    });

    // Sort groups so that larger categories or higher performing categories stay aligned neatly
    return Object.entries(groups)
      .map(([name, items]) => {
        // Sort items in group by total size/weight (Market Cap)
        const sortedItems = [...items].sort((a, b) => {
          if (a.marketCap === 0) return 1;
          if (b.marketCap === 0) return -1;
          return b.marketCap - a.marketCap;
        });
        return { name, items: sortedItems };
      })
      .sort((a, b) => b.items.length - a.items.length); // Larger groups first
  }, [filteredAssets, groupBy]);

  // Helper stats calculations
  const summaryStats = useMemo(() => {
    const total = filteredAssets.length;
    const gainers = filteredAssets.filter((a) => a.change > 0.05).length;
    const losers = filteredAssets.filter((a) => a.change < -0.05).length;
    const neutral = total - gainers - losers;
    const avgChange =
      total > 0
        ? filteredAssets.reduce((sum, a) => sum + a.change, 0) / total
        : 0;

    return { total, gainers, losers, neutral, avgChange };
  }, [filteredAssets]);

  const activeMarketCapTotal = useMemo(() => {
    const sum = filteredAssets.reduce((acc, a) => acc + (a.marketCap || 0), 0);
    return sum > 1000 ? `$${(sum / 1000).toFixed(2)}T` : `$${sum.toFixed(1)}B`;
  }, [filteredAssets]);

  // Compute cell display value according to metric setting
  const getCellMetricDisplay = (asset: Asset) => {
    if (metricView === "volume") {
      return asset.volumeDisplay;
    }
    if (metricView === "range52w") {
      const spread = asset.high52w - asset.low52w;
      if (spread === 0) return "50%";
      const relativePosition = ((asset.price - asset.low52w) / spread) * 100;
      return `${relativePosition.toFixed(0)}% Range`;
    }
    if (metricView === "flowVelocity") {
      const flow = getTimeframeChange(asset) * 1.5;
      return `${flow >= 0 ? "+" : ""}${flow.toFixed(1)}B Flow`;
    }
    if (metricView === "volatility") {
      const vol = Math.abs(asset.change) * 4.2 + 10;
      return `${vol.toFixed(1)} VI`;
    }
    return `${asset.change >= 0 ? "+" : ""}${asset.change.toFixed(2)}%`;
  };


  const getTimeframeChange = (asset: Asset) => {
    if (heatmapTimeframe === "1D") return asset.change;
    const history = asset.history[heatmapTimeframe];
    if (!history || history.length === 0) return asset.change;
    const startVal = history[0].value;
    return ((asset.price - startVal) / startVal) * 100;
  };

  const getCellMetricColorIntensityStyle = (asset: Asset) => {
    if (metricView === "volume") {
      // Return custom purple style for high volume blocks
      const volWeight =
        asset.volume > 10000000
          ? "bg-indigo-950/90 text-indigo-300 border-indigo-500/30"
          : "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
      return volWeight;
    }
    if (metricView === "range52w") {
      const spread = asset.high52w - asset.low52w;
      const pct =
        spread > 0 ? ((asset.price - asset.low52w) / spread) * 100 : 50;
      if (pct > 80)
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/20";
      if (pct < 20) return "bg-rose-950/80 text-rose-300 border-rose-500/20";
      return "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    }
    if (metricView === "flowVelocity") {
      const flow = asset.change * 1.5;
      if (flow > 2) return "bg-cyan-950/80 text-cyan-300 border-cyan-500/30";
      if (flow < -2) return "bg-orange-950/80 text-orange-300 border-orange-500/30";
      return "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    }
    if (metricView === "volatility") {
      const vol = Math.abs(asset.change) * 4.2 + 10;
      if (vol > 25) return "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/30";
      if (vol > 15) return "bg-purple-950/60 text-purple-300 border-purple-500/20";
      return "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300";
    }
    return getChangeBgColor(getTimeframeChange(asset), colorScheme);
  };

  return (
    <div className="space-y-6 pt-6" id="finova-heatmap-matrix">
      {/* 1. Header & Quick Analytics Tape */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-white font-sans tracking-tight">
              Interactive Global Market Heatmap
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Real-time visualization map of financial assets sorted by weights
            and performance. Simulated tick fluctuations are live to support
            asset discovery, absolute trends and regional opportunities.
          </p>
        </div>

        {/* Live Simulation Speed Controllers */}
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-850 self-start md:self-auto">
          <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 font-mono flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Live Stream:
          </span>
          {(["slow", "normal", "fast", "paused"] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`rounded-lg px-2 text-[10px] font-mono py-1 capitalize font-bold transition-all ${
                simSpeed === speed
                  ? "bg-zinc-800 text-amber-400 border border-zinc-700 shadow"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top-Bar Banner Ticker tape */}
      <div className="w-full bg-zinc-900/40 rounded-xl border border-zinc-850 p-3 overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono border-b border-zinc-850/50 pb-2 mb-2 text-zinc-500 px-1">
          <span className="flex items-center gap-1.5">
            <LineChartIcon className="h-3 w-3 text-zinc-400" /> Active Market Map
            Summary
          </span>
          <span className="text-[10px] uppercase text-zinc-500">
            Live ticks active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">
              Total Assets
            </span>
            <span className="font-bold text-white text-sm font-mono">
              {summaryStats.total}
            </span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase font-bold text-emerald-400">
              Gainers
            </span>
            <span className="font-bold text-emerald-400 text-sm font-mono">
              {summaryStats.gainers}
            </span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase font-bold text-rose-450">
              Losers
            </span>
            <span className="font-bold text-rose-400 text-sm font-mono">
              {summaryStats.losers}
            </span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">
              Avg Change
            </span>
            <span
              className={`font-bold text-sm font-mono ${summaryStats.avgChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {summaryStats.avgChange >= 0 ? "+" : ""}
              {summaryStats.avgChange.toFixed(2)}%
            </span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 col-span-2 sm:col-span-1 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">
              Mkt Focus Size
            </span>
            <span className="font-bold text-indigo-400 text-sm font-mono">
              {activeMarketCapTotal}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Toolbar Filtration Dashboard */}
      <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-850 flex flex-col lg:flex-row gap-4 justify-between items-stretch">
        {/* Left: Search & Regional Quick Filters */}

          {/* Timeframe Selector */}
          <div className="flex items-center rounded-lg border border-zinc-900 bg-zinc-900/50 p-1">
            {(["1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setHeatmapTimeframe(tf)}
                className={`relative rounded px-3 py-1.5 text-xs font-mono font-bold select-none transition-all cursor-pointer ${
                  heatmapTimeframe === tf
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {heatmapTimeframe === tf && (
                  <motion.div
                    layoutId="heatmap-timeframe-indicator"
                    className="absolute inset-0 bg-indigo-600 shadow-lg shadow-indigo-900/40 border border-indigo-500/30 rounded"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tf}</span>
              </button>
            ))}
          </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Autocomplete-like search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets in map..."
              className="w-full rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950/80 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-zinc-700 focus:bg-zinc-950"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Regional focused views including Indian Markets explicitly */}
          <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedRegion("all")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                selectedRegion === "all"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Globe className="h-3 w-3 text-blue-400" /> Global All
            </button>
            <button
              id="selected-region-india"
              onClick={() => setSelectedRegion("india")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                selectedRegion === "india"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <IndianRupee className="h-3 w-3 text-emerald-400" /> India Markets
            </button>
            <button
              onClick={() => setSelectedRegion("united_states")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                selectedRegion === "united_states"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🗽 US Markets
            </button>
            <button
              onClick={() => setSelectedRegion("global_alt")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                selectedRegion === "global_alt"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Coins className="h-3 w-3 text-purple-400" /> Cryptos/Commodities
            </button>
          </div>
        </div>

        {/* Right: Heatmap Settings (Group By, Color and Metrics) */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* View Mode Toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Dimension:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("2d")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === "2d"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="w-3 h-3" /> 2D Map
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === "3d"
                    ? "bg-zinc-800 text-indigo-400 font-bold border border-indigo-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Globe className="w-3 h-3" /> 3D Topology
              </button>
              <button
                onClick={() => setViewMode("correlation")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === "correlation"
                    ? "bg-zinc-800 text-purple-400 font-bold border border-purple-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <LineChartIcon className="w-3 h-3" /> Correlation
              </button>
            </div>
          </div>

          {/* Matrix metric modifier */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Highlight Metric:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              <button
                onClick={() => setMetricView("change")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  metricView === "change"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Perform Change %
              </button>
              <button
                onClick={() => setMetricView("volume")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  metricView === "volume"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                24h Volume
              </button>
              <button
                onClick={() => setMetricView("range52w")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  metricView === "range52w"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                52W Proximity
              </button>
              <button
                onClick={() => setMetricView("flowVelocity")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  metricView === "flowVelocity"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                FII/DII Flow
              </button>
              <button
                onClick={() => setMetricView("volatility")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  metricView === "volatility"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Volatility Index
              </button>
            </div>
          </div>

          {/* Grouping filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Timeframe:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              {(["15m", "1H", "4H", "1D", "1W"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-1 px-2 rounded text-[10px] font-medium transition-all ${
                    timeframe === tf
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Density Mode:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              <button
                onClick={() => setDensityMode("standard")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  densityMode === "standard"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setDensityMode("high")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  densityMode === "high"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                100x Density
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Group Elements By:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              <button
                onClick={() => setGroupBy("none")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  groupBy === "none"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Global View
              </button>
              <button
                onClick={() => setGroupBy("sector")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  groupBy === "sector"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sector Grouping
              </button>
              <button
                onClick={() => setGroupBy("country")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  groupBy === "country"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Countries
              </button>
              <button
                onClick={() => setGroupBy("type")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium transition-all ${
                  groupBy === "type"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Asset Class
              </button>
            </div>
          </div>

          {/* Heatmap spectrum colors */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              Color Style:
            </span>
            <div className="flex border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 rounded-lg p-0.5">
              <button
                onClick={() => setColorScheme("redgreen")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                  colorScheme === "redgreen"
                    ? "bg-zinc-900 text-emerald-400 border border-emerald-500/15 font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> G/R
              </button>
              <button
                onClick={() => setColorScheme("blueorange")}
                className={`py-1 px-2.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                  colorScheme === "blueorange"
                    ? "bg-zinc-900 text-blue-400 border border-blue-500/15 font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" /> B/O
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Heatmap Main Visualization Node */}
      {viewMode === "correlation" ? (
        <CorrelationMatrix assets={filteredAssets} />
      ) : viewMode === "3d" ? (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-2xl relative">
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs animate-pulse">
                Loading 3D Topology...
              </div>
            }
          >
            <Heatmap3D assets={filteredAssets} onSelectAsset={onSelectAsset} />
          </Suspense>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 rounded-3xl bg-zinc-900/15">
          <Info className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-zinc-400">
            No assets matching criteria
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Try resetting the region toggle or clearance queries.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedData.map((group) => (
            <div
              key={group.name}
              className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-5 space-y-3 shadow-lg"
            >
              {/* Group description segment */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-450 tracking-wider font-mono">
                    Category Group
                  </span>
                  <span className="text-zinc-600 font-mono text-[10px]">•</span>
                  <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
                    {group.name}
                  </h3>
                  <span className="text-[10px] bg-zinc-850/60 px-2 py-0.5 rounded-full font-mono font-semibold text-zinc-500">
                    {group.items.length} units
                  </span>
                </div>

                {/* Visualizer detail label */}
                <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest hidden sm:inline">
                  Sorted by relative weight
                </span>
              </div>

              {/* Grid of Blocks Map. We formulate custom sizes based on relative weight (market cap) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {group.items.map((asset) => {
                  const relativeUp = asset.change >= 0;
                  const isFlash = flashUpdateSym[asset.symbol];

                  // Setup specific sizing based on asset market cap class
                  let sizeClass = "col-span-1 row-span-1 h-24";
                  if (groupBy === "sector") {
                    // Boost huge market caps visuals so they are major anchors
                    if (asset.marketCap > 1000)
                      sizeClass = "col-span-1 sm:col-span-2 row-span-1 h-24";
                  }
                  
                  if (expandedTile === asset.symbol) {
                    sizeClass = "col-span-2 sm:col-span-3 lg:col-span-2 row-span-2 min-h-[260px]";
                  }

                  return (
                    <div
                      key={asset.symbol}
                      className="relative"
                      onMouseEnter={() => setHoveredAsset(asset)}
                      onMouseLeave={() => setHoveredAsset(null)}
                    >
                      <motion.div
                        layout
                        onClick={() => setExpandedTile(expandedTile === asset.symbol ? null : asset.symbol)}
                        animate={{ scale: isFlash ? 1.05 : 1 }}
                        className={`group relative rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow overflow-hidden ${sizeClass} ${getCellMetricColorIntensityStyle(asset)} ${
                          isFlash === "up"
                            ? "ring-2 ring-emerald-400 bg-emerald-950/70 border-emerald-400"
                            : isFlash === "down"
                              ? "ring-2 ring-rose-455 bg-rose-950/70 border-rose-400"
                              : ""
                        }`}
                        whileHover={{ scale: 1.025, zIndex: 10 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Shimmer overlay for live dynamic update flashes */}
                        <AnimatePresence>
                          {isFlash && (
                            <motion.div
                              initial={{ opacity: 0.8 }}
                              animate={{ opacity: 0 }}
                              exit={{ opacity: 0 }}
                              className={`absolute inset-0 pointer-events-none transition-all ${
                                isFlash === "up"
                                  ? "bg-emerald-500/30"
                                  : "bg-rose-500/30"
                              }`}
                              transition={{ duration: 0.5 }}
                            />
                          )}
                        </AnimatePresence>

                        {/* Top: Symbol Name and country indicator */}
                        <div className="flex items-start justify-between w-full">
                          <div>
                            <span className="font-mono text-xs font-black tracking-tight text-white block">
                              {asset.symbol}
                            </span>
                            <span className="text-[9px] text-zinc-300 font-medium truncate max-w-[100px] block opacity-80 group-hover:opacity-100 transition-opacity">
                              {asset.name}
                            </span>
                          </div>

                          {/* Flag/Marker icon */}
                          <span className="text-[10px] opacity-75">
                            {asset.country === "India"
                              ? "🇮🇳"
                              : asset.country === "United States"
                                ? "🇺🇸"
                                : asset.country === "Japan"
                                  ? "🇯🇵"
                                  : asset.country === "United Kingdom"
                                    ? "🇬🇧"
                                    : asset.country === "Germany"
                                      ? "🇩🇪"
                                      : asset.country === "Taiwan"
                                        ? "🇹🇼"
                                        : asset.country === "South Korea"
                                          ? "🇰🇷"
                                          : "🌐"}
                          </span>
                        </div>

                        {/* Mid Section for extra data */}
                        <div className="my-1 flex justify-between items-center text-[8px] font-mono text-zinc-300 opacity-80">
                          <span>
                            RSI:{" "}
                            {(
                              20 +
                              ((asset.symbol.charCodeAt(0) * 7) % 60)
                            ).toFixed(1)}
                          </span>
                          <span>Vol: {asset.volumeDisplay}</span>
                        </div>
                        
                        
                        {expandedTile === asset.symbol && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full mt-2 border-t border-white/10 pt-2 flex flex-col gap-2 relative z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between text-[10px] text-zinc-300 font-mono bg-black/20 p-1 rounded">
                              <span className="flex flex-col"><span>O</span><span className="font-bold text-white">{asset.openPrice.toFixed(2)}</span></span>
                              <span className="flex flex-col text-center"><span>H</span><span className="font-bold text-emerald-400">{asset.high52w.toFixed(2)}</span></span>
                              <span className="flex flex-col text-right"><span>L</span><span className="font-bold text-rose-400">{asset.low52w.toFixed(2)}</span></span>
                            </div>
                            
                            <div className="h-12 w-full mt-1 bg-black/10 rounded">
                              
                              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" className="opacity-80">
                                {(() => {
                                  const data = asset.history[heatmapTimeframe] || [];
                                  if (data.length <= 1) return null;
                                  const min = Math.min(...data.map(d => d.value));
                                  const max = Math.max(...data.map(d => d.value));
                                  const range = max - min || 1;
                                  
                                  const strokeColor = getTimeframeChange(asset) >= 0 ? "#10b981" : "#f43f5e";
                                  return (
                                    <>
                                                                            <path fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" d={`M ${data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100;
                                        const y = 100 - ((d.value - min) / range) * 100;
                                        if (i === 0) return `${x},${y}`;
                                        const prevX = ((i - 1) / (data.length - 1)) * 100;
                                        const prevY = 100 - ((data[i - 1].value - min) / range) * 100;
                                        const cp1x = prevX + (x - prevX) / 3;
                                        const cp1y = prevY;
                                        const cp2x = x - (x - prevX) / 3;
                                        const cp2y = y;
                                        return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
                                      }).join(' ')}`} />
                                    </>
                                  );
                                })()}
                              </svg>

                            </div>
                            
                            <div className="flex gap-1 mt-1">
                              <input 
                                type="number"
                                min="1"
                                className="w-12 bg-black/40 border border-white/20 rounded text-xs px-1 text-white outline-none font-mono focus:border-indigo-500"
                                value={tradeQuantity[asset.symbol] || 1}
                                onChange={(e) => setTradeQuantity({...tradeQuantity, [asset.symbol]: parseInt(e.target.value) || 1})}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onTradeSubmit) onTradeSubmit('BUY', asset.symbol, tradeQuantity[asset.symbol] || 1, asset.price);
                                }}
                                className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-[10px] font-bold uppercase py-1 flex items-center justify-center gap-1 transition-colors"
                              >
                                <ShoppingCart className="w-3 h-3" /> Buy
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onTradeSubmit) onTradeSubmit('SELL', asset.symbol, tradeQuantity[asset.symbol] || 1, asset.price);
                                }}
                                className="flex-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 rounded text-[10px] font-bold uppercase py-1 flex items-center justify-center gap-1 transition-colors"
                              >
                                Sell
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAsset(asset);
                              }}
                              className="w-full mt-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 rounded text-[10px] font-bold uppercase py-1 transition-colors text-center"
                            >
                              Terminal
                            </button>
                          </motion.div>
                        )}

                        
                        {densityMode === "high" && (
                          <div className="my-1 border-y border-white/5 py-1 flex flex-col gap-1 w-full">
                            <div className="flex justify-between items-center text-[7px] text-zinc-400 font-mono">
                              <span>Inst Flow</span>
                              <span className={asset.change > 0 ? "text-emerald-400" : "text-rose-400"}>{asset.change > 0 ? "+" : ""}{(asset.change * 0.4).toFixed(2)}B</span>
                            </div>
                            <div className="flex justify-between items-center text-[7px] text-zinc-400 font-mono">
                              <span>Liq Pool</span>
                              <span className="text-blue-400">${(asset.volume / 10000000).toFixed(1)}T</span>
                            </div>
                            <div className="flex gap-0.5 mt-0.5 items-end h-4 w-full opacity-60">
                               {Array.from({length: 8}).map((_, i) => (
                                 <div key={i} className={`flex-1 rounded-sm ${i < 4 ? (asset.change > 0 ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-zinc-600'}`} style={{ height: `${20 + 0 * 80}%` }}></div>
                               ))}
                            </div>
                          </div>
                        )}

                        {/* Middle/Bottom: Visual indicators */}
                        <div className="flex items-end justify-between w-full mt-auto">
                          <div className="text-left">
                            <span className="text-[10px] font-bold block opacity-60 font-mono">
                              {asset.type === "bond" ? "YIELD" : "PRICE"}
                            </span>
                            <span className="text-xs font-black font-mono tracking-tight text-white block">
                              {asset.type === "bond"
                                ? asset.price.toFixed(4) + "%"
                                : asset.type === "forex"
                                  ? asset.price.toFixed(4)
                                  : new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency:
                                        asset.country === "India" &&
                                        asset.type === "stock"
                                          ? "INR"
                                          : "USD",
                                    }).format(asset.price)}
                            </span>
                          </div>

                          <div className="text-right flex items-center gap-1 flex-col justify-end">
                            {expandedTile === asset.symbol ? <ChevronUp className="w-3 h-3 text-white/50" /> : <ChevronDown className="w-3 h-3 text-white/50" />}
                            {/* Metric overlay */}
                            <span className="text-[10px] font-black font-mono bg-black/40 text-zinc-150 px-1.5 py-0.5 rounded border border-white/5 shadow-inner">
                              {getCellMetricDisplay(asset)}
                            </span>
                          </div>
                        </div>

                        {/* Glow and hover interactions */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-1.5 w-1.5 rounded-full bg-white/70 animate-ping" />
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Rich Explanations discovery drawer (Interactive Guides to Heatmap trends) */}
      <div className="bg-zinc-900/35 border border-zinc-850 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 tracking-widest flex items-center gap-1.5 mb-2">
            <Info className="h-3.5 w-3.5 text-blue-400" /> Color Intensity Guide
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The heatmap spectrum highlights absolute returns. Strong deep-green
            (or dark-blue) denotes &gt;3% positive daily changes. Deep-red (or
            copper-orange) represents &gt;3% losses. Calm, darker cell tones
            represent flat or stable asset changes.
          </p>
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] text-zinc-400">
            <span className="bg-rose-950 px-1.5 py-0.5 rounded text-rose-300">
              -3%
            </span>
            <span className="text-zinc-600">&larr;</span>
            <span className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
              0%
            </span>
            <span className="text-zinc-600">&rarr;</span>
            <span className="bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">
              +3%
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 tracking-widest flex items-center gap-1.5 mb-2">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> India
            Markets Highlight
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            We have integrated active tracking for Indian market metrics,
            including blue-chips like Reliance Industries, TCS, HDFC Bank,
            Infosys and the major index Nifty 50. Select "India Markets" under
            region controls to isolate India's financial anchors.
          </p>
          <button
            id="btn-trigger-india-region"
            onClick={() => setSelectedRegion("india")}
            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
          >
            Zoom into Indian Markets <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 tracking-widest flex items-center gap-1.5 mb-2">
            <Flame className="h-3.5 w-3.5 text-purple-400" /> Proximity
            Analytics
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Switch metric mode to "52W Proximity" to discover market fatigue
            levels. If a cell approaches 100%, the asset is peaking near
            absolute session resistance lines. If near 0%, it represents an
            extreme value opportunity touching valley support.
          </p>
          <button
            onClick={() => setMetricView("range52w")}
            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all font-mono"
          >
            Toggle Proximity View <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Floating tooltip dynamic portal */}
      <AnimatePresence>
        {hoveredAsset && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 backdrop-blur-xl p-4 shadow-2xl shadow-black/90 text-xs text-zinc-300 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-sm font-bold text-zinc-100 flex items-center gap-2">
                  {hoveredAsset.symbol}
                  <span className="text-[10px] font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                    {hoveredAsset.type.toUpperCase()}
                  </span>
                </span>
                <p className="text-zinc-400 font-semibold">
                  {hoveredAsset.name}
                </p>
              </div>
              <span className="text-xs">
                {hoveredAsset.country === "India"
                  ? "🇮🇳 India"
                  : hoveredAsset.country}
              </span>
            </div>

            <div className="h-px bg-zinc-900" />

            <div className="grid grid-cols-2 gap-3.5 font-mono text-[11px]">
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-bold">
                  Standard Price
                </p>
                <p className="font-bold text-zinc-100">
                  {hoveredAsset.type === "bond"
                    ? hoveredAsset.price.toFixed(4) + "%"
                    : hoveredAsset.type === "forex"
                      ? hoveredAsset.price.toFixed(4)
                      : new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency:
                            hoveredAsset.country === "India" &&
                            hoveredAsset.type === "stock"
                              ? "INR"
                              : "USD",
                        }).format(hoveredAsset.price)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-bold">
                  24h Fluctuation
                </p>
                <p
                  className={`font-bold flex items-center gap-1 ${hoveredAsset.change >= 0 ? "text-emerald-400" : "text-rose-455"}`}
                >
                  {hoveredAsset.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {hoveredAsset.change >= 0 ? "+" : ""}
                    {hoveredAsset.change}%
                  </span>
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-bold">
                  Market Cap Weight
                </p>
                <p className="font-bold text-zinc-100">
                  {hoveredAsset.marketCapDisplay}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] uppercase font-bold">
                  24H Trading Volume
                </p>
                <p className="font-bold text-zinc-100">
                  {hoveredAsset.volumeDisplay}
                </p>
              </div>
            </div>

            {/* Advanced Binance-style Technicals */}
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="col-span-2 text-zinc-500 text-[9px] uppercase font-bold mb-1 border-b border-zinc-900 pb-1">
                Advanced Technicals & Sentiments (Live)
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">RSI(14)</span>
                <span
                  className={`font-bold ${
                    20 + ((hoveredAsset.symbol.charCodeAt(0) * 7) % 60) > 65
                      ? "text-rose-400"
                      : 20 + ((hoveredAsset.symbol.charCodeAt(0) * 7) % 60) < 35
                        ? "text-emerald-400"
                        : "text-zinc-300"
                  }`}
                >
                  {(20 + ((hoveredAsset.symbol.charCodeAt(0) * 7) % 60)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">MACD(12,26)</span>
                <span className={`font-bold ${hoveredAsset.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredAsset.change > 0 ? '+' : ''}{(hoveredAsset.change * 0.42).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Bollinger</span>
                <span className="font-bold text-blue-400">
                  {Math.abs(hoveredAsset.change) > 2 ? 'Outside' : 'Middle'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Volatility(IV)</span>
                <span className="font-bold text-amber-400">
                  {(15 + ((hoveredAsset.symbol.charCodeAt(0) * 3) % 40)).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Beta vs SPY</span>
                <span className="font-bold text-zinc-300">
                  {(0.5 + ((hoveredAsset.symbol.charCodeAt(0) * 1.1) % 1.5)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">VWAP Spread</span>
                <span className="font-bold text-indigo-400">
                  +{(Math.abs(hoveredAsset.change) * 0.12).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center col-span-2">
                <span className="text-zinc-500">Dark Pool Index</span>
                <div className="w-1/2 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-purple-500 h-full" style={{ width: `${30 + ((hoveredAsset.symbol.charCodeAt(0) * 5) % 50)}%` }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center col-span-2">
                <span className="text-zinc-500">AI Confidence</span>
                <div className="w-1/2 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-emerald-500 h-full" style={{ width: `${40 + ((hoveredAsset.symbol.charCodeAt(0) * 2) % 55)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-900" />

            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live ticks sync active
              </span>
              <span
                className="flex items-center gap-1 text-zinc-400 group-hover:text-white pb-0.5 hover:underline cursor-pointer"
                onClick={() => onSelectAsset(hoveredAsset)}
              >
                Access Terminal <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
