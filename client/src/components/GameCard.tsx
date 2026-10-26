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
  Users,
  Clock,
  Play,
} from 'lucide-react';
import { GameMetadata } from '../types.js';
import { tg } from '../services/telegram.js';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const getIcon = () => {
    const props = { size: 28, className: 'text-white' };
    switch (game.icon) {
      case 'Crown':
        return <Crown {...props} />;
      case 'CircleDot':
        return <CircleDot {...props} />;
      case 'Calculator':
        return <Calculator {...props} />;
      case 'Axe':
        return <Axe {...props} />;
      case 'Grid2x2':
        return <Grid2x2 {...props} />;
      case 'X':
        return <X {...props} />;
      case 'Activity':
        return <Activity {...props} />;
      case 'SpellCheck':
        return <SpellCheck {...props} />;
      case 'Crosshair':
        return <Crosshair {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      default:
        return <Crown {...props} />;
    }
  };

  const handleCardClick = () => {
    tg.haptic('light');
    onSelect(game);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] shadow-sm flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Decorative gradient corner glow */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: game.accentColor }}
      ></div>

      <div>
        {/* Top bar: Icon and Badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
            style={{
              backgroundColor: `${game.accentColor}25`,
              borderColor: `${game.accentColor}40`,
              borderWidth: 1,
            }}
          >
            <div style={{ color: game.accentColor }}>{getIcon()}</div>
          </div>

          {game.badge && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: `${game.accentColor}18`,
                color: game.accentColor,
                borderColor: `${game.accentColor}40`,
              }}
            >
              {game.badge}
            </span>
          )}
        </div>

        {/* Title and description */}
        <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
          {game.titleUz}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {game.descriptionUz}
        </p>
      </div>

      {/* Meta tags & Play Button */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1 font-medium">
            <Users size={13} className="text-slate-500" />
            {game.isMultiplayer ? '1v1 PvP' : 'Solo'}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Clock size={13} className="text-slate-500" />
            {game.avgDuration}
          </span>
        </div>

        <button
          className="w-8 h-8 rounded-full bg-blue-600/80 group-hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-sm"
          title="O‘ynash"
        >
          <Play size={14} className="fill-white translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
