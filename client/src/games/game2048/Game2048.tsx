import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

type Board = number[][];

export const Game2048: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, showToast } = useAppStore();
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function getInitialBoard(): Board {
    const b: Board = Array(4).fill(0).map(() => Array(4).fill(0));
    spawnTile(b);
    spawnTile(b);
    return b;
  }

  function spawnTile(b: Board): boolean {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return false;
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  const moveLeft = useCallback((currentBoard: Board): { newBoard: Board; addedScore: number; moved: boolean } => {
    let moved = false;
    let addedScore = 0;
    const newBoard = currentBoard.map((row) => {
      let filtered = row.filter((val) => val !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          addedScore += filtered[i];
          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < 4) {
        filtered.push(0);
      }
      for (let i = 0; i < 4; i++) {
        if (filtered[i] !== row[i]) moved = true;
      }
      return filtered;
    });
    return { newBoard, addedScore, moved };
  }, []);

  const rotate = (matrix: Board): Board => {
    return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  };

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;

    let b = board.map((r) => [...r]);
    let totalScore = 0;
    let moved = false;

    if (direction === 'left') {
      const res = moveLeft(b);
      b = res.newBoard;
      totalScore = res.addedScore;
      moved = res.moved;
    } else if (direction === 'right') {
      b = rotate(rotate(b));
      const res = moveLeft(b);
      b = rotate(rotate(res.newBoard));
      totalScore = res.addedScore;
      moved = res.moved;
    } else if (direction === 'up') {
      b = rotate(rotate(rotate(b)));
      const res = moveLeft(b);
      b = rotate(res.newBoard);
      totalScore = res.addedScore;
      moved = res.moved;
    } else if (direction === 'down') {
      b = rotate(b);
      const res = moveLeft(b);
      b = rotate(rotate(rotate(res.newBoard)));
      totalScore = res.addedScore;
      moved = res.moved;
    }

    if (moved) {
      tg.haptic('light');
      spawnTile(b);
      setBoard(b);
      const newScore = score + totalScore;
      setScore(newScore);
      if (newScore > bestScore) setBestScore(newScore);

      // Check win 2048
      if (!won && b.some((row) => row.some((c) => c === 2048))) {
        setWon(true);
        confetti({ particleCount: 120, spread: 90 });
        tg.haptic('success');
      }

      // Check game over
      if (isGameOver(b)) {
        setGameOver(true);
        tg.haptic('error');
        if (user) {
          api.finishSoloGame(user.id, '2048', newScore).catch(() => {});
        }
      }
    }
  }, [board, gameOver, score, bestScore, won, user, moveLeft]);

  function isGameOver(b: Board): boolean {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
      }
    }
    return true;
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleMove('left');
      else if (e.key === 'ArrowRight') handleMove('right');
      else if (e.key === 'ArrowUp') handleMove('up');
      else if (e.key === 'ArrowDown') handleMove('down');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        handleMove(dx > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(dy) > 30) {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    }
  };

  const resetGame = () => {
    tg.haptic('medium');
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-amber-100 text-slate-800';
      case 4: return 'bg-amber-200 text-slate-800';
      case 8: return 'bg-orange-400 text-white';
      case 16: return 'bg-orange-500 text-white';
      case 32: return 'bg-rose-500 text-white';
      case 64: return 'bg-red-600 text-white';
      case 128: return 'bg-yellow-400 text-slate-900 shadow-md shadow-yellow-500/30';
      case 256: return 'bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-400/40';
      case 512: return 'bg-emerald-400 text-slate-950 font-black';
      case 1024: return 'bg-cyan-400 text-slate-950 font-black';
      case 2048: return 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black shadow-xl animate-pulse';
      default: return 'bg-slate-800/60 text-transparent';
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">2048 Puzzle</h2>
          <span className="text-[10px] text-slate-400">Barmoq bilan suring</span>
        </div>
        <button onClick={resetGame} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Score Bar */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Ochko</span>
            <span className="text-lg font-black text-amber-400 font-mono">{score}</span>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Eng Yuqori</span>
            <span className="text-lg font-black text-blue-400 font-mono">{bestScore}</span>
          </div>
        </div>

        {/* 4x4 Grid Container */}
        <div className="relative aspect-square w-full bg-slate-900 border-2 border-slate-800/80 rounded-3xl p-3 shadow-2xl flex flex-col justify-between">
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
            {board.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-2xl flex items-center justify-center font-bold transition-all duration-100 ${
                    val ? 'scale-100' : 'scale-95'
                  } ${getTileColor(val)}`}
                >
                  {val !== 0 && (
                    <span className={`font-mono ${val > 512 ? 'text-lg' : val > 64 ? 'text-xl' : 'text-2xl'}`}>
                      {val}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30">
              <Trophy size={48} className="text-amber-400 mb-2" />
              <h3 className="text-2xl font-black mb-1">O‘yin yakunlandi!</h3>
              <p className="text-xs text-slate-400 mb-4">To‘plangan ochko: <span className="font-bold text-amber-300 font-mono">{score}</span></p>
              <button
                onClick={resetGame}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95"
              >
                Qaytadan o‘ynash
              </button>
            </div>
          )}
        </div>

        {/* On-Screen D-Pad / Touch Controls */}
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={() => handleMove('up')}
            className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-blue-600 active:scale-95 mb-1.5 shadow-sm"
          >
            <ChevronUp size={24} />
          </button>
          <div className="flex space-x-6">
            <button
              onClick={() => handleMove('left')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-blue-600 active:scale-95 shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => handleMove('down')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-blue-600 active:scale-95 shadow-sm"
            >
              <ChevronDown size={24} />
            </button>
            <button
              onClick={() => handleMove('right')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-blue-600 active:scale-95 shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
