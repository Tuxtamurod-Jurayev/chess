import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Bot, Flag, Volume2, VolumeX, ShieldAlert, Trophy } from 'lucide-react';
import { ChessPieceIcon } from './ChessPieces.js';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { socket } from '../../services/socket.js';

interface ChessGameProps {
  onBack: () => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({ onBack }) => {
  const { user, activeRoom, setMatchmaking, updateCoins } = useAppStore();

  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<'bot' | 'pvp' | 'pass_play'>('bot');
  const [botLevel, setBotLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameStarted, setGameStarted] = useState(false);

  // Timers (in seconds)
  const [whiteTimer, setWhiteTimer] = useState(300); // 5 mins
  const [blackTimer, setBlackTimer] = useState(300);
  const [activeTimerSide, setActiveTimerSide] = useState<'w' | 'b'>('w');

  // Game over state
  const [gameOverResult, setGameOverResult] = useState<{
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
  } | null>(null);

  // Setup Telegram Back Button
  useEffect(() => {
    tg.setBackButton(() => {
      onBack();
    });
    return () => {
      tg.setBackButton(undefined);
    };
  }, [onBack]);

  // Timer interval
  useEffect(() => {
    if (!gameStarted || gameOverResult) return;

    const interval = setInterval(() => {
      if (activeTimerSide === 'w') {
        setWhiteTimer((t) => {
          if (t <= 1) {
            handleGameOver('b', 'Vaqt tugadi (Oqlar yutqazdi)');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTimer((t) => {
          if (t <= 1) {
            handleGameOver('w', 'Vaqt tugadi (Qoralar yutqazdi)');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, activeTimerSide, gameOverResult]);

  // Bot move trigger
  useEffect(() => {
    if (gameMode === 'bot' && gameStarted && !gameOverResult && chess.turn() === 'b') {
      const delay = Math.floor(Math.random() * 400) + 500;
      const timeout = setTimeout(() => {
        makeBotMove();
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [fen, gameMode, gameStarted, gameOverResult]);

  const makeBotMove = () => {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return;

    let chosenMove = moves[0];
    if (botLevel === 'easy') {
      chosenMove = moves[Math.floor(Math.random() * moves.length)];
    } else {
      // Medium / Hard: prefer captures or checks
      const captures = moves.filter((m) => m.captured);
      const checks = moves.filter((m) => m.san.includes('+'));

      if (captures.length > 0 && Math.random() > 0.3) {
        chosenMove = captures[Math.floor(Math.random() * captures.length)];
      } else if (checks.length > 0 && Math.random() > 0.4) {
        chosenMove = checks[Math.floor(Math.random() * checks.length)];
      } else {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      }
    }

    chess.move({
      from: chosenMove.from,
      to: chosenMove.to,
      promotion: chosenMove.promotion || 'q',
    });

    tg.haptic('light');
    setFen(chess.fen());
    setActiveTimerSide('w');
    checkGameState();
  };

  const handleSquareClick = (square: Square) => {
    if (!gameStarted || gameOverResult) return;

    // Disallow moving black if playing against bot
    if (gameMode === 'bot' && chess.turn() === 'b') return;

    const piece = chess.get(square);

    // If square is already selected, unselect or move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Try making the move
      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          tg.haptic(move.captured ? 'heavy' : 'medium');
          setFen(chess.fen());
          setSelectedSquare(null);
          setValidMoves([]);
          setActiveTimerSide(chess.turn());
          checkGameState();
          return;
        }
      } catch {
        // Illegal move, continue
      }
    }

    // Select piece if it's the current player's piece
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
        handleGameOver(winner, 'Mot! (Checkmate)');
      } else if (chess.isDraw()) {
        let reason = 'Durrang!';
        if (chess.isStalemate()) reason = 'Pat (Stalemate)!';
        else if (chess.isThreefoldRepetition()) reason = '3 karra takrorlanish!';
        else if (chess.isInsufficientMaterial()) reason = 'Yetarsiz donalar!';
        handleGameOver('draw', reason);
      }
    }
  };

  const handleGameOver = (winner: 'w' | 'b' | 'draw', reason: string) => {
    setGameOverResult({ winner, reason });
    if (winner === 'w' && user) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      tg.haptic('success');
      updateCoins(user.coins + 30);
    } else if (winner === 'draw') {
      tg.haptic('warning');
    } else {
      tg.haptic('error');
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

  // Board files and ranks
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      {/* Top Navbar */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Shaxmat (FIDE)</h2>
          <span className="text-[10px] text-slate-400">
            {gameMode === 'bot'
              ? `Botga qarshi (${botLevel.toUpperCase()})`
              : gameMode === 'pvp'
              ? '1v1 Onlayn'
              : 'Birgalikda o‘yin'}
          </span>
        </div>
        <button
          onClick={restartGame}
          className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95"
          title="Qayta boshlash"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {!gameStarted ? (
        /* Game Setup Lobby */
        <div className="flex-1 p-6 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Bot size={40} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">O‘yin rejimini tanlang</h2>
            <p className="text-xs text-slate-400 mt-1">
              Reytingingizni oshiring yoki bot bilan mashq qiling
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => {
                setGameMode('bot');
                setGameStarted(true);
                tg.haptic('medium');
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-left flex items-center justify-between shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              <div>
                <span className="block text-sm">🤖 Botga qarshi o‘ynash</span>
                <span className="text-[11px] text-blue-200 font-normal">Tezkor mashg‘ulot va taktikalar</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-white/20 rounded-full">Easy / Med</span>
            </button>

            <button
              onClick={() => {
                tg.haptic('medium');
                setMatchmaking(true, 'chess');
                if (user) {
                  socket.emit('join_queue', { userId: user.id, gameId: 'chess' });
                }
              }}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 font-bold text-left flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div>
                <span className="block text-sm text-white">🌐 1v1 Onlayn Matchmaking</span>
                <span className="text-[11px] text-slate-400 font-normal">Tasodifiy onlayn raqib bilan ELO jangi</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full font-mono">1200 ELO</span>
            </button>

            <button
              onClick={() => {
                setGameMode('pass_play');
                setGameStarted(true);
                tg.haptic('medium');
              }}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold text-left flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div>
                <span className="block text-sm text-white">👥 Bitta ekranda o‘ynash</span>
                <span className="text-[11px] text-slate-400 font-normal">Do‘stingiz bilan navbatma-navbat</span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full">Lokal</span>
            </button>
          </div>

          {/* Bot Level selector */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">Bot qiyinlik darajasi:</span>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setBotLevel(lvl)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    botLevel === lvl
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'easy' ? 'Oson' : lvl === 'medium' ? 'O‘rta' : 'Qiyin'}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Chess Board Screen */
        <div className="flex-1 flex flex-col justify-between p-3 max-w-md mx-auto w-full">
          {/* Top Player (Black) */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl px-3.5 py-2 mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 border border-slate-700">
                {gameMode === 'bot' ? '🤖' : '♟'}
              </div>
              <div>
                <span className="text-xs font-bold block text-slate-200">
                  {gameMode === 'bot' ? `AI Bot (${botLevel})` : 'Qoralar (Black)'}
                </span>
                <span className="text-[10px] text-slate-400">Reyting: 1400</span>
              </div>
            </div>

            {/* Black Timer */}
            <div
              className={`px-3 py-1 rounded-xl font-mono text-sm font-bold border transition-colors ${
                activeTimerSide === 'b'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse-subtle'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {formatTimer(blackTimer)}
            </div>
          </div>

          {/* 8x8 Chessboard */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-800">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {ranks.map((rank, rIdx) =>
                files.map((file, fIdx) => {
                  const square = `${file}${rank}` as Square;
                  const isBlackSquare = (rIdx + fIdx) % 2 === 1;
                  const piece = chess.get(square);
                  const isSelected = selectedSquare === square;
                  const isValidTarget = validMoves.includes(square);
                  const isCheck = chess.inCheck() && piece?.type === 'k' && piece?.color === chess.turn();

                  return (
                    <div
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                        isBlackSquare ? 'bg-[#779952]' : 'bg-[#edeed1]'
                      } ${isSelected ? '!bg-amber-300/80' : ''} ${
                        isCheck ? '!bg-rose-500/90' : ''
                      }`}
                    >
                      {/* Rank & File labels */}
                      {fIdx === 0 && (
                        <span
                          className={`absolute top-0.5 left-1 text-[9px] font-bold ${
                            isBlackSquare ? 'text-[#edeed1]' : 'text-[#779952]'
                          }`}
                        >
                          {rank}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span
                          className={`absolute bottom-0.5 right-1 text-[9px] font-bold ${
                            isBlackSquare ? 'text-[#edeed1]' : 'text-[#779952]'
                          }`}
                        >
                          {file}
                        </span>
                      )}

                      {/* Piece */}
                      {piece && (
                        <div className="w-[85%] h-[85%] z-10 drop-shadow-md">
                          <ChessPieceIcon
                            piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()}
                          />
                        </div>
                      )}

                      {/* Move dot indicator */}
                      {isValidTarget && (
                        <div
                          className={`absolute z-20 rounded-full ${
                            piece
                              ? 'w-full h-full border-4 border-black/30 bg-rose-500/20'
                              : 'w-3 h-3 bg-black/25'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Player (White - You) */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl px-3.5 py-2 mt-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'S'}
              </div>
              <div>
                <span className="text-xs font-bold block text-white">
                  {user?.firstName || 'Siz'} (Oqlar)
                </span>
                <span className="text-[10px] text-slate-400">
                  ELO: {user?.eloRating?.chess || 1200}
                </span>
              </div>
            </div>

            {/* White Timer */}
            <div
              className={`px-3 py-1 rounded-xl font-mono text-sm font-bold border transition-colors ${
                activeTimerSide === 'w'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse-subtle'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {formatTimer(whiteTimer)}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => handleGameOver('b', 'Siz taslim bo‘ldingiz')}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
            >
              <Flag size={14} />
              <span>Taslim bo‘lish</span>
            </button>

            <div className="text-xs text-slate-400 font-medium">
              Navbat:{' '}
              <span className="font-bold text-white">
                {chess.turn() === 'w' ? 'Oqlar' : 'Qoralar'}
              </span>
            </div>

            <button
              onClick={restartGame}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
            >
              <RotateCcw size={14} />
              <span>Qayta</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl animate-fade-in">
            <div
              className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg ${
                gameOverResult.winner === 'w'
                  ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                  : gameOverResult.winner === 'draw'
                  ? 'bg-slate-700/30 border border-slate-600 text-slate-300'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
              }`}
            >
              <Trophy size={32} />
            </div>

            <h3 className="text-xl font-bold mb-1">
              {gameOverResult.winner === 'w'
                ? 'G‘alaba qozondingiz! 🎉'
                : gameOverResult.winner === 'draw'
                ? 'Durrang natija! 🤝'
                : 'Mag‘lubiyat! ⚔️'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{gameOverResult.reason}</p>

            {gameOverResult.winner === 'w' && (
              <div className="inline-block px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs font-bold text-yellow-300 mb-6">
                Mukofot: +30 tanga & +16 ELO
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={restartGame}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 active:scale-95 transition-all"
              >
                Yana o‘ynash
              </button>
              <button
                onClick={() => {
                  setGameOverResult(null);
                  setGameStarted(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 active:scale-95 transition-all"
              >
                Lobbiyga qaytish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
