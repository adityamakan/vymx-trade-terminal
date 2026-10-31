import express, { Request, Response } from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import yahooFinance from 'yahoo-finance2';

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT || 5000);
const MAX_SYMBOLS = 100;
const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 500;
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', '^GSPC', '^IXIC', '^NSEI', '^BSESN', 'BTC-USD', 'GC=F'];

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

const SYMBOL_ALIASES: Record<string, string> = {
  NIFTY50: '^NSEI', NIFTY: '^NSEI', SENSEX: '^BSESN', BANKNIFTY: '^NSEBANK',
  BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', BNB: 'BNB-USD', XRP: 'XRP-USD',
  DOGE: 'DOGE-USD', LINK: 'LINK-USD', UNI: 'UNI-USD', SPX: '^GSPC', '.SPX': '^GSPC',
  '.IXIC': '^IXIC', '.DJI': '^DJI', '.FTSE': '^FTSE', '.N225': '^N225',
  SANDP500: '^GSPC', NASDAQ: '^IXIC', UK100: '^FTSE', FTSE: '^FTSE',
  DAX: '^GDAXI', CAC: '^FCHI', COPPER: 'HG=F', TSMC: 'TSM',
  RELIANCE: 'RELIANCE.NS', TCS: 'TCS.NS', HDFCBANK: 'HDFCBANK.NS', INFY: 'INFY.NS',
  ICICIBANK: 'ICICIBANK.NS', BHARTIARTL: 'BHARTIARTL.NS', SBIN: 'SBIN.NS', LT: 'LT.NS',
  ITC: 'ITC.NS', HINDUNILVR: 'HINDUNILVR.NS', TATASTEEL: 'TATASTEEL.NS',
  ZOMATO: 'ZOMATO.NS', BAJFINANCE: 'BAJFINANCE.NS', MARUTI: 'MARUTI.NS', US10Y: '^TNX',
  'EUR/USD': 'EURUSD=X', 'USD/INR': 'INR=X', 'USD/JPY': 'JPY=X',
  'GBP/USD': 'GBPUSD=X', 'USD/CAD': 'CAD=X', 'AUD/USD': 'AUDUSD=X'
};

type PriceQuote = {
  price: number;
  change: number;
  changeAbs: number;
  low52w: number | null;
  high52w: number | null;
  prevClose: number | null;
  currency: string | null;
  marketState: string | null;
  dayHigh: number | null;
  dayLow: number | null;
  asOf: string;
  source: 'Yahoo Finance';
};

const quoteCache = new Map<string, { value: PriceQuote; expiresAt: number }>();
const historyCache = new Map<string, { value: unknown; expiresAt: number }>();
const financialCache = new Map<string, { value: unknown; expiresAt: number }>();

function setBoundedCache<T>(cache: Map<string, { value: T; expiresAt: number }>, key: string, value: T, ttlMs: number) {
  const now = Date.now();
  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
    for (const [entryKey, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(entryKey);
    }
    while (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) break;
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { value, expiresAt: now + ttlMs });
}

const normalizeSymbol = (symbol: string) => SYMBOL_ALIASES[symbol.toUpperCase()] || symbol;

function validateSymbols(input: unknown): string[] {
  if (input === undefined) return DEFAULT_SYMBOLS;
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_SYMBOLS) {
    throw new Error(`symbols must be an array containing 1-${MAX_SYMBOLS} entries`);
  }
  const values = input.map((item) => String(item).trim());
  if (values.some((s) => !/^[A-Za-z0-9.^=_/\\-]{1,32}$/.test(s))) {
    throw new Error('One or more symbols contain unsupported characters');
  }
  return [...new Set(values)];
}

