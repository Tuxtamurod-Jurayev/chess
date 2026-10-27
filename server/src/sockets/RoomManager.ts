import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';
import { GameId, GameRoom, UserProfile } from '../types.js';
import { store } from '../services/store.js';

export class RoomManager {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private chessEngines: Map<string, Chess> = new Map(); // RoomId -> Chess instance
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(
    host: UserProfile,
    gameId: GameId,
    options: {
      gameMode?: 'pvp' | 'bot';
      botDifficulty?: 'easy' | 'medium' | 'hard';
      timerMinutes?: number;
    } = {}
  ): GameRoom {
    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    const timerSeconds = (options.timerMinutes || 5) * 60;

    const room: GameRoom = {
      id: roomId,
      gameId,
      status: options.gameMode === 'bot' ? 'playing' : 'waiting',
      host,
      guest: options.gameMode === 'bot' ? this.createBotProfile(options.botDifficulty || 'medium') : undefined,
      currentTurn: host.id, // White starts
      gameState: this.getInitialGameState(gameId),
      timerWhite: timerSeconds,
      timerBlack: timerSeconds,
      lastMoveTimestamp: Date.now(),
      gameMode: options.gameMode || 'pvp',
      botDifficulty: options.botDifficulty || 'medium',
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);

    if (gameId === 'chess') {
      const chess = new Chess();
      this.chessEngines.set(roomId, chess);
      room.gameState = {
        fen: chess.fen(),
        history: [],
        turn: chess.turn(), // 'w' or 'b'
        isCheck: chess.inCheck(),
        isGameOver: false,
      };
    }

    if (room.status === 'playing') {
      this.startTurnTimer(roomId);
    }

    return room;
  }

