import { UserProfile, LeaderboardItem, GameId } from '../types.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const api = {
  async authTelegram(initData: string, mockUser?: any): Promise<{ user: UserProfile }> {
    const res = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, mockUser }),
    });
    if (!res.ok) throw new Error('Auth failed');
    return res.json();
  },

  async getLeaderboard(gameId: GameId): Promise<LeaderboardItem[]> {
    const res = await fetch(`${BACKEND_URL}/api/leaderboard/${gameId}`);
    if (!res.ok) throw new Error('Leaderboard fetch failed');
    const data = await res.json();
    return data.leaderboard;
  },

  async claimDailyBonus(userId: string): Promise<{ success: boolean; coinsAwarded: number; newStreak: number; message: string; user?: UserProfile }> {
    const res = await fetch(`${BACKEND_URL}/api/user/claim-daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async finishSoloGame(userId: string, gameId: GameId, score: number): Promise<{ success: boolean; earnedCoins: number; user: UserProfile }> {
    const res = await fetch(`${BACKEND_URL}/api/solo/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, gameId, score }),
    });
    return res.json();
  },
};
