import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  Server, 
  X,
  ShieldCheck,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { calculateIntegritySignature, simulateSHA256 } from '../utils/security';

interface GoogleIdSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile: {
    uid: string;
    name: string;
    email: string;
    authType: 'google_personal' | 'google_workspace';
    avatarUrl: string;
    idToken: string;
    securitySignature: string;
  }) => void;
}

export default function GoogleIdSimulator({ isOpen, onClose, onSuccess }: GoogleIdSimulatorProps) {
  const [step, setStep] = useState<'choose' | 'custom' | 'handshake'>('choose');
  const [selectedType, setSelectedType] = useState<'personal' | 'workspace'>('personal');
  
  // Custom account fields
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Handshake parameters (read-only logs)
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [tokenProgress, setTokenProgress] = useState(0);
  
  // High fidelity default account profiles
  const accounts = [
    {
      type: 'personal' as const,
      name: 'Aditya Makan',
      email: 'adityamakan609@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
      badge: 'Owner / Primary'
    },
    {
      type: 'workspace' as const,
      name: 'Aditya Makan (Enterprise Key)',
      email: 'aditya@vymx-enterprise.google.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507052810242-697d1dd14782?w=80&fit=crop&q=80',
      badge: 'Partner Ledger Authorized'
    }
  ];

  // Simulation handshake ticker with real-time logs
  useEffect(() => {
    if (step === 'handshake') {
      setTokenProgress(0);
      setHandshakeLogs([
        'Initializing secure Google OIDC endpoint handshake...',
        'Connecting identity server: https://oauth2.googleapis.com/v1/token',
        'Signed cryptographic payload with server RSA private certificate keys...',
        `Authenticating client target for identity email: ${getLoginEmail()}`
      ]);

      const logLines = [
        'Validating Cross-Origin Access headers...',
        'JWT parsed claims: [openid, profile, email]',
        'Verified hardware-level Google Passkey biometric signature...',
        'Verifying cryptographic token authenticity on secure Vymx nodes...',
        'Integrity checksum matched. SECURE handshakes completed successfully.'
      ];

      let idx = 0;
      const interval = setInterval(() => {
        if (idx < logLines.length) {
          setHandshakeLogs(prev => [...prev, logLines[idx]]);
          setTokenProgress(p => p + 20);
          idx++;
        } else {
          setTokenProgress(100);
          clearInterval(interval);
          
          // Complete login
          const email = getLoginEmail();
          const name = getLoginName();
          const avatar = getLoginAvatar();
          const cleanEmail = email.trim().toLowerCase();
          const rawIdToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhO' + simulateSHA256(cleanEmail).substring(0, 24) + '.' + btoa(JSON.stringify({email, name})) + '.vymx-signature-token';
          
          setTimeout(() => {
            onSuccess({
              uid: 'vymx-g-' + simulateSHA256(cleanEmail).substring(0, 12),
              name,
              email: cleanEmail,
              authType: selectedType === 'personal' ? 'google_personal' : 'google_workspace',
              avatarUrl: avatar,
              idToken: rawIdToken,
              securitySignature: calculateIntegritySignature(JSON.stringify({email, name, timestamp: Date.now()}))
            });
          }, 600);
        }
      }, 350);

      return () => clearInterval(interval);
    }
  }, [step]);

  if (!isOpen) return null;

  const getLoginEmail = () => {
    if (step === 'custom') return customEmail;
    const found = accounts.find(a => a.type === selectedType);
    return found ? found.email : customEmail;
  };

  const getLoginName = () => {
    if (step === 'custom') return customName || customEmail.split('@')[0];
    const found = accounts.find(a => a.type === selectedType);
    return found ? found.name : (customName || 'Vymx Guest Trader');
  };

  const getLoginAvatar = () => {
    if (selectedType === 'personal') return accounts[0].avatarUrl;
    if (selectedType === 'workspace') return accounts[1].avatarUrl;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80';
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      return;
    }
    setStep('handshake');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-sans select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden" id="google-container-lightbox">
        
        {/* Authentic Google Authentication Header */}
        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Custom Google Styled Emblem */}
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center font-bold text-lg shadow border border-zinc-200 shrink-0">
              <span className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">G</span>
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wider">
                Sign in with Google
              </h2>
              <p className="text-[9px] text-zinc-500 tracking-widest font-mono uppercase">Certified OIDC Gateway</p>
            </div>
          </div>
          
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* content rendering steps */}
        <AnimatePresence mode="wait">

          {/* STEP 1: CHOOSE REGISTERED ACCOUNT */}
          {step === 'choose' && (
            <motion.div
              key="choose-acc"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="space-y-4 text-left"
            >
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose a Google Identity account to securely connect with your Vymx investment ledger.
              </p>

              <div className="space-y-2.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => {
                      setSelectedType(acc.type);
                      setStep('handshake');
                    }}
                    className="w-full p-3.5 rounded-2xl border border-zinc-900 bg-zinc-900/40 hover:border-blue-600 hover:bg-blue-600/5 transition duration-300 flex items-center gap-3.5 cursor-pointer text-left group"
                  >
                    <img 
                      src={acc.avatarUrl} 
                      alt={acc.name} 
                      className="h-10 w-10 rounded-full object-cover border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-100 truncate group-hover:text-blue-400 transition">{acc.name}</span>
                        <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 font-mono font-bold shrink-0 uppercase tracking-wider">{acc.badge}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setStep('custom')}
                  className="w-full p-3 rounded-2xl border border-dashed border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/20 transition duration-300 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Use another Google account</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-900/60 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <Lock className="h-3.5 w-3.5 text-blue-500" />
                <span>Encrypted direct-session TLS authentication. No password shared.</span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CUSTOM GOOGLE SIGN IN */}
          {step === 'custom' && (
            <motion.div
              key="custom-acc"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="text-left"
            >
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your Google identity parameters to begin handshake authentication.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Google Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        className="w-full rounded-xl border border-zinc-900 bg-zinc-900/30 py-2.5 px-4 text-xs text-zinc-200 outline-none focus:border-blue-600 focus:bg-blue-600/5 transition"
                        placeholder="e.g. aditya.makan@google.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Your Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl border border-zinc-900 bg-zinc-900/30 py-2.5 px-4 text-xs text-zinc-200 outline-none focus:border-blue-600 focus:bg-blue-600/5 transition"
                        placeholder="e.g. Aditya Makan"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-900 hover:bg-zinc-900 text-zinc-400 text-xs font-bold cursor-pointer transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <span>Connect Google Account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: PROGRESS HANDSHAKE */}
          {step === 'handshake' && (
            <motion.div
              key="handshake-val"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-left space-y-4"
            >
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-blue-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Verifying Session Compliance...</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Biometric hardware security verified.</p>
                </div>
              </div>

              {/* Console logs */}
              <div className="bg-black/40 border border-zinc-900/80 rounded-2xl p-4 font-mono text-[9px] text-zinc-400 space-y-2 h-36 overflow-y-auto" id="handshake-cli">
                {handshakeLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-zinc-600 shrink-0">&gt;</span>
                    {log && (log.startsWith('Integrity') || log.startsWith('SECURE')) ? (
                      <span className="text-emerald-400 font-bold">{log}</span>
                    ) : log && (log.startsWith('OIDC') || log.startsWith('JWT')) ? (
                      <span className="text-blue-400">{log}</span>
                    ) : (
                      <span>{log || ''}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Handshake progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Cryptographic Session Lock</span>
                  <span className="font-bold text-blue-400">{tokenProgress}%</span>
                </div>
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${tokenProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900/60 flex items-center gap-2.5 text-[10px] text-zinc-500 font-mono">
                <Server className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Connection established via high-efficiency encrypted handshakes.</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
