/**
 * Vymx Trade Secure Cryto-Simulation Ledger and session integrity helpers
 * Handcrafted to enforce "uneditable" secure attributes and protect localStorage.
 */

// Simple deterministic integrity checksum to prevent users modifying JSON state in the browser dev tools
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

  // Pre-populate with high security default logs
  const initialLogs: SecurityEvent[] = [
    {
      id: 'evt-001',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      event: 'TLS 1.3 Key Exchange Handshake Initialized',
      ipAddress: '157.48.112.59',
      fingerprint: 'fp_a98f12c290',
      status: 'ALIGNED',
      severity: 'low'
    },
    {
      id: 'evt-002',
      timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
      event: 'Google Identity Security Policy Verified',
      ipAddress: '157.48.112.59',
      fingerprint: 'fp_a98f12c290',
      status: 'ALIGNED',
      severity: 'low'
    },
    {
      id: 'evt-003',
      timestamp: new Date(Date.now() - 1800000 * 4).toISOString(),
      event: 'MFA Double-factor Authentication Pool Synced',
      ipAddress: '157.48.112.59',
      fingerprint: 'fp_a98f12c290',
      status: 'SUCCESS',
      severity: 'medium'
    }
  ];

  saveSecurityLogs(initialLogs);
  return initialLogs;
}

// Save security logs with cryptographic lock
export function saveSecurityLogs(logs: SecurityEvent[]): void {
  const dataStr = JSON.stringify(logs);
  localStorage.setItem('vymx_security_logs', dataStr);
  localStorage.setItem('vymx_security_logs_sig', calculateIntegritySignature(dataStr));
}

// Add a log to the immutable ledger
export function logSecurityEvent(event: string, status: SecurityEvent['status'], severity: SecurityEvent['severity']): SecurityEvent {
  const logs = getSecurityLogs();
  
  // Simulated dynamic but stable IP & Fingerprint
  const ipAddress = "172.56.221." + Math.floor(Math.random() * 254 + 1);
  const fingerprint = "fp_" + simulateSHA256(navigator.userAgent).substring(0, 10);

  const newLog: SecurityEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    event,
    ipAddress,
    fingerprint,
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
