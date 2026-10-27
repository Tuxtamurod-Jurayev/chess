export type GameId = 
  | 'chess'
  | 'checkers'
  | 'math-battle'
  | 'timberjack'
  | '2048'
  | 'tictactoe'
  | 'knife-hit'
  | 'tower-blocks';

export interface UserProfile {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  photoUrl?: string;
  coins: number;
  dailyStreak: number;
  lastDailyClaim?: string;
  eloRating: Record<GameId, number>;
  highScores?: Partial<Record<GameId, number>>;
  totalMatches: number;
  totalWins: number;
}

export interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  firstName: string;
  photoUrl?: string;
  score: number;
  elo?: number;
  badge?: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface GameRoom {
  id: string;
  gameId: GameId;
  status: RoomStatus;
  host: UserProfile;
  guest?: UserProfile;
  currentTurn?: string; // userId or 'white'/'black'
  gameState: any;
  timerWhite: number; // seconds
  timerBlack: number; // seconds
  lastMoveTimestamp?: number;
  winnerId?: string | null;
  draw?: boolean;
  gameMode?: 'pvp' | 'bot';
  botDifficulty?: 'easy' | 'medium' | 'hard';
  createdAt: number;
}
