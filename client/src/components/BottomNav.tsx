import React from 'react';
import { Gamepad2, Trophy, Users, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, selectedGame } = useAppStore();

  if (selectedGame) return null;

  const tabs = [
    { id: 'games', label: 'O‘yinlar', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Reyting', icon: Trophy },
    { id: 'friends', label: 'Do‘stlar', icon: Users },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  const handleTabChange = (tabId: typeof activeTab) => {
    tg.haptic('select');
    setActiveTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors active:scale-95 ${
              isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[10px] mt-1 font-medium tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
