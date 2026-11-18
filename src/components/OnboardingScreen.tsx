import React from 'react';
import { Sparkles, Play, Radio, MessageSquare, Gift, Heart, ArrowRight } from 'lucide-react';
import { NepTokLogo } from './NepTokLogo';

interface OnboardingScreenProps {
  onNext: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNext }) => {
  const highlights = [
    { icon: Sparkles, label: 'Create' },
    { icon: Play, label: 'Watch' },
    { icon: Radio, label: 'Go Live' },
    { icon: MessageSquare, label: 'Connect' },
  ];

  return (
    <div className="relative w-full h-full min-h-[680px] bg-gradient-to-b from-[#090514] via-[#140A26] to-[#090514] text-white overflow-hidden flex flex-col justify-between px-6 py-7 select-none">
      {/* Subtle Ambient Radial Neon Accents */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#FF0080]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-[#9D00FF]/25 blur-3xl pointer-events-none" />

      {/* Top Transparent NT NepTok Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <NepTokLogo size="md" showWordmark={true} wordmarkLight={true} />
      </div>

      {/* Glowing Smartphone Live Preview Mockup */}
      <div className="relative z-10 flex flex-col items-center my-4">
        <div className="relative w-56 h-[310px] rounded-[34px] border-2 border-[#FF0080]/60 bg-[#120824] shadow-[0_0_45px_rgba(255,0,128,0.28)] overflow-hidden p-2">
          <img
            src="/src/assets/images/creator_dance_kathmandu_1794926294158.jpg"
            alt="NepTok Live Creator Preview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-[26px]"
          />
          <div className="absolute inset-2 rounded-[26px] bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* LIVE 25.6K Badge */}
          <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-[#FF0080] px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg">
            <span>LIVE</span>
            <span className="tabular-nums">25.6K</span>
          </div>

          {/* Center Play Pulse */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center animate-pulse">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Floating 3D Pink Gift Box & Heart */}
          <div className="animate-float-a absolute -right-1 bottom-16 bg-gradient-to-br from-[#FF0080] to-[#9D00FF] p-2.5 rounded-2xl shadow-[0_0_20px_rgba(255,0,128,0.65)]">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="animate-float-b absolute left-5 bottom-14 bg-white/15 backdrop-blur-md p-2 rounded-full border border-pink-400/50">
            <Heart className="w-4 h-4 text-[#FF0080] fill-[#FF0080]" />
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-left">
            <p className="text-xs font-bold text-white truncate">@sita_kathmandu</p>
            <p className="text-[11px] text-pink-200 truncate">NEP Live &amp; NEP Battle Tonight</p>
          </div>
        </div>
      </div>

      {/* 4 Glowing Circular Feature Icons + Single-Step Next Button */}
      <div className="relative z-10 flex flex-col gap-5">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Create. Go Live. <span className="text-[#FF0080]">Shine.</span>
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">
            Nepal&apos;s stage for short videos, NEP Battle streams &amp; USD creator rewards.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#1C0F33] border border-[#9D00FF]/50 shadow-[0_0_16px_rgba(157,0,255,0.35)] flex items-center justify-center text-[#FF0080]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-purple-100">{item.label}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="w-full h-13 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white font-display font-bold text-base shadow-[0_0_24px_rgba(255,0,128,0.45)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
