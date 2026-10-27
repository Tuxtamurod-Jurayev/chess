import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

export const KnifeHitGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [knivesLeft, setKnivesLeft] = useState(7);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  const gameStateRef = useRef({
    rotation: 0,
    speed: 0.03,
    targetKnives: [] as number[],
    flyingKnife: null as { y: number } | null,
    gameOver: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = 120;
      const radius = 52;

      const state = gameStateRef.current;
      if (!state.gameOver) {
        state.rotation += state.speed;
      }

      // Draw Rotating Minimal Disc
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(state.rotation);

      // Disc body
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#27272a';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#52525b';
      ctx.stroke();

      // Inner subtle circle
      ctx.beginPath();
      ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Embedded Knives
      for (const angle of state.targetKnives) {
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = '#f4f4f5';
        ctx.fillRect(-1.5, radius, 3, 26);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(-3, radius + 26, 6, 10);
        ctx.restore();
      }

      ctx.restore();

      // Draw Flying Knife
      if (state.flyingKnife) {
        state.flyingKnife.y -= 20;

        ctx.save();
        ctx.translate(centerX, state.flyingKnife.y);
        ctx.fillStyle = '#f4f4f5';
        ctx.fillRect(-1.5, 0, 3, 26);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(-3, 26, 6, 10);
        ctx.restore();

        if (state.flyingKnife.y <= centerY + radius + 10) {
          const currentRelAngle = -state.rotation + Math.PI / 2;
          const normalizedAngle = ((currentRelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          const hitExisting = state.targetKnives.some((existingAngle) => {
            const normExisting = ((existingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const diff = Math.abs(normExisting - normalizedAngle);
            return diff < 0.22 || Math.abs(diff - Math.PI * 2) < 0.22;
          });

          if (hitExisting) {
            tg.haptic('error');
            state.gameOver = true;
            state.flyingKnife = null;
            setGameOver(true);
            if (user) {
              api.finishSoloGame(user.id, 'knife-hit', score).catch(() => {});
            }
          } else {
            tg.haptic('light');
            state.targetKnives.push(currentRelAngle);
            state.flyingKnife = null;
            setScore((s) => s + 1);

            setKnivesLeft((k) => {
              const remaining = k - 1;
              if (remaining <= 0) {
                confetti({ particleCount: 40, spread: 50 });
                setStage((st) => st + 1);
                state.targetKnives = [];
                state.speed = (Math.random() > 0.5 ? 1 : -1) * (0.03 + stage * 0.005);
                return 7 + stage;
              }
              return remaining;
            });
          }
        }
      }

      // Draw Ready Knife at bottom
      if (!state.flyingKnife && !state.gameOver) {
        ctx.save();
        ctx.translate(centerX, canvas.height - 60);
        ctx.fillStyle = '#f4f4f5';
        ctx.fillRect(-2, 0, 4, 28);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(-3.5, 28, 7, 12);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stage, score, user]);

  const throwKnife = () => {
    if (gameOver || gameStateRef.current.flyingKnife) return;
    tg.haptic('light');
    gameStateRef.current.flyingKnife = { y: 280 };
  };

  const restart = () => {
    tg.haptic('medium');
    gameStateRef.current = {
      rotation: 0,
      speed: 0.03,
      targetKnives: [],
      flyingKnife: null,
      gameOver: false,
    };
    setKnivesLeft(7);
    setScore(0);
    setStage(1);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Knife Hit ({stage}-bosqich)</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Qoldi: {knivesLeft} | Ball: {score}</span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div
          onClick={throwKnife}
          className="relative aspect-[3/4] w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-md flex flex-col items-center justify-center cursor-pointer"
        >
          <canvas ref={canvasRef} width={340} height={380} className="w-full h-full" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin tugadi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">Ball: {score}</p>
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
          onClick={throwKnife}
          disabled={gameOver}
          className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs active:scale-95 transition-all mt-3"
        >
          Pichoq otish
        </button>
      </div>
    </div>
  );
};