async function fetchQuote(symbol: string): Promise<PriceQuote> {
  const now = Date.now();
  const cached = quoteCache.get(symbol);
  if (cached && cached.expiresAt > now) return cached.value;

  const providerSymbol = normalizeSymbol(symbol);
  const quote: any = await yahooFinance.quote(providerSymbol);
  const unitScale = symbol === 'US10Y' || providerSymbol === '^TNX' ? 0.1 : 1;
  const rawPrice = Number(quote?.regularMarketPrice);
  const price = rawPrice * unitScale;
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Provider returned no valid price for ${symbol}`);

  const previousClose = quote?.regularMarketPreviousClose == null
    ? Number.NaN
    : Number(quote.regularMarketPreviousClose) * unitScale;
  const changeAbs = quote?.regularMarketChange != null && Number.isFinite(Number(quote.regularMarketChange))
    ? Number(quote.regularMarketChange) * unitScale
    : (Number.isFinite(previousClose) ? price - previousClose : 0);
  const change = quote?.regularMarketChangePercent != null && Number.isFinite(Number(quote.regularMarketChangePercent))
    ? Number(quote.regularMarketChangePercent)
    : (previousClose > 0 ? (changeAbs / previousClose) * 100 : 0);

  const result: PriceQuote = {
    price, change, changeAbs,
    low52w: quote?.fiftyTwoWeekLow != null && Number.isFinite(Number(quote.fiftyTwoWeekLow)) ? Number(quote.fiftyTwoWeekLow) * unitScale : null,
    high52w: quote?.fiftyTwoWeekHigh != null && Number.isFinite(Number(quote.fiftyTwoWeekHigh)) ? Number(quote.fiftyTwoWeekHigh) * unitScale : null,
    prevClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
    currency: typeof quote?.currency === 'string' ? quote.currency : null,
    marketState: typeof quote?.marketState === 'string' ? quote.marketState : null,
    dayHigh: quote?.regularMarketDayHigh != null && Number.isFinite(Number(quote.regularMarketDayHigh)) ? Number(quote.regularMarketDayHigh) * unitScale : null,
    dayLow: quote?.regularMarketDayLow != null && Number.isFinite(Number(quote.regularMarketDayLow)) ? Number(quote.regularMarketDayLow) * unitScale : null,
    asOf: new Date().toISOString(), source: 'Yahoo Finance'
  };
  setBoundedCache(quoteCache, symbol, result, CACHE_TTL_MS);
  return result;
}

// Bound provider concurrency. A 100-symbol client request should not launch 100
// simultaneous Yahoo Finance requests and trigger avoidable throttling.
async function getPrices(symbols: string[]) {
  const prices: Record<string, PriceQuote> = {};
  const errors: string[] = [];
  for (let i = 0; i < symbols.length; i += 8) {
    const batch = symbols.slice(i, i + 8);
    const entries = await Promise.all(batch.map(async (symbol) => {
      try { return [symbol, await fetchQuote(symbol)] as const; }
      catch { return [symbol, null] as const; }
    }));
    for (const [symbol, quote] of entries) {
      if (quote) prices[symbol] = quote;
      else errors.push(symbol);
    }
  }
  return { prices, errors, requested: symbols.length, returned: Object.keys(prices).length };
}

app.get(['/health', '/api/health', '/api/status'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok', service: 'vymx-api', marketDataProvider: 'Yahoo Finance',
    marketDataConfigured: true,
    optionalProviders: {
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      fred: Boolean(process.env.FRED_API_KEY),
      finnhub: Boolean(process.env.FINNHUB_API_KEY),
    },
    checkedAt: new Date().toISOString(),
    note: 'Health confirms API process availability, not market availability or execution capability.'
  });
});

app.post('/api/prices', async (req: Request, res: Response) => {
  let symbols: string[];
  try { symbols = validateSymbols(req.body?.symbols); }
  catch (error) { return res.status(400).json({ success: false, error: (error as Error).message }); }
  const result = await getPrices(symbols);
  const success = result.returned > 0;
  return res.status(success ? 200 : 503).json({
    success, ...result, source: 'Yahoo Finance', fetchedAt: new Date().toISOString(),
    partial: result.errors.length > 0
  });
});

// FX conversion rates expressed as USD value for one unit of foreign currency.
const USD_FX_QUOTES: Record<string, { symbol: string; invert: boolean }> = {
  INR: { symbol: 'INR=X', invert: true }, EUR: { symbol: 'EURUSD=X', invert: false },
  GBP: { symbol: 'GBPUSD=X', invert: false }, JPY: { symbol: 'JPY=X', invert: true },
  CAD: { symbol: 'CAD=X', invert: true }, AUD: { symbol: 'AUDUSD=X', invert: false },
  CHF: { symbol: 'CHF=X', invert: true }, KRW: { symbol: 'KRW=X', invert: true },
  TWD: { symbol: 'TWD=X', invert: true }, HKD: { symbol: 'HKD=X', invert: true },
  CNY: { symbol: 'CNY=X', invert: true }, SGD: { symbol: 'SGD=X', invert: true },
  SEK: { symbol: 'SEK=X', invert: true }, NZD: { symbol: 'NZDUSD=X', invert: false },
  MXN: { symbol: 'MXN=X', invert: true }, BRL: { symbol: 'BRL=X', invert: true }
};

app.get('/api/fx/rates', async (req: Request, res: Response) => {
  const base = String(req.query.base || 'USD').toUpperCase();
  const requested = String(req.query.currencies || '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
  if (base !== 'USD') return res.status(400).json({ success: false, error: 'Only USD base conversion is currently supported.' });
  if (requested.length > 30 || requested.some((currency) => !/^[A-Z]{3}$/.test(currency))) {
    return res.status(400).json({ success: false, error: 'Provide up to 30 valid ISO currency codes.' });
  }
  const currencies = [...new Set(requested)];
  const rates: Record<string, number> = { USD: 1 };
  const unavailable: string[] = [];
  for (let index = 0; index < currencies.length; index += 6) {
    const batch = currencies.slice(index, index + 6);
    const results = await Promise.all(batch.map(async (currency) => {
      if (currency === 'USD') return [currency, 1] as const;
      const config = USD_FX_QUOTES[currency];
      if (!config) return [currency, null] as const;
      try {
        const quote = await fetchQuote(config.symbol);
        const rate = config.invert ? 1 / quote.price : quote.price;
        return [currency, Number.isFinite(rate) && rate > 0 ? rate : null] as const;
      } catch {
        return [currency, null] as const;
      }
    }));
    for (const [currency, rate] of results) {
      if (rate == null) unavailable.push(currency);
      else rates[currency] = rate;
    }
  }
  return res.json({
    success: true, base: 'USD', rates, unavailable,
    source: 'Yahoo Finance FX quotes', fetchedAt: new Date().toISOString(),
    note: 'Rates are indicative provider quotes, not executable conversion prices. Historical valuations use the latest retrieved rate available at snapshot time.'
  });
});

app.get('/api/market-snapshot', async (_req: Request, res: Response) => {
  const symbols = ['^NSEI', '^BSESN', '^GSPC', '^IXIC', 'BTC-USD', '^VIX'];
  const result = await getPrices(symbols);
  if (!result.returned) return res.status(503).json({ success: false, ...result });
  res.json({ success: true, ...result, source: 'Yahoo Finance', fetchedAt: new Date().toISOString() });
});

// Real historical OHLCV candles from Yahoo Finance. Date ranges and intervals
// are constrained to avoid unbounded upstream requests.
app.get('/api/historical/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || '').trim();
  if (!/^[A-Za-z0-9.^=_/\\-]{1,32}$/.test(symbol)) {
    return res.status(400).json({ success: false, error: 'Invalid symbol' });
  }
  const interval = String(req.query.interval || '1d');
  const allowedIntervals = new Set(['1d', '1wk', '1mo', '1h', '30m', '15m', '5m']);
  if (!allowedIntervals.has(interval)) return res.status(400).json({ success: false, error: 'Unsupported interval' });

  const end = req.query.end ? new Date(String(req.query.end)) : new Date();
  const start = req.query.start ? new Date(String(req.query.start)) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
    return res.status(400).json({ success: false, error: 'Invalid historical date range' });
  }
  const rangeMs = end.getTime() - start.getTime();
  const maxRangeMs = ['5m', '15m', '30m'].includes(interval)
    ? 60 * 24 * 60 * 60 * 1000
    : interval === '1h'
      ? 730 * 24 * 60 * 60 * 1000
      : 5 * 365 * 24 * 60 * 60 * 1000;
  if (rangeMs > maxRangeMs) {
    return res.status(400).json({ success: false, error: `Historical range exceeds the supported limit for ${interval}` });
  }
  const cacheKey = `${symbol}:${interval}:${start.toISOString()}:${end.toISOString()}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);
  try {
    const chart: any = await (yahooFinance as any).chart(normalizeSymbol(symbol), {
      period1: start, period2: end, interval
    });
    const quotes = Array.isArray(chart?.quotes) ? chart.quotes : [];
    const historyScale = symbol === 'US10Y' || normalizeSymbol(symbol) === '^TNX' ? 0.1 : 1;
    if (!quotes.length) return res.status(404).json({ success: false, error: 'No historical observations returned', symbol });
    const payload = {
      success: true, symbol, providerSymbol: normalizeSymbol(symbol), interval,
      currency: chart.meta?.currency || null,
      exchangeTimezoneName: chart.meta?.exchangeTimezoneName || null,
      quotes: quotes.map((row: any) => ({
        date: row.date, open: row.open == null ? null : row.open * historyScale, high: row.high == null ? null : row.high * historyScale,
        low: row.low == null ? null : row.low * historyScale, close: row.close == null ? null : row.close * historyScale, adjclose: row.adjclose == null ? null : row.adjclose * historyScale,
        volume: row.volume ?? null
      })),
      source: 'Yahoo Finance', fetchedAt: new Date().toISOString()
    };
    setBoundedCache(historyCache, cacheKey, payload, 60_000);
    return res.json(payload);
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Historical data provider unavailable', detail: (error as Error).message });
  }
});

