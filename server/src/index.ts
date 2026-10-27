import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { store } from './services/store.js';
import { parseAndValidateTelegramData } from './utils/telegramAuth.js';
import { RoomManager } from './sockets/RoomManager.js';
import { MatchmakingQueue } from './sockets/MatchmakingQueue.js';
import { TelegramBotService } from './services/telegramBot.js';
import { GameId } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Tunnel bypass header
app.use((req, res, next) => {
  res.setHeader('bypass-tunnel-reminder', 'true');
  next();
});

// Telegram Bot instance
const webappUrl = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '';
const telegramBot = new TelegramBotService({
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  webappUrl,
});

const roomManager = new RoomManager(io);
const matchmakingQueue = new MatchmakingQueue(io, roomManager, (user, gameId) => {
  telegramBot.broadcastGameInvite(user.firstName, gameId, user.telegramId);
});

// REST Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/auth/telegram', (req, res) => {
  const { initData, mockUser } = req.body;

  let tgData = parseAndValidateTelegramData(initData, process.env.TELEGRAM_BOT_TOKEN);
  if (!tgData && mockUser) {
    // Local dev fallback
    tgData = {
      id: mockUser.id || 12345678,
      first_name: mockUser.firstName || 'Geymer',
      username: mockUser.username || 'pro_player',
      photo_url: mockUser.photoUrl,
    };
  }

  if (!tgData) {
    return res.status(400).json({ error: 'Avtorizatsiya ma’lumotlari topilmadi' });
  }

  const user = store.getOrCreateUser(tgData);
  if (tgData.id) {
    telegramBot.registerChatId(tgData.id);
  }
  res.json({ user });
});

app.get('/api/leaderboard/:gameId', (req, res) => {
  const gameId = req.params.gameId as GameId;
  const board = store.getLeaderboard(gameId);
  res.json({ gameId, leaderboard: board });
});

app.post('/api/user/claim-daily', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId talab qilinadi' });

  const result = store.claimDailyBonus(userId);
  const user = store.getUser(userId);
  res.json({ ...result, user });
});

app.post('/api/solo/finish', (req, res) => {
  const { userId, gameId, score } = req.body;
  if (!userId || !gameId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Noto‘g‘ri parametrlar' });
  }

  const user = store.getUser(userId);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  // Update leaderboard & coins
  store.updateMatchResult(gameId as GameId, userId, null, userId, score);
  // Add reward coins based on score
  const earnedCoins = Math.min(50, Math.floor(score / 50)) + 5;
  user.coins += earnedCoins;

  res.json({ success: true, earnedCoins, user });
});

// Socket.io Real-time Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_queue', (data: { userId: string; gameId: GameId }) => {
    const user = store.getUser(data.userId);
    if (!user) return socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
    matchmakingQueue.addPlayer(user, socket, data.gameId);
  });

  socket.on('leave_queue', () => {
    matchmakingQueue.removePlayer(socket.id);
  });

  socket.on('create_room', (data: { userId: string; gameId: GameId; options?: any }) => {
    const user = store.getUser(data.userId);
    if (!user) return socket.emit('error', { message: 'Foydalanuvchi topilmadi' });

    const room = roomManager.createRoom(user, data.gameId, data.options || {});
    socket.join(room.id);
    socket.emit('room_created', { room });
    console.log(`[Socket] Room created: ${room.id} by ${user.username}`);
  });

  socket.on('join_room', (data: { userId: string; roomId: string }) => {
    const user = store.getUser(data.userId);
    if (!user) return socket.emit('error', { message: 'Foydalanuvchi topilmadi' });

    const room = roomManager.joinRoom(data.roomId, user, socket);
    if (!room) {
      return socket.emit('error', { message: 'Xona topilmadi yoki to‘lgan' });
    }
  });

  socket.on('game_move', (data: { roomId: string; userId: string; payload: any }) => {
    roomManager.handleMove(data.roomId, data.userId, data.payload);
  });

  socket.on('send_reaction', (data: { roomId: string; emoji: string }) => {
    socket.to(data.roomId).emit('opponent_reaction', { emoji: data.emoji });
  });

  socket.on('disconnect', () => {
    matchmakingQueue.removePlayer(socket.id);
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Serve static frontend files if built
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 Telegram Gaming Portal Backend running on http://localhost:${PORT}`);
  // Start Telegram Bot
  await telegramBot.start();
});
