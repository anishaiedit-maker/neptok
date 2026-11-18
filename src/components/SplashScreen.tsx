import React, { useEffect, useState } from 'react';
import { Users, MapPin, MessageCircle, ArrowRight } from 'lucide-react';
import { NepTokLogo } from './NepTokLogo';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 14));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[680px] bg-white overflow-hidden flex flex-col justify-between select-none">
      {/* Exact 01.jpg light/white scenic Mount Everest, Pagoda, Stupa & Prayer Flags background */}
      <img
        src="/src/assets/images/nepal_everest_splash_bg_1794926292743.jpg"
        alt="Mount Everest, Pagoda Temple, Boudhanath Stupa and Prayer Flags"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/35 to-transparent pointer-events-none" />

      {/* Top Subtle Tagline */}
      <div className="relative z-10 pt-8 px-6 text-center">
        <p className="text-xs font-semibold tracking-widest text-[#003893] uppercase">
          Nepal&apos;s Social &amp; Live Platform
        </p>
      </div>

      {/* Center Stage: Red/Blue Connecting Lines + 4 Floating White Cards + 3D NT Logo */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        {/* Red & Blue Connecting Lines */}
        <svg
          viewBox="0 0 360 360"
          className="absolute w-[330px] h-[330px] pointer-events-none"
          aria-hidden="true"
        >
          <line x1="180" y1="180" x2="74" y2="78" stroke="#DC143C" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="180" y1="180" x2="286" y2="78" stroke="#003893" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="180" y1="180" x2="74" y2="278" stroke="#003893" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="180" y1="180" x2="286" y2="278" stroke="#DC143C" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* 4 Floating White Cards */}
        <div className="relative w-[330px] h-[330px] flex items-center justify-center">
          {/* Top-Left: Community */}
          <div className="animate-float-a absolute top-4 left-2 bg-white/95 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-slate-900/10 border border-slate-100 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-50 text-[#DC143C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">Community</span>
          </div>

          {/* Top-Right: Flag */}
          <div className="animate-float-b absolute top-4 right-2 bg-white/95 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-slate-900/10 border border-slate-100 flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden="true">🇳🇵</span>
            <span className="text-xs font-bold text-slate-800">Nepal Pride</span>
          </div>

          {/* Bottom-Left: Location */}
          <div className="animate-float-b absolute bottom-5 left-2 bg-white/95 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-slate-900/10 border border-slate-100 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#003893] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">Kathmandu</span>
          </div>

          {/* Bottom-Right: Chat */}
          <div className="animate-float-a absolute bottom-5 right-2 bg-white/95 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-slate-900/10 border border-slate-100 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-50 text-[#DC143C] flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">Live Chat</span>
          </div>

          {/* Central 3D NT Logo (Transparent — Zero Added Box/Circle) */}
          <div className="animate-logo-3d z-20">
            <NepTokLogo size="xl" showWordmark={false} />
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress + Red-to-Blue Gradient Get Started Button */}
      <div className="relative z-10 px-6 pb-8 pt-4 flex flex-col items-center gap-4">
        <div className="w-48 h-1.5 rounded-full bg-slate-200/90 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#DC143C] to-[#003893] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="w-full max-w-xs h-13 rounded-full bg-gradient-to-r from-[#DC143C] via-[#A11D5E] to-[#003893] text-white font-display font-bold text-base shadow-xl shadow-[#003893]/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
