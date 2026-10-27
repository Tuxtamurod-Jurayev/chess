import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';
import { LumberjackCharacter } from './LumberjackCharacter.js';

type BranchPos = 'none' | 'left' | 'right';

interface TreeSegment {
  id: number;
  branch: BranchPos;
}

interface FlyingLog {
  id: number;
  direction: 'left' | 'right';
}

interface WoodParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
}

export const TimberjackGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const [playerSide, setPlayerSide] = useState<'left' | 'right'>('left');
  const [tree, setTree] = useState<TreeSegment[]>(() => generateInitialTree());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [isChopping, setIsChopping] = useState(false);
  const [flyingLogs, setFlyingLogs] = useState<FlyingLog[]>([]);
  const [particles, setParticles] = useState<WoodParticle[]>([]);
  const [treeShake, setTreeShake] = useState(false);
  const [lastTappedSide, setLastTappedSide] = useState<'left' | 'right' | null>(null);
  const [scorePops, setScorePops] = useState<{ id: number; text: string }[]>([]);

  const gameOverRef = useRef(false);
  gameOverRef.current = gameOver;

  function generateInitialTree(): TreeSegment[] {
    const segments: TreeSegment[] = [];
    for (let i = 0; i < 6; i++) {
      segments.push({
        id: i,
        branch: i < 2 ? 'none' : getRandomBranch(),
      });
    }
    return segments;
  }

  function getRandomBranch(): BranchPos {
    const r = Math.random();
    if (r < 0.45) return 'none';
    return r < 0.72 ? 'left' : 'right';
  }

  useEffect(() => {
    if (!started || gameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.4) {
          handleGameOver();
          return 0;
        }
        return t - 0.42; // Generous ~12s comfortable timer
      });
    }, 50);

    return () => clearInterval(interval);
  }, [started, gameOver]);

  // Clean up flying logs
  useEffect(() => {
    if (flyingLogs.length === 0) return;
    const timeout = setTimeout(() => {
      setFlyingLogs((logs) => logs.slice(1));
    }, 400);
    return () => clearTimeout(timeout);
  }, [flyingLogs]);

  // Clean up particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = setTimeout(() => {
      setParticles([]);
    }, 350);
    return () => clearTimeout(timeout);
  }, [particles]);

  const chop = (side: 'left' | 'right') => {
    if (gameOverRef.current) return;
    if (!started) setStarted(true);

    tg.haptic('light');
    setPlayerSide(side);
    setLastTappedSide(side);
    setTimeout(() => setLastTappedSide(null), 120);

    setIsChopping(true);
    setTimeout(() => setIsChopping(false), 130);

    // Tree horizontal shake
    setTreeShake(true);
    setTimeout(() => setTreeShake(false), 70);

    // Spawn flying log towards the opposite side
    const flyDir = side === 'left' ? 'right' : 'left';
    setFlyingLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        direction: flyDir,
      },
    ]);

    // Spawn wood splinter particles
    const newParticles: WoodParticle[] = [];
    for (let i = 0; i < 7; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: side === 'left' ? -18 : 18,
        y: 8 + Math.random() * 24,
        vx: (side === 'left' ? 1 : -1) * (Math.random() * 6 + 3),
        vy: -Math.random() * 6 - 2,
        rot: Math.random() * 360,
      });
    }
    setParticles(newParticles);

    // Floating +1 score pop
    setScorePops((prev) => [
      ...prev.slice(-3),
      { id: Date.now(), text: '+1' },
    ]);

    // Check collision with the bottom branch
    const bottomBranch = tree[0]?.branch;
    if (bottomBranch === side) {
      handleGameOver();
      return;
    }

    const newTree = tree.slice(1);
    newTree.push({
      id: Date.now() + Math.random(),
      branch: getRandomBranch(),
    });

    // Check collision with newly lowered branch
    if (newTree[0]?.branch === side) {
      setTree(newTree);
      handleGameOver();
      return;
    }

    setTree(newTree);
    setScore((s) => s + 1);
    setCombo((c) => c + 1);
    setTimeLeft((t) => Math.min(100, t + 6.8));
  };

  const handleGameOver = () => {
    tg.haptic('error');
    setGameOver(true);
    setCombo(0);
    if (user) {
      api.finishSoloGame(user.id, 'timberjack', score).catch(() => {});
    }
  };

  const restart = () => {
    tg.haptic('medium');
    setPlayerSide('left');
    setTree(generateInitialTree());
    setScore(0);
    setCombo(0);
    setTimeLeft(100);
    setGameOver(false);
    setStarted(false);
    setFlyingLogs([]);
    setParticles([]);
    setScorePops([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      {/* Top Header */}
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Timberjack</h2>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-[10px] text-zinc-400 font-mono">Zarbalar: {score}</span>
            {combo > 4 && (
              <span className="text-[10px] text-amber-400 font-bold font-mono animate-bounce flex items-center">
                <Zap size={10} className="fill-amber-400 mr-0.5" /> {combo}x
              </span>
            )}
          </div>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Timer Bar */}
        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden mb-2 p-0.5 border border-zinc-800 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-75 shadow-xs"
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        {/* Tree Stage with Vertical Split Touch Zones */}
        <div
          style={{ touchAction: 'none' }}
          className="relative flex-1 bg-gradient-to-b from-zinc-900/90 via-zinc-900 to-amber-950/20 border-2 border-zinc-800 rounded-3xl overflow-hidden flex flex-col justify-end items-center my-2 pb-6 shadow-2xl"
        >
          {/* Subtle Vertical Center Seam Line */}
          <div className="absolute inset-y-0 left-1/2 w-px border-r-2 border-dashed border-zinc-700/30 pointer-events-none z-10" />

          {/* Left Half Interactive Zone */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              chop('left');
            }}
            className={`absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer transition-colors duration-100 flex items-end justify-start p-4 ${
              lastTappedSide === 'left' ? 'bg-amber-500/15' : 'hover:bg-amber-500/5'
            }`}
          >
            <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl px-2.5 py-1 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-amber-400 select-none block">
                👈 CHAP
              </span>
            </div>
          </div>

          {/* Right Half Interactive Zone */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              chop('right');
            }}
            className={`absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer transition-colors duration-100 flex items-end justify-end p-4 ${
              lastTappedSide === 'right' ? 'bg-amber-500/15' : 'hover:bg-amber-500/5'
            }`}
          >
            <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl px-2.5 py-1 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-amber-400 select-none block">
                O‘NG 👉
              </span>
            </div>
          </div>

          {/* Floating Score Popups */}
          {scorePops.map((pop) => (
            <div
              key={pop.id}
              className="absolute bottom-28 z-30 font-mono font-black text-amber-400 text-sm animate-float pointer-events-none"
              style={{
                left: playerSide === 'left' ? '30%' : '65%',
              }}
            >
              {pop.text}
            </div>
          ))}

          {/* Tree Trunk Column with Recoil Shake */}
          <div
            className={`w-20 flex flex-col-reverse items-center relative transition-transform duration-75 ${
              treeShake ? 'scale-[0.97] translate-y-0.5' : 'scale-100'
            }`}
          >
            {tree.map((seg, idx) => (
              <div
                key={seg.id}
                className={`w-20 h-14 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-x-2 border-amber-950 relative flex items-center justify-center shrink-0 shadow-sm ${
                  idx === 0 && treeShake ? 'brightness-125' : ''
                }`}
              >
                {/* Wood bark grain textures */}
                <div className="w-full h-1 bg-amber-800/40" />
                <div className="w-full h-0.5 bg-amber-950/60 mt-2" />

                {/* Left Branch */}
                {seg.branch === 'left' && (
                  <div className="absolute right-full top-2 w-16 h-8 bg-gradient-to-l from-amber-900 to-amber-950 rounded-l-full border-t border-b border-amber-800 shadow-lg flex items-center">
                    <div className="w-7 h-7 bg-emerald-600 rounded-full -left-2 -top-1 absolute shadow-sm border border-emerald-500" />
                    <div className="w-5 h-5 bg-emerald-500 rounded-full -left-1 top-2 absolute shadow-sm" />
                  </div>
                )}

                {/* Right Branch */}
                {seg.branch === 'right' && (
                  <div className="absolute left-full top-2 w-16 h-8 bg-gradient-to-r from-amber-900 to-amber-950 rounded-r-full border-t border-b border-amber-800 shadow-lg flex items-center">
                    <div className="w-7 h-7 bg-emerald-600 rounded-full -right-2 -top-1 absolute shadow-sm border border-emerald-500" />
                    <div className="w-5 h-5 bg-emerald-500 rounded-full -right-1 top-2 absolute shadow-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Animated Vector Lumberjack Character */}
          <div
            className={`absolute bottom-5 transition-all duration-100 z-10 pointer-events-none ${
              playerSide === 'left' ? 'left-5' : 'right-5'
            }`}
          >
            <LumberjackCharacter side={playerSide} isChopping={isChopping} />
          </div>

          {/* Flying Wood Logs (spinning away on chop) */}
          {flyingLogs.map((log) => (
            <div
              key={log.id}
              className={`absolute bottom-16 w-14 h-10 bg-amber-900 border-2 border-amber-950 rounded-lg shadow-xl z-20 pointer-events-none ${
                log.direction === 'left' ? 'animate-fly-left' : 'animate-fly-right'
              }`}
            >
              <div className="w-full h-1 bg-amber-800/50 mt-1" />
            </div>
          ))}

          {/* Wood Splinter Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bottom-20 w-2 h-1 bg-amber-500 rounded-xs z-20 pointer-events-none animate-ping"
              style={{
                transform: `translate(${p.x * 2}px, ${p.y}px) rotate(${p.rot}deg)`,
              }}
            />
          ))}

          {/* Game Over Modal */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-xl font-black text-white mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-zinc-400 mb-4 font-mono">
                Kesilgan yog‘ochlar: <span className="text-amber-400 font-bold">{score}</span>
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

        {/* Bottom Guide Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              chop('left');
            }}
            className="py-4 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-850 hover:to-zinc-800 border-2 border-zinc-800 text-white font-bold text-xs active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span className="text-lg">🪓</span>
            <span>CHAPGA ZARBA</span>
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              chop('right');
            }}
            className="py-4 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-850 hover:to-zinc-800 border-2 border-zinc-800 text-white font-bold text-xs active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>O‘NGGA ZARBA</span>
            <span className="text-lg">🪓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
