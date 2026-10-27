import React from 'react';
import { Coins, Flame, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const Header: React.FC = () => {
  const { user, setDailyModalOpen, setActiveTab } = useAppStore();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
      {/* Profile Info */}
      <button
        onClick={() => {
          tg.haptic('light');
          setActiveTab('profile');
        }}
        className="flex items-center space-x-2.5 text-left group transition-all active:scale-95"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/50 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : user?.firstName ? (
              user.firstName[0].toUpperCase()
            ) : (
              <User size={15} className="text-white" />
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-zinc-950 rounded-full" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block leading-tight group-hover:text-blue-400 transition-colors">
            {user?.firstName || 'Mehmon'}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">@{user?.username || 'player'}</span>
        </div>
      </button>

      {/* Stats (Streak & Coins) with vibrant pills */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            tg.haptic('light');
            setDailyModalOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 transition-all active:scale-95 shadow-xs"
          title="Kunlik bonus"
        >
          <Flame size={13} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span className="font-mono text-[11px]">{user?.dailyStreak || 1}d</span>
        </button>

        <button
          onClick={() => {
            tg.haptic('light');
            setActiveTab('profile');
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 hover:border-yellow-500/60 px-3 py-1 rounded-full text-xs font-bold text-yellow-300 transition-all active:scale-95 shadow-xs"
        >
          <Coins size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="font-mono text-[11px]">{user?.coins?.toLocaleString() ?? 0}</span>
        </button>
      </div>
    </header>
  );
};
