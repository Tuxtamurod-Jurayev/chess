import { GameId, UserProfile, LeaderboardItem } from '../types.js';

class InMemoryStore {
  private users: Map<string, UserProfile> = new Map();
  private userByTgId: Map<number, string> = new Map();
  private gameLeaderboards: Map<GameId, LeaderboardItem[]> = new Map();

  constructor() {
    // Real, active player leaderboards (mock bot entries removed)
    this.gameLeaderboards = new Map();
  }

  public getOrCreateUser(tgData: { id: number; first_name: string; username?: string; photo_url?: string }): UserProfile {
    const existingId = this.userByTgId.get(tgData.id);
    if (existingId && this.users.has(existingId)) {
      const user = this.users.get(existingId)!;
      // Update info if changed
      user.firstName = tgData.first_name || user.firstName;
      user.username = tgData.username || user.username;
      if (tgData.photo_url) user.photoUrl = tgData.photo_url;
      return user;
    }

    const userId = `usr_${tgData.id}`;
    const defaultElo: Record<GameId, number> = {
      'chess': 1200,
      'checkers': 1200,
      'math-battle': 1200,
      'timberjack': 1000,
      '2048': 1000,
      'tictactoe': 1200,
      'knife-hit': 1000,
      'tower-blocks': 1000,
    };

    const newUser: UserProfile = {
      id: userId,
      telegramId: tgData.id,
      username: tgData.username || `player_${tgData.id.toString().slice(-4)}`,
      firstName: tgData.first_name || 'Geymer',
      photoUrl: tgData.photo_url,
      coins: 250, // Boshlang'ich tangalar
      dailyStreak: 1,
      lastDailyClaim: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), // Kechagi kun
      eloRating: defaultElo,
      highScores: {},
      totalMatches: 0,
      totalWins: 0,
    };

    this.users.set(userId, newUser);
    this.userByTgId.set(tgData.id, userId);
    return newUser;
  }

  public getUser(userId: string): UserProfile | undefined {
    return this.users.get(userId);
  }

  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  public claimDailyBonus(userId: string): { success: boolean; coinsAwarded: number; newStreak: number; message: string } {
    const user = this.users.get(userId);
    if (!user) return { success: false, coinsAwarded: 0, newStreak: 0, message: 'Foydalanuvchi topilmadi' };

    const now = new Date();
    const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;

    if (lastClaim) {
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 3600);
      if (diffHours < 20) {
        return {
          success: false,
          coinsAwarded: 0,
          newStreak: user.dailyStreak,
          message: `Keyingi bonusni yana ${Math.ceil(24 - diffHours)} soatdan so‘ng olishingiz mumkin!`,
        };
      }
      if (diffHours < 48) {
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 1; // Uzilib qolgan
      }
    } else {
      user.dailyStreak = 1;
    }

    const baseReward = 50;
    const coinsAwarded = baseReward * Math.min(user.dailyStreak, 7);
    user.coins += coinsAwarded;
    user.lastDailyClaim = now.toISOString();

    return {
      success: true,
      coinsAwarded,
      newStreak: user.dailyStreak,
      message: `Kunlik bonus: +${coinsAwarded} tanga olindi! Streak: ${user.dailyStreak} kun!`,
    };
  }

  public updateMatchResult(
    gameId: GameId,
    p1Id: string,
    p2Id: string | null, // null if bot or solo
    winnerId: string | null, // null if draw
    score?: number
  ) {
    const p1 = this.users.get(p1Id);
    if (!p1) return;

    p1.totalMatches += 1;

    // Solo game highscore update
    if (!p2Id && score !== undefined) {
      if (!p1.highScores) p1.highScores = {};
      const peakScore = Math.max(p1.highScores[gameId] || 0, score);
      p1.highScores[gameId] = peakScore;
      this.updateLeaderboard(gameId, p1, peakScore);
      return;
    }

    const p2 = p2Id ? this.users.get(p2Id) : null;
    if (p2) {
      p2.totalMatches += 1;
    }

    // ELO calculation
    const r1 = p1.eloRating[gameId] || 1200;
    const r2 = p2 ? (p2.eloRating[gameId] || 1200) : 1200; // bot is ~1200

    const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const e2 = 1 / (1 + Math.pow(10, (r1 - r2) / 400));

    const K = 32;
    let s1 = 0.5;
    let s2 = 0.5;

    if (winnerId === p1Id) {
      s1 = 1;
      s2 = 0;
      p1.totalWins += 1;
      p1.coins += 25; // G'alaba uchun mukofot
    } else if (winnerId && p2 && winnerId === p2.id) {
      s1 = 0;
      s2 = 1;
      p2.totalWins += 1;
      p2.coins += 25;
    }

    p1.eloRating[gameId] = Math.max(100, Math.round(r1 + K * (s1 - e1)));
    if (!p1.highScores) p1.highScores = {};
    p1.highScores[gameId] = Math.max(p1.highScores[gameId] || 0, p1.eloRating[gameId]);

    if (p2) {
      p2.eloRating[gameId] = Math.max(100, Math.round(r2 + K * (s2 - e2)));
      if (!p2.highScores) p2.highScores = {};
      p2.highScores[gameId] = Math.max(p2.highScores[gameId] || 0, p2.eloRating[gameId]);
      this.updateLeaderboard(gameId, p2, p2.eloRating[gameId], true);
    }
    this.updateLeaderboard(gameId, p1, p1.eloRating[gameId], true);
  }

  public updateLeaderboard(gameId: GameId, user: UserProfile, score: number, isElo = false) {
    let board = this.gameLeaderboards.get(gameId);
    if (!board) {
      board = [];
      this.gameLeaderboards.set(gameId, board);
    }

    const existingIdx = board.findIndex((item) => item.userId === user.id);
    if (existingIdx >= 0) {
      if (isElo) {
        board[existingIdx].score = score;
        board[existingIdx].elo = score;
      } else if (score > board[existingIdx].score) {
        board[existingIdx].score = score;
      }
    } else {
      board.push({
        rank: 0,
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        photoUrl: user.photoUrl,
        score,
        elo: isElo ? score : user.eloRating[gameId],
      });
    }

    // Sort descending by highest score
    board.sort((a, b) => b.score - a.score);
    // Assign ranks
    board.forEach((item, idx) => {
      item.rank = idx + 1;
      if (idx === 0) item.badge = '👑 1-O‘rin';
      else if (idx === 1) item.badge = '🥈 2-O‘rin';
      else if (idx === 2) item.badge = '🥉 3-O‘rin';
      else item.badge = undefined;
    });

    // Keep top 100
    this.gameLeaderboards.set(gameId, board.slice(0, 100));
  }

  public getLeaderboard(gameId: GameId): LeaderboardItem[] {
    return this.gameLeaderboards.get(gameId) || [];
  }
}

export const store = new InMemoryStore();
