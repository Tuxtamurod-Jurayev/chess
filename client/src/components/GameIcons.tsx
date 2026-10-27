import React from 'react';

interface GameIconProps {
  id: string;
  size?: number;
  className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ id, size = 32, className = '' }) => {
  switch (id) {
    case 'chess':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="chessGold" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#EAB308" />
              <stop offset="1" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="chessCrown" x1="12" y1="10" x2="36" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.3" stopColor="#FEF08A" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
          {/* Base pedestal */}
          <rect x="10" y="38" width="28" height="5" rx="2.5" fill="url(#chessGold)" />
          <path d="M13 38C13 34 16 33 18 31H30C32 33 35 34 35 38H13Z" fill="url(#chessGold)" />
          {/* Stem */}
          <path d="M19 31C18 25 18 22 17 19H31C30 22 30 25 29 31H19Z" fill="url(#chessGold)" opacity="0.9" />
          {/* Crown */}
          <path
            d="M13 14L17 21L24 10L31 21L35 14L33 24H15L13 14Z"
            fill="url(#chessCrown)"
            stroke="#CA8A04"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Crown pearls */}
          <circle cx="13" cy="13" r="2" fill="#FFFFFF" />
          <circle cx="24" cy="9" r="2.5" fill="#FFFFFF" />
          <circle cx="35" cy="13" r="2" fill="#FFFFFF" />
          {/* Cross on top */}
          <rect x="23" y="3" width="2" height="5" rx="1" fill="#FFFFFF" />
          <rect x="21" y="4.5" width="6" height="2" rx="1" fill="#FFFFFF" />
        </svg>
      );

    case 'knife-hit':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="knifeBlade" x1="20" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.4" stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="knifeHandle" x1="22" y1="30" x2="26" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EA580C" />
              <stop offset="1" stopColor="#9A3412" />
            </linearGradient>
          </defs>
          {/* Target Ring behind */}
          <circle cx="24" cy="24" r="19" stroke="#EA580C" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="24" cy="24" r="13" stroke="#F97316" strokeWidth="1.5" opacity="0.5" />
          {/* Sharp Blade */}
          <path
            d="M24 4L28 14V28H20V14L24 4Z"
            fill="url(#knifeBlade)"
            stroke="#64748B"
            strokeWidth="1"
          />
          {/* Blade Center Ridge */}
          <line x1="24" y1="6" x2="24" y2="28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          {/* Crossguard */}
          <rect x="17" y="28" width="14" height="4" rx="2" fill="#334155" stroke="#64748B" strokeWidth="1" />
          {/* Handle */}
          <rect x="21" y="32" width="6" height="11" rx="2" fill="url(#knifeHandle)" />
          <line x1="21" y1="35" x2="27" y2="35" stroke="#7C2D12" strokeWidth="1" />
          <line x1="21" y1="39" x2="27" y2="39" stroke="#7C2D12" strokeWidth="1" />
          {/* Pommel */}
          <circle cx="24" cy="44" r="2.5" fill="#334155" />
        </svg>
      );

    case 'checkers':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="checkersRed" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EF4444" />
              <stop offset="0.7" stopColor="#B91C1C" />
              <stop offset="1" stopColor="#7F1D1D" />
            </linearGradient>
            <linearGradient id="checkersWhite" x1="20" y1="18" x2="42" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.6" stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          {/* White back chip */}
          <ellipse cx="30" cy="28" rx="13" ry="8" fill="url(#checkersWhite)" stroke="#94A3B8" strokeWidth="1.5" />
          <ellipse cx="30" cy="27" rx="10" ry="5.5" stroke="#CBD5E1" strokeWidth="1.2" />
          {/* Red front king chip */}
          <ellipse cx="20" cy="20" rx="14" ry="9" fill="url(#checkersRed)" stroke="#DC2626" strokeWidth="1.5" />
          <ellipse cx="20" cy="19" rx="10.5" ry="6.5" stroke="#FCA5A5" strokeWidth="1.2" />
          {/* Crown glyph on king */}
          <path
            d="M16 20L17.5 17L20 19L22.5 17L24 20H16Z"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case '2048':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="g2048A" x1="6" y1="6" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="g2048B" x1="24" y1="24" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EC4899" />
              <stop offset="1" stopColor="#BE185D" />
            </linearGradient>
            <linearGradient id="g2048C" x1="24" y1="6" x2="42" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
          {/* 4 tiles grid layout */}
          <rect x="6" y="6" width="16" height="16" rx="4" fill="url(#g2048A)" />
          <text x="14" y="18" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">2</text>

          <rect x="26" y="6" width="16" height="16" rx="4" fill="url(#g2048C)" />
          <text x="34" y="18" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">0</text>

          <rect x="6" y="26" width="16" height="16" rx="4" fill="#10B981" />
          <text x="14" y="38" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">4</text>

          <rect x="26" y="26" width="16" height="16" rx="4" fill="url(#g2048B)" />
          <text x="34" y="38" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">8</text>
        </svg>
      );

    case 'math-battle':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="mathGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#mathGrad)" />
          {/* Plus */}
          <path d="M14 17H22M18 13V21" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* Multiply */}
          <path d="M28 14L34 20M34 14L28 20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* Divide */}
          <path d="M13 32H23M18 28H18.02M18 36H18.02" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* Equal */}
          <path d="M28 30H36M28 34H36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'timberjack':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="axeBlade" x1="10" y1="8" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.5" stopColor="#CBD5E1" />
              <stop offset="1" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="woodHandle" x1="12" y1="36" x2="36" y2="12" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D97706" />
              <stop offset="1" stopColor="#78350F" />
            </linearGradient>
          </defs>
          {/* Crossed Axes 1 */}
          <path d="M12 40L36 12" stroke="url(#woodHandle)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Axe head 1 */}
          <path
            d="M32 8C36 10 40 14 38 18L33 16L31 11L32 8Z"
            fill="url(#axeBlade)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Crossed Axes 2 */}
          <path d="M36 40L12 12" stroke="url(#woodHandle)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Axe head 2 */}
          <path
            d="M16 8C12 10 8 14 10 18L15 16L17 11L16 8Z"
            fill="url(#axeBlade)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Tree stump at bottom */}
          <rect x="18" y="38" width="12" height="6" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1" />
        </svg>
      );

    case 'tower-blocks':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="towerGrad1" x1="10" y1="30" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="1" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id="towerGrad2" x1="14" y1="18" x2="34" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="towerGrad3" x1="18" y1="8" x2="30" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5B4FC" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          {/* Bottom Block */}
          <rect x="8" y="30" width="32" height="12" rx="3" fill="url(#towerGrad1)" stroke="#312E81" strokeWidth="1.5" />
          <rect x="12" y="33" width="5" height="6" rx="1" fill="#FEF08A" opacity="0.8" />
          <rect x="21.5" y="33" width="5" height="6" rx="1" fill="#FEF08A" opacity="0.8" />
          <rect x="31" y="33" width="5" height="6" rx="1" fill="#FEF08A" opacity="0.8" />

          {/* Middle Block */}
          <rect x="12" y="18" width="24" height="12" rx="3" fill="url(#towerGrad2)" stroke="#3730A3" strokeWidth="1.5" />
          <rect x="16" y="21" width="4" height="6" rx="1" fill="#FEF08A" opacity="0.9" />
          <rect x="28" y="21" width="4" height="6" rx="1" fill="#FEF08A" opacity="0.9" />

          {/* Top Block */}
          <rect x="17" y="8" width="14" height="10" rx="2" fill="url(#towerGrad3)" stroke="#4338CA" strokeWidth="1.5" />
          <rect x="21" y="10" width="6" height="4" rx="1" fill="#FEF08A" />

          {/* Spire */}
          <line x1="24" y1="8" x2="24" y2="3" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="3" r="1.5" fill="#EF4444" />
        </svg>
      );

    case 'tictactoe':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Grid lines */}
          <line x1="18" y1="8" x2="18" y2="40" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="8" x2="30" y2="40" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="18" x2="40" y2="18" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="30" x2="40" y2="30" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

          {/* Neon X */}
          <path
            d="M10 10L16 16M16 10L10 16"
            stroke="#06B6D4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Neon O */}
          <circle cx="24" cy="24" r="3.5" stroke="#EC4899" strokeWidth="3" />

          {/* Winning X */}
          <path
            d="M32 32L38 38M38 32L32 38"
            stroke="#06B6D4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};
