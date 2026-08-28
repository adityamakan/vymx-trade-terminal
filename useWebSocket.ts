import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  // Use connection unstable to trigger fallback REST pooling in consumer
  const [isConnectionUnstable, setIsConnectionUnstable] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  
  // Reconnection state
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Heartbeat state
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const pongTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Determine the websocket URL based on current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setIsConnectionUnstable(false);
      reconnectAttempts.current = 0;
      startHeartbeat();
    };

    ws.current.onmessage = (event) => {
      // Handle heartbeat response
      if (event.data === 'pong') {
        if (pongTimeout.current) clearTimeout(pongTimeout.current);
        return;
      }
      
      console.log('WebSocket message received:', event.data);
      // Keep only last 50 messages in buffer to prevent memory bloat
      setMessages((prev) => [...prev, event.data].slice(-50));
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      stopHeartbeat();
      handleReconnect();
    };

    ws.current.onerror = (error) => {
      // Don't surface as a big error to avoid console noise on HMR.
      console.debug('WebSocket error encountered. Attempting recovery...', error);
      // Let onclose handle the reconnection
    };
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      const waitTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      console.log(`Scheduling reconnect attempt ${reconnectAttempts.current + 1} in ${waitTime}ms`);
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        connect();
      }, waitTime);
    } else {
      console.warn('Max WebSocket reconnect attempts reached. Failing over to REST polling.');
      setIsConnectionUnstable(true);
    }
  }, [connect]);

  const startHeartbeat = () => {
    stopHeartbeat();
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send('ping');
        // Give the server 3 seconds to respond with a pong
        pongTimeout.current = setTimeout(() => {
          console.warn('WebSocket heartbeat missed. Terminating stalled connection.');
          ws.current?.close(); // This will trigger onclose and then reconnect
        }, 3000);
      }
    }, 15000); // ping every 15 seconds
  };

  const stopHeartbeat = () => {
    if (pingInterval.current) clearInterval(pingInterval.current);
    if (pongTimeout.current) clearTimeout(pongTimeout.current);
  };

  useEffect(() => {
    connect();

    return () => {
      stopHeartbeat();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        // Remove listeners to prevent state updates on unmount
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('Cannot send message, WebSocket is not open.');
    }
  }, []);

  return { isConnected, isConnectionUnstable, messages, sendMessage };
}
