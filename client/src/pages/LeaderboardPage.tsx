import React, { useState, useEffect } from 'react';
import { ALL_GAMES } from '../constants.js';
import type { GameId, LeaderboardItem } from '../types.js';
import { api } from '../services/api.js';
import { tg } from '../services/telegram.js';

export const LeaderboardPage: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>('chess');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);

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
        <h2 className="text-base font-bold text-zinc-100">Reyting Jadvali</h2>
        <p className="text-xs text-zinc-500">Eng yaxshi natijalar va ELO ballari</p>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-zinc-900/70 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {game.titleUz}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Yuklanmoqda...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">Hozircha natijalar yo‘q</div>
        ) : (
          leaderboard.map((item) => (
            <div
              key={item.userId}
              className="p-3 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <span className={`w-5 text-center font-mono font-semibold ${
                  item.rank === 1 ? 'text-amber-400' : item.rank === 2 ? 'text-zinc-300' : item.rank === 3 ? 'text-amber-600' : 'text-zinc-500'
                }`}>
                  {item.rank}
                </span>
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-zinc-300">
                  {item.firstName[0]}
                </div>
                <div>
                  <span className="font-medium text-zinc-200 block">{item.firstName}</span>
                  <span className="text-[10px] text-zinc-500">@{item.username}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-semibold text-zinc-200 block">
                  {item.score}
                </span>
                {item.badge && (
                  <span className="text-[9px] text-zinc-500">{item.badge}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