// Financial statement/profile data is fetched from the upstream provider; no
// fabricated fundamentals are substituted when Yahoo omits a field.
app.get('/api/yahoo/financials/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || '').trim();
  if (!/^[A-Za-z0-9.^=_/\\-]{1,32}$/.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
  const cached = financialCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);
  try {
    const modules = ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile',
      'incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory'];
    const data = await (yahooFinance as any).quoteSummary(normalizeSymbol(symbol), { modules });
    const payload = { success: true, symbol, data, source: 'Yahoo Finance', fetchedAt: new Date().toISOString() };
    setBoundedCache(financialCache, symbol, payload, 5 * 60_000);
    return res.json(payload);
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Financial data unavailable from provider', detail: (error as Error).message });
  }
});

app.get('/api/macro/indicators', async (_req: Request, res: Response) => {
  const symbols = ['^GSPC', '^VIX', '^TNX', 'DX-Y.NYB', 'GC=F', 'CL=F', 'BTC-USD', 'EURUSD=X', 'INR=X'];
  const result = await getPrices(symbols);
  return res.status(result.returned ? 200 : 503).json({
    success: result.returned > 0, indicators: result.prices, unavailable: result.errors,
    source: 'Yahoo Finance', fetchedAt: new Date().toISOString(),
    note: 'These are quoted market proxies, not official macroeconomic releases. Yahoo ^TNX is quoted in tenths of a percentage point; the UI normalizes it to percent.'
  });
});

