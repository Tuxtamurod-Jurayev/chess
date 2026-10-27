import React from 'react';
import { User, Trophy, Flame, Coins, Swords, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { ALL_GAMES } from '../constants.js';

export const ProfilePage: React.FC = () => {
  const { user } = useAppStore();

  if (!user) return null;

  const winRate = user.totalMatches > 0 ? Math.round((user.totalWins / user.totalMatches) * 100) : 0;

  // Personal High Scores (from server profile or local fallback)
  const getHighScoreForGame = (gameId: string): number => {
    if (user.highScores && user.highScores[gameId as keyof typeof user.highScores] !== undefined) {
      return Number(user.highScores[gameId as keyof typeof user.highScores] || 0);
    }
    if (gameId === '2048') {
      return Number(localStorage.getItem('2048_best_score') || '0');
    }
    if (gameId === 'tower-blocks') {
      return Number(localStorage.getItem('tower_blocks_best') || '0');
    }
    return Number(user.eloRating?.[gameId as keyof typeof user.eloRating] || 0);
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      {/* Profile Overview Card */}
      <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 text-center shadow-md">
        <div className="w-16 h-16 mx-auto mb-2.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg">
          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-zinc-200 overflow-hidden">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <User size={28} />
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">{user.firstName}</h3>
        <p className="text-xs text-zinc-400 font-mono">@{user.username}</p>

        {/* Balance & Streak Chips */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs text-amber-300 font-bold font-mono">
            <Coins size={14} className="text-amber-400" />
            <span>{user.coins} tanga</span>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs text-orange-400 font-bold font-mono">
            <Flame size={14} className="text-orange-500" />
            <span>{user.dailyStreak} kun seriya</span>
          </div>
        </div>

        {/* 3 Matches Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-zinc-800/80 text-center">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">O‘yinlar</span>
            <span className="text-sm font-mono font-bold text-zinc-100">{user.totalMatches}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">G‘alabalar</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{user.totalWins}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">G‘alaba %</span>
            <span className="text-sm font-mono font-bold text-blue-400">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Highest Scores Across All Played Games */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Trophy size={13} className="text-amber-400" />
            O‘yinlardagi Eng Yuqori Natijalar
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Shaxsiy rekordlar</span>
        </div>

        <div className="space-y-2">
          {ALL_GAMES.map((game) => {
            const scoreVal = getHighScoreForGame(game.id);
            const isEloGame = ['chess', 'checkers', 'tictactoe'].includes(game.id);

            return (
              <div
                key={game.id}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between transition-all hover:border-zinc-700"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${game.accentColor}33, ${game.accentColor}11)`,
                      border: `1px solid ${game.accentColor}44`,
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: game.accentColor }}>
                      {game.titleUz[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">{game.titleUz}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {isEloGame ? 'PvP Reyting' : 'Solo Rekord'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-sm font-mono font-bold block"
                    style={{ color: scoreVal > 0 ? game.accentColor : '#71717a' }}
                  >
                    {scoreVal > 0 ? (isEloGame ? `${scoreVal} ELO` : `${scoreVal} ball`) : 'Hali o‘ynalmagan'}
                  </span>
                  {scoreVal > 0 && (
                    <span className="text-[9px] text-emerald-400 flex items-center justify-end gap-0.5">
                      <CheckCircle2 size={9} /> Eng yuqori
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
