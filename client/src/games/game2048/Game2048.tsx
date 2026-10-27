import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

type Board = number[][];

export const Game2048: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();

  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('2048_best_score') || '0');
    } catch {
      return 0;
    }
  });
  const [floatingScore, setFloatingScore] = useState<{ amount: number; id: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initial 4x4 board with 2 random tiles
  function createInitialBoard(): Board {
    const b: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    addRandomTile(b);
    addRandomTile(b);
    return b;
  }

  function addRandomTile(b: Board): boolean {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return false;
    const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[choice.r][choice.c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  // Pure 1D line slider: slides line to the left, merges identical adjacent tiles
  function slideLine(line: number[]): { newLine: number[]; addedScore: number; changed: boolean } {
    const nonZero = line.filter((v) => v !== 0);
    const result: number[] = [];
    let addedScore = 0;
    let i = 0;

    while (i < nonZero.length) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        result.push(mergedVal);
        addedScore += mergedVal;
        i += 2;
      } else {
        result.push(nonZero[i]);
        i += 1;
      }
    }

    while (result.length < 4) {
      result.push(0);
    }

    const changed = result.some((v, idx) => v !== line[idx]);
    return { newLine: result, addedScore, changed };
  }

  // Move handler for all 4 directions
  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      const newBoard: Board = board.map((row) => [...row]);
      let totalAddedScore = 0;
      let hasChanged = false;

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          const { newLine, addedScore, changed } = slideLine(newBoard[r]);
          newBoard[r] = newLine;
          totalAddedScore += addedScore;
          if (changed) hasChanged = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const reversed = newBoard[r].slice().reverse();
          const { newLine, addedScore, changed } = slideLine(reversed);
          newBoard[r] = newLine.reverse();
          totalAddedScore += addedScore;
          if (changed) hasChanged = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          const column = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const { newLine, addedScore, changed } = slideLine(column);
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = newLine[r];
          }
          totalAddedScore += addedScore;
          if (changed) hasChanged = true;
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          const column = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]].reverse();
          const { newLine, addedScore, changed } = slideLine(column);
          const finalCol = newLine.reverse();
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = finalCol[r];
          }
          totalAddedScore += addedScore;
          if (changed) hasChanged = true;
        }
      }

      if (hasChanged) {
        tg.haptic('light');
        addRandomTile(newBoard);
        setBoard(newBoard);

        const newScore = score + totalAddedScore;
        setScore(newScore);

        if (totalAddedScore > 0) {
          setFloatingScore({ amount: totalAddedScore, id: Date.now() });
        }

        if (newScore > bestScore) {
          setBestScore(newScore);
          try {
            localStorage.setItem('2048_best_score', newScore.toString());
          } catch {}
        }

        // Check if 2048 achieved
        if (!won && newBoard.some((row) => row.some((v) => v === 2048))) {
          setWon(true);
          confetti({ particleCount: 70, spread: 70 });
          tg.haptic('success');
        }

        // Check game over
        if (checkGameOver(newBoard)) {
          setGameOver(true);
          tg.haptic('error');
          if (user) {
            api.finishSoloGame(user.id, '2048', newScore).catch(() => {});
          }
        }
      }
    },
    [board, gameOver, score, bestScore, won, user]
  );

  function checkGameOver(b: Board): boolean {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  }

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleMove('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleMove('right');
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleMove('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleMove('down');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove]);

  // Touch / Swipe handling with touch-action: none
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    const dx = clientX - touchStartRef.current.x;
    const dy = clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const minSwipe = 24;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) >= minSwipe) {
        handleMove(dx > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(dy) >= minSwipe) {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    }
  };

  const resetGame = () => {
    tg.haptic('medium');
    setBoard(createInitialBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const getTileStyle = (val: number): { bg: string; text: string; shadow: string } => {
    switch (val) {
      case 2:
        return { bg: 'bg-amber-100', text: 'text-zinc-900', shadow: 'shadow-xs' };
      case 4:
        return { bg: 'bg-amber-200', text: 'text-zinc-900', shadow: 'shadow-xs' };
      case 8:
        return { bg: 'bg-orange-500', text: 'text-white', shadow: 'shadow-orange-500/30 shadow-md' };
      case 16:
        return { bg: 'bg-orange-600', text: 'text-white', shadow: 'shadow-orange-600/30 shadow-md' };
      case 32:
        return { bg: 'bg-rose-500', text: 'text-white', shadow: 'shadow-rose-500/30 shadow-md' };
      case 64:
        return { bg: 'bg-red-600', text: 'text-white', shadow: 'shadow-red-600/40 shadow-lg' };
      case 128:
        return { bg: 'bg-yellow-400', text: 'text-zinc-950 font-black', shadow: 'shadow-yellow-400/50 shadow-lg' };
      case 256:
        return { bg: 'bg-yellow-300', text: 'text-zinc-950 font-black', shadow: 'shadow-yellow-300/50 shadow-xl' };
      case 512:
        return { bg: 'bg-emerald-500', text: 'text-white font-black', shadow: 'shadow-emerald-500/40 shadow-xl' };
      case 1024:
        return { bg: 'bg-cyan-400', text: 'text-zinc-950 font-black', shadow: 'shadow-cyan-400/50 shadow-2xl' };
      case 2048:
        return {
          bg: 'bg-gradient-to-tr from-amber-400 to-yellow-200 ring-2 ring-yellow-300 animate-pulse',
          text: 'text-zinc-950 font-black',
          shadow: 'shadow-amber-400/60 shadow-2xl',
        };
      default:
        return {
          bg: 'bg-gradient-to-tr from-purple-500 to-pink-500',
          text: 'text-white font-black',
          shadow: 'shadow-purple-500/50 shadow-2xl',
        };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center space-x-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-center min-w-[70px]">
            <span className="text-[10px] text-zinc-500 block uppercase font-mono tracking-wider">Ball</span>
            <span className="text-sm font-bold text-white font-mono">{score}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-center min-w-[70px] relative">
            <span className="text-[10px] text-amber-400 flex items-center justify-center gap-1 uppercase font-mono tracking-wider">
              <Trophy size={10} /> Rekord
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono">{bestScore}</span>

            {floatingScore && (
              <span
                key={floatingScore.id}
                className="absolute -top-3 right-2 text-xs font-bold text-emerald-400 font-mono animate-bounce"
              >
                +{floatingScore.amount}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={resetGame}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
          title="Qayta boshlash"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Main Game Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* 4x4 Grid Container with touch-action: none */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className="relative w-full max-w-[340px] aspect-square bg-zinc-900/90 border-2 border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing"
        >
          <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
            {board.map((row, r) =>
              row.map((val, c) => {
                const style = getTileStyle(val);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative rounded-xl flex items-center justify-center transition-all duration-100 ${
                      val === 0
                        ? 'bg-zinc-800/40 border border-zinc-800/40'
                        : `${style.bg} ${style.text} ${style.shadow} animate-pop`
                    }`}
                  >
                    {val > 0 && (
                      <span
                        className={`font-mono font-bold leading-none ${
                          val >= 1024 ? 'text-lg sm:text-xl' : val >= 128 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                        }`}
                      >
                        {val}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center z-30 animate-fade-in">
              <h3 className="text-lg font-bold text-white mb-1">O‘yin tugadi! 🎮</h3>
              <p className="text-xs text-zinc-400 mb-4 font-mono">To‘plangan ball: {score}</p>
              <button
                onClick={resetGame}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold text-xs shadow-lg active:scale-95 transition-all"
              >
                Qaytadan o‘ynash
              </button>
            </div>
          )}

          {/* 2048 Won Overlay */}
          {won && !gameOver && (
            <div className="absolute top-2 left-2 right-2 bg-amber-500/90 text-zinc-950 font-bold text-xs py-1.5 px-3 rounded-lg text-center shadow-lg z-20">
              🎉 Tabriklaymiz! 2048 ga yetdingiz! O‘yinni davom ettirishingiz mumkin.
            </div>
          )}
        </div>

        {/* Swipe Hint */}
        <p className="text-[11px] text-zinc-500 mt-3 font-mono">
          Ekranni istalgan tomonga suring yoki tugmalardan foydalaning
        </p>

        {/* Convenient Thumb D-Pad Controls */}
        <div className="mt-3 flex flex-col items-center">
          <button
            onClick={() => handleMove('up')}
            className="w-12 h-11 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-800 active:scale-95 mb-1.5 text-zinc-300 shadow-sm"
          >
            <ChevronUp size={22} />
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => handleMove('left')}
              className="w-12 h-11 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-300 shadow-sm"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => handleMove('down')}
              className="w-12 h-11 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-300 shadow-sm"
            >
              <ChevronDown size={22} />
            </button>
            <button
              onClick={() => handleMove('right')}
              className="w-12 h-11 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-300 shadow-sm"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
