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
        className="flex items-center space-x-2.5 text-left group transition-opacity active:opacity-70"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-200 overflow-hidden">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
          ) : user?.firstName ? (
            user.firstName[0].toUpperCase()
          ) : (
            <User size={14} className="text-zinc-400" />
          )}
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-200 block leading-tight">
            {user?.firstName || 'Mehmon'}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">@{user?.username || 'player'}</span>
        </div>
      </button>

      {/* Stats (Streak & Coins) */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => {
            tg.haptic('light');
            setDailyModalOpen(true);
          }}
          className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 transition-colors active:scale-95"
          title="Kunlik bonus"
        >
          <Flame size={13} className="text-amber-500" />
          <span className="font-mono text-[11px]">{user?.dailyStreak || 1}d</span>
        </button>

        <button
          onClick={() => {
            tg.haptic('light');
            setActiveTab('profile');
          }}
          className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 transition-colors active:scale-95"
        >
          <Coins size={13} className="text-amber-400" />
          <span className="font-mono text-[11px]">{user?.coins?.toLocaleString() ?? 0}</span>
        </button>
      </div>
    </header>
  );
};