  public joinRoom(roomId: string, guest: UserProfile, socket: Socket): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.guest && room.guest.id !== guest.id) return null; // Room full

    if (!room.guest) {
      room.guest = guest;
      room.status = 'playing';
      room.lastMoveTimestamp = Date.now();
      this.startTurnTimer(roomId);
    }

    socket.join(roomId);
    this.io.to(roomId).emit('room_updated', room);
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public handleMove(roomId: string, userId: string, payload: any): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return false;

    // Check turn
    const isHost = room.host.id === userId;
    const isGuest = room.guest?.id === userId;
    if (!isHost && !isGuest) return false;

    if (room.gameId === 'chess') {
      return this.handleChessMove(room, userId, payload, isHost);
    } else if (room.gameId === 'tictactoe') {
      return this.handleTicTacToeMove(room, userId, payload, isHost);
    }

    // Generic game action fallback
    room.gameState = { ...room.gameState, ...payload };
    this.io.to(roomId).emit('game_updated', {
      gameState: room.gameState,
      currentTurn: room.currentTurn,
    });
    return true;
  }

  private handleChessMove(room: GameRoom, userId: string, move: { from: string; to: string; promotion?: string }, isHost: boolean): boolean {
    const chess = this.chessEngines.get(room.id);
    if (!chess) return false;

    const currentTurnColor = chess.turn(); // 'w' | 'b'
    const expectedColor = isHost ? 'w' : 'b';

    if (currentTurnColor !== expectedColor) {
      return false; // Not this player's turn
    }

    try {
      const result = chess.move(move);
      if (!result) return false;

      // Update room state
      room.gameState = {
        fen: chess.fen(),
        history: chess.history({ verbose: true }),
        turn: chess.turn(),
        isCheck: chess.inCheck(),
        isGameOver: chess.isGameOver(),
        lastMove: { from: result.from, to: result.to, san: result.san },
      };

      room.currentTurn = chess.turn() === 'w' ? room.host.id : (room.guest?.id || 'bot');
      room.lastMoveTimestamp = Date.now();

      // Check game over
      if (chess.isGameOver()) {
        this.endGame(room, chess.isCheckmate() ? userId : null, chess.isDraw() ? 'draw' : 'checkmate');
      } else {
        this.io.to(room.id).emit('game_updated', {
          gameState: room.gameState,
          currentTurn: room.currentTurn,
          timerWhite: room.timerWhite,
          timerBlack: room.timerBlack,
        });

        // If playing against Bot and now it's Bot's turn
        if (room.gameMode === 'bot' && chess.turn() === 'b') {
          setTimeout(() => {
            this.makeBotChessMove(room, chess);
          }, 600);
        }
      }

      return true;
    } catch (err) {
      console.warn('Invalid chess move attempted:', err);
      return false;
    }
  }

  private makeBotChessMove(room: GameRoom, chess: Chess) {
    if (room.status !== 'playing' || chess.isGameOver()) return;

    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) return;

    const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

    // Smart Tactical Bot: evaluates checks, captures, and defended pieces
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      let score = 0;

      // Prioritize delivering checkmate or check
      if (move.san.includes('#')) score += 100000;
      else if (move.san.includes('+')) score += 50;

      // Prioritize high-value captures
      if (move.captured) {
        score += (pieceValues[move.captured] || 50) * 10;
      }

      // Prioritize pawn promotion
      if (move.promotion) {
        score += 800;
      }

      // Center control (d4, e4, d5, e5)
      if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) {
        score += 25;
      }

      // Look ahead 1 step: check if opponent can capture back with lower piece
      chess.move(move);
      if (chess.isCheckmate()) {
        score += 50000;
      }
      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    const selectedMove = bestMove;

    const result = chess.move({
      from: selectedMove.from,
      to: selectedMove.to,
      promotion: selectedMove.promotion || 'q',
    });

    room.gameState = {
      fen: chess.fen(),
      history: chess.history({ verbose: true }),
      turn: chess.turn(),
      isCheck: chess.inCheck(),
      isGameOver: chess.isGameOver(),
      lastMove: { from: result.from, to: result.to, san: result.san },
    };

    room.currentTurn = room.host.id;
    room.lastMoveTimestamp = Date.now();

    if (chess.isGameOver()) {
      this.endGame(room, chess.isCheckmate() ? (room.guest?.id || 'bot') : null, chess.isDraw() ? 'draw' : 'checkmate');
    } else {
      this.io.to(room.id).emit('game_updated', {
        gameState: room.gameState,
        currentTurn: room.currentTurn,
        timerWhite: room.timerWhite,
        timerBlack: room.timerBlack,
      });
    }
  }

  private handleTicTacToeMove(room: GameRoom, userId: string, payload: { index: number }, isHost: boolean): boolean {
    const board = room.gameState.board as (string | null)[];
    const index = payload.index;
    if (board[index] !== null) return false;

    const symbol = isHost ? 'X' : 'O';
    board[index] = symbol;

    const winner = this.checkTicTacToeWinner(board);
    const isFull = board.every((c) => c !== null);

    if (winner) {
      room.gameState.board = board;
      this.endGame(room, isHost ? room.host.id : room.guest?.id || null, 'win');
    } else if (isFull) {
      room.gameState.board = board;
      this.endGame(room, null, 'draw');
    } else {
      room.currentTurn = isHost ? (room.guest?.id || 'bot') : room.host.id;
      room.gameState.board = board;
      this.io.to(room.id).emit('game_updated', {
        gameState: room.gameState,
        currentTurn: room.currentTurn,
      });

      // Bot move if solo
      if (room.gameMode === 'bot' && !isHost) {
        setTimeout(() => {
          const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter((v): v is number => v !== null);
          if (emptyIndices.length > 0) {
            const botChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            this.handleTicTacToeMove(room, 'bot', { index: botChoice }, false);
          }
        }, 500);
      }
    }

    return true;
  }

  private checkTicTacToeWinner(board: (string | null)[]): string | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],           // diags
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  private startTurnTimer(roomId: string) {
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!);
    }

    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (room.currentTurn === room.host.id) {
        room.timerWhite = Math.max(0, room.timerWhite - 1);
        if (room.timerWhite === 0) {
          this.endGame(room, room.guest?.id || null, 'timeout');
          clearInterval(interval);
        }
      } else {
        room.timerBlack = Math.max(0, room.timerBlack - 1);
        if (room.timerBlack === 0) {
          this.endGame(room, room.host.id, 'timeout');
          clearInterval(interval);
        }
      }
    }, 1000);

    this.timers.set(roomId, interval);
  }

  private endGame(room: GameRoom, winnerId: string | null, reason: string) {
    room.status = 'ended';
    room.winnerId = winnerId;
    room.draw = winnerId === null;

    if (this.timers.has(room.id)) {
      clearInterval(this.timers.get(room.id)!);
      this.timers.delete(room.id);
    }

    store.updateMatchResult(
      room.gameId,
      room.host.id,
      room.guest ? room.guest.id : null,
      winnerId
    );

    this.io.to(room.id).emit('game_over', {
      winnerId,
      reason,
      hostStats: store.getUser(room.host.id),
      guestStats: room.guest ? store.getUser(room.guest.id) : null,
    });
  }

  private getInitialGameState(gameId: GameId): any {
    switch (gameId) {
      case 'chess':
        return { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', history: [], turn: 'w' };
      case 'tictactoe':
        return { board: Array(9).fill(null), size: 3 };
      case 'checkers':
        return { board: [], turn: 'w' };
      case 'math-battle':
        return { scoreWhite: 0, scoreBlack: 0, currentEquation: '5 + 7 = ?' };
      default:
        return {};
    }
  }

  private createBotProfile(diff: string): UserProfile {
    return {
      id: 'bot_player',
      telegramId: 0,
      username: `Bot (${diff.toUpperCase()})`,
      firstName: 'AI Bot 🤖',
      coins: 9999,
      dailyStreak: 10,
      eloRating: {
        'chess': diff === 'easy' ? 900 : (diff === 'medium' ? 1400 : 1800),
        'checkers': 1300,
        'math-battle': 1300,
        'timberjack': 1000,
        '2048': 1000,
        'tictactoe': 1300,
        'knife-hit': 1000,
        'tower-blocks': 1000,
      },
      totalMatches: 500,
      totalWins: 250,
    };
  }
}
