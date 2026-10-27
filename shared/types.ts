export type GameId = 
  | 'chess'
  | 'checkers'
  | 'math-battle'
  | 'timberjack'
  | '2048'
  | 'tictactoe'
  | 'snake'
  | 'knife-hit'
  | 'tower-blocks';

export type GameCategory = 'all' | 'pvp' | 'puzzle' | 'arcade';

export interface GameMetadata {
  id: GameId;
  title: string;
  titleUz: string;
  category: GameCategory;
  descriptionUz: string;
  icon: string;
  badge?: string;
  isMultiplayer: boolean;
  minPlayers: number;
  maxPlayers: number;
  avgDuration: string;
  difficulty: 'Oson' | 'O‘rtacha' | 'Qiyin';
  accentColor: string;
}

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
  currentTurn?: string; // userId
  gameState: any;
  timerWhite?: number; // seconds
  timerBlack?: number; // seconds
  lastMoveTimestamp?: number;
  winnerId?: string | null;
  draw?: boolean;
  createdAt: number;
}

export interface ChatReaction {
  userId: string;
  emoji: string;
  timestamp: number;
}
