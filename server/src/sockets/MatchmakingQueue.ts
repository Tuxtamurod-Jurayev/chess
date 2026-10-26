import { Server, Socket } from 'socket.io';
import { GameId, UserProfile } from '../types.js';
import { RoomManager } from './RoomManager.js';

interface QueuedPlayer {
  user: UserProfile;
  socketId: string;
  gameId: GameId;
  timestamp: number;
}

export class MatchmakingQueue {
  private io: Server;
  private roomManager: RoomManager;
  private queues: Map<GameId, QueuedPlayer[]> = new Map();

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  public addPlayer(user: UserProfile, socket: Socket, gameId: GameId) {
    this.removePlayer(socket.id); // clean previous

    let queue = this.queues.get(gameId);
    if (!queue) {
      queue = [];
      this.queues.set(gameId, queue);
    }

    // Check if another player is in queue
    if (queue.length > 0) {
      const opponent = queue.shift()!;
      // Match found!
      const room = this.roomManager.createRoom(opponent.user, gameId, { gameMode: 'pvp', timerMinutes: 5 });
      this.roomManager.joinRoom(room.id, user, socket);

      // Join opponent socket as well
      const opponentSocket = this.io.sockets.sockets.get(opponent.socketId);
      if (opponentSocket) {
        opponentSocket.join(room.id);
        opponentSocket.emit('match_found', { room, isHost: true, opponent: user });
      }

      socket.emit('match_found', { room, isHost: false, opponent: opponent.user });
      console.log(`[Matchmaking] Matched ${user.username} with ${opponent.user.username} in room ${room.id}`);
    } else {
      // Add to queue
      queue.push({
        user,
        socketId: socket.id,
        gameId,
        timestamp: Date.now(),
      });
      socket.emit('queue_joined', { gameId, waitSeconds: 15 });
      console.log(`[Matchmaking] ${user.username} joined queue for ${gameId}`);
    }
  }

  public removePlayer(socketId: string) {
    for (const [gameId, queue] of this.queues.entries()) {
      const idx = queue.findIndex((p) => p.socketId === socketId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        console.log(`[Matchmaking] Player left queue: ${socketId}`);
      }
    }
  }
}
