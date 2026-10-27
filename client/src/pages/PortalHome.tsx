import React, { useState } from 'react';
import { ALL_GAMES } from '../constants.js';
import { GameCard } from '../components/GameCard.js';
import type { GameCategory, GameMetadata } from '../types.js';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

interface PortalHomeProps {
  onSelectGame: (game: GameMetadata) => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({ onSelectGame }) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const { setDailyModalOpen } = useAppStore();

  const categories = [
    { id: 'all', label: 'Barchasi', count: ALL_GAMES.length },
    { id: 'pvp', label: '1v1 PvP', count: ALL_GAMES.filter((g) => g.category === 'pvp').length },
    { id: 'puzzle', label: 'Puzzle', count: ALL_GAMES.filter((g) => g.category === 'puzzle').length },
    { id: 'arcade', label: 'Arkada', count: ALL_GAMES.filter((g) => g.category === 'arcade').length },
  ] as const;

  const filteredGames = ALL_GAMES.filter((game) => {
    if (selectedCategory === 'all') return true;
    return game.category === selectedCategory;
  });

  const featuredGame = ALL_GAMES.find((g) => g.id === 'chess') || ALL_GAMES[0];

  return (
    <div className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      {/* Minimalist Featured Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="min-w-0 pr-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
            Kunning o‘yini
          </span>
          <h2 className="text-base font-bold text-zinc-100 leading-tight">
            {featuredGame.titleUz} (FIDE)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            1v1 onlayn yoki aqlli bot bilan mashq qiling
          </p>
        </div>

        <button
          onClick={() => {
            tg.haptic('medium');
            onSelectGame(featuredGame);
          }}
          className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shrink-0 transition-all active:scale-95 shadow-sm"
        >
          O‘ynash
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                tg.haptic('select');
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-zinc-900/70 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className="ml-1 text-[10px] opacity-60">({cat.count})</span>
            </button>
          );
        })}
      </div>

      {/* 10 Games List */}
      <div className="space-y-2">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} onSelect={onSelectGame} />
        ))}
      </div>
    </div>
  );
};
