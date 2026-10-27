import React from 'react';

interface LumberjackCharacterProps {
  side: 'left' | 'right';
  isChopping: boolean;
}

export const LumberjackCharacter: React.FC<LumberjackCharacterProps> = ({ side, isChopping }) => {
  const isLeft = side === 'left';

  return (
    <div
      className={`relative w-20 h-28 pointer-events-none transition-transform duration-75 ${
        isLeft ? 'scale-x-100' : '-scale-x-100'
      }`}
      style={{
        transformOrigin: 'bottom center',
      }}
    >
      <svg
        viewBox="0 0 80 110"
        className={`w-full h-full transition-transform duration-75 ${
          isChopping ? 'translate-x-2 -translate-y-0.5' : ''
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Steel blade gradient */}
          <linearGradient id="bladeGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FAFC" />
            <stop offset="0.5" stopColor="#CBD5E1" />
            <stop offset="1" stopColor="#64748B" />
          </linearGradient>
          {/* Wooden handle gradient */}
          <linearGradient id="handleGrad" x1="0" y1="0" x2="6" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" />
            <stop offset="1" stopColor="#78350F" />
          </linearGradient>
          {/* Red/black plaid pattern */}
          <pattern id="plaid" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#DC2626" />
            <rect width="4" height="8" fill="#991B1B" />
            <rect y="4" width="8" height="4" fill="#7F1D1D" opacity="0.6" />
            <rect width="4" height="4" fill="#18181B" opacity="0.4" />
          </pattern>
        </defs>

        {/* Shadow */}
        <ellipse cx="38" cy="104" rx="18" ry="4" fill="#000000" opacity="0.35" />

        {/* Boots */}
        <rect x="25" y="94" width="10" height="9" rx="3" fill="#451A03" />
        <rect x="41" y="94" width="10" height="9" rx="3" fill="#451A03" />
        <rect x="23" y="99" width="13" height="4" rx="2" fill="#271003" />
        <rect x="39" y="99" width="13" height="4" rx="2" fill="#271003" />

        {/* Jeans / Legs */}
        <path d="M26 68L27 95H34L35 73L37 73L38 95H45L46 68H26Z" fill="#1E3A8A" />
        <rect x="25" y="67" width="22" height="4" rx="1" fill="#18181B" /> {/* Belt */}
        <rect x="34" y="67" width="4" height="4" rx="1" fill="#FBBF24" /> {/* Buckle */}

        {/* Body / Torso (Plaid Flannel Shirt) */}
        <path
          d="M23 42H50C52 42 54 44 53 47L50 69H22L20 47C19 44 21 42 23 42Z"
          fill="url(#plaid)"
          stroke="#7F1D1D"
          strokeWidth="1"
        />

        {/* Head & Neck */}
        <rect x="33" y="36" width="8" height="7" rx="2" fill="#FBBF24" /> {/* Neck */}
        {/* Face */}
        <circle cx="37" cy="27" r="11" fill="#FBBF24" />
        {/* Beard */}
        <path
          d="M27 28C27 38 47 38 47 28C47 33 44 38 37 38C30 38 27 33 27 28Z"
          fill="#78350F"
        />
        <ellipse cx="37" cy="32" rx="4" ry="1.5" fill="#451A03" /> {/* Mustache */}
        {/* Nose */}
        <circle cx="39" cy="27" r="1.5" fill="#F59E0B" />
        {/* Eye */}
        <circle cx="41" cy="24" r="1.5" fill="#18181B" />
        <circle cx="41.5" cy="23.5" r="0.5" fill="#FFFFFF" />
        {/* Eyebrow */}
        <rect x="39" y="21" width="4" height="1.2" rx="0.6" fill="#78350F" />

        {/* Red Knit Beanie / Hat */}
        <path
          d="M26 23C26 15 31 10 38 10C45 10 49 15 48 23H26Z"
          fill="#DC2626"
        />
        <rect x="25" y="21" width="24" height="3.5" rx="1.5" fill="#991B1B" />
        <circle cx="37" cy="9" r="2.5" fill="#B91C1C" /> {/* Pom-pom */}

        {/* Arms and AXE with dynamic swing */}
        {isChopping ? (
          /* Chopping Swing Pose: Axe strikes forward horizontally into the tree */
          <g transform="translate(34, 48) rotate(32)">
            {/* Back Arm */}
            <path d="M-2 -3L12 8" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
            {/* Axe Handle */}
            <rect x="10" y="-14" width="4" height="42" rx="2" fill="url(#handleGrad)" stroke="#451A03" strokeWidth="0.8" transform="rotate(-65 12 7)" />
            {/* Axe Head */}
            <path
              d="M36 -12C41 -15 47 -10 45 -2L38 0L35 -7L36 -12Z"
              fill="url(#bladeGrad)"
              stroke="#334155"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Front Arm */}
            <path d="M-4 2L10 10" stroke="#DC2626" strokeWidth="6.5" strokeLinecap="round" />
            {/* Hands */}
            <circle cx="10" cy="10" r="3.5" fill="#FBBF24" />
          </g>
        ) : (
          /* Ready Pose: Axe held up high and back, ready to chop */
          <g transform="translate(32, 46) rotate(-22)">
            {/* Arms raised */}
            <path d="M-2 4L8 -10" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
            <path d="M2 7L12 -8" stroke="#DC2626" strokeWidth="6.5" strokeLinecap="round" />
            {/* Hands */}
            <circle cx="10" cy="-9" r="3.5" fill="#FBBF24" />
            {/* Axe Handle */}
            <rect x="8" y="-36" width="4" height="44" rx="2" fill="url(#handleGrad)" stroke="#451A03" strokeWidth="0.8" transform="rotate(-15 10 -14)" />
            {/* Axe Head pointed ready */}
            <path
              d="M12 -38C17 -40 23 -37 22 -28L15 -27L12 -33L12 -38Z"
              fill="url(#bladeGrad)"
              stroke="#334155"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
