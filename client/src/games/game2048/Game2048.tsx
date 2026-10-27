import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

type Board = number[][];

export const Game2048: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [addedScoreInfo, setAddedScoreInfo] = useState<{ amount: number; id: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [spawnedKey, setSpawnedKey] = useState<string | null>(null);

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
    setSpawnedKey(`${randomCell.r}-${randomCell.c}`);
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
      if (totalScore > 0) {
        setAddedScoreInfo({ amount: totalScore, id: Date.now() });
      }
      if (newScore > bestScore) setBestScore(newScore);

      if (!won && b.some((row) => row.some((c) => c === 2048))) {
        setWon(true);
        confetti({ particleCount: 60, spread: 60 });
        tg.haptic('success');
      }

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
      if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'down' : 'up');
    }
  };

  const resetGame = () => {
    tg.haptic('medium');
    setBoard(getInitialBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const getTileStyle = (val: number) => {
    switch (val) {
      case 2: return 'bg-zinc-800 text-zinc-300';
      case 4: return 'bg-zinc-700 text-zinc-100 font-semibold';
      case 8: return 'bg-zinc-600 text-white font-semibold';
      case 16: return 'bg-zinc-500 text-white font-bold';
      case 32: return 'bg-zinc-400 text-zinc-950 font-bold';
      case 64: return 'bg-zinc-300 text-zinc-950 font-black';
      case 128: return 'bg-zinc-200 text-zinc-950 font-black';
      case 256: return 'bg-zinc-100 text-zinc-950 font-black';
      case 512: return 'bg-white text-zinc-950 font-black shadow-xs';
      case 1024: return 'bg-amber-400 text-zinc-950 font-black';
      case 2048: return 'bg-amber-300 text-zinc-950 font-black shadow-sm';
      default: return 'bg-zinc-900/60 text-transparent';
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">2048</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Ball: {score}</span>
        </div>
        <button onClick={resetGame} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Score Bar */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-center relative overflow-hidden">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Ochko</span>
            <span className="text-sm font-bold font-mono text-zinc-200">{score}</span>
            {addedScoreInfo && (
              <span
                key={addedScoreInfo.id}
                className="absolute top-1 right-2 text-xs font-mono font-bold text-amber-400 animate-float pointer-events-none"
              >
                +{addedScoreInfo.amount}
              </span>
            )}
          </div>
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Eng Yuqori</span>
            <span className="text-sm font-bold font-mono text-zinc-400">{bestScore}</span>
          </div>
        </div>

        {/* Minimal 4x4 Grid */}
        <div className="relative aspect-square w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
            {board.map((row, r) =>
              row.map((val, c) => {
                const cellKey = `${r}-${c}`;
                const isJustSpawned = spawnedKey === cellKey && val !== 0;

                return (
                  <div
                    key={cellKey}
                    className={`rounded-xl flex items-center justify-center font-mono transition-all duration-150 ${getTileStyle(val)} ${
                      isJustSpawned ? 'animate-spawn' : ''
                    }`}
                  >
                    {val !== 0 && (
                      <span className={`text-base ${val > 512 ? 'text-xs' : val > 64 ? 'text-sm' : 'text-base'}`}>
                        {val}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin yakunlandi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">Ball: {score}</p>
              <button
                onClick={resetGame}
                className="py-2 px-5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
              >
                Qaytadan
              </button>
            </div>
          )}
        </div>

        {/* Minimal Arrow D-Pad */}
        <div className="mt-3 flex flex-col items-center">
          <button
            onClick={() => handleMove('up')}
            className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 mb-1 text-zinc-400"
          >
            <ChevronUp size={20} />
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => handleMove('left')}
              className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handleMove('down')}
              className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronDown size={20} />
            </button>
            <button
              onClick={() => handleMove('right')}
              className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
