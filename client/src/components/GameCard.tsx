import React from 'react';
import {
  Crown,
  CircleDot,
  Calculator,
  Axe,
  Grid2x2,
  X,
  Activity,
  Crosshair,
  Layers,
  Play,
} from 'lucide-react';
import type { GameMetadata } from '../types.js';
import { tg } from '../services/telegram.js';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const getIcon = () => {
    const props = { size: 22, className: 'text-white' };
    switch (game.icon) {
      case 'Crown': return <Crown {...props} />;
      case 'CircleDot': return <CircleDot {...props} />;
      case 'Calculator': return <Calculator {...props} />;
      case 'Axe': return <Axe {...props} />;
      case 'Grid2x2': return <Grid2x2 {...props} />;
      case 'X': return <X {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Crosshair': return <Crosshair {...props} />;
      case 'Layers': return <Layers {...props} />;
      default: return <Crown {...props} />;
    }
  };

  const handleCardClick = () => {
    tg.haptic('light');
    onSelect(game);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative overflow-hidden bg-gradient-to-r from-zinc-900/90 to-zinc-900/60 hover:to-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-3.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-between cursor-pointer shadow-md backdrop-blur-xs"
    >
      {/* Subtle ambient colored glow on left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: game.accentColor }}
      />
      <div
        className="absolute -left-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity"
        style={{ backgroundColor: game.accentColor }}
      />

      <div className="flex items-center space-x-3.5 min-w-0 pl-1.5">
        {/* Vibrant Icon Box */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-200 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${game.accentColor}dd, ${game.accentColor}66)`,
            boxShadow: `0 4px 14px ${game.accentColor}33`,
          }}
        >
          {getIcon()}
        </div>

        {/* Clean Info - Only Title */}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-zinc-100">
            {game.titleUz}
          </h3>
        </div>
      </div>

      {/* Right Play Button with vibrant glow */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ml-2 shadow-md transition-all duration-200 group-hover:scale-110 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${game.accentColor}, ${game.accentColor}aa)`,
          boxShadow: `0 2px 8px ${game.accentColor}44`,
        }}
      >
        <Play size={13} className="fill-white translate-x-0.5" />
      </div>
    </div>
  );
};
