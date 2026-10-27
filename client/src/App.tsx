import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { DailyBonusModal } from './components/DailyBonusModal.js';
import { MatchmakingModal } from './components/MatchmakingModal.js';
import { PortalHome } from './pages/PortalHome.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { FriendsPage } from './pages/FriendsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { ALL_GAMES } from './constants.js';

// Games
import { ChessGame } from './games/chess/ChessGame.js';
import { Game2048 } from './games/game2048/Game2048.js';
import { MathBattleGame } from './games/mathBattle/MathBattleGame.js';
import { TicTacToeGame } from './games/tictactoe/TicTacToeGame.js';
import { TimberjackGame } from './games/timberjack/TimberjackGame.js';
import { KnifeHitGame } from './games/knifeHit/KnifeHitGame.js';
import { TowerBlocksGame } from './games/towerBlocks/TowerBlocksGame.js';
import { CheckersGame } from './games/checkers/CheckersGame.js';

import { useAppStore } from './store/useAppStore.js';
import { tg } from './services/telegram.js';
import { api } from './services/api.js';
import { socket } from './services/socket.js';

export const App: React.FC = () => {
  const {
    user,
    setUser,
    activeTab,
    selectedGame,
    setSelectedGame,
    toastMessage,
    hideToast,
    setMatchmaking,
    setActiveRoom,
  } = useAppStore();

  // Initialize Telegram & Authenticate
  useEffect(() => {
    tg.expand();

    const tgUser = tg.user;
    const mockUser = tgUser
      ? {
          id: tgUser.id,
          firstName: tgUser.first_name,
          username: tgUser.username,
          photoUrl: tgUser.photo_url,
        }
      : {
          id: 99887766,
          firstName: 'UzGamer ⚡',
          username: 'uz_champion',
          photoUrl: undefined,
        };

    api.authTelegram(tg.initData, mockUser)
      .then((res) => {
        setUser(res.user);

        // Check if user came from a deep link invite (e.g. startapp=challenge_<id> or join_chess)
        const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('startapp');
        if (startParam && startParam.startsWith('challenge_')) {
          const challengeId = startParam.replace('challenge_', '');
          socket.emit('accept_challenge', { challengeId, userId: res.user.id });
        } else if (startParam && startParam.startsWith('join_')) {
          const gameId = startParam.replace('join_', '');
          const target = ALL_GAMES.find((g) => g.id === gameId);
          if (target) {
            setSelectedGame(target);
            setMatchmaking(true, target.id as any);
            socket.emit('join_queue', { userId: res.user.id, gameId: target.id });
          }
        }
      })
      .catch((err) => {
        console.error('Auth error:', err);
      });
  }, [setUser, setSelectedGame, setMatchmaking]);

  const [incomingChallenge, setIncomingChallenge] = useState<{
    challengeId: string;
    gameId: string;
    hostName: string;
    hostUserId: string;
    timeMinutes?: number;
    hostColor?: 'w' | 'b';
  } | null>(null);

  // Socket event listeners
  useEffect(() => {
    socket.on('game_challenge_broadcast', (data: {
      challengeId: string;
      gameId: string;
      hostName: string;
      hostUserId: string;
      timeMinutes?: number;
      hostColor?: 'w' | 'b';
    }) => {
      if (user && data.hostUserId === user.id) return;
      tg.haptic('warning');
      setIncomingChallenge(data);

      // Auto dismiss after 15 seconds
      setTimeout(() => {
        setIncomingChallenge((curr) => (curr?.challengeId === data.challengeId ? null : curr));
      }, 15000);
    });

    socket.on('challenge_already_taken', () => {
      tg.haptic('warning');
      alert("⚠️ Bu o‘yinga allaqachon boshqa foydalanuvchi qo‘shildi. Siz yangi o‘yin taklifi yaratishingiz mumkin!");
      const target = ALL_GAMES.find((g) => g.id === 'chess') || ALL_GAMES[0];
      setSelectedGame(target);
    });

    socket.on('match_found', (data: any) => {
      tg.haptic('success');
      setMatchmaking(false);
      setActiveRoom(data.room);
      // Select the game
      const targetGame = ALL_GAMES.find((g) => g.id === data.room.gameId) || {
        id: data.room.gameId,
        title: data.room.gameId,
        titleUz: data.room.gameId,
        category: 'pvp' as const,
        descriptionUz: '',
        icon: 'Crown',
        isMultiplayer: true,
        minPlayers: 1,
        maxPlayers: 2,
        avgDuration: '5 daq',
        difficulty: 'O‘rtacha' as const,
        accentColor: '#3b82f6',
      };
      setSelectedGame(targetGame);
    });

    socket.on('error', (err: any) => {
      console.warn('Socket error:', err);
    });

    return () => {
      socket.off('game_challenge_broadcast');
      socket.off('challenge_already_taken');
      socket.off('match_found');
      socket.off('error');
    };
  }, [user, setMatchmaking, setActiveRoom, setSelectedGame]);

  // Floating Challenge Invite Banner
  const renderChallengeBanner = () => {
    if (!incomingChallenge) return null;
    return (
      <div className="fixed top-3 left-3 right-3 z-50 p-3 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-950 border border-blue-400/50 text-white shadow-2xl backdrop-blur-md flex items-center justify-between animate-bounce">
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="text-xl">♟️</span>
          <div className="min-w-0">
            <span className="text-xs font-bold block truncate">
              {incomingChallenge.hostName} sizni o‘yinga chaqirmoqda!
            </span>
            <span className="text-[10px] text-blue-300 font-mono">
              CHESS • {incomingChallenge.timeMinutes || 5} daq • 1v1 Onlayn
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              tg.haptic('medium');
              if (user && incomingChallenge) {
                socket.emit('accept_challenge', {
                  challengeId: incomingChallenge.challengeId,
                  userId: user.id,
                });
              }
              setIncomingChallenge(null);
            }}
            className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md active:scale-95"
          >
            Qo‘shilish
          </button>
          <button
            onClick={() => setIncomingChallenge(null)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Active game view
  if (selectedGame) {
    let gameEl: React.ReactNode = null;
    switch (selectedGame.id) {
      case 'chess':
        gameEl = <ChessGame onBack={() => setSelectedGame(null)} />;
        break;
      case '2048':
        gameEl = <Game2048 onBack={() => setSelectedGame(null)} />;
        break;
      case 'math-battle':
        gameEl = <MathBattleGame onBack={() => setSelectedGame(null)} />;
        break;
      case 'tictactoe':
        gameEl = <TicTacToeGame onBack={() => setSelectedGame(null)} />;
        break;
      case 'timberjack':
        gameEl = <TimberjackGame onBack={() => setSelectedGame(null)} />;
        break;
      case 'knife-hit':
        gameEl = <KnifeHitGame onBack={() => setSelectedGame(null)} />;
        break;
      case 'tower-blocks':
        gameEl = <TowerBlocksGame onBack={() => setSelectedGame(null)} />;
        break;
      case 'checkers':
        gameEl = <CheckersGame onBack={() => setSelectedGame(null)} />;
        break;
      default:
        gameEl = (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h2 className="text-lg font-bold mb-2">{selectedGame.titleUz}</h2>
            <p className="text-xs text-slate-400 mb-4">Tez kunda ishga tushadi!</p>
            <button
              onClick={() => setSelectedGame(null)}
              className="py-2.5 px-6 bg-blue-600 rounded-xl font-bold text-xs"
            >
              Orqaga qaytish
            </button>
          </div>
        );
    }
    return (
      <>
        {renderChallengeBanner()}
        {gameEl}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {renderChallengeBanner()}
      {/* Top Header */}
      <Header />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'games' && <PortalHome onSelectGame={(g) => setSelectedGame(g)} />}
        {activeTab === 'leaderboard' && <LeaderboardPage />}
        {activeTab === 'friends' && <FriendsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Modals */}
      <DailyBonusModal />
      <MatchmakingModal
        onStartBotMatch={() => {
          setSelectedGame({
            id: 'chess',
            title: 'Chess',
            titleUz: 'Shaxmat',
            category: 'pvp',
            descriptionUz: '',
            icon: 'Crown',
            isMultiplayer: true,
            minPlayers: 1,
            maxPlayers: 2,
            avgDuration: '5 daq',
            difficulty: 'Qiyin',
            accentColor: '#3b82f6',
          });
        }}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          onClick={hideToast}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 border border-slate-700/80 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in flex items-center space-x-2 cursor-pointer"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
