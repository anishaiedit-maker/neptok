import React from 'react';

interface NepTokLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  wordmarkLight?: boolean;
  className?: string;
}

/**
 * Exact transparent NT / NepTok Logo:
 * - Zero extra background box, circle, badge, or fill behind the logo.
 * - Preserves 3D Red/Blue NT monogram, Himalayan mountain peaks, pagoda roof, and Nepal flag motif.
 */
export const NepTokLogo: React.FC<NepTokLogoProps> = ({
  size = 'md',
  showWordmark = true,
  wordmarkLight = true,
  className = '',
}) => {
  const dims =
    size === 'xl'
      ? { w: 120, h: 104, text: 'text-3xl' }
      : size === 'lg'
      ? { w: 84, h: 72, text: 'text-2xl' }
      : size === 'sm'
      ? { w: 34, h: 30, text: 'text-base' }
      : { w: 54, h: 46, text: 'text-xl' };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center bg-transparent select-none ${className}`}
      style={{ background: 'transparent' }}
    >
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 140 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="NepTok NT Logo"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="ntRedGrad" x1="18" y1="22" x2="74" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF1E56" />
            <stop offset="55%" stopColor="#DC143C" />
            <stop offset="100%" stopColor="#8F0B28" />
          </linearGradient>
          <linearGradient id="ntBlueGrad" x1="66" y1="22" x2="124" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="60%" stopColor="#003893" />
            <stop offset="100%" stopColor="#0A1B4D" />
          </linearGradient>
          <linearGradient id="ntPagodaGold" x1="52" y1="8" x2="88" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <filter id="ntLogoShadow" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.32" />
          </filter>
        </defs>

        {/* Himalayan Mountain Peaks behind NT crown */}
        <path
          d="M28 42L52 18L70 34L90 15L114 42H28Z"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M46 24L52 18L58 24M84 21L90 15L96 21"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pagoda Roof Motif crowning the center */}
        <path
          d="M54 24C60 19 66 15 70 10C74 15 80 19 86 24H54Z"
          fill="url(#ntPagodaGold)"
        />
        <path
          d="M59 17C64 14 67 11 70 7C73 11 76 14 81 17H59Z"
          fill="url(#ntPagodaGold)"
        />
        <line x1="70" y1="3" x2="70" y2="9" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />

        {/* Nepal Double-Pennant Flag Motif on top-right peak */}
        <line x1="104" y1="6" x2="104" y2="30" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M105 6L121 13L105 16L122 23L105 25V6Z"
          fill="#DC143C"
          stroke="#003893"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 3D Red 'N' Monogram */}
        <g filter="url(#ntLogoShadow)">
          <path
            d="M20 102V36H36L62 76V36H76V102H60L34 62V102H20Z"
            fill="url(#ntRedGrad)"
          />
          {/* 3D depth edge on N */}
          <path
            d="M16 105V40L20 36V102H34L30 105H16Z"
            fill="#6B071C"
            opacity="0.7"
          />

          {/* 3D Blue 'T' Monogram */}
          <path
            d="M68 36H122V50H102V102H86V50H68V36Z"
            fill="url(#ntBlueGrad)"
          />
          {/* 3D highlight slash across NT */}
          <path
            d="M72 36H122V40H72V36Z"
            fill="#60A5FA"
            opacity="0.55"
          />
        </g>
      </svg>

      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight leading-none mt-1 ${dims.text} ${
            wordmarkLight ? 'text-white' : 'text-[#0D1B4C]'
          }`}
        >
          Nep<span className="text-[#FF0080]">Tok</span>
        </span>
      )}
    </div>
  );
};
