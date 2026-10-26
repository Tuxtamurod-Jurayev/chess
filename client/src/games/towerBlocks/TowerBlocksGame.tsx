import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Trophy, Layers } from 'lucide-react';
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

  const blockHeight = 24;
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];

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

    // Base initial block at bottom
    gameStateRef.current.stack = [
      {
        x: (canvas.width - 160) / 2,
        y: canvas.height - blockHeight - 20,
        width: 160,
        color: colors[0],
      },
    ];

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameStateRef.current;

      // Draw all blocks in stack
      for (const b of state.stack) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, blockHeight);
        ctx.strokeStyle = '#ffffff20';
        ctx.strokeRect(b.x, b.y, b.width, blockHeight);
      }

      // Move and draw current sliding block
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
        ctx.strokeStyle = '#ffffff40';
        ctx.strokeRect(state.currentBlock.x, curY, state.currentBlock.width, blockHeight);
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

    // Calculate overhang
    const diff = cur.x - topBlock.x;
    if (Math.abs(diff) >= cur.width) {
      // Completely missed!
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

    // If perfectly aligned within 3px, reward combo
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

    // If stack height gets high, shift everything down
    if (nextY < 120) {
      for (const b of state.stack) {
        b.y += blockHeight;
      }
    }

    state.score += 1;
    setScore(state.score);

    state.currentBlock.width = newWidth;
    state.currentBlock.x = 0;
    state.currentBlock.speed = Math.min(7, 3 + state.score * 0.2);
  };

  const restart = () => {
    tg.haptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current = {
      stack: [
        {
          x: (canvas.width - 160) / 2,
          y: canvas.height - blockHeight - 20,
          width: 160,
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Tower Blocks (Minora)</h2>
          <span className="text-[10px] text-slate-400">Qavatlar soni: {score}</span>
        </div>
        <button onClick={restart} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div
          onClick={dropBlock}
          className="relative aspect-[3/4] w-full bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer"
        >
          <canvas ref={canvasRef} width={340} height={380} className="w-full h-full" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <Trophy size={44} className="text-amber-400 mb-2" />
              <h3 className="text-2xl font-black mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-slate-400 mb-4">Minora balandligi: <span className="text-indigo-400 font-bold">{score} qavat</span></p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Qaytadan boshlash
              </button>
            </div>
          )}
        </div>

        <button
          onClick={dropBlock}
          disabled={gameOver}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-600/25 active:scale-95 transition-all mt-4"
        >
          BLOKNI TUSHIRISH (TAP)
        </button>
      </div>
    </div>
  );
};
