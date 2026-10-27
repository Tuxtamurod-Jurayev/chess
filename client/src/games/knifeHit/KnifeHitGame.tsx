import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

interface StageTheme {
  name: string;
  knifeName: string;
  discType: 'wood' | 'fruit' | 'shield' | 'cyber' | 'gold';
  targetColor: string;
  particleColor: string[];
}

const STAGE_THEMES: StageTheme[] = [
  {
    name: 'Yog‘och Nishon',
    knifeName: 'Ovchi Pichog‘i',
    discType: 'wood',
    targetColor: '#78350f',
    particleColor: ['#b45309', '#d97706', '#fef3c7'],
  },
  {
    name: 'Tarvuz (Meva)',
    knifeName: 'Yapon Santoku',
    discType: 'fruit',
    targetColor: '#e11d48',
    particleColor: ['#f43f5e', '#fb7185', '#166534', '#0f172a'],
  },
  {
    name: 'Temir Qalqon',
    knifeName: 'Ritsar Xanjari',
    discType: 'shield',
    targetColor: '#334155',
    particleColor: ['#94a3b8', '#f8fafc', '#fbbf24'],
  },
  {
    name: 'Kiber Reaktor',
    knifeName: 'Plazma Kiber-Pichoq',
    discType: 'cyber',
    targetColor: '#0f172a',
    particleColor: ['#06b6d4', '#3b82f6', '#a855f7'],
  },
  {
    name: 'Oltin Qirollik',
    knifeName: 'Zarhal Xanjar',
    discType: 'gold',
    targetColor: '#ca8a04',
    particleColor: ['#facc15', '#fef08a', '#e11d48'],
  },
];