// FRED access uses a server-side secret only. Never accept API keys from browsers.
app.get('/api/fred/series/:seriesId', async (req: Request, res: Response) => {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, code: 'PROVIDER_NOT_CONFIGURED', error: 'FRED integration is not configured' });
  const seriesId = String(req.params.seriesId || '');
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(seriesId)) return res.status(400).json({ success: false, error: 'Invalid FRED series ID' });
  try {
    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.search = new URLSearchParams({ series_id: seriesId, api_key: apiKey, file_type: 'json', sort_order: 'desc', limit: '500' }).toString();
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) return res.status(502).json({ success: false, error: 'FRED upstream request failed', status: upstream.status });
    const data = await upstream.json();
    return res.json({ success: true, seriesId, observations: data.observations || [], source: 'Federal Reserve Bank of St. Louis FRED' });
  } catch (error) {
    return res.status(502).json({ success: false, error: 'FRED provider unavailable', detail: (error as Error).message });
  }
});

// Optional news provider. Credentials are read exclusively from server env.
app.get('/api/finnhub/news', async (req: Request, res: Response) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, code: 'PROVIDER_NOT_CONFIGURED', error: 'Finnhub integration is not configured' });
  const category = String(req.query.category || 'general');
  if (!/^[A-Za-z_-]{1,24}$/.test(category)) return res.status(400).json({ success: false, error: 'Invalid news category' });
  try {
    const url = new URL('https://finnhub.io/api/v1/news');
    url.search = new URLSearchParams({ category, token: apiKey }).toString();
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) return res.status(502).json({ success: false, error: 'News provider request failed', status: upstream.status });
    const news = await upstream.json();
    return res.json({ success: true, news, source: 'Finnhub', fetchedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ success: false, error: 'News provider unavailable', detail: (error as Error).message });
  }
});

