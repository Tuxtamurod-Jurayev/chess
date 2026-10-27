import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

interface Block {
  x: number;
  y: number;
  width: number;
  color: string;
}

export const TowerBlocksGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const blockHeight = 22;
  const colors = ['#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'];

  const gameStateRef = useRef({
    stack: [] as Block[],
    currentBlock: { x: 0, width: 140, dir: 1, speed: 3 },
    score: 0,
    gameOver: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameStateRef.current.stack = [
      {
        x: (canvas.width - 150) / 2,
        y: canvas.height - blockHeight - 20,
        width: 150,
        color: colors[0],
      },
    ];

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameStateRef.current;

      for (const b of state.stack) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, blockHeight);
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.width, blockHeight);
      }

      if (!state.gameOver) {
        const topBlockY = state.stack[state.stack.length - 1].y;
        const curY = topBlockY - blockHeight;

        state.currentBlock.x += state.currentBlock.speed * state.currentBlock.dir;
        if (state.currentBlock.x + state.currentBlock.width >= canvas.width) {
          state.currentBlock.dir = -1;
        } else if (state.currentBlock.x <= 0) {
          state.currentBlock.dir = 1;
        }

        const curColor = colors[state.stack.length % colors.length];
        ctx.fillStyle = curColor;
        ctx.fillRect(state.currentBlock.x, curY, state.currentBlock.width, blockHeight);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const dropBlock = () => {
    const state = gameStateRef.current;
    if (state.gameOver) return;

    tg.haptic('light');
    const topBlock = state.stack[state.stack.length - 1];
    const cur = state.currentBlock;

    const diff = cur.x - topBlock.x;
    if (Math.abs(diff) >= cur.width) {
      tg.haptic('error');
      state.gameOver = true;
      setGameOver(true);
      if (user) {
        api.finishSoloGame(user.id, 'tower-blocks', state.score).catch(() => {});
      }
      return;
    }

    let newWidth = cur.width - Math.abs(diff);
    let newX = diff > 0 ? cur.x : topBlock.x;

    if (Math.abs(diff) < 4) {
      newWidth = topBlock.width;
      newX = topBlock.x;
      tg.haptic('medium');
    }

    const nextY = topBlock.y - blockHeight;

    state.stack.push({
      x: newX,
      y: nextY,
      width: newWidth,
      color: colors[state.stack.length % colors.length],
    });

    if (nextY < 120) {
      for (const b of state.stack) {
        b.y += blockHeight;
      }
    }

    state.score += 1;
    setScore(state.score);

    state.currentBlock.width = newWidth;
    state.currentBlock.x = 0;
    state.currentBlock.speed = Math.min(6.5, 3 + state.score * 0.18);
  };

  const restart = () => {
    tg.haptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current = {
      stack: [
        {
          x: (canvas.width - 150) / 2,
          y: canvas.height - blockHeight - 20,
          width: 150,
          color: colors[0],
        },
      ],
      currentBlock: { x: 0, width: 140, dir: 1, speed: 3 },
      score: 0,
      gameOver: false,
    };
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Minora (Tower)</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Qavatlar: {score}</span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div
          onClick={dropBlock}
          className="relative aspect-[3/4] w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-md flex flex-col items-center justify-center cursor-pointer"
        >
          <canvas ref={canvasRef} width={340} height={380} className="w-full h-full" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin tugadi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">Balandlik: {score} qavat</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
              >
                Qayta boshlash
              </button>
            </div>
          )}
        </div>

        <button
          onClick={dropBlock}
          disabled={gameOver}
          className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs active:scale-95 transition-all mt-3"
        >
          Blokni tushirish
        </button>
      </div>
    </div>
  );
};
