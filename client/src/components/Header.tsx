import React from 'react';
import { Coins, Flame, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const Header: React.FC = () => {
  const { user, setDailyModalOpen, setActiveTab } = useAppStore();

  const handleDailyClick = () => {
    tg.haptic('medium');
    setDailyModalOpen(true);
  };

  const handleProfileClick = () => {
    tg.haptic('light');
    setActiveTab('profile');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
      {/* User profile avatar & name */}
      <button
        onClick={handleProfileClick}
        className="flex items-center space-x-2.5 text-left group transition-transform active:scale-95"
      >
        <div className="relative">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.firstName}
              className="w-10 h-10 rounded-full border-2 border-blue-500/80 object-cover shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              {user?.firstName ? user.firstName[0].toUpperCase() : <User size={20} />}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight flex items-center gap-1 group-hover:text-blue-400 transition-colors">
            {user?.firstName || 'Mehmon'}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono">@{user?.username || 'player'}</p>
        </div>
      </button>

      {/* Stats (Streak & Coins) */}
      <div className="flex items-center space-x-2">
        {/* Streak Button */}
        <button
          onClick={handleDailyClick}
          className="flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-full text-xs font-semibold text-amber-400 transition-all active:scale-95 shadow-sm"
          title="Kunlik bonus va seriya"
        >
          <Flame size={15} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span>{user?.dailyStreak || 1} kun</span>
        </button>

        {/* Coins Button */}
        <button
          onClick={() => {
            tg.haptic('light');
            setActiveTab('profile');
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/30 hover:border-yellow-500/50 px-3 py-1.5 rounded-full text-xs font-bold text-yellow-300 transition-all active:scale-95 shadow-sm"
        >
          <Coins size={15} className="text-yellow-400 fill-yellow-400" />
          <span>{user?.coins?.toLocaleString() ?? 0}</span>
        </button>
      </div>
    </header>
  );
};
