import express, { Request, Response } from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import yahooFinance from 'yahoo-finance2';

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT || 5000);
const MAX_SYMBOLS = 50;
const CACHE_TTL_MS = 15_000;
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', '^GSPC', '^IXIC', '^NSEI', '^BSESN', 'BTC-USD', 'GC=F'];

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

const SYMBOL_ALIASES: Record<string, string> = {
  NIFTY50: '^NSEI',
  NIFTY: '^NSEI',
  SENSEX: '^BSESN',
  BANKNIFTY: '^NSEBANK',
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  SPX: '^GSPC',
  SANDP500: '^GSPC',
  NASDAQ: '^IXIC'
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
  asOf: string;
  source: 'Yahoo Finance';
};

const quoteCache = new Map<string, { value: PriceQuote; expiresAt: number }>();
const normalizeSymbol = (symbol: string) => SYMBOL_ALIASES[symbol.toUpperCase()] || symbol;

function validateSymbols(input: unknown): string[] {
  if (input === undefined) return DEFAULT_SYMBOLS;
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_SYMBOLS) {
    throw new Error(`symbols must be an array containing 1-${MAX_SYMBOLS} entries`);
  }
  const values = input.map((item) => String(item).trim());
  if (values.some((s) => !/^[A-Za-z0-9.^=_-]{1,32}$/.test(s))) {
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
  const price = Number(quote?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Provider returned no valid price for ${symbol}`);
  }

  const previousClose = Number(quote?.regularMarketPreviousClose);
  const changeAbs = Number.isFinite(Number(quote?.regularMarketChange))
    ? Number(quote.regularMarketChange)
    : (Number.isFinite(previousClose) ? price - previousClose : 0);
  const change = Number.isFinite(Number(quote?.regularMarketChangePercent))
    ? Number(quote.regularMarketChangePercent)
    : (previousClose > 0 ? (changeAbs / previousClose) * 100 : 0);

  const result: PriceQuote = {
    price,
    change,
    changeAbs,
    low52w: Number.isFinite(Number(quote?.fiftyTwoWeekLow)) ? Number(quote.fiftyTwoWeekLow) : null,
    high52w: Number.isFinite(Number(quote?.fiftyTwoWeekHigh)) ? Number(quote.fiftyTwoWeekHigh) : null,
    prevClose: Number.isFinite(previousClose) && previousClose > 0 ? previousClose : null,
    currency: typeof quote?.currency === 'string' ? quote.currency : null,
    marketState: typeof quote?.marketState === 'string' ? quote.marketState : null,
    asOf: new Date().toISOString(),
    source: 'Yahoo Finance'
  };
  quoteCache.set(symbol, { value: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

async function getPrices(symbols: string[]) {
  const entries = await Promise.all(symbols.map(async (symbol) => {
    try {
      return [symbol, await fetchQuote(symbol)] as const;
    } catch (error) {
      return [symbol, null] as const;
    }
  }));
  const prices: Record<string, PriceQuote> = {};
  const errors: string[] = [];
  for (const [symbol, quote] of entries) {
    if (quote) prices[symbol] = quote;
    else errors.push(symbol);
  }
  return { prices, errors, requested: symbols.length, returned: Object.keys(prices).length };
}

app.get(['/health', '/api/health', '/api/status'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'vymx-api',
    marketDataProvider: 'Yahoo Finance',
    marketDataConfigured: true,
    checkedAt: new Date().toISOString(),
    note: 'Health confirms API process availability; it does not guarantee every market symbol is currently tradable.'
  });
});

app.post('/api/prices', async (req: Request, res: Response) => {
  let symbols: string[];
  try {
    symbols = validateSymbols(req.body?.symbols);
  } catch (error) {
    return res.status(400).json({ success: false, error: (error as Error).message });
  }
  try {
    const result = await getPrices(symbols);
    const success = result.returned > 0;
    return res.status(success ? 200 : 503).json({
      success,
      ...result,
      source: 'Yahoo Finance',
      fetchedAt: new Date().toISOString(),
      partial: result.errors.length > 0
    });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Market data provider unavailable', detail: (error as Error).message });
  }
});

app.get('/api/market-snapshot', async (_req: Request, res: Response) => {
  const symbols = ['^NSEI', '^BSESN', '^GSPC', '^IXIC', 'BTC-USD', '^VIX'];
  const result = await getPrices(symbols);
  if (!result.returned) return res.status(503).json({ success: false, ...result });
  res.json({ success: true, ...result, source: 'Yahoo Finance', fetchedAt: new Date().toISOString() });
});

// These endpoints previously returned hard-coded or synthetic performance figures.
// Return an explicit unavailable response until a reproducible, data-backed engine is connected.
app.all(['/api/python/macro-backtest', '/api/macro-backtest', '/api/backtest', '/api/macro/backtest'], (_req, res) => {
  res.status(501).json({
    success: false,
    error: 'Backtesting engine is not configured',
    code: 'BACKTEST_ENGINE_UNAVAILABLE',
    message: 'No simulated performance is returned. Connect validated historical price data and a reproducible strategy before enabling this endpoint.'
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found', path: req.path });
});

const wss = new WebSocketServer({ noServer: true });
const subscriptions = new Map<WebSocket, string[]>();

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (pathname !== '/api/prices') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
});

wss.on('connection', (ws) => {
  subscriptions.set(ws, DEFAULT_SYMBOLS);
  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message?.type === 'subscribe') {
        subscriptions.set(ws, validateSymbols(message.symbols));
      } else if (raw.toString() === 'ping' || message?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: (error as Error).message }));
    }
  });
  ws.on('close', () => subscriptions.delete(ws));
  ws.on('error', () => subscriptions.delete(ws));
});

const broadcastPrices = async () => {
  const active = [...wss.clients].filter((client) => client.readyState === WebSocket.OPEN);
  if (!active.length) return;
  const symbols = [...new Set(active.flatMap((client) => subscriptions.get(client) || DEFAULT_SYMBOLS))];
  const result = await getPrices(symbols);
  for (const client of active) {
    const requested = subscriptions.get(client) || DEFAULT_SYMBOLS;
    const prices = Object.fromEntries(requested.filter((symbol) => result.prices[symbol]).map((symbol) => [symbol, result.prices[symbol]]));
    if (Object.keys(prices).length) {
      client.send(JSON.stringify({ type: 'price_update', prices, source: 'Yahoo Finance', fetchedAt: new Date().toISOString() }));
    }
  }
};
const broadcastTimer = setInterval(() => { void broadcastPrices(); }, 15_000);

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

server.listen(PORT, () => {
  console.log(`VYMX API listening on port ${PORT}`);
});

const shutdown = () => {
  clearInterval(broadcastTimer);
  for (const client of wss.clients) client.close(1001, 'Server shutting down');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
