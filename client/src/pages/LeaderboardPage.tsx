import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { ALL_GAMES } from '../constants.js';
import type { GameId, LeaderboardItem } from '../types.js';
import { api } from '../services/api.js';
import { tg } from '../services/telegram.js';

export const LeaderboardPage: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>('chess');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const currentGame = ALL_GAMES.find((g) => g.id === selectedGameId);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getLeaderboard(selectedGameId)
      .then((data) => {
        if (isMounted) setLeaderboard(data);
      })
      .catch((err) => {
        console.error('Leaderboard error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGameId]);

  return (
    <div className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
          <Trophy size={18} className="text-amber-400" />
          <span>Haqiqiy Reyting Jadvali</span>
        </h2>
        <p className="text-xs text-zinc-400">Faqat real o‘yinchilar va eng yuqori natijalar</p>
      </div>

      {/* Game selector pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {ALL_GAMES.map((game) => {
          const isActive = selectedGameId === game.id;
          return (
            <button
              key={game.id}
              onClick={() => {
                tg.haptic('select');
                setSelectedGameId(game.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {game.titleUz}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-10 text-center text-xs text-zinc-500 animate-pulse font-mono">
            Natijalar yuklanmoqda...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Sparkles size={28} className="mx-auto text-amber-400/60" />
            <h4 className="text-xs font-bold text-zinc-300">Hozircha natijalar kiritilmagan</h4>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              {currentGame?.titleUz} o‘yinini birinchi bo‘lib o‘ynang va reyting cho‘qqisini egallang!
            </p>
          </div>
        ) : (
          leaderboard.map((item, idx) => {
            const isElo = ['chess', 'checkers', 'tictactoe'].includes(selectedGameId);
            const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${item.rank}`;

            return (
              <div
                key={item.userId}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-6 text-center font-mono font-bold text-sm ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-zinc-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    {rankBadge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 overflow-hidden shadow-xs">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.firstName} className="w-full h-full object-cover" />
                    ) : (
                      item.firstName?.[0] || 'U'
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-100 block">{item.firstName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">@{item.username}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-100 text-sm block">
                    {item.score} {isElo ? 'ELO' : selectedGameId === 'tower-blocks' ? 'etaj' : 'ball'}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-mono text-amber-400/90 font-medium">{item.badge}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
