import { useEffect, useRef, useState, useCallback } from 'react';

export interface PriceQuote {
  price: number;
  change: number;
  changeAbs: number;
  low52w: number;
  high52w: number;
  prevClose: number;
}

export type PriceMap = Record<string, PriceQuote>;

interface UseWebSocketOptions {
  onPriceUpdate?: (prices: PriceMap) => void;
  symbols?: string[];
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectionUnstable, setIsConnectionUnstable] = useState(false);
  const [livePrices, setLivePrices] = useState<PriceMap>({});
  const [messages, setMessages] = useState<string[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 6;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const pongTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastPingTime = useRef<number>(0);
  const isPollingActive = useRef<boolean>(false);

  const onPriceUpdateRef = useRef(options?.onPriceUpdate);
  onPriceUpdateRef.current = options?.onPriceUpdate;

  const symbolsRef = useRef(options?.symbols || []);
  symbolsRef.current = options?.symbols || [];

  // Stop HTTP fallback polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPollingActive.current = false;
  }, []);

  // HTTP Long-Polling Fallback when WebSocket drops
  const startPolling = useCallback(() => {
    if (isPollingActive.current) return;
    isPollingActive.current = true;
    console.warn('[Market Data Engine] WebSocket disconnected. Initiating HTTP long-polling fallback...');

    const pollPrices = async () => {
      try {
        const start = performance.now();
        const payload = symbolsRef.current.length > 0 ? { symbols: symbolsRef.current } : {};
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.prices) {
            setLivePrices(data.prices);
            setLatencyMs(Math.round(performance.now() - start));
            if (onPriceUpdateRef.current) {
              onPriceUpdateRef.current(data.prices);
            }
          }
        }
      } catch (_) {
        // Silenced fallback polling error
      }
    };

    pollPrices();
    pollingInterval.current = setInterval(pollPrices, 3000);
  }, []);

  const startHeartbeat = useCallback(() => {
    if (pingInterval.current) clearInterval(pingInterval.current);
    if (pongTimeout.current) clearTimeout(pongTimeout.current);

    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        lastPingTime.current = performance.now();
        ws.current.send('ping');
        pongTimeout.current = setTimeout(() => {
          console.warn('[Market Data Engine] Heartbeat missed. Reconnecting WebSocket...');
          ws.current?.close();
        }, 4000);
      }
    }, 15000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (pingInterval.current) clearInterval(pingInterval.current);
    if (pongTimeout.current) clearTimeout(pongTimeout.current);
  }, []);

  const connect = useCallback(() => {
    // Determine the websocket URL based on current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/prices`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[Market Data Engine] Live price WebSocket established on /api/prices');
        setIsConnected(true);
        setIsConnectionUnstable(false);
        reconnectAttempts.current = 0;
        stopPolling();
        startHeartbeat();

        // Subscribe to initial symbols if requested
        if (symbolsRef.current.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'subscribe', symbols: symbolsRef.current }));
        }
      };

      ws.current.onmessage = (event) => {
        if (event.data === 'pong') {
          if (pongTimeout.current) clearTimeout(pongTimeout.current);
          if (lastPingTime.current) {
            setLatencyMs(Math.round(performance.now() - lastPingTime.current));
          }
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'pong') {
            if (pongTimeout.current) clearTimeout(pongTimeout.current);
            return;
          }

          if (parsed.type === 'price_update' && parsed.prices) {
            setLivePrices(parsed.prices);
            if (onPriceUpdateRef.current) {
              onPriceUpdateRef.current(parsed.prices);
            }
          }
        } catch (_) {
          // Store plain text messages
          setMessages((prev) => [...prev, event.data].slice(-50));
        }
      };

      ws.current.onclose = () => {
        console.log('[Market Data Engine] WebSocket closed');
        setIsConnected(false);
        stopHeartbeat();
        handleReconnect();
      };

      ws.current.onerror = (error) => {
        console.debug('[Market Data Engine] WebSocket connection issue. Transitioning...', error);
      };
    } catch (err) {
      console.warn('[Market Data Engine] WebSocket initialization failed:', err);
      handleReconnect();
    }
  }, [startHeartbeat, stopHeartbeat, stopPolling]);

  const handleReconnect = useCallback(() => {
    startPolling();

    if (reconnectAttempts.current < maxReconnectAttempts) {
      // Exponential backoff: 1.5s, 2.25s, 3.37s, etc., capped at 10s
      const waitTime = Math.min(1500 * Math.pow(1.5, reconnectAttempts.current), 10000);
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        connect();
      }, waitTime);
    } else {
      console.warn('[Market Data Engine] Max WebSocket reconnection attempts reached. Continuing with HTTP long-polling fallback.');
      setIsConnectionUnstable(true);
      // Try again after a longer 15s cooldown
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current = 0;
        connect();
      }, 15000);
    }
  }, [connect, startPolling]);

  useEffect(() => {
    connect();

    return () => {
      stopHeartbeat();
      stopPolling();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
    };
  }, [connect, stopHeartbeat, stopPolling]);

  const sendMessage = useCallback((message: string | object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      ws.current.send(payload);
    }
  }, []);

  const subscribeSymbols = useCallback((symbols: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', symbols }));
    }
  }, []);

  return {
    isConnected,
    isConnectionUnstable,
    livePrices,
    messages,
    sendMessage,
    subscribeSymbols,
    latencyMs
  };
}

