import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DataSyncLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
  latencyMs?: number;
}

export interface BackendTelemetry {
  uptimeSeconds?: number;
  processMemory?: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number };
  providers?: {
    marketData?: { name: string; configured: boolean; operationallyVerified: boolean };
    gemini?: { configured: boolean };
    fred?: { configured: boolean };
    finnhub?: { configured: boolean };
  };
}

interface DataIntegrityContextType {
  telemetry: BackendTelemetry | null;
  logs: DataSyncLog[];
  addLog: (log: Omit<DataSyncLog, 'id'>) => void;
  isBackendConnected: boolean;
  lastPingLatency: number | undefined;
  errorLog: string | undefined;
}

const DataIntegrityContext = createContext<DataIntegrityContextType>({
  telemetry: null,
  logs: [],
  addLog: () => {},
  isBackendConnected: false,
  lastPingLatency: undefined,
  errorLog: undefined,
});

export const DataIntegrityProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<DataSyncLog[]>([]);
  const [telemetry, setTelemetry] = useState<BackendTelemetry | null>(null);

  const addLog = (log: Omit<DataSyncLog, 'id'>) => {
    setLogs(prev => {
      const newLog: DataSyncLog = { ...log, id: Math.random().toString(36).substring(2) };
      const updated = [newLog, ...prev];
      return updated.slice(0, 10); // keep only last 10
    });
  };


  useEffect(() => {
    let disposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let retryCount = 0;
    const maxRetries = 3;

    const schedule = (delay: number) => {
      if (!disposed) timeoutId = setTimeout(pingHealth, delay);
    };

    const pingHealth = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch('/api/health', { signal: AbortSignal.timeout(8_000) });
        const data = await response.json();
        if (!response.ok || data?.status !== 'ok' || data?.service !== 'vymx-api') {
          throw new Error(data?.error || 'API health check failed');
        }
        if (disposed) return;

        setTelemetry({
          uptimeSeconds: Number.isFinite(data.uptimeSeconds) ? data.uptimeSeconds : undefined,
          processMemory: data.processMemory && typeof data.processMemory === 'object' ? data.processMemory : undefined,
          providers: data.providers && typeof data.providers === 'object' ? data.providers : undefined
        });
        addLog({
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          message: 'API process healthy; upstream market-data availability is checked separately.',
          latencyMs: Date.now() - startTime
        });
        retryCount = 0;
        schedule(15_000);
      } catch (error) {
        if (disposed) return;
        addLog({
          timestamp: new Date().toISOString(),
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'API health check failed'
        });
        const delay = retryCount < maxRetries ? 5_000 * (2 ** retryCount) : 30_000;
        retryCount = Math.min(retryCount + 1, maxRetries);
        schedule(delay);
      }
    };

    void pingHealth();
    return () => {
      disposed = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);


    const isBackendConnected = logs.length > 0 && logs[0].status === 'SUCCESS';
  const lastPingLatency = logs.length > 0 ? logs[0].latencyMs : undefined;
  const errorLog = logs.find(l => l.status === 'ERROR')?.message;

  return (
    <DataIntegrityContext.Provider value={{ logs, addLog, isBackendConnected, lastPingLatency, errorLog, telemetry }}>
      {children}
    </DataIntegrityContext.Provider>
  );
};

export const useDataIntegrity = () => useContext(DataIntegrityContext);

