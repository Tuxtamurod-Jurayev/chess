import React from 'react';
import { ALL_GAMES } from '../constants.js';
import { GameCard } from '../components/GameCard.js';
import type { GameMetadata } from '../types.js';

interface PortalHomeProps {
  onSelectGame: (game: GameMetadata) => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({ onSelectGame }) => {
  return (
    <div className="p-4 space-y-2.5 pb-24 max-w-md mx-auto pt-2">
      <div className="space-y-2.5">
        {ALL_GAMES.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelectGame} />
        ))}
      </div>
    </div>
  );
};
