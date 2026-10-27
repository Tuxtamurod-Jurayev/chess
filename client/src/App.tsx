import React, { useEffect } from 'react';
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { DailyBonusModal } from './components/DailyBonusModal.js';
import { MatchmakingModal } from './components/MatchmakingModal.js';
import { PortalHome } from './pages/PortalHome.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { FriendsPage } from './pages/FriendsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

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
      })
      .catch((err) => {
        console.error('Auth error:', err);
      });
  }, [setUser]);

  // Socket event listeners
  useEffect(() => {
    socket.on('match_found', (data: any) => {
      tg.haptic('success');
      setMatchmaking(false);
      setActiveRoom(data.room);
      // Select the game
      const targetGame = {
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
      socket.off('match_found');
      socket.off('error');
    };
  }, [setMatchmaking, setActiveRoom, setSelectedGame]);

  // Active game view
  if (selectedGame) {
    switch (selectedGame.id) {
      case 'chess':
        return <ChessGame onBack={() => setSelectedGame(null)} />;
      case '2048':
        return <Game2048 onBack={() => setSelectedGame(null)} />;
      case 'math-battle':
        return <MathBattleGame onBack={() => setSelectedGame(null)} />;
      case 'tictactoe':
        return <TicTacToeGame onBack={() => setSelectedGame(null)} />;
      case 'timberjack':
        return <TimberjackGame onBack={() => setSelectedGame(null)} />;
      case 'knife-hit':
        return <KnifeHitGame onBack={() => setSelectedGame(null)} />;
      case 'tower-blocks':
        return <TowerBlocksGame onBack={() => setSelectedGame(null)} />;
      case 'checkers':
        return <CheckersGame onBack={() => setSelectedGame(null)} />;
      default:
        return (
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
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
