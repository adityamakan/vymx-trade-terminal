import React, { useState, useEffect } from 'react';
import { useDataIntegrity } from '../contexts/DataIntegrityContext';
import { Activity, Cpu, Network, Database, Target, Zap, Server, MemoryStick } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrecisionMetrics() {
  const { isBackendConnected, lastPingLatency, telemetry } = useDataIntegrity();
  
  const latency = lastPingLatency || 0;
  
  // Format Memory
  const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + ' MB';
  const memUsed = telemetry?.memoryUsage?.heapUsed ? formatMB(telemetry.memoryUsage.heapUsed) : '0 MB';
  
  // Format CPU (load avg 1 min)
  const cpuLoad = telemetry?.cpuLoad ? telemetry.cpuLoad[0].toFixed(2) : '0.00';
  
  // Cache stats
  const cacheSize = telemetry?.cache?.size || 0;
  const cachePercent = telemetry?.cache ? ((telemetry.cache.size / telemetry.cache.capacity) * 100).toFixed(1) : '0.0';

  return (
    <div className="glass-panel p-5 rounded-xl border border-indigo-500/30 glow-border shadow-2xl flex flex-col gap-4 relative overflow-hidden group h-full">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
        <Server className="w-24 h-24 text-indigo-500" />
      </div>
      
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 font-mono tracking-tight uppercase">Core Telemetry</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Real-time Node Diagnostics</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${isBackendConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className={`text-[9px] font-bold font-mono uppercase tracking-wider ${isBackendConnected ? 'text-emerald-400' : 'text-rose-500'}`}>
            {isBackendConnected ? 'Optimal' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 z-10 mt-2">
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/50 w-full">
            <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, (latency / 1000) * 100))}%` }}></div>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1"><Network className="w-3 h-3 text-zinc-400" /> API Round-Trip</span>
          <span className="text-lg font-black text-white font-mono tracking-tighter">{latency.toFixed(1)}<span className="text-[10px] text-zinc-500 ml-0.5">ms</span></span>
        </div>
        
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1"><Cpu className="w-3 h-3 text-zinc-400" /> Node CPU Load</span>
          <span className="text-lg font-black text-white font-mono tracking-tighter">{cpuLoad}<span className="text-[10px] text-zinc-500 ml-0.5">avg</span></span>
        </div>

        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
          <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1"><Activity className="w-3 h-3 text-zinc-400" /> Heap Memory</span>
          <span className="text-lg font-black text-white font-mono tracking-tighter">{memUsed}</span>
        </div>

        <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${cachePercent}%` }}></div>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1"><Database className="w-3 h-3 text-zinc-400" /> LRU Cache</span>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">{cacheSize}<span className="text-[10px] text-zinc-500 ml-0.5">entries</span></span>
        </div>
      </div>
    </div>
  );
}
