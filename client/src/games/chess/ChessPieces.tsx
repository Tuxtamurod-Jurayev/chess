import React from 'react';

interface ChessPieceIconProps {
  piece: string;
  className?: string;
}

export const ChessPieceIcon: React.FC<ChessPieceIconProps> = ({ piece, className = 'w-full h-full' }) => {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  // Gradients matching 2-rasm:
  // White pieces: Glossy ivory/cream gradient (#FFFFFF to #E8E5D0) with clean dark outline
  // Black pieces: Deep obsidian gradient (#3F4148 to #151619) with crisp white/silver highlights
  const whiteGradId = `wGrad_${type}`;
  const blackGradId = `bGrad_${type}`;

  const renderDefs = () => (
    <defs>
      <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#FAF8ED" />
        <stop offset="100%" stopColor="#E2DDD0" />
      </linearGradient>
      <linearGradient id={blackGradId} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#43454D" />
        <stop offset="50%" stopColor="#25262B" />
        <stop offset="100%" stopColor="#121316" />
      </linearGradient>
      <filter id="pieceShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.35" />
      </filter>
    </defs>
  );

  switch (type) {
    case 'p': // Pawn
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Head */}
              <circle cx="22.5" cy="11.5" r="5.5" />
              {/* Neck & Body */}
              <path d="M19 17C17 21 16 26 15 32H30C29 26 28 21 26 17H19Z" />
              {/* Pedestal & Base */}
              <path d="M12 36C15 34 30 34 33 36V38H12V36Z" />
              <rect x="10" y="38" width="25" height="3" rx="1.5" />
            </g>
            {/* White glossy specular highlight */}
            <ellipse cx="20.5" cy="10" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.8" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="11.5" r="5.5" />
            <path d="M19 17C17 21 16 26 15 32H30C29 26 28 21 26 17H19Z" />
            <path d="M12 36C15 34 30 34 33 36V38H12V36Z" />
            <rect x="10" y="38" width="25" height="3" rx="1.5" />
          </g>
          {/* Subtle white inner sheen */}
          <ellipse cx="20.5" cy="10" rx="1.8" ry="1" fill="#FFFFFF" opacity="0.6" />
          <path d="M18 24C17.5 27 17 30 16.5 32" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.6" />
        </svg>
      );

    case 'r': // Rook
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Battlement Ramparts */}
              <path d="M11 9H15V13H19V9H26V13H30V9H34V15H11V9Z" />
              {/* Stem */}
              <path d="M14 15L15 30H30L31 15H14Z" />
              {/* Base */}
              <path d="M11 34C13 32 32 32 34 34V37H11V34Z" />
              <rect x="9" y="37" width="27" height="4" rx="1.5" />
            </g>
            <line x1="14" y1="19" x2="31" y2="19" stroke="#1A1A1A" strokeWidth="1" opacity="0.3" />
            <line x1="15" y1="28" x2="30" y2="28" stroke="#1A1A1A" strokeWidth="1" opacity="0.3" />
            <rect x="16" y="10" width="2" height="3" fill="#FFFFFF" opacity="0.8" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 9H15V13H19V9H26V13H30V9H34V15H11V9Z" />
            <path d="M14 15L15 30H30L31 15H14Z" />
            <path d="M11 34C13 32 32 32 34 34V37H11V34Z" />
            <rect x="9" y="37" width="27" height="4" rx="1.5" />
          </g>
          {/* Inner white brick lines matching 2-rasm */}
          <line x1="14" y1="19" x2="31" y2="19" stroke="#FFFFFF" strokeWidth="1.2" />
          <line x1="15" y1="25" x2="30" y2="25" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
      );

    case 'n': // Knight (Classic handsome curved silhouette matching 2-rasm)
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10C21 8 18 6 15 8C12 10 11 13 10 17C9 20 10 23 13 24C12 25 10 27 11 29C12 30 14 30 16 28C14 32 15 36 21 37H33C33 34 34 26 33 22C32 17 28 13 22 10Z" />
              <rect x="11" y="37" width="23" height="4" rx="1.5" />
              {/* Mane notches */}
              <path d="M24 11C28 13 31 16 31 20" stroke="#1A1A1A" strokeWidth="1.3" />
              {/* Nostril & Eye */}
              <circle cx="13" cy="18" r="1.2" fill="#1A1A1A" />
              <path d="M16 14C17 13 18 13 19 14" stroke="#1A1A1A" strokeWidth="1.2" />
            </g>
            <path d="M18 16C19 20 20 26 21 32" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10C21 8 18 6 15 8C12 10 11 13 10 17C9 20 10 23 13 24C12 25 10 27 11 29C12 30 14 30 16 28C14 32 15 36 21 37H33C33 34 34 26 33 22C32 17 28 13 22 10Z" />
            <rect x="11" y="37" width="23" height="4" rx="1.5" />
            {/* White mane and facial details matching 2-rasm */}
            <path d="M24 11C28 13 31 16 31 20" stroke="#FFFFFF" strokeWidth="1.3" />
            <circle cx="13" cy="18" r="1.2" fill="#FFFFFF" />
            <path d="M16 14C17 13 18 13 19 14" stroke="#FFFFFF" strokeWidth="1.2" />
          </g>
          <path d="M18 16C19 20 20 26 21 32" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
        </svg>
      );

    case 'b': // Bishop
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Small top cross */}
              <circle cx="22.5" cy="8" r="1.5" />
              {/* Mitre head */}
              <path d="M16 19C16 12 19 9 22.5 9C26 9 29 12 29 19C29 25 27 28 25 30H20C18 28 16 25 16 19Z" />
              {/* Slit */}
              <path d="M21 13L26 18" stroke="#1A1A1A" strokeWidth="1.5" />
              {/* Collar ribbon matching 2-rasm */}
              <path d="M15 31C19 32 26 32 30 31L32 35H13L15 31Z" />
              {/* Base */}
              <rect x="10" y="36" width="25" height="4" rx="1.5" />
            </g>
            {/* White cross inside mitre */}
            <line x1="22.5" y1="18" x2="22.5" y2="24" stroke="#1A1A1A" strokeWidth="1.3" />
            <line x1="20" y1="20.5" x2="25" y2="20.5" stroke="#1A1A1A" strokeWidth="1.3" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8" r="1.5" />
            <path d="M16 19C16 12 19 9 22.5 9C26 9 29 12 29 19C29 25 27 28 25 30H20C18 28 16 25 16 19Z" />
            <path d="M21 13L26 18" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M15 31C19 32 26 32 30 31L32 35H13L15 31Z" />
            <rect x="10" y="36" width="25" height="4" rx="1.5" />
          </g>
          {/* Inner white cross matching 2-rasm */}
          <line x1="22.5" y1="18" x2="22.5" y2="24" stroke="#FFFFFF" strokeWidth="1.3" />
          <line x1="20" y1="20.5" x2="25" y2="20.5" stroke="#FFFFFF" strokeWidth="1.3" />
        </svg>
      );

    case 'q': // Queen (Coronet with pearls and multi-tier base matching 2-rasm)
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* 5 Coronet pearls */}
              <circle cx="8" cy="12" r="2" />
              <circle cx="15" cy="9" r="2" />
              <circle cx="22.5" cy="7.5" r="2" />
              <circle cx="30" cy="9" r="2" />
              <circle cx="37" cy="12" r="2" />
              {/* Crown spokes */}
              <path d="M9 26L7 14L15 22L22.5 10L30 22L38 14L36 26H9Z" />
              {/* Middle waistband */}
              <path d="M11 27C15 28.5 30 28.5 34 27V32H11V27Z" />
              {/* Multi-tier round pedestal base */}
              <path d="M10 33C14 34.5 31 34.5 35 33V36H10V33Z" />
              <rect x="8" y="37" width="29" height="4" rx="2" />
            </g>
            <circle cx="22.5" cy="20" r="2" fill="#1A1A1A" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="12" r="2" />
            <circle cx="15" cy="9" r="2" />
            <circle cx="22.5" cy="7.5" r="2" />
            <circle cx="30" cy="9" r="2" />
            <circle cx="37" cy="12" r="2" />
            <path d="M9 26L7 14L15 22L22.5 10L30 22L38 14L36 26H9Z" />
            <path d="M11 27C15 28.5 30 28.5 34 27V32H11V27Z" />
            <path d="M10 33C14 34.5 31 34.5 35 33V36H10V33Z" />
            <rect x="8" y="37" width="29" height="4" rx="2" />
          </g>
          {/* Inner white jewel details */}
          <line x1="11" y1="29.5" x2="34" y2="29.5" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="22.5" cy="20" r="2" fill="#FFFFFF" />
        </svg>
      );

    case 'k': // King (Broad royal arched crown with cross matching 2-rasm)
      if (isWhite) {
        return (
          <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
            {renderDefs()}
            <g fill={`url(#${whiteGradId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Royal Cross on top */}
              <line x1="22.5" y1="4" x2="22.5" y2="10" strokeWidth="1.8" />
              <line x1="19.5" y1="6.5" x2="25.5" y2="6.5" strokeWidth="1.8" />
              {/* Arched Royal Dome */}
              <path d="M14 23C13 15 17 11 22.5 11C28 11 32 15 31 23H14Z" />
              {/* Crown curves */}
              <path d="M14 23C17 24.5 28 24.5 31 23L33 30H12L14 23Z" />
              {/* Pedestal */}
              <path d="M11 31C15 32.5 30 32.5 34 31V35H11V31Z" />
              <rect x="8" y="36" width="29" height="4" rx="2" />
            </g>
            {/* Inner royal arch lines */}
            <path d="M18 23C18 16 20 13 22.5 13C25 13 27 16 27 23" stroke="#1A1A1A" strokeWidth="1.2" fill="none" />
            <ellipse cx="22.5" cy="18" rx="2.5" ry="1.5" fill="#1A1A1A" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 45 45" className={className} filter="url(#pieceShadow)">
          {renderDefs()}
          <g fill={`url(#${blackGradId})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22.5" y1="4" x2="22.5" y2="10" strokeWidth="1.8" />
            <line x1="19.5" y1="6.5" x2="25.5" y2="6.5" strokeWidth="1.8" />
            <path d="M14 23C13 15 17 11 22.5 11C28 11 32 15 31 23H14Z" />
            <path d="M14 23C17 24.5 28 24.5 31 23L33 30H12L14 23Z" />
            <path d="M11 31C15 32.5 30 32.5 34 31V35H11V31Z" />
            <rect x="8" y="36" width="29" height="4" rx="2" />
          </g>
          {/* Inner white royal arch lines matching 2-rasm */}
          <path d="M18 23C18 16 20 13 22.5 13C25 13 27 16 27 23" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
          <ellipse cx="22.5" cy="18" rx="2.5" ry="1.5" fill="#FFFFFF" />
        </svg>
      );

    default:
      return null;
  }
};
