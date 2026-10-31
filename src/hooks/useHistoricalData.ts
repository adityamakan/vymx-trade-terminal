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

/**
 * Fetches actual historical candles from the server-side Yahoo Finance adapter.
 * The app's bundled asset.history arrays are synthetic demo samples and must
 * not be used as verified historical observations.
 */
export function useHistoricalData(symbol: string, range: HistoricalRange = '6M') {
  const [state, setState] = useState<HistoricalDataState>({
    data: [],
    loading: Boolean(symbol),
    error: null,
    source: null,
    fetchedAt: null
  });

  useEffect(() => {
    if (!symbol) {
      setState({ data: [], loading: false, error: 'A symbol is required.', source: null, fetchedAt: null });
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const config = RANGE_CONFIG[range];
    const end = new Date();
    const start = new Date(end.getTime() - config.days * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      interval: config.interval
    });

    setState({ data: [], loading: true, error: null, source: null, fetchedAt: null });

    const load = async () => {
      try {
        const response = await fetch(
          `/api/historical/${encodeURIComponent(symbol)}?${params.toString()}`,
          { signal: controller.signal }
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
        if (active) {
          setState({
            data,
            loading: false,
            error: null,
            source: payload.source || 'Yahoo Finance',
            fetchedAt: payload.fetchedAt || new Date().toISOString()
          });
        }
      } catch (error: any) {
        if (active) {
          setState({
            data: [],
            loading: false,
            error: error?.name === 'AbortError' ? 'Historical data request timed out.' : (error?.message || 'Historical data provider unavailable.'),
            source: null,
            fetchedAt: null
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [symbol, range]);

  return state;
}
