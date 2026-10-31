import { useEffect, useState } from 'react';

export type HistoricalRange = '1D' | '1W' | '1M' | '6M' | '1Y';

export interface HistoricalPoint {
  date: string;
  value: number;
  volume: number | null;
}

interface HistoricalDataState {
  data: HistoricalPoint[];
  loading: boolean;
  error: string | null;
  source: string | null;
  fetchedAt: string | null;
}

const RANGE_CONFIG: Record<HistoricalRange, { days: number; interval: string }> = {
  '1D': { days: 1, interval: '1h' },
  '1W': { days: 7, interval: '1d' },
  '1M': { days: 30, interval: '1d' },
  '6M': { days: 180, interval: '1d' },
  '1Y': { days: 365, interval: '1wk' }
};

const CLIENT_CACHE_TTL_MS = 60_000;
const historicalCache = new Map<string, { value: HistoricalDataState; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<HistoricalDataState>>();

/**
 * Fetches actual historical candles from the server-side Yahoo Finance adapter.
 * The bundled asset.history arrays are synthetic demo samples and are never
 * used by provider-backed analysis components.
 *
 * Requests are normalized to stable time boundaries and deduplicated across
 * components so the same symbol/range does not trigger parallel upstream calls.
 */
async function requestHistoricalData(symbol: string, range: HistoricalRange): Promise<HistoricalDataState> {
  const config = RANGE_CONFIG[range];
  const end = new Date();
  if (range === '1D') end.setUTCMinutes(0, 0, 0);
  else end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - config.days * 24 * 60 * 60 * 1000);
  const key = `${symbol}:${range}:${end.toISOString()}`;

  const cached = historicalCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = inFlightRequests.get(key);
  if (pending) return pending;

  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    interval: config.interval
  });

  const request = (async (): Promise<HistoricalDataState> => {
    try {
      const response = await fetch(
        `/api/historical/${encodeURIComponent(symbol)}?${params.toString()}`,
        { signal: AbortSignal.timeout(20_000) }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !Array.isArray(payload.quotes)) {
        throw new Error(payload?.error || `Historical data unavailable (HTTP ${response.status})`);
      }

      const data: HistoricalPoint[] = payload.quotes.flatMap((quote: any) => {
        const value = Number(quote?.close);
        const date = quote?.date ? new Date(quote.date) : null;
        if (!Number.isFinite(value) || value <= 0 || !date || !Number.isFinite(date.getTime())) return [];
        return [{
          date: date.toISOString(),
          value,
          volume: quote?.volume == null || !Number.isFinite(Number(quote.volume)) ? null : Number(quote.volume)
        }];
      });

      if (!data.length) throw new Error('The provider returned no valid historical closing prices.');
      return {
        data,
        loading: false,
        error: null,
        source: payload.source || 'Yahoo Finance',
        fetchedAt: payload.fetchedAt || new Date().toISOString()
      };
    } catch (error: any) {
      return {
        data: [],
        loading: false,
        error: error?.name === 'TimeoutError' || error?.name === 'AbortError'
          ? 'Historical data request timed out.'
          : (error?.message || 'Historical data provider unavailable.'),
        source: null,
        fetchedAt: null
      };
    }
  })();

  inFlightRequests.set(key, request);
  try {
    const result = await request;
    if (!result.error) {
      historicalCache.set(key, { value: result, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });
      if (historicalCache.size > 100) {
        const oldestKey = historicalCache.keys().next().value;
        if (oldestKey !== undefined) historicalCache.delete(oldestKey);
      }
    }
    return result;
  } finally {
    inFlightRequests.delete(key);
  }
}

export function useHistoricalData(symbol: string, range: HistoricalRange = '6M') {
  const [state, setState] = useState<HistoricalDataState>({
    data: [],
    loading: Boolean(symbol),
    error: null,
    source: null,
    fetchedAt: null
  });

  useEffect(() => {
    let active = true;
    if (!symbol) {
      setState({ data: [], loading: false, error: 'A symbol is required.', source: null, fetchedAt: null });
      return () => { active = false; };
    }

    setState({ data: [], loading: true, error: null, source: null, fetchedAt: null });
    void requestHistoricalData(symbol, range).then((result) => {
      if (active) setState(result);
    });
    return () => { active = false; };
  }, [symbol, range]);

  return state;
}
