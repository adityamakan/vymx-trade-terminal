import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import FinancialChatbot from './components/FinancialChatbot';
import EconomicCalendar from './components/EconomicCalendar';
import MacroeconomicAnalyzer from './components/MacroeconomicAnalyzer';
import InstitutionalFlows from './components/InstitutionalFlows';
import { Geopolitics } from './components/Geopolitics';
import CommandCenter from './components/CommandCenter';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Asset, PortfolioItem, Transaction, PriceAlert } from './types';
import { assets } from './data';
import { Layers, GraduationCap, Globe, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateIntegritySignature } from './utils/security';
import { getAssetMarketStatus } from './utils/market';
import { auth, onAuthStateChanged, signOut, db, doc, getDoc, setDoc, collection, getDocs } from './lib/firebase';
import { useWebSocket } from './hooks/useWebSocket';
import { useDataIntegrity } from './contexts/DataIntegrityContext';

interface PortfolioSnapshot {
  id: string;
  capturedAt: number;
  cashBalance: number;
  positions: { symbol: string; quantity: number; price: number; marketValue: number; quoteCurrency: string | null; marketValueUSD: number | null }[];
  baseCurrency: 'USD';
  fxRates: Record<string, number>;
  totalEquityUSD: number | null;
  source: 'provider-quote-snapshot';
  currencyNormalization: 'provider-fx-to-usd' | 'incomplete';
}

