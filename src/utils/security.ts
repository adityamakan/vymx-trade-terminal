/**
 * Vymx Trade Secure Cryto-Simulation Ledger and session integrity helpers
 * Browser-local activity history helpers. These are not cryptographic security controls.
 */

// Non-cryptographic consistency marker for accidental local-data corruption only; not tamper protection.
export function calculateIntegritySignature(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const factor = dataStr.length * 2026;
  return `vymx-sec-${Math.abs(hash).toString(16)}-${factor.toString(16)}`;
}

// Simulated standard SHA-256 for password visualizer hashing
export function simulateSHA256(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0') +
         Math.abs(hash * 31).toString(16).padStart(8, '0') +
         "e4b8d9c2a3f5f6e8";
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event: string;
  ipAddress: string;
  fingerprint: string;
  status: 'SUCCESS' | 'WARNING' | 'BLOCKED' | 'ALIGNED';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Load security logs
export function getSecurityLogs(): SecurityEvent[] {
  const saved = localStorage.getItem('vymx_security_logs');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Validate integrity of security logs themselves to prevent tampering
      const sig = localStorage.getItem('vymx_security_logs_sig');
      if (sig === calculateIntegritySignature(saved)) {
        return parsed;
      }
    } catch (e) {
      // Tampering detected, reset logs below
    }
  }

  // Start empty. Never seed the activity history with fabricated security events.
  const initialLogs: SecurityEvent[] = [];
  saveSecurityLogs(initialLogs);
  return initialLogs;
}

// Save browser-local activity entries. Local storage is user-editable.
export function saveSecurityLogs(logs: SecurityEvent[]): void {
  const dataStr = JSON.stringify(logs);
  localStorage.setItem('vymx_security_logs', dataStr);
  localStorage.setItem('vymx_security_logs_sig', calculateIntegritySignature(dataStr));
}

// Add a browser-local activity entry; this is not an immutable audit event.
export function logSecurityEvent(event: string, status: SecurityEvent['status'], severity: SecurityEvent['severity']): SecurityEvent {
  const logs = getSecurityLogs();

  const newLog: SecurityEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    event,
    ipAddress: 'Not collected',
    fingerprint: 'Not collected',
    status,
    severity
  };

  // Limit to last 35 logs to keep storage clean
  const updatedLogs = [newLog, ...logs].slice(0, 35);
  saveSecurityLogs(updatedLogs);
  return newLog;
}

// Validate session locally representing the core tamper-prevention check
export function validateSession(): boolean {
  const authSaved = localStorage.getItem('vymx_is_authenticated') === 'true';
  const userSaved = localStorage.getItem('vymx_auth_user');
  const signature = localStorage.getItem('vymx_integrity_signature');

  if (authSaved && userSaved && signature) {
    try {
      const calculatedSignature = calculateIntegritySignature(userSaved);
      if (signature === calculatedSignature) {
        return true;
      }
    } catch {
      // JSON syntax error or tampering
    }
    // Signatures do not match -> Clear session as security lock triggered!
    localStorage.removeItem('vymx_is_authenticated');
    localStorage.removeItem('vymx_auth_user');
    localStorage.removeItem('vymx_integrity_signature');
    logSecurityEvent('Local session state altered. Automatic safety purge triggered.', 'BLOCKED', 'critical');
    return false;
  }
  return false;
}

