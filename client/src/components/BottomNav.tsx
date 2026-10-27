import React from 'react';
import { Gamepad2, Trophy, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, selectedGame } = useAppStore();

  if (selectedGame) return null;

  const tabs = [
    { id: 'games', label: 'O‘yinlar', icon: Gamepad2, color: 'text-blue-400', activeBg: 'bg-blue-500/15' },
    { id: 'leaderboard', label: 'Reyting', icon: Trophy, color: 'text-amber-400', activeBg: 'bg-amber-500/15' },
    { id: 'profile', label: 'Profil', icon: User, color: 'text-purple-400', activeBg: 'bg-purple-500/15' },
  ] as const;

  const handleTabChange = (tabId: typeof activeTab) => {
    tg.haptic('select');
    setActiveTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-3 py-1.5 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive ? `${tab.activeBg} ${tab.color}` : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} className="transition-transform duration-200" />
            <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