// Quote-backed intelligence endpoint. It returns only observations supplied by
// Yahoo Finance; sentiment, order-book depth and institutional flows are not inferred.
app.get('/api/ai/vymx-intelligence', async (_req: Request, res: Response) => {
  const symbols = [
    '^GSPC', '^NSEI', '^BSESN', 'BTC-USD', '^VIX',
    'XLK', 'XLF', 'XLV', 'XLE', 'XLY', 'XLB', 'XLI',
    'GC=F', 'CL=F', 'BZ=F', 'SI=F', 'HG=F', 'NG=F',
    'EURUSD=X', 'JPY=X', 'GBPUSD=X', 'INR=X', 'AUDUSD=X', 'CAD=X', '^TNX'
  ];
  const result = await getPrices(symbols);
  if (!result.returned) return res.status(503).json({ success: false, error: 'Market quote providers are temporarily unavailable', unavailable: result.errors });
  const quote = (symbol: string) => result.prices[symbol];
  const metric = (symbol: string) => {
    const item = quote(symbol);
    return item ? { price: item.price, change: item.change, currency: item.currency } : null;
  };
  const spx = quote('^GSPC');
  const nifty = quote('^NSEI');
  const sensex = quote('^BSESN');
  const btc = quote('BTC-USD');
  const vix = quote('^VIX');
  return res.json({
    success: true,
    generated: false,
    source: 'Yahoo Finance',
    fetchedAt: new Date().toISOString(),
    unavailable: result.errors,
    data: {
      spxPrice: spx?.price ?? null, spxChange: spx?.change ?? null,
      niftyPrice: nifty?.price ?? null, niftyChange: nifty?.change ?? null,
      sensexPrice: sensex?.price ?? null, sensexChange: sensex?.change ?? null,
      btcPrice: btc?.price ?? null, btcHigh: btc?.dayHigh ?? null, btcLow: btc?.dayLow ?? null,
      vixPrice: vix?.price ?? null, vixChange: vix?.change ?? null,
      sectors: {
        tech: metric('XLK'), financial: metric('XLF'), healthcare: metric('XLV'),
        energy: metric('XLE'), consumerDiscretionary: metric('XLY'),
        materials: metric('XLB'), industrials: metric('XLI')
      },
      commodities: {
        gold: metric('GC=F'), crudeOil: metric('CL=F'), brentOil: metric('BZ=F'),
        silver: metric('SI=F'), copper: metric('HG=F'), naturalGas: metric('NG=F')
      },
      currencies: {
        eurUsd: metric('EURUSD=X'), usdJpy: metric('JPY=X'), gbpUsd: metric('GBPUSD=X'),
        usdInr: metric('INR=X'), audUsd: metric('AUDUSD=X'), usdCad: metric('CAD=X')
      },
      bonds: { us10y: metric('^TNX'), us2y: null, us30y: null },
      // These are deliberately null until an appropriate provider is connected.
      fearGreed: null, orderImbalance: null, smartMoney: null, darkPool: null, algoRisk: null,
      capitalInflows: null, capitalOutflows: null,
      quoteSource: 'Yahoo Finance', quoteAsOf: new Date().toISOString()
    },
    note: 'Prices, ETF proxies, commodity futures, FX crosses and the US 10Y proxy are provider-backed. Fear/greed, institutional flows, order-book depth, dark-pool activity, algorithmic risk and unsupported Treasury tenors are not supplied by this feed.'
  });
});

// Provider-backed sector momentum proxies. Scores are a transparent transform of
// the ETF's daily percentage move, not analyst ratings or institutional flow data.
app.get('/api/ai/market-auras', async (_req: Request, res: Response) => {
  const proxies = [
    { sector: 'Technology', symbol: 'XLK' },
    { sector: 'Financials', symbol: 'XLF' },
    { sector: 'Healthcare', symbol: 'XLV' },
    { sector: 'Energy', symbol: 'XLE' },
    { sector: 'Consumer Discretionary', symbol: 'XLY' },
    { sector: 'Industrials', symbol: 'XLI' },
    { sector: 'Materials', symbol: 'XLB' },
    { sector: 'Utilities', symbol: 'XLU' },
    { sector: 'Real Estate', symbol: 'XLRE' },
    { sector: 'Communication Services', symbol: 'XLC' }
  ];
  const result = await getPrices(proxies.map((item) => item.symbol));
  const auras = proxies.flatMap((item) => {
    const quote = result.prices[item.symbol];
    if (!quote) return [];
    const score = Math.max(0, Math.min(100, Math.round(50 + quote.change * 10)));
    return [{
      sector: item.sector,
      score,
      trend: quote.change > 0.25 ? 'Bullish' : quote.change < -0.25 ? 'Bearish' : 'Neutral',
      dailyChangePercent: quote.change,
      proxy: item.symbol,
      source: 'Yahoo Finance'
    }];
  });
  if (!auras.length) return res.status(503).json({ success: false, error: 'Sector ETF quotes are temporarily unavailable', unavailable: result.errors });
  return res.json(auras);
});

// A concise, rule-based market snapshot. It describes observed quotes only;
// it does not infer causes, events, sentiment or future returns.
app.get('/api/ai/narrative', async (_req: Request, res: Response) => {
  const symbols = ['^GSPC', '^NSEI', 'BTC-USD', '^VIX', 'GC=F'];
  const result = await getPrices(symbols);
  if (!result.returned) return res.status(503).json({ success: false, error: 'Market snapshot unavailable', unavailable: result.errors });
  const describe = (label: string, symbol: string) => {
    const quote = result.prices[symbol];
    if (!quote) return `${label}: unavailable`;
    const direction = quote.change > 0 ? 'up' : quote.change < 0 ? 'down' : 'unchanged';
    return `${label}: ${quote.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}, ${direction} ${Math.abs(quote.change).toFixed(2)}% on the provider's quoted change`;
  };
  const text = [
    'Provider market snapshot — observed quotes, not a causal news analysis.',
    describe('S&P 500', '^GSPC'),
    describe('NIFTY 50', '^NSEI'),
    describe('Bitcoin (USD)', 'BTC-USD'),
    describe('VIX', '^VIX'),
    describe('Gold futures', 'GC=F'),
    'This feed does not include verified institutional positioning, geopolitical event attribution, or a forward return forecast.'
  ].join(' ');
  return res.json({ success: true, text, generated: false, source: 'Yahoo Finance', fetchedAt: new Date().toISOString(), unavailable: result.errors });
});

