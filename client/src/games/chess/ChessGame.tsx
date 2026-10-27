import React, { useState, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { ChessPieceIcon } from './ChessPieces.js';
import { findBestChessMove } from './chessAI.js';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { socket } from '../../services/socket.js';
import type { GameRoom } from '../../types.js';

interface ChessGameProps {
  onBack: () => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({ onBack }) => {
  const { user, updateCoins } = useAppStore();

  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<'bot' | 'pvp' | 'pass_play'>('bot');
  const [botLevel, setBotLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameStarted, setGameStarted] = useState(false);

  // 1v1 PvP state
  const [pvpRoom, setPvpRoom] = useState<GameRoom | null>(null);
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');

  // Timers (in seconds)
  const [whiteTimer, setWhiteTimer] = useState(300);
  const [blackTimer, setBlackTimer] = useState(300);
  const [activeTimerSide, setActiveTimerSide] = useState<'w' | 'b'>('w');

  // Game over state
  const [gameOverResult, setGameOverResult] = useState<{
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
  } | null>(null);

  useEffect(() => {
    tg.setBackButton(() => onBack());
    return () => tg.setBackButton(undefined);
  }, [onBack]);

  // Socket listeners for 1v1 PvP
  useEffect(() => {
    const handleMatchFound = (data: { room: GameRoom; hostColor: 'w' | 'b' }) => {
      tg.haptic('success');
      confetti({ particleCount: 40, spread: 60 });
      setPvpRoom(data.room);
      setGameMode('pvp');

      const isHost = user && data.room.host.id === user.id;
      const assignedColor: 'w' | 'b' = isHost ? (data.hostColor || 'w') : ((data.hostColor || 'w') === 'w' ? 'b' : 'w');
      setMyColor(assignedColor);

      chess.reset();
      setFen(chess.fen());
      setSelectedSquare(null);
      setValidMoves([]);

      setWhiteTimer(data.room.timerWhite || 300);
      setBlackTimer(data.room.timerBlack || 300);
      setActiveTimerSide('w');
      setGameOverResult(null);
      setGameStarted(true);
    };

    const handleGameUpdated = (data: {
      gameState: any;
      currentTurn: string;
      timerWhite: number;
      timerBlack: number;
    }) => {
      try {
        if (data.gameState?.fen) {
          chess.load(data.gameState.fen);
          setFen(chess.fen());
          tg.haptic('light');
        }
        if (typeof data.timerWhite === 'number') setWhiteTimer(data.timerWhite);
        if (typeof data.timerBlack === 'number') setBlackTimer(data.timerBlack);
        if (data.gameState?.turn) setActiveTimerSide(data.gameState.turn);

        if (chess.isGameOver()) {
          checkGameState();
        }
      } catch (err) {
        console.warn('Error loading updated chess state:', err);
      }
    };

    socket.on('match_found', handleMatchFound);
    socket.on('game_updated', handleGameUpdated);

    return () => {
      socket.off('match_found', handleMatchFound);
      socket.off('game_updated', handleGameUpdated);
    };
  }, [user, chess]);

  // Timers countdown
  useEffect(() => {
    if (!gameStarted || gameOverResult) return;

    const interval = setInterval(() => {
      if (activeTimerSide === 'w') {
        setWhiteTimer((t) => {
          if (t <= 1) {
            handleGameOver('b', 'Vaqt tugadi');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTimer((t) => {
          if (t <= 1) {
            handleGameOver('w', 'Vaqt tugadi');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, activeTimerSide, gameOverResult]);

  // Bot move (when in Bot mode)
  useEffect(() => {
    if (gameMode === 'bot' && gameStarted && !gameOverResult && chess.turn() === 'b') {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fen, gameMode, gameStarted, gameOverResult]);

  const makeBotMove = () => {
    const bestMove = findBestChessMove(chess, botLevel);
    if (!bestMove) return;

    chess.move({
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q',
    });

    tg.haptic(bestMove.captured ? 'heavy' : 'light');
    setFen(chess.fen());
    setActiveTimerSide('w');
    checkGameState();
  };

  const handleSquareClick = (square: Square) => {
    if (!gameStarted || gameOverResult) return;

    // In Bot mode: player can only move when it's white's turn ('w')
    if (gameMode === 'bot' && chess.turn() === 'b') return;

    // In 1v1 PvP mode: player can only move when it is their turn!
    if (gameMode === 'pvp') {
      if (chess.turn() !== myColor) {
        return; // Not my turn
      }
    }

    const piece = chess.get(square);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          tg.haptic('light');
          setFen(chess.fen());
          setSelectedSquare(null);
          setValidMoves([]);
          setActiveTimerSide(chess.turn());

          // Send move to server if in PvP mode
          if (gameMode === 'pvp' && pvpRoom && user) {
            socket.emit('game_move', {
              roomId: pvpRoom.id,
              userId: user.id,
              payload: {
                from: move.from,
                to: move.to,
                promotion: move.promotion || 'q',
              },
            });
          }

          checkGameState();
          return;
        }
      } catch {
        // Illegal move attempt
      }
    }

    // Select piece
    if (piece && piece.color === chess.turn()) {
      if (gameMode === 'pvp' && piece.color !== myColor) {
        return; // Cannot select opponent's pieces
      }
      tg.haptic('select');
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const checkGameState = () => {
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'b' : 'w';
        handleGameOver(winner, 'Mot (Checkmate)');
      } else if (chess.isDraw()) {
        handleGameOver('draw', 'Durrang');
      }
    }
  };

  const handleGameOver = (winner: 'w' | 'b' | 'draw', reason: string) => {
    setGameOverResult({ winner, reason });
    const isWin = (winner === 'w' && myColor === 'w') || (winner === 'b' && myColor === 'b');
    if (isWin && user) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      tg.haptic('success');
      updateCoins(user.coins + 35);
    } else {
      tg.haptic(winner === 'draw' ? 'warning' : 'error');
    }
  };

  const restartGame = () => {
    if (gameMode === 'pvp') {
      // In PvP, exit to lobby
      setGameStarted(false);
      setPvpRoom(null);
      return;
    }
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setWhiteTimer(300);
    setBlackTimer(300);
    setActiveTimerSide('w');
    setGameOverResult(null);
    setGameStarted(true);
    tg.haptic('medium');
  };



  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Flip board if player is playing Black ('b')
  const isFlipped = gameMode === 'pvp' && myColor === 'b';
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Identify Opponent Profile
  const opponentProfile =
    gameMode === 'pvp' && pvpRoom
      ? user && pvpRoom.host.id === user.id
        ? pvpRoom.guest
        : pvpRoom.host
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      {/* Top Navbar */}
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Shaxmat</h2>
          <span className="text-[10px] text-zinc-500 font-mono">
            {gameMode === 'bot' ? `AI (${botLevel})` : gameMode === 'pvp' ? `1v1 Onlayn (${myColor === 'w' ? 'Oqlar' : 'Qoralar'})` : '2P Lokal'}
          </span>
        </div>
        <button
          onClick={restartGame}
          className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
          title="Qayta / Chiqish"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {!gameStarted ? (
        /* Mode Selection Lobby */
        <div className="flex-1 p-5 flex flex-col justify-center max-w-sm mx-auto w-full space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-base font-bold text-zinc-100">O‘yin Rejimi</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Shaxmat partiyasini boshlash</p>
          </div>

          <div className="space-y-2">
            {/* Botga qarshi */}
            <button
              onClick={() => {
                setGameMode('bot');
                setGameStarted(true);
                tg.haptic('medium');
              }}
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-medium text-left flex items-center justify-between active:scale-[0.99] transition-all"
            >
              <div>
                <span className="block text-xs font-semibold text-zinc-200">Botga qarshi</span>
                <span className="text-[10px] text-zinc-500">Mashq qilish rejimi</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                {botLevel.toUpperCase()}
              </span>
            </button>

            {/* Lokal 2P */}
            <button
              onClick={() => {
                setGameMode('pass_play');
                setGameStarted(true);
                tg.haptic('medium');
              }}
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-medium text-left flex items-center justify-between active:scale-[0.99] transition-all"
            >
              <div>
                <span className="block text-xs font-semibold text-zinc-200">Lokal (1 ekran)</span>
                <span className="text-[10px] text-zinc-500">Bitta telefonda ikki kishi</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                2P
              </span>
            </button>
          </div>

          {/* Bot Level Selector */}
          <div className="pt-2">
            <span className="text-[10px] font-medium text-zinc-500 block mb-1.5 uppercase tracking-wider">
              Bot darajasi:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setBotLevel(lvl)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    botLevel === lvl
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-900 border border-zinc-800/80 text-zinc-400'
                  }`}
                >
                  {lvl === 'easy' ? 'Oson' : lvl === 'medium' ? 'O‘rta' : 'Qiyin'}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Board View */
        <div className="flex-1 flex flex-col justify-between p-3.5 max-w-sm mx-auto w-full">
          {/* Top Opponent Card */}
          <div className="flex items-center justify-between py-2 px-3 bg-zinc-900/70 border border-zinc-800 rounded-xl shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-bold font-mono overflow-hidden">
                {gameMode === 'bot' ? (
                  '🤖'
                ) : opponentProfile?.photoUrl ? (
                  <img src={opponentProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (isFlipped ? '⚪' : '⚫')
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {gameMode === 'bot'
                    ? `AI Master (${botLevel.toUpperCase()})`
                    : opponentProfile?.firstName || 'Raqib kutilmoqda'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {gameMode === 'bot'
                    ? botLevel === 'hard'
                      ? '1850 ELO'
                      : botLevel === 'medium'
                      ? '1500 ELO'
                      : '1250 ELO'
                    : `@${opponentProfile?.username || 'player'}`}
                </span>
              </div>
            </div>

            <div
              className={`font-mono text-sm px-2.5 py-1 rounded-lg border transition-all ${
                (isFlipped ? activeTimerSide === 'w' : activeTimerSide === 'b')
                  ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/50 shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-500 border-zinc-700'
              }`}
            >
              {formatTimer(isFlipped ? whiteTimer : blackTimer)}
            </div>
          </div>

          {/* 8x8 Tournament Blue/White Chessboard (matching 2-rasm) */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border-4 border-[#354562] shadow-2xl my-2 bg-[#354562]">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {ranks.map((rank, rIdx) =>
                files.map((file, fIdx) => {
                  const square = `${file}${rank}` as Square;
                  const isDark = (rIdx + fIdx) % 2 === 1;
                  const piece = chess.get(square);
                  const isSelected = selectedSquare === square;
                  const isValidTarget = validMoves.includes(square);
                  const isCheck = chess.inCheck() && piece?.type === 'k' && piece?.color === chess.turn();
                  const lastMove = chess.history({ verbose: true }).slice(-1)[0];
                  const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);

                  return (
                    <div
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 select-none ${
                        isDark ? 'bg-[#7795C2]' : 'bg-[#FFFFFF]'
                      } ${isLastMove ? '!bg-[#96B8E8]' : ''} ${isSelected ? '!bg-[#B2CEF7]' : ''} ${
                        isCheck ? '!bg-rose-500/80 animate-pulse' : ''
                      }`}
                    >
                      {/* Subdued Rank/File labels matching 2-rasm */}
                      {fIdx === 0 && (
                        <span
                          className={`absolute top-0.5 left-1 text-[8px] font-mono font-bold select-none pointer-events-none ${
                            isDark ? 'text-white/60' : 'text-[#354562]/70'
                          }`}
                        >
                          {rank}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span
                          className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold select-none pointer-events-none ${
                            isDark ? 'text-white/60' : 'text-[#354562]/70'
                          }`}
                        >
                          {file}
                        </span>
                      )}

                      {/* Piece with smooth lift/drop */}
                      {piece && (
                        <div
                          className={`w-[84%] h-[84%] flex items-center justify-center transition-transform duration-100 ${
                            isSelected ? '-translate-y-1 scale-105' : ''
                          }`}
                        >
                          <ChessPieceIcon piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()} />
                        </div>
                      )}

                      {/* Valid move indicator */}
                      {isValidTarget && (
                        <div
                          className={`absolute rounded-full pointer-events-none ${
                            piece
                              ? 'w-full h-full border-4 border-amber-400/80'
                              : 'w-3 h-3 bg-zinc-900/40 shadow-xs ring-2 ring-white/50'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Player Card (User) */}
          <div className="flex items-center justify-between py-2 px-3 bg-zinc-900/70 border border-zinc-800 rounded-xl shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-bold font-mono overflow-hidden">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (isFlipped ? '⚫' : '⚪')
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {user?.firstName || 'Siz'} ({isFlipped ? 'Qoralar' : 'Oqlar'})
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {gameMode === 'pvp' ? `@${user?.username || 'player'}` : 'Sizning navbatingiz'}
                </span>
              </div>
            </div>

            <div
              className={`font-mono text-sm px-2.5 py-1 rounded-lg border transition-all ${
                (isFlipped ? activeTimerSide === 'b' : activeTimerSide === 'w')
                  ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/50 shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-500 border-zinc-700'
              }`}
            >
              {formatTimer(isFlipped ? blackTimer : whiteTimer)}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 text-center animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4">
            <div className="text-3xl">
              {gameOverResult.winner === 'draw'
                ? '🤝'
                : (gameOverResult.winner === 'w' && myColor === 'w') || (gameOverResult.winner === 'b' && myColor === 'b')
                ? '🏆'
                : '💀'}
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                {gameOverResult.winner === 'draw'
                  ? 'Durrang!'
                  : (gameOverResult.winner === 'w' && myColor === 'w') || (gameOverResult.winner === 'b' && myColor === 'b')
                  ? 'G‘alaba qozondingiz!'
                  : 'Mag‘lubiyat'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">{gameOverResult.reason}</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setGameOverResult(null);
                  setGameStarted(false);
                  setPvpRoom(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95"
              >
                Menyuga qaytish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
