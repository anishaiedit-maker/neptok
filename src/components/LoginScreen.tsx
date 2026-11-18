import React, { useState } from 'react';
import { Phone, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, X } from 'lucide-react';
import { NepTokLogo } from './NepTokLogo';

interface LoginScreenProps {
  onSuccess: () => void;
  onSkip: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onSkip }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('+977 9841234567');
  const [password, setPassword] = useState('neptok@2026');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('482910');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone.trim() || !password.trim()) {
      setErrorMsg('Please enter both your mobile number and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not send OTP.');
      } else {
        setStatusMsg(data.message);
        setOtpModalOpen(true);
      }
    } catch {
      setErrorMsg('Network error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'OTP verification failed');
      } else {
        setOtpModalOpen(false);
        onSuccess();
      }
    } catch {
      setErrorMsg('Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setStatusMsg(`Signed in via ${provider}`);
    onSuccess();
  };

  return (
    <div className="relative w-full h-full min-h-[680px] bg-[#090514] text-white overflow-hidden flex flex-col justify-between px-6 py-6 select-none">
      {/* Exact Cosmic Purple Background with Meditating Gautam Buddha */}
      <img
        src="/src/assets/images/buddha_cosmic_login_1794926292676.jpg"
        alt="Meditating Gautam Buddha in Cosmic Sky"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090514]/75 via-[#140A26]/45 to-[#090514]/95 pointer-events-none" />

      {/* Continuous Glowing & Rotating Golden Chakra Aura Behind/Around Gautam Buddha (keeps Buddha's face 100% clear) */}
      <div
        className="absolute inset-x-0 top-[11%] flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <svg
          width="276"
          height="276"
          viewBox="0 0 200 200"
          className="animate-chakra-spin opacity-80"
        >
          <defs>
            <radialGradient id="chakraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="48%" stopColor="#FACC15" stopOpacity="0" />
              <stop offset="68%" stopColor="#FACC15" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="94" fill="url(#chakraGlow)" />
          <circle cx="100" cy="100" r="90" stroke="#FACC15" strokeWidth="1.8" strokeDasharray="6 4" fill="none" />
          <circle cx="100" cy="100" r="74" stroke="#FDE047" strokeWidth="1.4" fill="none" />
          <circle cx="100" cy="100" r="56" stroke="#FACC15" strokeWidth="1.4" strokeDasharray="3 4" fill="none" />
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            const x1 = 100 + Math.cos(angle) * 56;
            const y1 = 100 + Math.sin(angle) * 56;
            const x2 = 100 + Math.cos(angle) * 90;
            const y2 = 100 + Math.sin(angle) * 90;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FDE047"
                strokeWidth="1.5"
                strokeOpacity="0.85"
              />
            );
          })}
        </svg>
      </div>

      {/* Top Row: Skip > & Transparent NT NepTok Logo */}
      <div className="relative z-10 flex flex-col">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-purple-200 hover:text-white px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md cursor-pointer"
          >
            Skip &gt;
          </button>
        </div>
        <div className="flex justify-center mt-1">
          <NepTokLogo size="md" showWordmark={true} wordmarkLight={true} />
        </div>
      </div>

      {/* Auth Form Card */}
      <div className="relative z-10 mt-auto mb-2 bg-[#120924]/88 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl">
        {/* Login / Sign Up Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#090514] border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white shadow-md'
                : 'text-purple-200/75 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white shadow-md'
                : 'text-purple-200/75 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="login-phone" className="sr-only">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-[#FF0080] absolute left-3.5" />
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#090514]/90 border border-purple-500/35 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:border-[#FF0080]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="sr-only">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#9D00FF] absolute left-3.5" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#090514]/90 border border-purple-500/35 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:border-[#FF0080]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-200/70">SMS OTP enabled</span>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-[#FF0080] font-semibold hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}
          {statusMsg && !errorMsg && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              {statusMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white font-display font-bold text-sm shadow-[0_0_24px_rgba(255,0,128,0.45)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            <span>{loading ? 'Sending OTP...' : mode === 'login' ? 'Login' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Social Auth Icons: Google, Facebook, Apple ID, Email */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[11px] text-center text-purple-200/70 mb-2.5">Or continue with</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Google', badge: 'G' },
              { name: 'Facebook', badge: 'f' },
              { name: 'Apple ID', badge: 'apple' },
              { name: 'Email', badge: 'email' },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                aria-label={`Continue with ${item.name}`}
                onClick={() => handleSocialLogin(item.name)}
                className="h-10 rounded-xl bg-white/8 border border-white/15 hover:border-[#FF0080]/70 flex items-center justify-center gap-1 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {item.badge === 'email' ? (
                  <Mail className="w-4 h-4 text-[#FF0080]" />
                ) : item.badge === 'apple' ? (
                  <svg width="14" height="16" viewBox="0 0 14 17" fill="currentColor" aria-hidden="true">
                    <path d="M11.6 9.1c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3zM9.5 3.1c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
                  </svg>
                ) : (
                  <span className="text-sm font-display font-extrabold">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nepal Flag & Himalayan Silhouette Hint */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] text-purple-200/75 pb-1">
        <span>🇳🇵</span>
        <span>Secured by NepTok 2FA &amp; Encrypted Auth</span>
      </div>

      {/* SMS OTP Verification Modal */}
      {otpModalOpen && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl bg-[#140A26] border border-[#FF0080]/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF0080]" />
                <h2 className="font-display font-bold text-base">SMS OTP Verification</h2>
              </div>
              <button
                type="button"
                aria-label="Close OTP dialog"
                onClick={() => setOtpModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-purple-200/80">
              Enter the 6-digit SMS code sent to <strong className="text-white">{phone}</strong> (Demo OTP: <span className="font-mono text-[#FF0080]">482910</span>).
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              aria-label="6-digit OTP code"
              className="w-full h-12 text-center font-mono tracking-[0.4em] text-lg rounded-xl bg-[#090514] border border-purple-500/40 text-white focus:outline-none focus:border-[#FF0080]"
            />
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-bold text-sm text-white cursor-pointer"
            >
              Verify &amp; Enter NepTok
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl bg-[#140A26] border border-[#9D00FF]/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#9D00FF]" />
                <h2 className="font-display font-bold text-base">Reset Password</h2>
              </div>
              <button
                type="button"
                aria-label="Close Reset Password"
                onClick={() => setForgotModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-purple-200/80">
              We will send a password recovery OTP to <strong className="text-white">{phone}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setForgotModalOpen(false);
                setStatusMsg(`Recovery link & OTP sent to ${phone}`);
              }}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] font-bold text-sm text-white cursor-pointer"
            >
              Send Recovery OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