// Static educational quiz content; it is not presented as a live market signal.
app.get('/api/ai/quiz', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    generated: false,
    scenarioTitle: 'Understanding volatility indices',
    scenarioText: 'The VIX rises sharply while the S&P 500 falls during the same session. Which interpretation is the most defensible from these observations alone?',
    options: [
      { label: 'Risk aversion may be increasing', correct: true, reason: 'A rising VIX alongside a falling equity index is commonly associated with higher expected near-term volatility and risk aversion. It does not establish the cause or predict the next move.' },
      { label: 'A recession is now certain', correct: false, reason: 'A volatility index is not a recession probability and cannot establish that outcome.' },
      { label: 'Institutional investors are definitely selling', correct: false, reason: 'Index and volatility quotes do not reveal investor identity or actual institutional flows.' }
    ],
    source: 'VYMX educational content'
  });
});

// Exchange index proxies. Some exchanges do not have a supported public quote
// symbol in this adapter; those are explicitly returned as unavailable.
app.get('/api/ai/exchange-latest', async (req: Request, res: Response) => {
  const exchange = String(req.query.exchange || '').toUpperCase();
  const indexMap: Record<string, { symbol: string; name: string }> = {
    NYSE: { symbol: '^GSPC', name: 'S&P 500 (US market proxy)' },
    NSE: { symbol: '^NSEI', name: 'NIFTY 50' },
    LSE: { symbol: '^FTSE', name: 'FTSE 100' },
    TSE: { symbol: '^N225', name: 'Nikkei 225' },
    HKEX: { symbol: '^HSI', name: 'Hang Seng Index' },
    SGX: { symbol: '^STI', name: 'Straits Times Index' },
    ASX: { symbol: '^AXJO', name: 'S&P/ASX 200' },
    B3: { symbol: '^BVSP', name: 'Ibovespa' },
    JSE: { symbol: '^JTOPI', name: 'FTSE/JSE Top 40' }
  };
  const index = indexMap[exchange];
  if (!index) return res.status(503).json({ success: false, code: 'EXCHANGE_FEED_NOT_CONFIGURED', error: `No verified index quote mapping is configured for ${exchange || 'this exchange'}.` });
  const result = await getPrices([index.symbol]);
  const quote = result.prices[index.symbol];
  if (!quote) return res.status(503).json({ success: false, error: 'Exchange index quote unavailable', unavailable: result.errors });
  const change = `${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}%`;
  return res.json({
    success: true,
    exchange,
    indices: [{ name: index.name, value: quote.price, change }],
    sentiment: 'Not calculated from quote data',
    fearAndGreed: null,
    volume: 'Not supplied by this feed',
    topSector: 'Not supplied by this feed',
    gainers: [],
    news: 'This endpoint currently provides an index quote only. No verified exchange-specific news or event feed is connected.',
    source: 'Yahoo Finance',
    fetchedAt: quote.asOf
  });
});

// AI routes share a single server-side Gemini integration. If no key exists,
// return an explicit unavailable response rather than invented fallback content.
const aiRequestWindow = new Map<string, number[]>();
// These panels require specialized external datasets. Do not let a generic
// language model invent geopolitical events, institutional transactions or
// scheduled economic releases when those feeds are not configured.
app.all('/api/ai/geopolitics', (_req: Request, res: Response) => res.status(503).json({
  success: false, code: 'GEOPOLITICAL_FEED_UNAVAILABLE',
  error: 'No verified geopolitical event and news provider is connected.'
}));
app.all('/api/ai/institutional-flows', (_req: Request, res: Response) => res.status(503).json({
  success: false, code: 'INSTITUTIONAL_FLOW_FEED_UNAVAILABLE',
  error: 'No verified FII/DII, block-deal or institutional transaction provider is connected.'
}));
app.all('/api/ai/economic-calendar', (_req: Request, res: Response) => res.status(503).json({
  success: false, code: 'ECONOMIC_CALENDAR_UNAVAILABLE',
  error: 'No verified economic-release calendar provider is connected.'
}));

