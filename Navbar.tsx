import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, BarChart3, Wallet, GraduationCap, Layers, Globe, Flame, Newspaper, Sun, Moon, Sparkles, LogOut, Trophy, Network } from 'lucide-react';
import { Asset } from '../types';

interface NavbarProps {
  currentView: 'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news';
  setView: (view: 'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news') => void;
  selectedAsset: Asset | null;
  setSelectedAsset: (asset: Asset | null) => void;
  virtualBalance: number;
  totalEquity: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currencyMode: 'AUTO' | 'USD' | 'INR';
  setCurrencyMode: (mode: 'AUTO' | 'USD' | 'INR') => void;
  assets: Asset[];
  formatCurrency: (val: number, type?: string, country?: string) => string;
  isAuthenticated: boolean;
  onLogout: () => void;
  authUser: { email?: string; name?: string; authType?: string; type?: string; displayName?: string } | null;
}

export default function Navbar({
  currentView,
  setView,
  selectedAsset,
  setSelectedAsset,
  virtualBalance,
  totalEquity,
  theme,
  toggleTheme,
  currencyMode,
  setCurrencyMode,
  assets,
  formatCurrency: formatCurrencyProp,
  isAuthenticated,
  onLogout,
  authUser,
  onOpenCmdK,
}: NavbarProps & { onOpenCmdK?: () => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setView('details');
    setIsMobileMenuOpen(false);
  };

  const formatCurrency = (val: number) => {
    return formatCurrencyProp(val, 'cash');
  };

  return (
    <nav id="vymx-navbar" className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 group-hover:border-indigo-400/50 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                VYMX <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">Terminal</span>
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xl font-bold tracking-tight text-white">Vymx Trade</span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">MVP</span>
              </div>
              <p className="text-[10px] text-zinc-500 tracking-wider">AI INSIGHTS & PAPER TRADING</p>
            </div>
          </div>

          {/* Center: Global Autocomplete Search */}
          <div className="relative flex-1 max-w-md mx-2 sm:mx-6">
            <button
              onClick={() => onOpenCmdK?.()}
              className="relative w-full text-left"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Search className="h-4 w-4" />
              </div>
              <div className="w-full rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/60 py-2 pl-10 pr-16 text-sm text-zinc-500 hover:text-zinc-300 outline-none transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer">
                Search symbol, company name, crypto...
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500 leading-none">
                  <span>⌘</span><span>K</span>
                </kbd>
              </div>
            </button>
          </div>

          {/* Right: Desktop Navigation & Balance Hub */}
          <div className="hidden lg:flex items-center gap-6">
            <div id="virtual-equity-badge" className="flex items-center gap-1.5 rounded-full border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/30 px-3.5 py-1.5 text-xs text-zinc-400">
              <Wallet className="h-3.5 w-3.5 text-zinc-500" />
              <span>Virtual Portfolio Value:</span>
              <span className="font-semibold text-emerald-400">{formatCurrency(totalEquity)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-nav-dashboard"
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Market Overview
              </button>

              <button
                id="btn-nav-heatmap"
                onClick={() => setView('heatmap')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'heatmap'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Market Heatmap
              </button>

              <button
                id="btn-nav-screener"
                onClick={() => setView('screener')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'screener'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Asset Screener
              </button>

              <button
                id="btn-nav-macro"
                onClick={() => setView('macro')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'macro'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Economics
              </button>

              <button
                id="btn-nav-news"
                onClick={() => setView('news')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'news'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" />
                News
              </button>

              <button
                id="btn-nav-institutional-flows"
                onClick={() => setView('institutional-flows')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'institutional-flows'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                FII / DII Flows
              </button>

              <button
                id="btn-nav-portfolio"
                onClick={() => setView('portfolio')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'portfolio'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Paper Portfolio
              </button>

              <button
                id="btn-nav-advisor"
                onClick={() => setView('advisor')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'advisor'
                    ? 'bg-gradient-to-r from-indigo-600/25 to-blue-600/25 text-indigo-300 border-indigo-500/30'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                AI Advisor
              </button>

              <button
                id="btn-nav-academy"
                onClick={() => setView('academy')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                  currentView === 'academy'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Academy
              </button>

              {selectedAsset && (
                <button
                  id="btn-nav-details"
                  onClick={() => setView('details')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                    currentView === 'details'
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Terminal ({selectedAsset.symbol})
                </button>
              )}

              {/* Beautiful Segmented Currency Switcher */}
              <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setCurrencyMode('AUTO')}
                  className={`px-2 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                    currencyMode === 'AUTO'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Auto-Currency (INR for Indian stocks, USD for others)"
                >
                  ⚡ AUTO
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('USD')}
                  className={`px-2 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                    currencyMode === 'USD'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Force US Dollars ($) all assets"
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('INR')}
                  className={`px-2 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                    currencyMode === 'INR'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Force Indian Rupees (₹) all assets"
                >
                  ₹ INR
                </button>
              </div>

              {/* Theme Toggler Button */}
              <button
                id="theme-toggler-btn"
                onClick={toggleTheme}
                className="ml-1 px-3 py-2 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'High-Contrast Light'} Mode`}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="hidden xl:inline">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span className="hidden xl:inline">Light Mode</span>
                  </>
                )}
              </button>

              {/* Verified Secure Identity Tag */}
              {isAuthenticated && authUser && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-950 bg-emerald-500/5 text-emerald-400 text-[11px] font-semibold font-sans">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[120px]" title={authUser.email}>
                    {authUser.name || authUser.email?.split('@')[0]}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] px-1 py-0.5 rounded font-mono font-black scale-90">
                    SEC-KEY
                  </span>
                </div>
              )}

              {/* Secure Log Out Button */}
              {isAuthenticated && (
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="ml-1 px-3 py-2 rounded-lg border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/40 hover:bg-zinc-900 text-rose-400 hover:text-rose-300 transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Securely Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:text-white lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 px-4 py-4 space-y-4 shadow-xl">
          <div className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/30 p-3 space-y-1">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Trading Account balance</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Net Portfolio Equity</span>
              <span className="font-semibold text-emerald-400">{formatCurrency(totalEquity)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Available virtual Cash</span>
              <span className="font-semibold text-zinc-300">{formatCurrency(virtualBalance)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <Layers className="h-4 w-4" />
              Market Overview Dashboard
            </button>
            <button
              id="btn-mobile-nav-heatmap"
              onClick={() => { setView('heatmap'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'heatmap' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <Flame className="h-4 w-4" />
              Market Heatmap
            </button>
            <button
              id="btn-mobile-nav-macro"
              onClick={() => { setView('macro'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'macro' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Economics
            </button>
            <button
              id="btn-mobile-nav-news"
              onClick={() => { setView('news'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'news' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <Newspaper className="h-4 w-4" />
              News
            </button>
            <button
              id="btn-mobile-nav-institutional-flows"
              onClick={() => { setView('institutional-flows'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'institutional-flows' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <Network className="h-4 w-4" />
              FII / DII Flows
            </button>
            <button
              onClick={() => { setView('screener'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'screener' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <Globe className="h-4 w-4" />
              Asset Screener
            </button>
            <button
              onClick={() => { setView('portfolio'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'portfolio' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Paper Portfolio Simulation
            </button>
            <button
              id="btn-mobile-nav-advisor"
              onClick={() => { setView('advisor'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'advisor' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/10' : 'text-zinc-300'
              }`}
            >
              <Sparkles className="h-4 w-4 text-indigo-400" />
              AI Matchmaker Advisor
            </button>
            <button
              id="btn-mobile-nav-academy"
              onClick={() => { setView('academy'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                currentView === 'academy' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-300'
              }`}
            >
              <GraduationCap className="h-4 w-4 text-zinc-400" />
              Wealth Academy Articles
            </button>
            {selectedAsset && (
              <button
                onClick={() => { setView('details'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                  currentView === 'details' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-400'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Active Terminal ({selectedAsset.symbol})
              </button>
            )}

            {/* Mobile Currency switch panel */}
            <div className="p-3 border border-zinc-850 rounded-xl bg-zinc-900/40 space-y-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Currency display mode</p>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-zinc-950 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => { setCurrencyMode('AUTO'); setIsMobileMenuOpen(false); }}
                  className={`py-1.5 rounded text-center cursor-pointer font-bold transition-all ${
                    currencyMode === 'AUTO' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  ⚡ AUTO
                </button>
                <button
                  type="button"
                  onClick={() => { setCurrencyMode('USD'); setIsMobileMenuOpen(false); }}
                  className={`py-1.5 rounded text-center cursor-pointer font-bold transition-all ${
                    currencyMode === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => { setCurrencyMode('INR'); setIsMobileMenuOpen(false); }}
                  className={`py-1.5 rounded text-center cursor-pointer font-bold transition-all ${
                    currencyMode === 'INR' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  ₹ INR
                </button>
              </div>
            </div>

            <button
              id="theme-toggler-mobile-btn"
              onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white border border-transparent hover:bg-zinc-900/50 cursor-pointer"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>Toggle Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Toggle High-Contrast Light Mode</span>
                </>
              )}
            </button>

            {isAuthenticated && (
              <button
                id="mobile-nav-logout-btn"
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-450 hover:text-rose-400 border border-transparent hover:bg-zinc-900/50 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Logout Securely</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
