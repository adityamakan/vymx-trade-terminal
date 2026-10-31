import React from 'react';
import { useDataIntegrity } from '../contexts/DataIntegrityContext';
import { Activity, Network, Server, MemoryStick, Clock, Database } from 'lucide-react';

export default function PrecisionMetrics() {
  const { isBackendConnected, lastPingLatency, telemetry } = useDataIntegrity();
  const formatMB = (bytes?: number) => Number.isFinite(bytes) ? `${(bytes! / 1024 / 1024).toFixed(1)} MB` : 'Not supplied';
  const uptime = telemetry?.uptimeSeconds;
  const marketProvider = telemetry?.providers?.marketData;

  const metrics = [
    { label: 'API round-trip', value: lastPingLatency == null ? 'Not measured' : `${lastPingLatency.toFixed(1)} ms`, icon: Network },
    { label: 'Process uptime', value: uptime == null ? 'Not supplied' : `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`, icon: Clock },
    { label: 'Heap used / total', value: telemetry?.processMemory ? `${formatMB(telemetry.processMemory.heapUsedBytes)} / ${formatMB(telemetry.processMemory.heapTotalBytes)}` : 'Not supplied', icon: MemoryStick },
    { label: 'Market data provider', value: marketProvider ? `${marketProvider.name} · ${marketProvider.configured ? 'configured' : 'not configured'} · live status unverified` : 'Not supplied', icon: Database }
  ];

  return (
    <div className="glass-panel p-5 rounded-xl border border-indigo-500/30 glow-border shadow-2xl flex flex-col gap-4 relative overflow-hidden group h-full">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
        <Server className="w-24 h-24 text-indigo-500" />
      </div>
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 font-mono tracking-tight uppercase">Core Telemetry</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">API process diagnostics</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${isBackendConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className={`text-[9px] font-bold font-mono uppercase tracking-wider ${isBackendConnected ? 'text-emerald-400' : 'text-rose-500'}`}>
            {isBackendConnected ? 'API healthy' : 'API unavailable'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 z-10 mt-2">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 min-w-0">
            <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1"><Icon className="w-3 h-3 text-zinc-400" /> {label}</span>
            <span className="text-sm font-bold text-white font-mono break-words">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-zinc-500">A healthy API process does not prove that Yahoo Finance or other upstream providers are responding. Provider quote checks are reported separately by their data panels.</p>
    </div>
  );
}