const supportedAiFeatures = new Set([
  'advisor', 'live-news', 'geopolitics', 'generic-chat', 'chat', 'hedge', 'explain',
  'quiz', 'narrative', 'exchange-latest', 'market-auras', 'institutional-flows',
  'economic-calendar', 'vymx-intelligence'
]);
app.all('/api/ai/:feature', async (req: Request, res: Response) => {
  if (!supportedAiFeatures.has(req.params.feature)) return res.status(404).json({ success: false, error: 'AI feature not found' });
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey && req.params.feature !== 'live-news') return res.status(503).json({
    success: false, code: 'AI_PROVIDER_NOT_CONFIGURED',
    error: 'AI analysis is unavailable until a server-side Gemini API key is configured.',
    generated: false
  });
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const recent = (aiRequestWindow.get(ip) || []).filter((time) => now - time < 60_000);
  if (aiRequestWindow.size > 1_000) {
    for (const [knownIp, timestamps] of aiRequestWindow) {
      if (!timestamps.some((time) => now - time < 60_000)) aiRequestWindow.delete(knownIp);
    }
  }
  if (recent.length >= 15) return res.status(429).json({ success: false, error: 'AI request rate limit exceeded' });
  recent.push(now);
  aiRequestWindow.set(ip, recent);

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (req.params.feature === 'live-news') {
    const newsKey = process.env.FINNHUB_API_KEY;
    if (!newsKey) return res.status(503).json({ success: false, code: 'NEWS_PROVIDER_NOT_CONFIGURED', error: 'Live news requires a server-side Finnhub API key.' });
    try {
      const url = new URL('https://finnhub.io/api/v1/news');
      url.search = new URLSearchParams({ category: 'general', token: newsKey }).toString();
      const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!upstream.ok) return res.status(502).json({ success: false, error: 'News provider request failed', status: upstream.status });
      const rows: any[] = await upstream.json();
      const articles = (Array.isArray(rows) ? rows : []).slice(0, 30).map((row) => ({
        id: row.id, title: row.headline, source: row.source,
        time: row.datetime ? new Date(row.datetime * 1000).toISOString() : null,
        symbolAffected: row.related || null, summary: row.summary || '',
        url: row.url || null
      }));
      return res.json({ success: true, articles, source: 'Finnhub', fetchedAt: new Date().toISOString() });
    } catch (error) {
      return res.status(502).json({ success: false, error: 'News provider unavailable', detail: (error as Error).message });
    }
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const explicitPrompt = body.prompt || body.message || body.query || body.text ||
    messages.map((message: any) => String(message?.content || message?.text || '')).filter(Boolean).join('\n');
  let prompt = String(explicitPrompt || '').trim();
  if (!prompt && req.params.feature === 'advisor') {
    prompt = `Act as a cautious multi-asset portfolio research assistant. Use the supplied investor profile only; do not claim access to live market data. Return a JSON object with allocation percentages for stock, crypto, forex, commodity, index, and bond summing to exactly 100, plus recommendedAssets (array), wealthProtectionTip, and macroOutlook. Investor profile: ${JSON.stringify(body)}`;
  } else if (!prompt && Object.keys(body).length) {
    prompt = `Analyze the following user-provided context. Distinguish supplied facts from assumptions, do not invent live prices, breaking news, institutional flows, or economic releases, and state uncertainty clearly. Feature: ${req.params.feature}. Context: ${JSON.stringify(body)}`;
  }
  const contextParts: string[] = [];
  if (body.persona) contextParts.push(`Persona: ${String(body.persona).slice(0, 120)}`);
  if (body.contextData) contextParts.push(`User context: ${JSON.stringify(body.contextData).slice(0, 4_000)}`);
  if (Array.isArray(body.history) && body.history.length) {
    contextParts.push(`Recent conversation:\n${JSON.stringify(body.history.slice(-10)).slice(0, 5_000)}`);
  }
  if (contextParts.length) prompt = contextParts.join('\n\n') + '\n\nCurrent request:\n' + prompt;
  if (body.systemInstruction) prompt = String(body.systemInstruction).slice(0, 2_000) + '\n\n' + prompt;
  prompt = prompt.slice(0, 12_000);
  if (!prompt) return res.status(503).json({
    success: false, code: 'FEATURE_DATA_NOT_CONFIGURED',
    error: `The ${req.params.feature} feature needs a configured data source or a user prompt. No synthetic result is returned.`
  });
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(25_000)
    });
    const result: any = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ success: false, error: 'Gemini provider request failed', detail: result?.error?.message || 'Upstream error' });
    const answer = (result?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || '').join('\n').trim();
    if (!answer) return res.status(502).json({ success: false, error: 'AI provider returned an empty response' });
    const common = { success: true, feature: req.params.feature, answer, text: answer, content: answer, reply: answer, generated: true, source: 'Google Gemini', fetchedAt: new Date().toISOString() };
    if (req.params.feature === 'advisor') {
      const jsonBlock = answer.match(/```json\s*([\s\S]*?)\s*```/i);
      const rawObject = jsonBlock?.[1] || answer.match(/\{[\s\S]*\}/)?.[0];
      if (!rawObject) return res.status(502).json({ success: false, error: 'AI advisor did not return the required structured allocation' });
      try {
        const parsed = JSON.parse(rawObject);
        const allocation = parsed.allocation || {};
        const keys = ['stock', 'crypto', 'forex', 'commodity', 'index', 'bond'];
        const values = keys.map((key) => Number(allocation[key]));
        if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100) || values.reduce((sum, value) => sum + value, 0) !== 100) {
          return res.status(502).json({ success: false, error: 'AI advisor allocation failed validation; percentages must sum to 100' });
        }
        const reasoning = answer.replace(/```json[\s\S]*?```/gi, '').trim();
        return res.json({ ...common, result: { ...parsed, allocation, reasoning } });
      } catch {
        return res.status(502).json({ success: false, error: 'AI advisor returned invalid structured output' });
      }
    }
    return res.json(common);
  } catch (error) {
    return res.status(502).json({ success: false, error: 'AI provider unavailable', detail: (error as Error).message });
  }
});

