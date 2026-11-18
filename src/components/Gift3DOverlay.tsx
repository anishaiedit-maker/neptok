import React, { useEffect, useRef } from 'react';
import type { GiftItem } from '../utils/neptokLogic';

interface Gift3DOverlayProps {
  gift: GiftItem | null;
  senderName: string;
  recipientName: string;
  comboCount?: number;
  onComplete: () => void;
}

let sharedGiftAudioCtx: AudioContext | null = null;
let lastChimeTimeMs = 0;

function playGiftChime(coins: number) {
  const nowMs = Date.now();
  if (nowMs - lastChimeTimeMs < 75) return;
  lastChimeTimeMs = nowMs;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedGiftAudioCtx || sharedGiftAudioCtx.state === 'closed') {
      sharedGiftAudioCtx = new AudioCtx();
    }
    if (sharedGiftAudioCtx.state === 'suspended') {
      sharedGiftAudioCtx.resume().catch(() => {});
    }
    const ctx = sharedGiftAudioCtx;
    const notes = coins >= 500 ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.46);
    });
  } catch {
    // Ignore autoplay restriction errors
  }
}

export const Gift3DOverlay: React.FC<Gift3DOverlayProps> = ({
  gift,
  senderName,
  recipientName,
  comboCount = 1,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!gift) return;
    playGiftChime(gift.coins);

    const canvas = canvasRef.current;
    let rafId = 0;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      if (ctx) {
        ctx.scale(dpr, dpr);
        const particles = Array.from({ length: gift.coins >= 300 ? 75 : 40 }).map((_, i) => ({
          x: canvas.clientWidth / 2 + (Math.random() - 0.5) * 60,
          y: canvas.clientHeight * 0.55 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.8) * 8,
          size: 3 + Math.random() * 5,
          color: i % 2 === 0 ? gift.accentColor : gift.secondaryColor,
          alpha: 1,
        }));

        const render = () => {
          ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.14;
            p.alpha *= 0.982;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          rafId = requestAnimationFrame(render);
        };
        rafId = requestAnimationFrame(render);
      }
    }

    const timer = setTimeout(onComplete, 2200);
    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [gift, comboCount, onComplete]);

  if (!gift) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center"
      aria-live="polite"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Sender Banner */}
      <div
        className="mb-6 px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/25 shadow-2xl flex items-center gap-3"
        style={{
          background: `linear-gradient(90deg, ${gift.accentColor}CC, ${gift.secondaryColor}AA)`,
        }}
      >
        <span className="text-2xl">{gift.emoji}</span>
        <div className="text-left">
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <span>
              {senderName} sent {gift.name} to {recipientName}
            </span>
            {comboCount > 1 && (
              <span
                data-testid="gift-overlay-combo"
                className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-mono text-[11px] font-extrabold shadow"
              >
                x{comboCount}
              </span>
            )}
          </p>
          <p className="text-[11px] font-mono text-white/90 tabular-nums">
            {gift.coins.toLocaleString()} NepTok Coins (${(gift.coins * 0.01).toFixed(2)})
          </p>
        </div>
      </div>

      {/* 3D Animated Gift Centerpiece */}
      <div className="animate-gift-3d relative flex flex-col items-center">
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: `radial-gradient(circle, ${gift.accentColor}55 0%, ${gift.secondaryColor}22 60%, transparent 100%)`,
            boxShadow: `0 0 60px ${gift.accentColor}99`,
          }}
        >
          <span className="text-7xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]">{gift.emoji}</span>
        </div>
        <span className="mt-2 font-display text-xl font-extrabold tracking-tight text-white drop-shadow-lg">
          {gift.name} {comboCount > 1 ? `x${comboCount}` : ''}
        </span>
      </div>
    </div>
  );
};

