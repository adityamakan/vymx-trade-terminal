import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Terminal, RefreshCw, AlertTriangle, Lock, Activity } from 'lucide-react';
import { getSecurityLogs, SecurityEvent, logSecurityEvent } from '../utils/security';

interface SecurityLedgerProps {
  currentUser: { email?: string; name?: string; authType?: string } | null;
}

export default function SecurityLedger({ currentUser }: SecurityLedgerProps) {
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(() => {
    setLogs(getSecurityLogs());
  }, []);

  useEffect(() => {
    loadLogs();
    const interval = window.setInterval(loadLogs, 4000);
    return () => window.clearInterval(interval);
  }, [loadLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
    logSecurityEvent('Local security activity log viewed by the current browser session.', 'ALIGNED', 'low');
    loadLogs();
    setRefreshing(false);
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-6 text-left" id="vymx-security-ledger-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-white">Security Activity</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Browser-local activity history. This panel is not an immutable server audit ledger and does not independently verify device identity, IP address, MFA, encryption or token signatures.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh activity
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 text-xs"><Lock className="h-4 w-4" /> Authentication state</div>
          <div className="text-sm font-semibold text-zinc-200">{currentUser ? 'Signed-in application session' : 'No signed-in user'}</div>
          <p className="text-xs text-zinc-500">{currentUser?.email || currentUser?.name || (currentUser?.authType === 'guest' ? 'Guest session' : 'Authentication details unavailable')}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 text-xs"><Activity className="h-4 w-4" /> Logging scope</div>
          <div className="text-sm font-semibold text-zinc-200">This browser only</div>
          <p className="text-xs text-zinc-500">Local storage can be modified or cleared by the browser user. These entries are not tamper-proof evidence.</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-xs leading-relaxed text-amber-100/80">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
        <p>Server-side audit logging, trusted IP collection, device attestation and cryptographically verifiable event records are not provided by this client-side ledger. No synthetic IP addresses or security signatures are displayed.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          Local activity events
        </div>
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">No local activity events have been recorded.</div>
          ) : (
            <div className="divide-y divide-zinc-900">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-zinc-300">{log.event}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 rounded px-2 py-1">{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
