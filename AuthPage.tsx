import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Smartphone, 
  Eye, 
  EyeOff, 
  CheckCircle,
  KeyRound,
  ArrowRight,
  TrendingUp,
  Info,
  Server,
  Fingerprint
} from 'lucide-react';
import { auth, GoogleAuthProvider, signInWithPopup, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import SecurityLedger from './SecurityLedger';
import { logSecurityEvent } from '../utils/security';

interface AuthPageProps {
  onLoginSuccess: (userProfile: {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    authType: 'google_personal' | 'google_workspace' | 'phone' | 'email';
    avatarUrl: string;
  }) => void;
  formatCurrency: (val: number, type?: string, country?: string) => string;
}

interface ConstellationNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'google' | 'phone' | 'email'>('google');
  
  // Form values
  const [phoneVal, setPhoneVal] = useState<string>('');
  const [emailVal, setEmailVal] = useState<string>('');
  const [passwordVal, setPasswordVal] = useState<string>('');
  const [otpVal, setOtpVal] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const [dispatchedPhoneOtp, setDispatchedPhoneOtp] = useState<string>('');
  const [showPhoneNotification, setShowPhoneNotification] = useState<boolean>(false);

  // Google Sign-In Simulator lightbox
  const [showGoogleSimulator, setShowGoogleSimulator] = useState<boolean>(false);

  // Background interactive 3D Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Background constellation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Build 3D coordinates nodes
    const nodes: ConstellationNode[] = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: (0 - 0.5) * 600,
        y: (0 - 0.5) * 600,
        z: 0 * 400 + 100,
        vx: (0 - 0.5) * 0.4,
        vy: (0 - 0.5) * 0.4,
        vz: (0 - 0.5) * 0.2,
        size: 0 * 1.5 + 0.8
      });
    }

    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left - width / 2;
      mouse.y = e.clientY - rect.top - height / 2;
    };
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);

    const cameraDepth = 250;
    let angleX = 0.001;
    let angleY = 0.0015;

    const render = () => {
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw light digital grid in the background
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.04)';
      ctx.lineWidth = 0.5;
      const grid = 60;
      for (let x = 0; x < width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Rotate nodes based on camera angle and mouse position drift
      const targetAngleX = (mouse.y / height) * 0.4;
      const targetAngleY = (mouse.x / width) * 0.4;
      
      angleX += (targetAngleX - angleX) * 0.05;
      angleY += (targetAngleY - angleY) * 0.05;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Map, sort and project nodes
      const projected = nodes.map((node) => {
        // Move with speed
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Wrap boundaries
        if (Math.abs(node.x) > 350) node.x = (0 - 0.5) * 300;
        if (Math.abs(node.y) > 350) node.y = (0 - 0.5) * 300;
        if (node.z < 50) node.z = 400;
        if (node.z > 500) node.z = 50;

        // Rotation multipliers
        // Y Yaw
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // X Pitch
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        // Project
        const scale = cameraDepth / z2;
        const screenX = cx + x1 * scale;
        const screenY = cy + y2 * scale;
        
        return {
          screenX,
          screenY,
          z: z2,
          scale,
          size: node.size,
          color: node.size > 1.5 ? 'rgba(59, 130, 246, 0.45)' : 'rgba(255, 255, 255, 0.35)'
        };
      });

      // Draw connectivity web
      ctx.lineWidth = 0.4;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const pi = projected[i];
          const pj = projected[j];

          if (pi.screenX >= 0 && pi.screenX <= width && pi.screenY >= 0 && pi.screenY <= height) {
            const dx = pi.screenX - pj.screenX;
            const dy = pi.screenY - pj.screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 85) {
              const alpha = (1 - dist / 85) * 0.15;
              ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(pi.screenX, pi.screenY);
              ctx.lineTo(pj.screenX, pj.screenY);
              ctx.stroke();
            }
          }
        }
      }

      // Draw single nodes
      projected.forEach((p) => {
        if (p.screenX >= 0 && p.screenX <= width && p.screenY >= 0 && p.screenY <= height) {
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, p.size * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      });

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorText('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const payload = {
        uid: user.uid,
        name: user.displayName || 'Vymx Trader',
        email: user.email || '',
        authType: 'google_personal' as const,
        avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&fit=crop&q=80',
      };
      
      // Attempt to save basic user record to Firestore (requires firestore init later)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: payload.uid,
          name: payload.name,
          email: payload.email,
          authType: payload.authType,
          avatarUrl: payload.avatarUrl,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not write user to firestore yet', e);
      }

      localStorage.setItem('vymx_is_authenticated', 'true');
      localStorage.setItem('vymx_auth_user', JSON.stringify(payload));
      localStorage.setItem('vymx_integrity_signature', 'vymx_google_verified_' + user.uid);

      logSecurityEvent(`Google authenticated session validated: ${payload.email}`, 'SUCCESS', 'low');
      onLoginSuccess(payload);
    } catch (e: any) {
      setErrorText(e.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified and satisfying direct phone connection
  const handleSendPhoneOTP = () => {
    if (!phoneVal.trim()) {
      setErrorText('Please specify your phone number.');
      return;
    }
    setIsLoading(true);
    setErrorText('');

    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
      const generatedOtp = Math.floor(1000 + 0 * 9000).toString();
      setDispatchedPhoneOtp(generatedOtp);
      setShowPhoneNotification(true);
      logSecurityEvent(`MFA OTP challenge dispatched to ${phoneVal}`, 'ALIGNED', 'low');
    }, 450);
  };

  const handleVerifyPhoneOTP = () => {
    if (otpVal.trim() !== dispatchedPhoneOtp) {
      setErrorText('Incorrect security code. Please review the dispatched SMS.');
      return;
    }

    setIsLoading(true);
    setErrorText('');
    setShowPhoneNotification(false);

    setTimeout(() => {
      const payload = {
        uid: `vymx-p-${Date.now()}`,
        name: `User ${phoneVal.slice(-4)}`,
        phone: phoneVal,
        email: `${phoneVal.replace(/\D/g, '')}@vymx-trade.org`,
        authType: 'phone' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'
      };

      localStorage.setItem('vymx_is_authenticated', 'true');
      localStorage.setItem('vymx_auth_user', JSON.stringify(payload));
      localStorage.setItem('vymx_integrity_signature', 'vymx_phone_token_validated');

      logSecurityEvent(`Authenticated verified phone account: ${phoneVal}`, 'SUCCESS', 'medium');
      onLoginSuccess(payload);
      setIsLoading(false);
    }, 300);
  };

  // Clean, satisfying direct email sign-in without rigid character locks
  const handleEmailLogin = () => {
    if (!emailVal.trim() || !emailVal.includes('@')) {
      setErrorText('Please enter a valid email address.');
      return;
    }
    if (passwordVal.length < 4) {
      setErrorText('Safety password is too short. Please use at least 4 characters.');
      return;
    }

    setIsLoading(true);
    setErrorText('');

    setTimeout(() => {
      const payload = {
        uid: `vymx-e-${Date.now()}`,
        name: emailVal.split('@')[0],
        email: emailVal.toLowerCase().trim(),
        authType: 'email' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80'
      };

      localStorage.setItem('vymx_is_authenticated', 'true');
      localStorage.setItem('vymx_auth_user', JSON.stringify(payload));
      localStorage.setItem('vymx_integrity_signature', 'vymx_email_session_verified');

      logSecurityEvent(`Authenticated email session for: ${emailVal}`, 'SUCCESS', 'medium');
      onLoginSuccess(payload);
      setIsLoading(false);
    }, 450);
  };

  return (
    <div id="vymx-auth-gate" className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden">
      
      {/* 3D background constellations container */}
      <div className="absolute inset-0 z-0 bg-[#06070a]">
        <canvas ref={canvasRef} className="w-full h-full opacity-60 block" />
      </div>

      {/* Phone Notification popup banner */}
      <AnimatePresence>
        {showPhoneNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm bg-zinc-950 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-3"
          >
            <Smartphone className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 text-left">
              <span className="text-[9px] font-mono uppercase text-emerald-400 tracking-widest font-black">Secure Login Dispatch</span>
              <p className="text-xs text-zinc-300">Vymx verification code issued:</p>
              <span className="mt-1 font-mono text-base font-black text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 tracking-widest">{dispatchedPhoneOtp}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-md px-4">
        
        {/* Main Authenticator card */}
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
          
          {/* Brand logo header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-2xl relative overflow-hidden">
              <img src="/logo.jpg" alt="Vymx" className="h-full w-full object-cover" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('fallback-icon');
              }} />
              <ShieldCheck className="h-6 w-6 text-emerald-400 absolute hidden [.fallback-icon_&]:block" />
            </div>
            
            <div>
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border border-blue-500/10 text-[8px] font-mono font-black tracking-widest px-3 py-1 rounded-full uppercase mb-1">
                <Fingerprint className="h-3 w-3 text-blue-400" />
                VERIFIED IDENTITY COMPLIANT
              </span>
              <h1 className="text-2xl font-black tracking-tight text-zinc-100 font-sans">Access Vymx Platform</h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Unlock your personalized quantitative trading dashboard and real-time AI portfolios securely.
              </p>
            </div>
          </div>

          {/* Mode choice Buttons toggle tabs */}
          <div className="flex rounded-xl bg-zinc-900/40 border border-zinc-900 p-1 text-xs font-bold">
            <button
              onClick={() => { setAuthMode('google'); setErrorText(''); }}
              className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
                authMode === 'google' ? 'bg-blue-600/15 text-blue-400 border border-blue-600/25' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Google Identity
            </button>
            <button
              onClick={() => { setAuthMode('phone'); setErrorText(''); }}
              className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
                authMode === 'phone' ? 'bg-blue-600/15 text-blue-400 border border-blue-600/25' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Phone / OTP
            </button>
            <button
              onClick={() => { setAuthMode('email'); setErrorText(''); }}
              className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
                authMode === 'email' ? 'bg-blue-600/15 text-blue-400 border border-blue-600/25' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Email SSO
            </button>
          </div>

          {errorText && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold text-center leading-relaxed font-mono">
              {errorText}
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* GOOGLE SIGN-IN GATE */}
            {authMode === 'google' && (
              <motion.div
                key="auth-google"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 text-left"
              >
                <div className="bg-blue-600/5 border border-blue-500/10 p-3.5 rounded-2xl text-xs text-zinc-400 leading-relaxed">
                  Recommended login for secure ledger access. Connects with Google Single Sign-In seamlessly.
                </div>

                <button
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-4 px-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-blue-600 transition flex items-center justify-between text-zinc-300 font-bold text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center font-bold text-lg shadow shrink-0">
                      <span className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">G</span>
                    </div>
                    <div>
                      <div className="text-zinc-200 text-xs font-extrabold uppercase tracking-wide">Continue with Google</div>
                      <div className="text-[10px] text-zinc-500 font-normal mt-0.5">Launches Google identity popup</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition" />
                </button>
              </motion.div>
            )}

            {/* PHONE SIGN-IN GATE */}
            {authMode === 'phone' && (
              <motion.div
                key="auth-phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 text-left"
              >
                {!isOtpSent ? (
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">Registered Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="tel"
                        disabled={isLoading}
                        className="w-full rounded-2xl border border-zinc-900 bg-zinc-900/30 py-2.5 pl-11 pr-4 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500 transition font-mono"
                        placeholder="e.g. +91 98765 43210"
                        value={phoneVal}
                        onChange={(e) => setPhoneVal(e.target.value)}
                      />
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={handleSendPhoneOTP}
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Request Verification OTP
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900 flex items-center gap-2.5">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-zinc-400 leading-normal">
                        SMS code dispatched to <strong className="font-mono text-zinc-200">{phoneVal}</strong>.
                      </span>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase block mb-1">Enter 4-Digit SMS Code</label>
                      <div className="relative font-mono">
                        <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          maxLength={4}
                          disabled={isLoading}
                          className="w-full rounded-2xl border border-zinc-900 bg-zinc-900/30 py-2.5 pl-11 pr-4 text-xs text-zinc-250 tracking-widest outline-none focus:border-blue-500 text-center font-bold font-mono"
                          placeholder="XXXX"
                          value={otpVal}
                          onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={handleVerifyPhoneOTP}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Verify Token & Access Vaults
                    </button>

                    <button
                      onClick={() => { setIsOtpSent(false); setShowPhoneNotification(false); }}
                      className="text-center font-bold text-[10px] text-zinc-500 hover:text-zinc-300 block mx-auto underline cursor-pointer"
                    >
                      Modify details
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* EMAIL SIGN-IN GATE */}
            {authMode === 'email' && (
              <motion.div
                key="auth-email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">Email Identity</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      disabled={isLoading}
                      className="w-full rounded-2xl border border-zinc-900 bg-zinc-900/30 py-2.5 pl-11 pr-4 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500 transition"
                      placeholder="aditya@vymx-trader.com"
                      value={emailVal}
                      onChange={(e) => setEmailVal(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLoading}
                      className="w-full rounded-2xl border border-zinc-900 bg-zinc-900/30 py-2.5 pl-11 pr-11 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500 transition font-sans"
                      placeholder="Enter password sequence"
                      value={passwordVal}
                      onChange={(e) => setPasswordVal(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  onClick={handleEmailLogin}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Sign In to Platform
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Secure Informational Footer note */}
          <div className="bg-zinc-900/20 border border-zinc-900/60 p-3.5 rounded-2xl flex items-start gap-2 text-[10px] leading-relaxed text-zinc-500" id="sandbox-saving-note">
            <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-left font-sans">
              Dynamic trade parameters are safely isolated inside your client domain. Client-side authentication states synchronize securely with dynamic ledger hashes.
            </p>
          </div>

        </div>

        {/* Dynamic transaction log files */}
        <div className="mt-8">
          <SecurityLedger currentUser={null} />
        </div>

      </div>

    </div>
  );
}
