import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Screener from './components/Screener';
import AssetDetails from './components/AssetDetails';
import Portfolio from './components/Portfolio';
import Heatmap from './components/Heatmap';
import QuickTrade from './components/QuickTrade';
import Walkthrough from './components/Walkthrough';
import AuthPage from './components/AuthPage';
import Academy from './components/Academy';
import WealthAdvisor from './components/WealthAdvisor';
import MarketNews from './components/MarketNews';
import EconomicCalendar from './components/EconomicCalendar';
import InstitutionalFlows from './components/InstitutionalFlows';
import CommandCenter from './components/CommandCenter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { compressData, decompressData } from './utils/storage';
import { Asset, PortfolioItem, Transaction, PriceAlert } from './types';
import { assets } from './data';
import { Layers, GraduationCap, Globe, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateIntegritySignature } from './utils/security';
import { getAssetMarketStatus } from './utils/market';
import { auth, onAuthStateChanged, signOut, db, doc, getDoc, setDoc } from './lib/firebase';
import { useWebSocket } from './hooks/useWebSocket';
import { useDataIntegrity } from './contexts/DataIntegrityContext';

export default function App() {
  const { addLog } = useDataIntegrity();
  const [currentView, setView] = useState<'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news'>('dashboard');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Establish WebSocket connection globally
  const { isConnected, isConnectionUnstable, sendMessage } = useWebSocket();

  // --- STRICT MARKET HOURS ENFORCEMENT ---
  const [isStrictHours, setIsStrictHours] = useState<boolean>(true);

  // --- INSTITUTIONAL USER AUTHENTICATION STATES & SECURE SYNC ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('vymx_is_authenticated') === 'true';
  });
  
  const [authUser, setAuthUser] = useState<{ uid?: string; email?: string; name?: string; authType?: string } | null>(() => {
    const savedUser = localStorage.getItem('vymx_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setAuthUser({
          uid: user.uid,
          name: user.displayName || 'Vymx Trader',
          email: user.email || '',
          authType: 'google'
        });
        localStorage.setItem('vymx_is_authenticated', 'true');
        
        // Also fetch ledger
        try {
          const ledgerRef = doc(db, 'users', user.uid, 'ledger', 'data');
          const snap = await getDoc(ledgerRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.virtualBalance) setVirtualBalance(data.virtualBalance);
            if (data.watchlist) setWatchlist(data.watchlist);
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.transactions) setTransactions(data.transactions);
          } else {
            // init ledger
            await setDoc(ledgerRef, {
               virtualBalance: 100000,
               watchlist: ['AAPL', 'BTC', 'SOL', 'GC=F'],
               portfolio: [
                 { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', avgBuyPrice: 175.50, quantity: 20 },
                 { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', avgBuyPrice: 62450.00, quantity: 0.5 },
               ],
               transactions: [
                 {
                   id: 'tx-seed-1',
                   symbol: 'AAPL',
                   name: 'Apple Inc.',
                   type: 'BUY',
                   quantity: 20,
                   price: 175.50,
                   total: 3510.00,
                   date: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
                 },
                 {
                   id: 'tx-seed-2',
                   symbol: 'BTC',
                   name: 'Bitcoin',
                   type: 'BUY',
                   quantity: 0.5,
                   price: 62455.00,
                   total: 31227.50,
                   date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
                 }
               ]
            });
          }
        } catch (e) {
          console.warn("Ledger fetch issue:", e);
        }
      } else {
        setIsAuthenticated(false);
        setAuthUser(null);
        localStorage.removeItem('vymx_is_authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userPayload: any) => {
    setIsAuthenticated(true);
    setAuthUser(userPayload);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setAuthUser(null);
    localStorage.removeItem('vymx_is_authenticated');
    localStorage.removeItem('vymx_auth_user');
    localStorage.removeItem('vymx_integrity_signature');
  };

  // --- THEME STATE MANAGEMENT & PERSISTENCE ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('finova_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('finova_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // --- CURRENCY MODE STATE MANAGEMENT ---
  const [currencyMode, setCurrencyMode] = useState<'AUTO' | 'USD' | 'INR'>(() => {
    const saved = localStorage.getItem('finova_currency_mode');
    return (saved === 'AUTO' || saved === 'USD' || saved === 'INR') ? saved : 'INR';
  });

  useEffect(() => {
    localStorage.setItem('finova_currency_mode', currencyMode);
  }, [currencyMode]);

  // --- REAL-TIME LIVE MARKET DATA TICKER ---
  const [liveAssets, setLiveAssets] = useState<Asset[]>(assets);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [isDataOffline, setIsDataOffline] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const lastFetchRef = React.useRef<number>(0);
  const isFetchingRef = React.useRef<boolean>(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdKOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const getKolkataTimeStr = () => {
      try {
        return new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } catch (e) {
        return new Date().toLocaleTimeString('en-US');
      }
    };

    setLastUpdatedTime(getKolkataTimeStr());

    const fetchRealPrices = async () => {
      if (isFetchingRef.current) return;
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) return;
      
      isFetchingRef.current = true;
      lastFetchRef.current = now;
      try {
        const symbolsToFetch = liveAssets.map(a => a.symbol);
        if (symbolsToFetch.length === 0) return;

        const startTime = performance.now();
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: symbolsToFetch }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (res.ok) {
          const endTime = performance.now();
          setLatencyMs(Math.round(endTime - startTime));
          
          const data = await res.json();
          if (data.success && data.prices) {
            setIsDataOffline(false);
            setLiveAssets(prevAssets => {
              return prevAssets.map(asset => {
                const newPriceData = data.prices[asset.symbol];
                if (newPriceData) {
                  // Validation Wrapper: Ensure incoming price data is valid
                  if (
                    newPriceData.price === null || 
                    newPriceData.price === undefined || 
                    isNaN(newPriceData.price) || 
                    !isFinite(newPriceData.price) ||
                    newPriceData.price < 0
                  ) {
                    console.error(`[Data Integrity Error] Market Data Update Failed: Invalid price detected for ${asset.symbol} - Data:`, newPriceData);
                    return asset; // Skip corrupted update
                  }

                  const updatedHistory = { ...asset.history };
                  if (updatedHistory['1D'] && updatedHistory['1D'].length > 0) {
                    const updated1D = [...updatedHistory['1D']];
                    const lastIdx = updated1D.length - 1;
                    updated1D[lastIdx] = {
                      ...updated1D[lastIdx],
                      value: newPriceData.price
                    };
                    updatedHistory['1D'] = updated1D;
                  }

                  return {
                    ...asset,
                    price: newPriceData.price,
                    change: newPriceData.change,
                    changeAbs: newPriceData.changeAbs,
                    low52w: newPriceData.low52w,
                    high52w: newPriceData.high52w,
                    prevClose: newPriceData.prevClose,
                    history: updatedHistory
                  };
                }
                return asset;
              });
            });
            setLastUpdatedTime(getKolkataTimeStr());
            addLog({ timestamp: new Date().toISOString(), status: 'SUCCESS', message: `Synchronized ${symbolsToFetch.length} assets.`, latencyMs: Math.round(endTime - startTime) });
          } else {
             addLog({ timestamp: new Date().toISOString(), status: 'ERROR', message: `Data sync format invalid.` });
          }
        } else {
           setIsDataOffline(true);
           addLog({ timestamp: new Date().toISOString(), status: 'ERROR', message: `Server error: ${res.status} ${res.statusText}` });
        }
      } catch (err: any) {
        // Detailed error handling: Set Data Offline state gracefully instead of failing silently
        setIsDataOffline(true);
        addLog({ timestamp: new Date().toISOString(), status: 'ERROR', message: `Connection failed: ${err.message}` });
        if (err.name !== 'TypeError' || err.message !== 'Failed to fetch') {
          console.warn('Real prices fetch exception:', err);
        }
      } finally { isFetchingRef.current = false; }
    };

    // Fetch immediately
    fetchRealPrices();
    // Always establish polling for market data
    const interval = setInterval(() => {
      fetchRealPrices();
    }, 2000); // Trigger clean real-time update cycle every 5 seconds

    return () => clearInterval(interval);
  }, [isConnected, isConnectionUnstable]);

  // Set default selected asset as NIFTY50 so details view is high-relevance and premium!
  useEffect(() => {
    const defaultAsset = assets.find((a) => a.symbol === 'NIFTY50') || assets[0];
    setSelectedAsset(defaultAsset);
  }, []);

  // --- COUNTRY-AWARE UNIFIED DYNAMIC FORMATTER ---
  const formatCurrency = (val: number, typeOrSymbol: string = 'stock', assetCountry?: string) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '---';
    }
    
    if (typeOrSymbol === 'bond' || typeOrSymbol === 'index' || typeOrSymbol === 'crypto') {
      // Just check if it's an index or something where we want to still show currency.
      // Wait, indices usually have points, but displaying currency is fine.
    }

    if (typeOrSymbol === 'bond') {
      return val.toFixed(4) + '%';
    }

    let targetCurrency = 'USD';
    let locale = 'en-US';

    const isIndian = assetCountry === 'India' || 
      ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'NIFTY50', 'SENSEX', 'BANKNIFTY', 'USD/INR', 'indian-stock'].includes(typeOrSymbol);
    const isUK = assetCountry === 'United Kingdom' || ['FTSE', 'UK100'].includes(typeOrSymbol);
    const isEurope = assetCountry === 'Europe' || assetCountry === 'Germany' || assetCountry === 'France' || ['DAX', 'CAC'].includes(typeOrSymbol);
    
    if (isIndian) {
      targetCurrency = 'INR';
      locale = 'en-IN';
    } else if (isUK) {
      targetCurrency = 'GBP';
      locale = 'en-GB';
    } else if (isEurope) {
      targetCurrency = 'EUR';
      locale = 'de-DE';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: typeOrSymbol === 'forex' ? 4 : 2,
      maximumFractionDigits: typeOrSymbol === 'forex' ? 4 : 2,
    }).format(val);
  };

  // --- STATE PERSISTENCE & HYDRATION ---
  
  // 1. Watchlist (Default indices & high-liquidity stock symbols)
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('finova_watchlist');
    return saved ? JSON.parse(saved) : ['AAPL', 'BTC', 'SOL', 'GC=F'];
  });

  // 2. Virtual USD Cash Capital
  const [virtualBalance, setVirtualBalance] = useState<number>(() => {
    const saved = localStorage.getItem('finova_balance');
    return saved ? parseFloat(saved) : 100000;
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('finova_price_alerts');
    return saved ? JSON.parse(saved) : [];
  });


  const addToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'alert') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  useEffect(() => {
    localStorage.setItem('finova_price_alerts', JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  // Alert check monitor
  useEffect(() => {
    setPriceAlerts(prevAlerts => {
      let updated = false;
      const newAlerts = prevAlerts.map(alert => {
        if (!alert.active) return alert;
        const liveAsset = liveAssets.find(a => a.symbol === alert.symbol);
        if (!liveAsset) return alert;

        let triggered = false;
        if (alert.direction === 'above' && liveAsset.price >= alert.targetPrice) {
          triggered = true;
        } else if (alert.direction === 'below' && liveAsset.price <= alert.targetPrice) {
          triggered = true;
        }

        if (triggered) {
          updated = true;
          addToast(`ALERT: ${alert.symbol} hit your target of ${alert.targetPrice}!`, 'alert');
          return { ...alert, active: false };
        }
        return alert;
      });
      return updated ? newAlerts : prevAlerts;
    });
  }, [liveAssets]);

  // 3. Investment Portfolios ledger (Prepopulate with AAPL & BTC to make the dashboard feel alive and interactive instantly!)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('finova_portfolio');
    const defaultPortfolio = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', avgBuyPrice: 175.50, quantity: 20 },
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', avgBuyPrice: 62450.00, quantity: 0.5 },
    ] as PortfolioItem[];
    if (saved) return decompressData<PortfolioItem[]>(saved, defaultPortfolio);
    return defaultPortfolio;
  });

  // 4. Settled Transactions History
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finova_transactions');
    const defaultTransactions = [
      {
        id: 'tx-seed-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'BUY',
        quantity: 20,
        price: 175.50,
        total: 3510.00,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
      },
      {
        id: 'tx-seed-2',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'BUY',
        quantity: 0.5,
        price: 62455.00,
        total: 31227.50,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
      },
    ] as Transaction[];
    if (saved) return decompressData<Transaction[]>(saved, defaultTransactions);
    return defaultTransactions;
  });

  const updateTransactionNote = (id: string, note: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, note } : t));
  };

  // Keep localStorage sync'd
  useEffect(() => {
    localStorage.setItem('finova_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('finova_balance', virtualBalance.toString());
  }, [virtualBalance]);

  useEffect(() => {
    localStorage.setItem('finova_portfolio', compressData(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('finova_transactions', compressData(transactions));
  }, [transactions]);
  
  useEffect(() => {
    const saveToCloud = async () => {
      if (typeof authUser === 'object' && authUser !== null && authUser.uid) {
         try {
           const ledgerRef = doc(db, 'users', authUser.uid, 'ledger', 'data');
           await setDoc(ledgerRef, {
             virtualBalance,
             watchlist,
             portfolio,
             transactions,
           }, { merge: true });
         } catch(e) {
           console.warn("Cloud sync paused/issue:", e);
         }
      }
    };
    saveToCloud();
  }, [watchlist, portfolio, virtualBalance, transactions, authUser]);


  // --- ACTIONS ---

  // Add/Remove of elements in watch lists
  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Portfolio items valuations calculators
  const getPortfolioValue = () => {
    return portfolio.reduce((sum, item) => {
      const liveAsset = liveAssets.find((a) => a.symbol === item.symbol);
      const currentPrice = liveAsset ? liveAsset.price : item.avgBuyPrice;
      return sum + item.quantity * currentPrice;
    }, 0);
  };

  const totalEquity = virtualBalance + getPortfolioValue();

  // Handle Order Settlement logic (Buy & Sell simulated transactions)
  const handleTradeSubmit = (
    type: 'BUY' | 'SELL',
    symbol: string,
    quantity: number,
    price: number
  ): { success: boolean; message: string } => {
    // Validation Wrapper: Ensure price and quantity are valid numbers
    if (price === null || price === undefined || isNaN(price) || !isFinite(price) || price < 0) {
      console.error(`[Data Integrity Error] Trade Submit Failed: Invalid price detected for ${symbol} - Price: ${price}`);
      return { success: false, message: 'Transaction rejected: Invalid or corrupted price data.' };
    }
    
    if (quantity === null || quantity === undefined || isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
      console.error(`[Data Integrity Error] Trade Submit Failed: Invalid quantity detected for ${symbol} - Quantity: ${quantity}`);
      return { success: false, message: 'Transaction rejected: Invalid or corrupted quantity data.' };
    }

    const liveAsset = liveAssets.find((a) => a.symbol === symbol)!;
    const assetName = liveAsset ? liveAsset.name : symbol;
    const totalCostValue = quantity * price;

    if (isNaN(totalCostValue) || !isFinite(totalCostValue)) {
      console.error(`[Data Integrity Error] Trade Submit Failed: Calculation resulted in NaN for ${symbol} - Quantity: ${quantity}, Price: ${price}`);
      return { success: false, message: 'Transaction rejected: Corrupted calculation.' };
    }

    if (type === 'BUY') {
      if (virtualBalance < totalCostValue) {
        return {
          success: false,
          message: `Insufficient Sandbox Balance. This order requires ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCostValue)} (Available virtual cash is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(virtualBalance)}).`,
        };
      }

      // Complete Simulated Cash debit
      setVirtualBalance((prev) => prev - totalCostValue);

      // Insert or adjust portfolio weight averages
      setPortfolio((prev) => {
        const existingIdx = prev.findIndex((item) => item.symbol === symbol);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const legacyItem = updated[existingIdx];
          const combinedQty = legacyItem.quantity + quantity;
          const weightedBuyPrice =
            (legacyItem.avgBuyPrice * legacyItem.quantity + price * quantity) /
            combinedQty;

          if (isNaN(weightedBuyPrice) || !isFinite(weightedBuyPrice)) {
            console.error(`[Data Integrity Error] Trade Submit Failed: weightedBuyPrice resulted in NaN for ${symbol}. avgBuyPrice: ${legacyItem.avgBuyPrice}, oldQty: ${legacyItem.quantity}, newPrice: ${price}, newQty: ${quantity}`);
          }

          updated[existingIdx] = {
            ...legacyItem,
            quantity: combinedQty,
            avgBuyPrice: isNaN(weightedBuyPrice) || !isFinite(weightedBuyPrice) ? legacyItem.avgBuyPrice : parseFloat(weightedBuyPrice.toFixed(2)),
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              symbol,
              name: assetName,
              type: liveAsset ? liveAsset.type : 'stock',
              avgBuyPrice: price,
              quantity,
            },
          ];
        }
      });

      // Append logs ledger file
      const orderId = `tx-${Date.now()}`;
      const newTx: Transaction = {
        id: orderId,
        symbol,
        name: assetName,
        type: 'BUY',
        quantity,
        price,
        total: totalCostValue,
        date: new Date().toLocaleString(),
      };
      setTransactions((prev) => [...prev, newTx]);

      return {
        success: true,
        message: `Successfully simulated buy order of ${quantity} shares/units of ${symbol} at ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}.`,
      };
    } else {
      // type: 'SELL'
      const existing = portfolio.find((item) => item.symbol === symbol);
      
      const epsilon = 0.000001;
      if (!existing || (existing.quantity + epsilon < quantity)) {
        return {
          success: false,
          message: `Insufficient Holdings Portfolio units. You attempted to liquidate ${quantity} units of ${symbol} but currently hold only ${existing ? existing.quantity : 0} units.`,
        };
      }

      // If it's a 100% liquidation (within epsilon), clear it exactly to avoid 0.000000001 dust leftover
      const actualSellQuantity = (Math.abs(existing.quantity - quantity) < epsilon) ? existing.quantity : quantity;
      
      // Complete simulated Cash Credit
      const proceeds = actualSellQuantity * price;
      setVirtualBalance((prev) => prev + proceeds);

      // Deduct shares portfolio or splice elements if fully liquidated
      setPortfolio((prev) => {
        return prev
          .map((item) => {
            if (item.symbol === symbol) {
              return { ...item, quantity: item.quantity - actualSellQuantity };
            }
            return item;
          })
          .filter((item) => item.quantity > epsilon);
      });

      // Append transaction ledger
      const orderId = `tx-${Date.now()}`;
      const newTx: Transaction = {
        id: orderId,
        symbol,
        name: assetName,
        type: 'SELL',
        quantity: actualSellQuantity,
        price,
        total: proceeds,
        date: new Date().toLocaleString(),
      };
      setTransactions((prev) => [...prev, newTx]);

      return {
        success: true,
        message: `Successfully liquidated and credited ${actualSellQuantity} units of ${symbol} at ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)} simulation.`,
      };
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setView('details');
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light text-zinc-800 bg-zinc-50' : 'text-zinc-300 bg-zinc-950'} font-sans antialiased selection:bg-emerald-500/30 selection:text-white relative`}>
      {/* Refined Backing Layer */}
      <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme === 'light' ? 'from-indigo-100 via-zinc-50 to-zinc-50' : 'from-indigo-900/15 via-zinc-950 to-zinc-950'} pointer-events-none bg-tech-grid`}></div>
      
      {/* Global Background Grid Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <CommandCenter
        isOpen={isCmdKOpen}
        onClose={() => setIsCmdKOpen(false)}
        setView={setView}
        assets={liveAssets}
        onSelectAsset={handleSelectAsset}
      />
      <div className="relative z-10 w-full h-full">
      {/* Dynamic Navbar */}
      <Navbar
        currentView={currentView}
        setView={setView}
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
        virtualBalance={virtualBalance}
        totalEquity={totalEquity}
        theme={theme}
        toggleTheme={toggleTheme}
        currencyMode={currencyMode}
        setCurrencyMode={setCurrencyMode}
        assets={liveAssets}
        formatCurrency={formatCurrency}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        authUser={authUser}
        onOpenCmdK={() => setIsCmdKOpen(true)}
      />

      {/* Main Container screen area */}
      <ErrorBoundary>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-16">
        
        {!isAuthenticated ? (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            formatCurrency={formatCurrency}
          />
        ) : (
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Dashboard
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  onSelectAsset={handleSelectAsset}
                  setView={setView}
                  portfolio={portfolio}
                  assets={liveAssets}
                  formatCurrency={formatCurrency}
                  isStrictHours={isStrictHours}
                  setIsStrictHours={setIsStrictHours}
                  priceAlerts={priceAlerts}
                  setPriceAlerts={setPriceAlerts}
                />
              </motion.div>
            )}

            {currentView === 'heatmap' && (
              <motion.div key="heatmap" initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Heatmap
                  onSelectAsset={handleSelectAsset}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  assets={liveAssets}
                  onTradeSubmit={handleTradeSubmit}
                />
              </motion.div>
            )}

            {currentView === 'screener' && (
              <motion.div key="screener" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Screener
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  onSelectAsset={handleSelectAsset}
                  assets={liveAssets}
                  formatCurrency={formatCurrency}
                  isStrictHours={isStrictHours}
                />
              </motion.div>
            )}

            {currentView === 'portfolio' && (
              <motion.div key="portfolio" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Portfolio
                  virtualBalance={virtualBalance}
                  portfolio={portfolio}
                  transactions={transactions}
                  onSelectAsset={handleSelectAsset}
                  setView={setView}
                  assets={liveAssets}
                  formatCurrency={formatCurrency}
                  onUpdateTransactionNote={updateTransactionNote}
                />
              </motion.div>
            )}

            {currentView === 'details' && selectedAsset && (() => {
              const liveSelected = liveAssets.find(a => a.symbol === selectedAsset.symbol) || selectedAsset;
              return (
                <motion.div key="details" initial={{ opacity: 0, y: 25, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -25, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <AssetDetails
                    asset={liveSelected}
                    virtualBalance={virtualBalance}
                    portfolio={portfolio}
                    watchlist={watchlist}
                    toggleWatchlist={toggleWatchlist}
                    onTradeSubmit={handleTradeSubmit}
                    formatCurrency={formatCurrency}
                    currencyMode={currencyMode}
                    isStrictHours={isStrictHours}
                    assets={liveAssets}
                  />
                </motion.div>
              );
            })()}

            {currentView === 'academy' && (
              <motion.div key="academy" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Academy
                  onSelectAsset={handleSelectAsset}
                  setView={setView}
                  assets={liveAssets}
                />
              </motion.div>
            )}

            {currentView === 'advisor' && (
              <motion.div key="advisor" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <WealthAdvisor
                  virtualBalance={virtualBalance}
                  assets={liveAssets}
                  setView={setView}
                  formatCurrency={formatCurrency}
                />
              </motion.div>
            )}

            {currentView === 'news' && (
              <motion.div key="news" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <MarketNews />
              </motion.div>
            )}

            {currentView === 'macro' && (
              <motion.div key="macro" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <EconomicCalendar />
              </motion.div>
            )}

            {currentView === 'institutional-flows' && (
              <motion.div key="institutional-flows" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <InstitutionalFlows formatCurrency={formatCurrency} />
              </motion.div>
            )}


          </AnimatePresence>
        )}

      </main>
      </ErrorBoundary>

      {/* Persistent global footer credits */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-[10px] text-zinc-600 font-mono relative z-10">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span>Vymx Trade Analytics</span>
            <span>•</span>
            <span>Built for MVP research discovery</span>
            {isDataOffline ? (
              <>
                <span>•</span>
                <span className="text-rose-400 capitalize flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Market Data Offline (API Rate Limit or Connection Lost)
                </span>
              </>
            ) : lastUpdatedTime && (
              <>
                <span>•</span>
                <span className="text-indigo-400 capitalize flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Tickers feed synchronized at {lastUpdatedTime} IST
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {latencyMs !== null && (
              <span className="text-zinc-500 flex items-center gap-1" title="Market Data Fetch Round-Trip Time">
                Latency: <span className="text-zinc-400 font-bold">{latencyMs}ms</span>
              </span>
            )}
            <span className="text-emerald-500/80 uppercase font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/15">Full-Stack Active</span>
            <span>Local Simulation Sandbox (No Financial Risks involved)</span>
          </div>
        </div>
      </footer>

      {/* Floating Quick Trade action overlay terminal */}
      {isAuthenticated && (
        <QuickTrade
          virtualBalance={virtualBalance}
          portfolio={portfolio}
          onTradeSubmit={handleTradeSubmit}
          assets={liveAssets}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Platform Onboarding Tour Walkthrough */}
      {isAuthenticated && (
        <Walkthrough
          currentView={currentView}
          setView={setView}
        />
      )}

      </div>

    </div>
  );
}
