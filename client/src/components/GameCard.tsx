import React, { useState } from 'react';
import { Play } from 'lucide-react';
import type { GameMetadata } from '../types.js';
import { tg } from '../services/telegram.js';
import { GameIcon } from './GameIcons.js';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    tg.haptic('light');
    onSelect(game);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-between cursor-pointer"
      style={{
        backgroundColor: isHovered ? '#171922' : '#111319',
        border: isHovered
          ? `1px solid ${game.accentColor}90`
          : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isHovered
          ? `0 6px 20px ${game.accentColor}25`
          : '0 3px 10px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Left Accent Bar - 100% clearly visible & illuminates on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 transition-all duration-200"
        style={{
          width: isHovered ? '4px' : '3px',
          backgroundColor: game.accentColor,
          boxShadow: isHovered ? `0 0 10px ${game.accentColor}` : `0 0 5px ${game.accentColor}66`,
        }}
      />

      {/* Subtle ambient glow in the background on hover */}
      <div
        className="absolute -left-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundColor: game.accentColor,
          opacity: isHovered ? 0.3 : 0.12,
        }}
      />

      <div className="flex items-center space-x-3.5 min-w-0 pl-1.5">
        {/* Exact Icon Box (kept in the exact style requested) */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-200 group-hover:scale-105 p-1.5"
          style={{
            background: `linear-gradient(135deg, ${game.accentColor}33, #18181b)`,
            border: `1px solid ${game.accentColor}55`,
            boxShadow: `0 4px 14px ${game.accentColor}25`,
          }}
        >
          <GameIcon id={game.id} size={30} />
        </div>

        {/* Clean Info - Title */}
        <div className="min-w-0">
          <h3
            className="text-sm font-bold text-white tracking-tight truncate transition-colors duration-200"
            style={{
              color: isHovered ? '#FFFFFF' : '#F4F4F5',
            }}
          >
            {game.titleUz}
          </h3>
        </div>
      </div>

      {/* Right Play Button with vibrant hover response */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ml-2 shadow-md transition-all duration-200 group-hover:scale-110 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${game.accentColor}, ${game.accentColor}aa)`,
          boxShadow: isHovered
            ? `0 0 14px ${game.accentColor}88`
            : `0 2px 8px ${game.accentColor}44`,
        }}
      >
        <Play size={13} className="fill-white translate-x-0.5" />
      </div>
    </div>
  );
};