export default function App() {
  const { addLog } = useDataIntegrity();
  const [currentView, setView] = useState<'dashboard' | 'screener' | 'portfolio' | 'details' | 'heatmap' | 'academy' | 'advisor' | 'macro' | 'institutional-flows' | 'news' | 'chatbot' | 'geopolitics' | 'login'>('macro');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // --- STRICT MARKET HOURS ENFORCEMENT ---
  const [isStrictHours, setIsStrictHours] = useState<boolean>(true);

  // Firebase is authoritative for persistent accounts. Demo access is an
  // explicitly ephemeral local sandbox and is never treated as a Firebase identity.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<{ uid?: string; email?: string; name?: string; authType?: string } | null>(null);
  const [ledgerHydrated, setLedgerHydrated] = useState(false);
  const guestSessionRef = useRef(false);
  const portfolioSnapshotRef = useRef<{ virtualBalance: number; portfolio: PortfolioItem[]; assets: Asset[] }>({ virtualBalance: 100000, portfolio: [], assets: [] });
  const lastSnapshotBucketRef = useRef<number | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        guestSessionRef.current = false;
        setLedgerHydrated(false);
        setIsAuthenticated(true);
        setAuthUser({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Vymx Trader',
          email: user.email || '',
          authType: user.providerData.some((provider) => provider.providerId === 'password') ? 'email' : 'google'
        });

        // Never carry a previous guest/browser demo portfolio into a new
        // Firebase identity. A newly created account starts with an empty ledger.
        setVirtualBalance(100000);
        setWatchlist(['AAPL', 'BTC', 'SOL', 'GC=F']);
        setPriceAlerts([]);
        setPortfolio([]);
        setTransactions([]);
        setPortfolioSnapshots([]);
        lastSnapshotBucketRef.current = null;

        let ledgerReadSucceeded = !db;
        try {
          if (db) {
            const ledgerRef = doc(db, 'users', user.uid, 'ledger', 'data');
            const snap = await getDoc(ledgerRef);
            if (auth.currentUser?.uid !== user.uid) return;
            if (snap.exists()) {
              const data = snap.data();
              if (typeof data.virtualBalance === 'number' && Number.isFinite(data.virtualBalance)) setVirtualBalance(data.virtualBalance);
              if (Array.isArray(data.watchlist)) setWatchlist(data.watchlist);
              if (Array.isArray(data.portfolio)) setPortfolio(data.portfolio);
              if (Array.isArray(data.transactions)) setTransactions(data.transactions);
            }
            const snapshotsRef = collection(db, 'users', user.uid, 'portfolioSnapshots');
            const snapshotDocs = await getDocs(snapshotsRef);
            if (auth.currentUser?.uid !== user.uid) return;
            const loadedSnapshots = snapshotDocs.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
              .filter((snapshot: any) => Number.isFinite(snapshot.capturedAt))
              .sort((a: any, b: any) => a.capturedAt - b.capturedAt)
              .slice(-500);
            setPortfolioSnapshots(loadedSnapshots as PortfolioSnapshot[]);
            ledgerReadSucceeded = true;
          }
        } catch (e) {
          // Do not enable cloud writes after a failed read: doing so could
          // overwrite an existing remote ledger with local demo defaults.
          console.warn('Ledger fetch issue; cloud writes remain paused:', e);
        } finally {
          if (auth.currentUser?.uid === user.uid && ledgerReadSucceeded) setLedgerHydrated(true);
        }
      } else if (!guestSessionRef.current) {
        setLedgerHydrated(false);
        setIsAuthenticated(false);
        setAuthUser(null);
        // No Firebase identity is active. Clear any previous account's
        // browser-side ledger so guest access cannot inherit another user's data.
        setVirtualBalance(100000);
        setWatchlist(['AAPL', 'BTC', 'SOL', 'GC=F']);
        setPriceAlerts([]);
        setPortfolio([]);
        setTransactions([]);
        setPortfolioSnapshots([]);
        lastSnapshotBucketRef.current = null;
        ['finova_watchlist', 'finova_balance', 'finova_price_alerts', 'finova_portfolio', 'finova_transactions'].forEach((key) => localStorage.removeItem(key));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userPayload: any) => {
    if (userPayload?.authType === 'guest') {
      guestSessionRef.current = true;
      setLedgerHydrated(true);
      setIsAuthenticated(true);
      setAuthUser(userPayload);
      return;
    }
    // A persistent account becomes authenticated only after Firebase emits
    // its signed-in user through onAuthStateChanged.
    setAuthUser(userPayload);
  };

  const handleLogout = async () => {
    guestSessionRef.current = false;
    if (auth) {
      try { await signOut(auth); }
      catch (err) { console.warn('Firebase signout error:', err); }
    }
    setIsAuthenticated(false);
    setAuthUser(null);
    setLedgerHydrated(false);
    setVirtualBalance(100000);
    setWatchlist(['AAPL', 'BTC', 'SOL', 'GC=F']);
    setPriceAlerts([]);
    setPortfolio([]);
    setTransactions([]);
    setPortfolioSnapshots([]);
    lastSnapshotBucketRef.current = null;
    ['finova_watchlist', 'finova_balance', 'finova_price_alerts', 'finova_portfolio', 'finova_transactions', 'vymx_auth_user', 'vymx_integrity_signature'].forEach((key) => localStorage.removeItem(key));
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
  const [isDataOffline, setIsDataOffline] = useState<boolean>(true);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);

  const getKolkataTimeStr = useCallback(() => {
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
  }, []);

  const handlePriceUpdate = useCallback((prices: Record<string, any>) => {
    if (!prices || Object.keys(prices).length === 0) return;
    setIsDataOffline(false);
    setLastUpdatedTime(getKolkataTimeStr());

    setLiveAssets(prevAssets => {
      let changed = false;
      const nextAssets = prevAssets.map(asset => {
        const newPriceData = prices[asset.symbol];
        if (!newPriceData) return asset;
        if (
          newPriceData.price === null ||
          newPriceData.price === undefined ||
          isNaN(newPriceData.price) ||
          !isFinite(newPriceData.price) ||
          newPriceData.price < 0
        ) {
          return asset;
        }

        changed = true;
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
          currency: typeof newPriceData.currency === 'string' ? newPriceData.currency.toUpperCase() : asset.currency ?? null,
          quoteAsOf: typeof newPriceData.asOf === 'string' ? newPriceData.asOf : new Date().toISOString(),
          volume: Number.isFinite(newPriceData.volume) ? newPriceData.volume : asset.volume,
          volumeDisplay: typeof newPriceData.volumeDisplay === 'string' ? newPriceData.volumeDisplay : asset.volumeDisplay,
          price: (newPriceData.price !== undefined && !isNaN(newPriceData.price)) ? newPriceData.price : asset.price,
          change: (newPriceData.change !== undefined && !isNaN(newPriceData.change)) ? newPriceData.change : asset.change,
          changeAbs: (newPriceData.changeAbs !== undefined && !isNaN(newPriceData.changeAbs)) ? newPriceData.changeAbs : asset.changeAbs,
          low52w: (newPriceData.low52w !== undefined && !isNaN(newPriceData.low52w)) ? newPriceData.low52w : asset.low52w,
          high52w: (newPriceData.high52w !== undefined && !isNaN(newPriceData.high52w)) ? newPriceData.high52w : asset.high52w,
          prevClose: (newPriceData.prevClose !== undefined && !isNaN(newPriceData.prevClose)) ? newPriceData.prevClose : asset.prevClose,
          history: updatedHistory
        };
      });

      return changed ? nextAssets : prevAssets;
    });
  }, [getKolkataTimeStr]);

  // Establish WebSocket connection globally at /api/prices with auto-reconnect and HTTP long-polling fallback
  const { isConnected, isPolling, isConnectionUnstable, sendMessage, latencyMs } = useWebSocket({
    onPriceUpdate: handlePriceUpdate,
    symbols: assets.map((asset) => asset.symbol)
  });

  useEffect(() => {
    const noHealthyTransport = (!isConnected && !isPolling) || (isConnectionUnstable && !isPolling);
    setIsDataOffline(noHealthyTransport || !lastUpdatedTime);
  }, [isConnected, isPolling, isConnectionUnstable, lastUpdatedTime]);

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

  // Local guest/demo state is intentionally ephemeral. Persistent accounts
  // hydrate their own ledger from Firestore after Firebase identity validation.
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'BTC', 'SOL', 'GC=F']);
  const [virtualBalance, setVirtualBalance] = useState<number>(100000);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);


  const addToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'alert') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

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

  // Demo mode starts with no positions or transaction history. Firebase
  // accounts load their own persisted portfolio after authentication.
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  portfolioSnapshotRef.current = { virtualBalance, portfolio, assets: liveAssets };

  const updateTransactionNote = (id: string, note: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, note } : t));
  };

  useEffect(() => {
    const saveToCloud = async () => {
      if (
        ledgerHydrated && db && auth && auth.currentUser && authUser?.uid &&
        authUser.authType !== 'guest' && auth.currentUser.uid === authUser.uid
      ) {
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
  }, [watchlist, portfolio, virtualBalance, transactions, authUser, ledgerHydrated]);


  // Capture provider-backed portfolio valuation snapshots for authenticated accounts.
  // Each observation stores provider quote currency and an indicative FX-to-USD conversion.
  // Unavailable currency rates leave the aggregate USD valuation null rather than guessed.
  useEffect(() => {
    if (!ledgerHydrated || !db || !auth || !authUser?.uid || authUser.authType === 'guest' || auth.currentUser?.uid !== authUser.uid || isDataOffline) return;
    const uid = authUser.uid;
    const captureSnapshot = async () => {
      const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
      if (lastSnapshotBucketRef.current === bucket) return;
      const current = portfolioSnapshotRef.current;
      const validPositions = current.portfolio
        .filter((position) => position.quantity > 0)
        .map((position) => {
          const quote = current.assets.find((asset) => asset.symbol === position.symbol);
          const currency = typeof quote?.currency === 'string' && /^[A-Z]{3}$/.test(quote.currency) ? quote.currency : null;
          return quote && Number.isFinite(quote.price) && quote.price > 0
            ? { symbol: position.symbol, quantity: position.quantity, price: quote.price, marketValue: position.quantity * quote.price, quoteCurrency: currency }
            : null;
        })
        .filter((position): position is NonNullable<typeof position> => position !== null);
      const currencies = [...new Set(validPositions.map((position) => position.quoteCurrency).filter((currency): currency is string => Boolean(currency)))];
      let fxRates: Record<string, number> = { USD: 1 };
      try {
        if (currencies.length) {
          const fxResponse = await fetch(`/api/fx/rates?base=USD&currencies=${encodeURIComponent(currencies.join(','))}`, { signal: AbortSignal.timeout(12_000) });
          if (fxResponse.ok) {
            const fxPayload = await fxResponse.json();
            if (fxPayload?.success && fxPayload.rates && typeof fxPayload.rates === 'object') fxRates = fxPayload.rates;
          }
        }
      } catch (error) {
        console.warn('FX conversion unavailable for this portfolio snapshot:', error);
      }
      const normalizedPositions = validPositions.map((position) => ({
        ...position,
        marketValueUSD: position.quoteCurrency && Number.isFinite(fxRates[position.quoteCurrency])
          ? position.marketValue * fxRates[position.quoteCurrency]
          : null
      }));
      const fxComplete = normalizedPositions.every((position) => position.marketValueUSD != null);
      const capturedAt = Date.now();
      const snapshot: PortfolioSnapshot = {
        id: String(bucket),
        capturedAt,
        cashBalance: current.virtualBalance,
        positions: normalizedPositions,
        baseCurrency: 'USD',
        fxRates,
        totalEquityUSD: fxComplete ? current.virtualBalance + normalizedPositions.reduce((sum, position) => sum + (position.marketValueUSD || 0), 0) : null,
        source: 'provider-quote-snapshot',
        currencyNormalization: fxComplete ? 'provider-fx-to-usd' : 'incomplete'
      };
      try {
        const dailyId = new Date(capturedAt).toISOString().slice(0, 10);
        const dailySnapshot = { ...snapshot, id: dailyId };
        await setDoc(doc(db, 'users', uid, 'portfolioSnapshots', dailyId), dailySnapshot);
        await setDoc(doc(db, 'users', uid, 'portfolioIntradaySnapshots', String(bucket)), { ...snapshot, id: String(bucket) });
        if (auth.currentUser?.uid !== uid) return;
        lastSnapshotBucketRef.current = bucket;
        setPortfolioSnapshots((previous) => [...previous.filter((item) => item.id !== dailyId), dailySnapshot].sort((a, b) => a.capturedAt - b.capturedAt).slice(-500));
      } catch (error) {
        console.warn('Portfolio snapshot was not persisted:', error);
      }
    };
    void captureSnapshot();
    const timer = window.setInterval(() => void captureSnapshot(), 60_000);
    return () => window.clearInterval(timer);
  }, [ledgerHydrated, authUser?.uid, authUser?.authType, isDataOffline]);

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
    if (isDataOffline) {
      return { success: false, message: 'Market quote feed unavailable. Simulated orders are disabled until a verified provider quote is received.' };
    }

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
        <AnimatePresence mode="wait">
          {currentView === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.3 }}>
              <div className="mb-4">
                <button
                  onClick={() => setView('dashboard')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2"
                >
                  ← Return to Terminal
                </button>
              </div>
              <AuthPage
                onLoginSuccess={(user) => {
                  handleLoginSuccess(user);
                  setView('dashboard');
                }}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}

          {currentView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Dashboard
                  isDataOffline={isDataOffline}
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
                  isDataOffline={isDataOffline}
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
                  snapshots={portfolioSnapshots}
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
                    isDataOffline={isDataOffline}
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
                <MacroeconomicAnalyzer />
              </motion.div>
            )}

            {currentView === 'chatbot' && (
              <motion.div key="chatbot" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <FinancialChatbot activeAsset={selectedAsset} portfolio={portfolio} userId={authUser?.uid || 'guest'} />
              </motion.div>
            )}

            {currentView === 'geopolitics' && (
              <motion.div key="geopolitics" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Geopolitics isMobile={false} />
              </motion.div>
            )}
            {currentView === 'institutional-flows' && (
              <motion.div key="institutional-flows" initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <InstitutionalFlows formatCurrency={formatCurrency} />
              </motion.div>
            )}

          </AnimatePresence>

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
      <QuickTrade
        virtualBalance={virtualBalance}
        portfolio={portfolio}
        onTradeSubmit={handleTradeSubmit}
        assets={liveAssets}
        formatCurrency={formatCurrency}
      />

      {/* Platform Onboarding Tour Walkthrough */}
      <Walkthrough
        currentView={currentView}
        setView={setView}
      />

      </div>

    </div>
  );
}