// Execution is deliberately disabled: the old implementation could submit live
// orders without a proper account/authorization/risk-control layer.
app.all('/api/alpaca/order', (_req, res) => res.status(403).json({
  success: false, code: 'LIVE_TRADING_DISABLED',
  error: 'Live order execution is disabled in this build. No order was submitted.'
}));

// Do not re-enable the previous synthetic macro backtest. A future engine must
// use validated historical observations, explicit costs, and reproducible rules.
app.all(['/api/python/macro-backtest', '/api/macro-backtest', '/api/backtest', '/api/macro/backtest'], (_req, res) => {
  res.status(501).json({
    success: false, error: 'Backtesting engine is not configured',
    code: 'BACKTEST_ENGINE_UNAVAILABLE',
    message: 'No simulated performance is returned. Connect validated historical data and a reproducible strategy before enabling this endpoint.'
  });
});

app.all('/api/world-monitor', (_req, res) => res.status(503).json({
  success: false, code: 'DATA_PROVIDER_NOT_CONFIGURED',
  error: 'World-monitor data provider is not configured. No synthetic geopolitical events are returned.'
}));
app.all('/api/yahoo/screener', (_req, res) => res.status(501).json({
  success: false, code: 'SCREENER_NOT_IMPLEMENTED',
  error: 'The upstream screener adapter is not implemented in this build.'
}));

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found', path: req.path });
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
const subscriptions = new Map<WebSocket, string[]>();

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (pathname !== '/api/prices') { socket.destroy(); return; }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
});

wss.on('connection', (ws) => {
  subscriptions.set(ws, DEFAULT_SYMBOLS);
  ws.on('message', (raw) => {
    if (raw.toString() === 'ping') { ws.send('pong'); return; }
    try {
      const message = JSON.parse(raw.toString());
      if (message?.type === 'subscribe') subscriptions.set(ws, validateSymbols(message.symbols));
      else if (message?.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: (error as Error).message }));
    }
  });
  ws.on('close', () => subscriptions.delete(ws));
  ws.on('error', () => subscriptions.delete(ws));
});

let broadcastInFlight = false;
const broadcastPrices = async () => {
  if (broadcastInFlight) return;
  broadcastInFlight = true;
  try {
    const active = [...wss.clients].filter((client) => client.readyState === WebSocket.OPEN);
    if (!active.length) return;
    const symbols = [...new Set(active.flatMap((client) => subscriptions.get(client) || DEFAULT_SYMBOLS))];
    const result = await getPrices(symbols);
    for (const client of active) {
      if (client.readyState !== WebSocket.OPEN) continue;
      const requested = subscriptions.get(client) || DEFAULT_SYMBOLS;
      const prices = Object.fromEntries(requested.filter((symbol) => result.prices[symbol]).map((symbol) => [symbol, result.prices[symbol]]));
      if (Object.keys(prices).length) {
        client.send(JSON.stringify({ type: 'price_update', prices, source: 'Yahoo Finance', fetchedAt: new Date().toISOString() }));
      }
    }
  } catch (error) {
    console.error('[Market Data Engine] Broadcast failed:', error);
  } finally {
    broadcastInFlight = false;
  }
};
const broadcastTimer = setInterval(() => { void broadcastPrices(); }, 30_000);

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

server.listen(PORT, () => console.log(`VYMX API listening on port ${PORT}`));

const shutdown = () => {
  clearInterval(broadcastTimer);
  for (const client of wss.clients) client.close(1001, 'Server shutting down');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
