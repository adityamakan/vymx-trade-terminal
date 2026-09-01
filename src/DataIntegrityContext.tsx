import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DataSyncLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
  latencyMs?: number;
}

export interface BackendTelemetry {
  memoryUsage?: any;
  systemMemory?: any;
  cpuLoad?: number[];
  uptime?: number;
  cache?: { size: number, capacity: number };
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
      const newLog: DataSyncLog = { ...log, id: Math.random().toString(36).substring(2, 9) };
      const updated = [newLog, ...prev];
      return updated.slice(0, 10); // keep only last 10
    });
  };

  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 5000;

    const pingHealth = async () => {
      const start = Date.now();
      let success = false;
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setTelemetry({
            memoryUsage: data.memoryUsage,
            systemMemory: data.systemMemory,
            cpuLoad: data.cpuLoad,
            uptime: data.uptime,
            cache: data.cache
          });
          const ms = Date.now() - start;
          addLog({
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            message: `Core Engine Sync (${data.aiBackend || 'connected'})`,
            latencyMs: ms,
          });
          success = true;
          retryCount = 0; // reset on success
        } else {
            throw new Error('API Error');
        }
      } catch (e) {
        addLog({
          timestamp: new Date().toISOString(),
          status: 'ERROR',
          message: 'Connection to Core Engine Failed',
        });
      }

      if (success) {
        timeoutId = setTimeout(pingHealth, 10000); // 10s poll when healthy
      } else {
        if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount); // 5s, 10s, 20s
            retryCount++;
            timeoutId = setTimeout(pingHealth, delay);
        } else {
            // max retries reached, maybe poll slower
            timeoutId = setTimeout(pingHealth, 30000);
        }
      }
    };
    
    pingHealth();
    return () => clearTimeout(timeoutId);
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
