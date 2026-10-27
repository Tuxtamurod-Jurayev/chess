import React from 'react';
import { ALL_GAMES } from '../constants.js';
import { GameCard } from '../components/GameCard.js';
import type { GameMetadata } from '../types.js';

interface PortalHomeProps {
  onSelectGame: (game: GameMetadata) => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({ onSelectGame }) => {
  return (
    <div className="p-4 space-y-3 pb-24 max-w-md mx-auto">
      {/* 10 Games Grid directly rendered */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>O‘yinlar Katalogi ({ALL_GAMES.length})</span>
        </h2>
        <span className="text-[11px] font-mono text-zinc-500">Online PvP & Bot</span>
      </div>

      <div className="space-y-2.5">
        {ALL_GAMES.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelectGame} />
        ))}
      </div>
    </div>
  );
};
