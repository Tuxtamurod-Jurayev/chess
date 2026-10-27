import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Building2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

interface Block {
  x: number;
  y: number;
  width: number;
  floorNum: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
}

export const TowerBlocksGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('tower_blocks_best') || '0');
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);

  const blockHeight = 26;

  const gameStateRef = useRef({
    stack: [] as Block[],
    currentBlock: { x: 0, width: 140, dir: 1, speed: 2.8 },
    fallingPieces: [] as Array<{
      x: number;
      y: number;
      width: number;
      vy: number;
      rot: number;
      vrot: number;
      floorNum: number;
    }>,
    particles: [] as Particle[],
    score: 0,
    gameOver: false,
    cameraY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset initial stack with ground floor foundation
    gameStateRef.current.stack = [
      {
        x: (canvas.width - 150) / 2,
        y: canvas.height - blockHeight - 25,
        width: 150,
        floorNum: 0,
      },
    ];
    gameStateRef.current.fallingPieces = [];
    gameStateRef.current.particles = [];
    gameStateRef.current.currentBlock = { x: 0, width: 150, dir: 1, speed: 2.8 };
    gameStateRef.current.score = 0;
    gameStateRef.current.gameOver = false;
    gameStateRef.current.cameraY = 0;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameStateRef.current;

      // Night Sky Background Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.65, '#0b1329');
      skyGrad.addColorStop(1, '#172554');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant City Skyline Silhouette at bottom
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      for (let i = 0; i < 8; i++) {
        const bx = i * 44;
        const bw = 38;
        const bh = 40 + ((i * 37) % 55);
        ctx.fillRect(bx, canvas.height - bh, bw, bh);
      }

      ctx.save();
      // Apply smooth camera offset as building rises
      ctx.translate(0, state.cameraY);

      // Draw Placed Building Floors
      for (let i = 0; i < state.stack.length; i++) {
        const b = state.stack[i];
        drawBuildingFloor(ctx, b.x, b.y, b.width, blockHeight, b.floorNum, i === 0);

        // If top-most placed floor, draw antenna / roof decoration
        if (i === state.stack.length - 1 && i > 0) {
          drawRooftopSpire(ctx, b.x + b.width / 2, b.y);
        }
      }

      // Draw Falling Cut Building Chunks
      for (let i = state.fallingPieces.length - 1; i >= 0; i--) {
        const p = state.fallingPieces[i];
        p.y += p.vy;
        p.vy += 0.45;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + blockHeight / 2);
        ctx.rotate(p.rot);
        drawBuildingFloor(ctx, -p.width / 2, -blockHeight / 2, p.width, blockHeight, p.floorNum, false);
        ctx.restore();

        if (p.y - state.cameraY > canvas.height + 60) {
          state.fallingPieces.splice(i, 1);
        }
      }

      // Draw Glass / Concrete Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.25;
        pt.life -= 0.04;

        if (pt.life <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = pt.life;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Active Moving Floor
      if (!state.gameOver) {
        const topBlock = state.stack[state.stack.length - 1];
        const curY = topBlock.y - blockHeight;

        state.currentBlock.x += state.currentBlock.speed * state.currentBlock.dir;
        if (state.currentBlock.x + state.currentBlock.width >= canvas.width - 2) {
          state.currentBlock.dir = -1;
        } else if (state.currentBlock.x <= 2) {
          state.currentBlock.dir = 1;
        }

        drawBuildingFloor(
          ctx,
          state.currentBlock.x,
          curY,
          state.currentBlock.width,
          blockHeight,
          state.stack.length,
          false,
          true
        );
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Draw Realistic Building Floor (Etaj)
  function drawBuildingFloor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    floorNum: number,
    isGroundLobby = false,
    isMoving = false
  ) {
    if (width <= 0) return;

    ctx.save();

    // Architectural color theme per 10 floors
    let wallColor = '#1e293b'; // slate dark granite
    let trimColor = '#475569';
    let glassLit = '#fef08a'; // warm interior amber
    let glassDim = '#0369a1'; // blue tint office
    let frameColor = '#090d16';

    if (floorNum >= 20) {
      wallColor = '#064e3b';
      trimColor = '#059669';
      glassLit = '#6ee7b7';
      glassDim = '#047857';
    } else if (floorNum >= 10) {
      wallColor = '#451a03';
      trimColor = '#9a3412';
      glassLit = '#fed7aa';
      glassDim = '#b45309';
    }

    // Concrete / Steel Wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, y, width, height);

    // Architectural concrete floor dividers / slabs
    ctx.fillStyle = trimColor;
    ctx.fillRect(x, y, width, 2.5); // top slab
    ctx.fillRect(x, y + height - 2.5, width, 2.5); // bottom slab

    if (isGroundLobby) {
      // Ground Entrance Floor
      const doorW = Math.min(36, width * 0.45);
      const doorX = x + (width - doorW) / 2;
      const doorY = y + 4;
      const doorH = height - 6.5;

      // Canopy
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(doorX - 4, y + 2, doorW + 8, 2);

      // Glass Sliding Doors
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(doorX, doorY, doorW / 2 - 1, doorH);
      ctx.fillRect(doorX + doorW / 2 + 1, doorY, doorW / 2 - 1, doorH);

      // Pillars
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 4, y + 3, 5, height - 6);
      ctx.fillRect(x + width - 9, y + 3, 5, height - 6);
    } else {
      // Standard Storey Windows
      const winW = 8;
      const winH = height - 8;
      const spacing = 5;
      const slot = winW + spacing;
      const count = Math.floor((width - 6) / slot);

      if (count > 0) {
        const startX = x + (width - (count * slot - spacing)) / 2;
        for (let i = 0; i < count; i++) {
          const wx = startX + i * slot;
          const wy = y + 4;

          // Window frame
          ctx.fillStyle = frameColor;
          ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);

          // Illuminated vs Dim Windows
          const isLit = (floorNum * 7 + i * 11) % 10 < 6;
          ctx.fillStyle = isLit ? glassLit : glassDim;
          ctx.fillRect(wx, wy, winW, winH);

          // Horizontal mullion / bar
          ctx.fillStyle = frameColor;
          ctx.fillRect(wx, wy + winH / 2 - 0.5, winW, 1);

          // Light reflection sheen
          if (isLit) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + 3, wy);
            ctx.lineTo(wx, wy + 4);
            ctx.fill();
          }
        }
      }
    }

    // Outer subtle outline
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }

  // Rooftop Spire with flashing aircraft beacon
  function drawRooftopSpire(ctx: CanvasRenderingContext2D, centerX: number, topY: number) {
    ctx.save();
    // Metal mast
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX, topY - 14);
    ctx.stroke();

    // Red warning beacon
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, topY - 15, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX, topY - 15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const dropBlock = () => {
    const state = gameStateRef.current;
    if (state.gameOver) return;

    tg.haptic('light');
    const topBlock = state.stack[state.stack.length - 1];
    const cur = state.currentBlock;

    const diff = cur.x - topBlock.x;
    if (Math.abs(diff) >= cur.width) {
      // Missed completely -> Collapse
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

    // Perfect placement tolerance
    const isPerfect = Math.abs(diff) < 4;
    if (isPerfect) {
      newWidth = topBlock.width;
      newX = topBlock.x;
      tg.haptic('medium');
    }

    const nextY = topBlock.y - blockHeight;
    const floorIndex = state.stack.length;

    // Spawn falling cut facade piece
    if (!isPerfect) {
      const cutWidth = Math.abs(diff);
      const cutX = diff > 0 ? topBlock.x + newWidth : cur.x;
      state.fallingPieces.push({
        x: cutX,
        y: nextY,
        width: cutWidth,
        vy: 1.5,
        rot: 0,
        vrot: (diff > 0 ? 1 : -1) * 0.05,
        floorNum: floorIndex,
      });

      // Scatter concrete / glass spark particles
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: cutX + cutWidth / 2,
          y: nextY + blockHeight / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.7) * 5,
          r: Math.random() * 2.5 + 1,
          color: Math.random() < 0.5 ? '#94a3b8' : '#38bdf8',
          life: 1,
        });
      }
    }

    state.stack.push({
      x: newX,
      y: nextY,
      width: newWidth,
      floorNum: floorIndex,
    });

    // Smooth camera pan down as skyscraper grows
    if (nextY + state.cameraY < 180) {
      state.cameraY += blockHeight;
    }

    state.score += 1;
    setScore(state.score);

    if (state.score > bestScore) {
      setBestScore(state.score);
      try {
        localStorage.setItem('tower_blocks_best', state.score.toString());
      } catch {}
    }

    if (state.score > 0 && state.score % 10 === 0) {
      confetti({ particleCount: 30, spread: 50 });
    }

    state.currentBlock.width = newWidth;
    state.currentBlock.x = 0;
    state.currentBlock.speed = Math.min(6.2, 2.8 + state.score * 0.12);
  };

  const restart = () => {
    tg.haptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameStateRef.current = {
      stack: [
        {
          x: (canvas.width - 150) / 2,
          y: canvas.height - blockHeight - 25,
          width: 150,
          floorNum: 0,
        },
      ],
      currentBlock: { x: 0, width: 150, dir: 1, speed: 2.8 },
      fallingPieces: [],
      particles: [],
      score: 0,
      gameOver: false,
      cameraY: 0,
    };
    setScore(0);
    setGameOver(false);
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-center min-w-[75px]">
            <span className="text-[10px] text-zinc-500 block uppercase font-mono tracking-wider flex items-center justify-center gap-1">
              <Building2 size={10} /> Etaj
            </span>
            <span className="text-sm font-bold text-white font-mono">{score}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-center min-w-[75px]">
            <span className="text-[10px] text-amber-400 flex items-center justify-center gap-1 uppercase font-mono tracking-wider">
              <Trophy size={10} /> Rekord
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono">{bestScore}</span>
          </div>
        </div>

        <button
          onClick={restart}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
          title="Qayta boshlash"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Main Canvas Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div
          onClick={dropBlock}
          className="relative w-full max-w-[340px] aspect-[3/4] bg-zinc-950 border-2 border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl cursor-pointer active:scale-[0.99] transition-transform"
        >
          <canvas ref={canvasRef} width={340} height={450} className="w-full h-full block" />

          {/* Building Height Tag */}
          <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs border border-zinc-800/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-300">
            🏙️ {score > 0 ? score * 3 : 0} metr balandlik
          </div>

          {/* Game Over Screen */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-20">
              <h3 className="text-lg font-bold text-white mb-1">Bino quladi! 🏗️</h3>
              <p className="text-xs text-zinc-400 mb-1 font-mono">Qurilgan etajlar: {score}</p>
              <p className="text-[11px] text-indigo-400 mb-4 font-mono">Balandlik: {score * 3} metr</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
              >
                Qaytadan qurish
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-500 mt-3 font-mono">
          Yangi etajni aniq ustiga tushirish uchun ekranga bosing
        </p>
      </div>
    </div>
  );
};
