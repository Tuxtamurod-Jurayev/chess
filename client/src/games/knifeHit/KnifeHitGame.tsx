import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
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
    particleColor: ['#b45309', '#d97706', '#fef3c7', '#78350f'],
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
    particleColor: ['#94a3b8', '#f8fafc', '#fbbf24', '#cbd5e1'],
  },
  {
    name: 'Kiber Reaktor',
    knifeName: 'Plazma Kiber-Pichoq',
    discType: 'cyber',
    targetColor: '#0f172a',
    particleColor: ['#06b6d4', '#3b82f6', '#a855f7', '#22d3ee'],
  },
  {
    name: 'Oltin Qirollik',
    knifeName: 'Zarhal Xanjar',
    discType: 'gold',
    targetColor: '#ca8a04',
    particleColor: ['#facc15', '#fef08a', '#e11d48', '#ca8a04'],
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
    deflectingKnife: null as { x: number; y: number; vx: number; vy: number; rot: number; vrot: number } | null,
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
      const centerY = 130;
      const radius = 54;
      const embedDepth = 12; // Knife penetrates 12px into the rim

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

        // Draw Embedded Knives sticking radially out from rim
        for (const angle of state.targetKnives) {
          ctx.save();
          ctx.rotate(angle);
          // Embedded at (0, radius - embedDepth), tip penetrates into rim, handle sticks outward
          drawRealisticKnife(ctx, 0, radius - embedDepth, currentTheme.discType);
          ctx.restore();
        }

        ctx.restore();
      }

      // Draw Deflecting Knife on Clash
      if (state.deflectingKnife) {
        const d = state.deflectingKnife;
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.5;
        d.rot += d.vrot;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        drawRealisticKnife(ctx, 0, 0, currentTheme.discType);
        ctx.restore();
      }

      // Draw Flying Knife
      if (state.flyingKnife) {
        state.flyingKnife.y -= 24;

        ctx.save();
        ctx.translate(centerX, state.flyingKnife.y);
        drawRealisticKnife(ctx, 0, 0, currentTheme.discType);
        ctx.restore();

        // Exact collision at bottom point of the circle (y = centerY + radius)
        const hitThreshold = centerY + radius + embedDepth;
        if (state.flyingKnife.y <= hitThreshold && !state.shattering && !state.deflectingKnife) {
          // Angle of impact: bottom of the disc is at angle 0 in world coords.
          // In rotating disc coords, angle = -state.rotation.
          const hitAngle = -state.rotation;

          // Check if it strikes an existing knife
          const hitExisting = state.targetKnives.some((existingAngle) => {
            const diff = Math.abs(((existingAngle - hitAngle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
            return diff < 0.26; // Angular width of knife
          });

          if (hitExisting) {
            tg.haptic('error');
            state.gameOver = true;
            state.deflectingKnife = {
              x: centerX,
              y: centerY + radius,
              vx: (Math.random() > 0.5 ? 5 : -5),
              vy: 3,
              rot: 0.2,
              vrot: 0.25,
            };
            state.flyingKnife = null;

            // Clash sparks
            for (let i = 0; i < 15; i++) {
              state.particles.push({
                x: centerX,
                y: centerY + radius + 15,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: '#facc15',
                size: Math.random() * 3 + 2,
              });
            }

            setGameOver(true);
            if (user) {
              api.finishSoloGame(user.id, 'knife-hit', score).catch(() => {});
            }
          } else {
            // Clean stick into disc
            tg.haptic('medium');
            state.targetKnives.push(hitAngle);
            state.flyingKnife = null;
            state.recoil = 7;

            // Spawn realistic particles based on disc theme
            for (let i = 0; i < 14; i++) {
              const pColor = currentTheme.particleColor[Math.floor(Math.random() * currentTheme.particleColor.length)];
              state.particles.push({
                x: centerX + (Math.random() - 0.5) * 10,
                y: centerY + radius,
                vx: (Math.random() - 0.5) * 9,
                vy: (Math.random() - 0.7) * 8,
                life: 1,
                color: pColor,
                size: Math.random() * 3.5 + 1.5,
              });
            }

            setScore((s) => s + 1);

            setKnivesLeft((k) => {
              const remaining = k - 1;
              if (remaining <= 0) {
                // Trigger Stage Shatter Effect!
                confetti({ particleCount: 50, spread: 70 });
                state.shattering = true;
                for (let i = 0; i < 18; i++) {
                  state.shatterPieces.push({
                    x: centerX,
                    y: centerY,
                    vx: (Math.random() - 0.5) * 13,
                    vy: (Math.random() - 0.8) * 11,
                    rot: 0,
                    vrot: (Math.random() - 0.5) * 0.25,
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
                  state.speed = (Math.random() > 0.45 ? 1 : -1) * (0.035 + nextStage * 0.005);
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
        p.life -= 0.045;

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

      // Draw Ready Knife at bottom
      if (!state.flyingKnife && !state.gameOver) {
        ctx.save();
        ctx.translate(centerX, canvas.height - 65);
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
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
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

  // Realistic Knife Model (Tip pointing UP at (0, 0), handle at bottom y > 0)
  function drawRealisticKnife(ctx: CanvasRenderingContext2D, x: number, y: number, theme: StageTheme['discType']) {
    ctx.save();
    ctx.translate(x, y);

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

    // Blade (Tip at (0,0), expanding to (±3.5, 8), base at (±3, 24))
    ctx.beginPath();
    ctx.moveTo(0, 0); // sharp tip
    ctx.lineTo(3.5, 8);
    ctx.lineTo(3, 24);
    ctx.lineTo(-3, 24);
    ctx.lineTo(-3.5, 8);
    ctx.closePath();
    ctx.fillStyle = bladeColor;
    ctx.fill();

    // Metallic centerline shine
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crossguard
    ctx.fillStyle = guardColor;
    ctx.fillRect(-6.5, 24, 13, 3.5);

    // Handle Grip
    ctx.fillStyle = handleColor;
    ctx.fillRect(-2.5, 27.5, 5, 16);

    // Pommel (end of handle)
    ctx.fillStyle = guardColor;
    ctx.beginPath();
    ctx.arc(0, 45.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const throwKnife = () => {
    if (gameOver || gameStateRef.current.flyingKnife || gameStateRef.current.shattering || gameStateRef.current.deflectingKnife) return;
    tg.haptic('light');
    gameStateRef.current.flyingKnife = { y: 285 };
  };

  const restart = () => {
    tg.haptic('medium');
    setScore(0);
    setStage(1);
    setKnivesLeft(7);
    setGameOver(false);
    setStageClearedTitle(null);
    gameStateRef.current = {
      rotation: 0,
      speed: 0.035,
      targetKnives: [],
      flyingKnife: null,
      deflectingKnife: null,
      gameOver: false,
      recoil: 0,
      shattering: false,
      shatterPieces: [],
      particles: [],
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      {/* Top Header */}
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <Zap size={14} className="text-amber-400 fill-amber-400" />
            <h2 className="text-xs font-semibold text-zinc-100">Bosqich {stage}</h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Ball: {score}</span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Main Interactive Arena (tap anywhere on stage to throw) */}
      <div
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          throwKnife();
        }}
        className="flex-1 flex flex-col items-center justify-center p-3 relative cursor-pointer"
      >
        {/* Stage Clear Banner */}
        {stageClearedTitle && (
          <div className="absolute top-8 z-20 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono tracking-wider animate-bounce shadow-lg">
            🎉 {stageClearedTitle}
          </div>
        )}

        {/* Knife Hit Canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={380}
          className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 shadow-2xl"
        />

        {/* Knives Ammo Counter Bar */}
        <div className="flex items-center justify-center space-x-1.5 mt-3 pointer-events-none">
          {Array.from({ length: knivesLeft }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-6 rounded-xs bg-gradient-to-t from-orange-600 to-amber-400 shadow-xs border border-orange-700/50"
            />
          ))}
        </div>

        {/* Tap guide */}
        <p className="text-[11px] text-zinc-500 mt-2 font-mono pointer-events-none">
          Pichoq otish uchun ekranni bosing 👆
        </p>

        {/* Game Over Modal */}
        {gameOver && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30"
          >
            <h3 className="text-xl font-black text-white mb-1">O‘yin tugadi!</h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">
              To‘plangan ball: <span className="text-amber-400 font-bold">{score}</span>
            </p>
            <button
              onClick={restart}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md active:scale-95"
            >
              Qayta boshlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
