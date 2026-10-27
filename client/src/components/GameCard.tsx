import React from 'react';
import {
  Crown,
  CircleDot,
  Calculator,
  Axe,
  Grid2x2,
  X,
  Activity,
  SpellCheck,
  Crosshair,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { GameMetadata } from '../types.js';
import { tg } from '../services/telegram.js';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const getIcon = () => {
    const props = { size: 18, className: 'text-zinc-200' };
    switch (game.icon) {
      case 'Crown': return <Crown {...props} />;
      case 'CircleDot': return <CircleDot {...props} />;
      case 'Calculator': return <Calculator {...props} />;
      case 'Axe': return <Axe {...props} />;
      case 'Grid2x2': return <Grid2x2 {...props} />;
      case 'X': return <X {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'SpellCheck': return <SpellCheck {...props} />;
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
      className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/70 hover:border-zinc-700 rounded-xl p-3.5 transition-all duration-150 active:scale-[0.99] flex items-center justify-between cursor-pointer"
    >
      <div className="flex items-center space-x-3 min-w-0">
        {/* Minimalist icon frame */}
        <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0">
          {getIcon()}
        </div>

        {/* Title & subtitle */}
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white">
              {game.titleUz}
            </h3>
            {game.badge && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {game.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
            {game.descriptionUz}
          </p>
        </div>
      </div>

      {/* Right Minimal Arrow */}
      <div className="w-7 h-7 rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 shrink-0 ml-2 transition-colors">
        <ChevronRight size={15} />
      </div>
    </div>
  );
};
