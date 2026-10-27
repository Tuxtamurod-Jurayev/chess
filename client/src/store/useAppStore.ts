import { create } from 'zustand';
import { UserProfile, GameMetadata, GameRoom, GameId } from '../types.js';

interface AppState {
  user: UserProfile | null;
  activeTab: 'games' | 'leaderboard' | 'profile';
  selectedGame: GameMetadata | null;
  activeRoom: GameRoom | null;
  isMatchmaking: boolean;
  matchmakingGameId: GameId | null;
  matchmakingSeconds: number;
  dailyModalOpen: boolean;
  toastMessage: string | null;

  setUser: (user: UserProfile) => void;
  updateCoins: (coins: number) => void;
  setActiveTab: (tab: 'games' | 'leaderboard' | 'profile') => void;
  setSelectedGame: (game: GameMetadata | null) => void;
  setActiveRoom: (room: GameRoom | null) => void;
  setMatchmaking: (isMatchmaking: boolean, gameId?: GameId | null) => void;
  incrementMatchmakingSeconds: () => void;
  setDailyModalOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  activeTab: 'games',
  selectedGame: null,
  activeRoom: null,
  isMatchmaking: false,
  matchmakingGameId: null,
  matchmakingSeconds: 0,
  dailyModalOpen: false,
  toastMessage: null,

  setUser: (user) => set({ user }),
  updateCoins: (coins) => set((s) => ({ user: s.user ? { ...s.user, coins } : null })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedGame: (selectedGame) => set({ selectedGame }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setMatchmaking: (isMatchmaking, matchmakingGameId = null) =>
    set({ isMatchmaking, matchmakingGameId, matchmakingSeconds: 0 }),
  incrementMatchmakingSeconds: () =>
    set((s) => ({ matchmakingSeconds: s.matchmakingSeconds + 1 })),
  setDailyModalOpen: (dailyModalOpen) => set({ dailyModalOpen }),
  showToast: (toastMessage) => set({ toastMessage }),
  hideToast: () => set({ toastMessage: null }),
}));
