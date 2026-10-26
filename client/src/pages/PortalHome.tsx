import React, { useState } from 'react';
import { Sparkles, Swords, Zap, Trophy, Flame } from 'lucide-react';
import { ALL_GAMES } from '../constants.js';
import { GameCard } from '../components/GameCard.js';
import { GameCategory, GameMetadata } from '../types.js';
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
    { id: 'puzzle', label: 'Puzzllar', count: ALL_GAMES.filter((g) => g.category === 'puzzle').length },
    { id: 'arcade', label: 'Arkada', count: ALL_GAMES.filter((g) => g.category === 'arcade').length },
  ] as const;

  const filteredGames = ALL_GAMES.filter((game) => {
    if (selectedCategory === 'all') return true;
    return game.category === selectedCategory;
  });

  const featuredGame = ALL_GAMES.find((g) => g.id === 'chess') || ALL_GAMES[0];

  return (
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
      {/* Hero Banner: Featured / Daily Challenge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 p-5 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            <Sparkles size={14} className="animate-spin text-amber-400" />
            <span>Kunning Tanlangan O‘yini</span>
          </div>

          <h2 className="text-xl font-black text-white mb-1">
            {featuredGame.titleUz} Blitz Turniri
          </h2>
          <p className="text-xs text-blue-200/80 mb-4 leading-relaxed">
            1v1 real-time ELO janglarida qatnashing va do‘stlaringiz bilan kuch sinashing!
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                tg.haptic('medium');
                onSelectGame(featuredGame);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-blue-500/30 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Swords size={16} />
              <span>Hozir o‘ynash</span>
            </button>

            <button
              onClick={() => {
                tg.haptic('light');
                setDailyModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 active:scale-95 transition-all flex items-center space-x-1"
            >
              <Flame size={15} className="text-amber-400 fill-amber-400" />
              <span>Bonus</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Category Pills */}
      <div>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  tg.haptic('select');
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10 Games Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            O‘yinlar ({filteredGames.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Barchasi bepul</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onSelect={onSelectGame} />
          ))}
        </div>
      </div>
    </div>
  );
};
