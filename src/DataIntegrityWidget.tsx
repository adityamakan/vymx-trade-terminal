import React from 'react';
import { ShieldCheck, ServerCrash, Activity } from 'lucide-react';
import { useDataIntegrity } from '../contexts/DataIntegrityContext';

export default function DataIntegrityWidget() {
  const { logs } = useDataIntegrity();

  return (
    <section className="rounded-xl border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-950 p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <Activity size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-100 font-mono tracking-tight uppercase">Data Integrity Log</h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">Real-time Sync Diagnostics</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {logs.length === 0 ? (
          <div className="text-xs text-zinc-500 italic text-center py-4">Waiting for incoming sync telemetry...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
              <div className="flex items-start sm:items-center gap-2">
                {log.status === 'SUCCESS' ? (
                  <ShieldCheck size={14} className="text-emerald-400 mt-0.5 sm:mt-0 flex-shrink-0" />
                ) : (
                  <ServerCrash size={14} className="text-red-400 mt-0.5 sm:mt-0 flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className={`text-xs font-mono font-medium ${log.status === 'SUCCESS' ? 'text-zinc-300' : 'text-red-400'}`}>
                    {log.message}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {log.latencyMs !== undefined && (
                <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/60 flex-shrink-0 self-start sm:self-auto">
                  {log.latencyMs}ms
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
