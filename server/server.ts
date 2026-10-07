import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// In-Memory Cache for Subprocesses (60s TTL)
const cache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL_MS = 60000;

const getCachedOrExecute = (
  key: string,
  command: string,
  timeoutMs: number,
  fallbackData: any,
  res: Response
) => {
  const now = Date.now();
  if (cache[key] && now - cache[key].timestamp < CACHE_TTL_MS) {
    return res.json({ ...cache[key].data, cached: true });
  }

  exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 2 }, (error, stdout) => {
    if (error || !stdout.trim()) {
      return res.json({ ...fallbackData, error: error?.message || 'Empty output', cached: false });
    }
    try {
      const parsed = JSON.parse(stdout);
      cache[key] = { timestamp: Date.now(), data: parsed };
      res.json({ ...parsed, cached: false });
    } catch {
      res.json({ ...fallbackData, error: 'JSON Parse Failure', cached: false });
    }
  });
};

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', system: 'vymx-trade-engine', timestamp: new Date().toISOString() });
});

// Python Live Market Snapshot Route
app.get('/api/python/market-snapshot', (_req: Request, res: Response) => {
  const scriptPath = path.join(__dirname, '../scripts/python/fetch_live_feeds.py');
  const pythonCmd = process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : 'python3';
  
  getCachedOrExecute(
    'market_snapshot',
    `"${pythonCmd}" "${scriptPath}"`,
    8000,
    { status: 'degraded', market: {} },
    res
  );
});

// Java High-Speed Technical Indicator Engine Route
app.get('/api/java/sma', (req: Request, res: Response) => {
  const prices = (req.query.prices as string) || '100,102,101,105,108';
  const javaClassDir = path.join(__dirname, '../scripts/java');
  
  getCachedOrExecute(
    `java_sma_${prices}`,
    `java -cp "${javaClassDir}" QuantEngine "${prices}"`,
    5000,
    { sma: 0, period: 0, status: 'degraded' },
    res
  );
});

// Serve Static Production Build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Vymx-Trade Engine running on port ${PORT}`);
});