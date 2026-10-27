import React, { useState, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Flag } from 'lucide-react';
import { ChessPieceIcon } from './ChessPieces.js';
import { findBestChessMove } from './chessAI.js';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { socket } from '../../services/socket.js';

interface ChessGameProps {
  onBack: () => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({ onBack }) => {
  const { user, setMatchmaking, updateCoins } = useAppStore();

  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<'bot' | 'pvp' | 'pass_play'>('bot');
  const [botLevel, setBotLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameStarted, setGameStarted] = useState(false);

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

  // Timers
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

  // Bot move
  useEffect(() => {
    if (gameMode === 'bot' && gameStarted && !gameOverResult && chess.turn() === 'b') {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fen, gameMode, gameStarted, gameOverResult]);

  const makeBotMove = () => {
    // Competitive tactical AI engine (Minimax + Piece-Square Tables)
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
    if (gameMode === 'bot' && chess.turn() === 'b') return;

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
          checkGameState();
          return;
        }
      } catch {
        // illegal move
      }
    }

    if (piece && piece.color === chess.turn()) {
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
    if (winner === 'w' && user) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      tg.haptic('success');
      updateCoins(user.coins + 30);
    } else {
      tg.haptic(winner === 'draw' ? 'warning' : 'error');
    }
  };

  const restartGame = () => {
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

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

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
            {gameMode === 'bot' ? `Bot (${botLevel})` : '1v1'}
          </span>
        </div>
        <button
          onClick={restartGame}
          className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
          title="Qayta"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {!gameStarted ? (
        /* Minimal Lobby */
        <div className="flex-1 p-5 flex flex-col justify-center max-w-sm mx-auto w-full space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-base font-bold text-zinc-100">O‘yin Rejimi</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Shaxmat partiyasini boshlash</p>
          </div>

          <div className="space-y-2">
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

            <button
              onClick={() => {
                tg.haptic('medium');
                setMatchmaking(true, 'chess');
                if (user) {
                  socket.emit('join_queue', { userId: user.id, gameId: 'chess' });
                }
              }}
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-medium text-left flex items-center justify-between active:scale-[0.99] transition-all"
            >
              <div>
                <span className="block text-xs font-semibold text-zinc-200">1v1 Onlayn</span>
                <span className="text-[10px] text-zinc-500">Tasodifiy o‘yinchi qidirish</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                1200 ELO
              </span>
            </button>

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

          {/* Bot Level */}
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
        /* Active Board */
        <div className="flex-1 flex flex-col justify-between p-3.5 max-w-sm mx-auto w-full">
          {/* Top (Black) */}
          <div className="flex items-center justify-between py-2 px-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-bold font-mono">
                {gameMode === 'bot' ? '🤖' : '♟'}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {gameMode === 'bot' ? `AI Master (${botLevel.toUpperCase()})` : 'Qoralar (Black)'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {gameMode === 'bot' ? (botLevel === 'hard' ? '1850 ELO' : botLevel === 'medium' ? '1500 ELO' : '1250 ELO') : '1400 ELO'}
                </span>
              </div>
            </div>

            <div
              className={`font-mono text-sm px-2.5 py-1 rounded-lg border transition-all ${
                activeTimerSide === 'b'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/50 shadow-xs animate-pulse-subtle'
                  : 'bg-zinc-800/80 text-zinc-500 border-zinc-700'
              }`}
            >
              {formatTimer(blackTimer)}
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
                          className={`w-[84%] h-[84%] z-10 transition-transform duration-150 ease-out ${
                            isSelected ? '-translate-y-1 scale-110 drop-shadow-md' : 'translate-y-0 scale-100'
                          }`}
                        >
                          <ChessPieceIcon
                            piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()}
                          />
                        </div>
                      )}

                      {/* Move dot with spring scale */}
                      {isValidTarget && (
                        <div
                          className={`absolute z-20 rounded-full animate-pop ${
                            piece
                              ? 'w-full h-full border-2 border-zinc-100/50 bg-zinc-100/15'
                              : 'w-2.5 h-2.5 bg-zinc-100/50 shadow-xs'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom (White) */}
          <div className="flex items-center justify-between py-2 px-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs text-blue-300 font-bold font-mono">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'W'}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {user?.firstName || 'Siz'} (Oqlar)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {user?.eloRating?.chess || 1200} ELO
                </span>
              </div>
            </div>

            <div
              className={`font-mono text-sm px-2.5 py-1 rounded-lg border transition-all ${
                activeTimerSide === 'w'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/50 shadow-xs animate-pulse-subtle'
                  : 'bg-zinc-800/80 text-zinc-500 border-zinc-700'
              }`}
            >
              {formatTimer(whiteTimer)}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
            <button
              onClick={() => handleGameOver('b', 'Taslim bo‘ldingiz')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
            >
              <Flag size={12} />
              <span>Taslim</span>
            </button>

            <span className="text-[11px] font-mono text-zinc-500">
              Navbat: {chess.turn() === 'w' ? 'Oqlar' : 'Qoralar'}
            </span>

            <button
              onClick={restartGame}
              className="px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <RotateCcw size={12} />
              <span>Qayta</span>
            </button>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 text-center shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-zinc-100 mb-1">
              {gameOverResult.winner === 'w' ? 'G‘alaba' : gameOverResult.winner === 'draw' ? 'Durrang' : 'Mag‘lubiyat'}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">{gameOverResult.reason}</p>

            <div className="space-y-1.5">
              <button
                onClick={restartGame}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs active:scale-95 transition-all"
              >
                Qayta o‘ynash
              </button>
              <button
                onClick={() => {
                  setGameOverResult(null);
                  setGameStarted(false);
                }}
                className="w-full py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs active:scale-95 transition-all"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
