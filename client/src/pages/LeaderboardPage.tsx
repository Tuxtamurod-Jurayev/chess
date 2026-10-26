import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, User } from 'lucide-react';
import { ALL_GAMES } from '../constants.js';
import { GameId, LeaderboardItem } from '../types.js';
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

  const selectedGame = ALL_GAMES.find((g) => g.id === selectedGameId);

  return (
    <div className="p-4 space-y-5 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
          <Trophy className="text-amber-400 fill-amber-400" size={24} />
          <span>Peshqadamlar Jadvali</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Eng yaxshi o‘yinchilar va ELO reytingi
        </p>
      </div>

      {/* Game selector pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        {ALL_GAMES.map((game) => {
          const isActive = selectedGameId === game.id;
          return (
            <button
              key={game.id}
              onClick={() => {
                tg.haptic('select');
                setSelectedGameId(game.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {game.titleUz}
            </button>
          );
        })}
      </div>

      {/* Top 3 Podium (if >= 3 players) */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-6 pb-2 items-end">
          {/* 2nd Place */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center relative shadow-md">
            <span className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow">
              2
            </span>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mb-1 text-slate-300 font-bold">
              {leaderboard[1].firstName[0]}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-full">
              {leaderboard[1].firstName}
            </span>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {leaderboard[1].score}
            </span>
          </div>

          {/* 1st Place (Crown) */}
          <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-3.5 flex flex-col items-center text-center relative shadow-xl scale-105">
            <Crown className="text-amber-400 fill-amber-400 absolute -top-5" size={24} />
            <span className="absolute -top-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
              1
            </span>
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-1 text-amber-300 font-bold text-lg">
              {leaderboard[0].firstName[0]}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-full">
              {leaderboard[0].firstName}
            </span>
            <span className="text-xs font-mono text-amber-300 font-black">
              {leaderboard[0].score}
            </span>
          </div>

          {/* 3rd Place */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center relative shadow-md">
            <span className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
              3
            </span>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center mb-1 text-amber-600 font-bold">
              {leaderboard[2].firstName[0]}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-full">
              {leaderboard[2].firstName}
            </span>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {leaderboard[2].score}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Hozircha natijalar yo‘q</div>
        ) : (
          leaderboard.map((item) => (
            <div
              key={item.userId}
              className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 font-mono text-xs font-bold text-slate-500 text-center">
                  #{item.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {item.firstName[0]}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{item.firstName}</span>
                  <span className="text-[10px] text-slate-400">@{item.username}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-400 block">
                  {item.score}
                </span>
                {item.badge && (
                  <span className="text-[9px] text-blue-400 font-semibold">{item.badge}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
