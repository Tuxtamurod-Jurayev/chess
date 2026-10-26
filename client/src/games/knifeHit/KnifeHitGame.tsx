import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Trophy, Crosshair } from 'lucide-react';
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
    targetKnives: [] as number[], // angles in radians
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
      const radius = 55;

      const state = gameStateRef.current;
      if (!state.gameOver) {
        state.rotation += state.speed;
      }

      // Draw Rotating Log Target
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(state.rotation);

      // Log body
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      // Wood rings
      ctx.beginPath();
      ctx.arc(0, 0, radius - 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Embedded Knives
      for (const angle of state.targetKnives) {
        ctx.save();
        ctx.rotate(angle);
        // Knife handle & blade sticking out
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-2, radius, 4, 30);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, radius + 30, 8, 14);
        ctx.restore();
      }

      ctx.restore();

      // Draw Flying Knife
      if (state.flyingKnife) {
        state.flyingKnife.y -= 20;

        ctx.save();
        ctx.translate(centerX, state.flyingKnife.y);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-2.5, 0, 5, 32);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4.5, 32, 9, 14);
        ctx.restore();

        // Check collision with target
        if (state.flyingKnife.y <= centerY + radius + 15) {
          // Hit target! Calculate relative angle
          const currentRelAngle = -state.rotation + Math.PI / 2;
          const normalizedAngle = ((currentRelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          // Check if hits existing knife (within 0.25 rad)
          const hitExisting = state.targetKnives.some((existingAngle) => {
            const normExisting = ((existingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const diff = Math.abs(normExisting - normalizedAngle);
            return diff < 0.22 || Math.abs(diff - Math.PI * 2) < 0.22;
          });

          if (hitExisting) {
            // Deflection / Game Over
            tg.haptic('error');
            state.gameOver = true;
            state.flyingKnife = null;
            setGameOver(true);
            if (user) {
              api.finishSoloGame(user.id, 'knife-hit', score).catch(() => {});
            }
          } else {
            // Success hit
            tg.haptic('medium');
            state.targetKnives.push(currentRelAngle);
            state.flyingKnife = null;
            setScore((s) => s + 1);

            setKnivesLeft((k) => {
              const remaining = k - 1;
              if (remaining <= 0) {
                // Next Stage!
                confetti({ particleCount: 60, spread: 60 });
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

      // Draw Ready Knife at bottom if none flying
      if (!state.flyingKnife && !state.gameOver) {
        ctx.save();
        ctx.translate(centerX, canvas.height - 70);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-3, 0, 6, 32);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-5, 32, 10, 15);
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Knife Hit (Bosqich {stage})</h2>
          <span className="text-[10px] text-slate-400">Pichoqlar: {knivesLeft} | Ochko: {score}</span>
        </div>
        <button onClick={restart} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div
          onClick={throwKnife}
          className="relative aspect-[3/4] w-full bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer"
        >
          <canvas ref={canvasRef} width={340} height={380} className="w-full h-full" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <Trophy size={44} className="text-amber-400 mb-2" />
              <h3 className="text-2xl font-black mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-slate-400 mb-4">To‘plangan ochko: <span className="text-orange-400 font-bold">{score}</span></p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs"
              >
                Qaytadan boshlash
              </button>
            </div>
          )}
        </div>

        <button
          onClick={throwKnife}
          disabled={gameOver}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all mt-4"
        >
          PICHOQ OTISH (TAP)
        </button>
      </div>
    </div>
  );
};
