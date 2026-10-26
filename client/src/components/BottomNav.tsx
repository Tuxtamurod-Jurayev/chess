import React from 'react';
import { Gamepad2, Trophy, Users, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, selectedGame } = useAppStore();

  // Hide bottom nav if inside an active game session
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around safe-bottom shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
              <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