export const KnifeHitGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [knivesLeft, setKnivesLeft] = useState(7);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [stageClearedTitle, setStageClearedTitle] = useState<string | null>(null);

  const currentTheme = STAGE_THEMES[(stage - 1) % STAGE_THEMES.length];

  const gameStateRef = useRef({
    rotation: 0,
    speed: 0.035,
    targetKnives: [] as number[],
    flyingKnife: null as { y: number } | null,
    gameOver: false,
    recoil: 0,
    shattering: false,
    shatterPieces: [] as Array<{ x: number; y: number; vx: number; vy: number; rot: number; vrot: number; r: number; color: string }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }>,
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
      const centerY = 125;
      const radius = 54;

      const state = gameStateRef.current;
      if (!state.gameOver) {
        state.rotation += state.speed;
      }

      if (state.recoil > 0) {
        state.recoil *= 0.82;
        if (state.recoil < 0.15) state.recoil = 0;
      }

      // Draw Shatter Animation if stage cleared
      if (state.shattering) {
        for (let i = state.shatterPieces.length - 1; i >= 0; i--) {
          const piece = state.shatterPieces[i];
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.vy += 0.35;
          piece.rot += piece.vrot;

          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rot);
          ctx.fillStyle = piece.color;
          ctx.beginPath();
          ctx.arc(0, 0, piece.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Draw Rotating Realistic Target Disc
        ctx.save();
        ctx.translate(centerX, centerY - state.recoil);
        ctx.rotate(state.rotation);

        drawRealisticDisc(ctx, currentTheme.discType, radius);

        // Draw Embedded Knives
        for (const angle of state.targetKnives) {
          ctx.save();
          ctx.rotate(angle);
          drawRealisticKnife(ctx, 0, radius, currentTheme.discType);
          ctx.restore();
        }

        ctx.restore();
      }

      // Draw Flying Knife
      if (state.flyingKnife) {
        state.flyingKnife.y -= 22;

        ctx.save();
        ctx.translate(centerX, state.flyingKnife.y);
        drawRealisticKnife(ctx, 0, 0, currentTheme.discType);
        ctx.restore();

        if (state.flyingKnife.y <= centerY + radius + 8 && !state.shattering) {
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
            tg.haptic('medium');
            state.targetKnives.push(currentRelAngle);
            state.flyingKnife = null;
            state.recoil = 6;

            // Spawn realistic particles based on disc theme
            for (let i = 0; i < 12; i++) {
              const pColor = currentTheme.particleColor[Math.floor(Math.random() * currentTheme.particleColor.length)];
              state.particles.push({
                x: centerX,
                y: centerY + radius,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.7) * 7,
                life: 1,
                color: pColor,
                size: Math.random() * 3 + 1.5,
              });
            }

            setScore((s) => s + 1);

            setKnivesLeft((k) => {
              const remaining = k - 1;
              if (remaining <= 0) {
                // Trigger Stage Shatter Effect!
                confetti({ particleCount: 50, spread: 70 });
                state.shattering = true;
                for (let i = 0; i < 16; i++) {
                  state.shatterPieces.push({
                    x: centerX,
                    y: centerY,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.8) * 10,
                    rot: 0,
                    vrot: (Math.random() - 0.5) * 0.2,
                    r: Math.random() * 12 + 6,
                    color: currentTheme.particleColor[i % currentTheme.particleColor.length],
                  });
                }

                const nextStage = stage + 1;
                const nextTheme = STAGE_THEMES[(nextStage - 1) % STAGE_THEMES.length];
                setStageClearedTitle(`${nextTheme.name.toUpperCase()} BOSQICHI!`);

                setTimeout(() => {
                  setStage(nextStage);
                  setStageClearedTitle(null);
                  state.shattering = false;
                  state.shatterPieces = [];
                  state.targetKnives = [];
                  state.speed = (Math.random() > 0.45 ? 1 : -1) * (0.035 + nextStage * 0.006);
                }, 900);

                return 7 + Math.min(nextStage, 5);
              }
              return remaining;
            });
          }
        }
      }

      // Render & update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= 0.04;

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Ready Knife at bottom with glowing hint
      if (!state.flyingKnife && !state.gameOver) {
        ctx.save();
        ctx.translate(centerX, canvas.height - 68);
        drawRealisticKnife(ctx, 0, 0, currentTheme.discType);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stage, score, user, currentTheme]);

  // Realistic Target Disc Renderer
  function drawRealisticDisc(ctx: CanvasRenderingContext2D, type: StageTheme['discType'], radius: number) {
    if (type === 'wood') {
      // Oak Tree Trunk
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#451a03';
      ctx.stroke();

      // Tree growth rings
      for (let r = radius - 10; r > 10; r -= 10) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
    } else if (type === 'fruit') {
      // Watermelon Disc
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#166534'; // Green rind
      ctx.fill();

      // Light rind
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#bbf7d0';
      ctx.fill();

      // Red pulp
      ctx.beginPath();
      ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
      ctx.fillStyle = '#e11d48';
      ctx.fill();

      // Watermelon Seeds
      ctx.fillStyle = '#09090b';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(22, 0, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (type === 'shield') {
      // Medieval Iron Shield
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      // Iron studs on rim
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const sx = Math.cos(a) * (radius - 2.5);
        const sy = Math.sin(a) * (radius - 2.5);
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center steel boss
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();
    } else if (type === 'cyber') {
      // Sci-fi Neon Reactor Core
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#06b6d4';
      ctx.stroke();

      // Glowing circuit rings
      ctx.beginPath();
      ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
    } else {
      // Golden Imperial Boss
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 12, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.stroke();

      // Royal ruby jewel center
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#e11d48';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }

  // Realistic Knife Model
  function drawRealisticKnife(ctx: CanvasRenderingContext2D, x: number, y: number, theme: StageTheme['discType']) {
    ctx.save();
    ctx.translate(x, y);

    // Color definitions based on stage knife
    let bladeColor = '#f1f5f9';
    let handleColor = '#78350f';
    let guardColor = '#64748b';

    if (theme === 'fruit') {
      bladeColor = '#e2e8f0';
      handleColor = '#18181b';
      guardColor = '#0f172a';
    } else if (theme === 'shield') {
      bladeColor = '#ffffff';
      handleColor = '#1e3a8a';
      guardColor = '#eab308';
    } else if (theme === 'cyber') {
      bladeColor = '#22d3ee';
      handleColor = '#09090b';
      guardColor = '#a855f7';
    } else if (theme === 'gold') {
      bladeColor = '#fef08a';
      handleColor = '#e11d48';
      guardColor = '#eab308';
    }

    // Blade
    ctx.beginPath();
    ctx.moveTo(-2.5, 0);
    ctx.lineTo(2.5, 0);
    ctx.lineTo(2.5, 24);
    ctx.lineTo(0, 32); // sharp tip
    ctx.lineTo(-2.5, 24);
    ctx.closePath();
    ctx.fillStyle = bladeColor;
    ctx.fill();

    // Blade metallic shine centerline
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crossguard
    ctx.fillStyle = guardColor;
    ctx.fillRect(-6, 0, 12, 3.5);

    // Handle Grip
    ctx.fillStyle = handleColor;
    ctx.fillRect(-3, -16, 6, 16);

    // Grip rings
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let r = -13; r <= -4; r += 3) {
      ctx.beginPath();
      ctx.moveTo(-3, r);
      ctx.lineTo(3, r);
      ctx.stroke();
    }

    // Pommel
    ctx.fillStyle = guardColor;
    ctx.beginPath();
    ctx.arc(0, -17.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const throwKnife = () => {
    if (gameOver || gameStateRef.current.flyingKnife || gameStateRef.current.shattering) return;
    tg.haptic('light');
    gameStateRef.current.flyingKnife = { y: 280 };
  };

  const restart = () => {
    tg.haptic('medium');
    gameStateRef.current = {
      rotation: 0,
      speed: 0.035,
      targetKnives: [],
      flyingKnife: null,
      gameOver: false,
      recoil: 0,
      shattering: false,
      shatterPieces: [],
      particles: [],
    };
    setKnivesLeft(7);
    setScore(0);
    setStage(1);
    setGameOver(false);
    setStageClearedTitle(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      {/* Header */}
      <div className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
            <span className="text-amber-400">STAGE {stage}:</span>
            <span>{currentTheme.name}</span>
          </h2>
          <span className="text-[10px] text-zinc-400 font-mono">
            Pichoq: <span className="text-zinc-200">{currentTheme.knifeName}</span> | Ball: {score}
          </span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Game Area Container */}
        <div
          onClick={throwKnife}
          className="relative aspect-[3/4] w-full bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center cursor-pointer"
        >
          <canvas ref={canvasRef} width={340} height={380} className="w-full h-full" />

          {/* Knives left indicator in corner */}
          <div className="absolute top-4 left-4 flex flex-col space-y-1 z-20">
            {Array.from({ length: knivesLeft }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-4 bg-amber-400 rounded-full shadow-xs"
              />
            ))}
          </div>

          {/* Stage Cleared Banner overlay */}
          {stageClearedTitle && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-pop">
              <Sparkles size={36} className="text-amber-400 mb-2 animate-spin" />
              <h3 className="text-lg font-black text-white tracking-wider mb-1">
                {stageClearedTitle}
              </h3>
              <span className="text-xs text-amber-300 font-mono">Yangi nishon va pichoq ochildi!</span>
            </div>
          )}

          {/* Game Over modal */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center animate-fade-in z-30">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-1">Pichoq bir-biriga tegdi!</h3>
              <p className="text-xs text-zinc-400 mb-4 font-mono">
                Bosqich: <span className="text-white font-bold">{stage}</span> | Yakuniy ball:{' '}
                <span className="text-amber-400 font-bold">{score}</span>
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/25 active:scale-95"
              >
                Qayta boshlash
              </button>
            </div>
          )}
        </div>

        {/* Action Throw Button */}
        <button
          onClick={throwKnife}
          disabled={gameOver}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition-all mt-4 tracking-wider flex items-center justify-center space-x-2"
        >
          <span>PICHOQ OTISH (TAP)</span>
        </button>
      </div>
    </div>
  );
};
