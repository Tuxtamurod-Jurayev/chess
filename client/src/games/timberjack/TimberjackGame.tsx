import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

type BranchPos = 'none' | 'left' | 'right';

interface TreeSegment {
  id: number;
  branch: BranchPos;
}

export const TimberjackGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const [playerSide, setPlayerSide] = useState<'left' | 'right'>('left');
  const [tree, setTree] = useState<TreeSegment[]>(() => generateInitialTree());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [isChopping, setIsChopping] = useState(false);
  const [flyingWood, setFlyingWood] = useState<{ id: number; side: 'left' | 'right' } | null>(null);

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
        if (t <= 1) {
          handleGameOver();
          return 0;
        }
        return t - 1.2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [started, gameOver]);

  const chop = (side: 'left' | 'right') => {
    if (gameOver) return;
    if (!started) setStarted(true);

    tg.haptic('light');
    setPlayerSide(side);
    setIsChopping(true);
    setTimeout(() => setIsChopping(false), 160);

    // Wood chip flies away to the opposite side
    setFlyingWood({ id: Date.now(), side: side === 'left' ? 'right' : 'left' });

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

    if (newTree[0]?.branch === side) {
      setTree(newTree);
      handleGameOver();
      return;
    }

    setTree(newTree);
    setScore((s) => s + 1);
    setTimeLeft((t) => Math.min(100, t + 4.5));
  };

  const handleGameOver = () => {
    tg.haptic('error');
    setGameOver(true);
    if (user) {
      api.finishSoloGame(user.id, 'timberjack', score).catch(() => {});
    }
  };

  const restart = () => {
    tg.haptic('medium');
    setPlayerSide('left');
    setTree(generateInitialTree());
    setScore(0);
    setTimeLeft(100);
    setGameOver(false);
    setStarted(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Timberjack</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Zarbalar: {score}</span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Minimal progress */}
        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-zinc-300 transition-all duration-75"
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        {/* Minimalist Tree Stage */}
        <div className="relative flex-1 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-end items-center my-2 pb-6">
          {/* Tree Trunk */}
          <div className="w-14 flex flex-col-reverse items-center relative">
            {tree.map((seg) => (
              <div
                key={seg.id}
                className="w-12 h-11 bg-zinc-800 border-x border-zinc-700/80 relative flex items-center justify-center shrink-0"
              >
                {/* Branches */}
                {seg.branch === 'left' && (
                  <div className="absolute right-full top-2.5 w-12 h-5 bg-zinc-700 rounded-l-md" />
                )}
                {seg.branch === 'right' && (
                  <div className="absolute left-full top-2.5 w-12 h-5 bg-zinc-700 rounded-r-md" />
                )}
              </div>
            ))}
          </div>

          {/* Minimal Woodcutter with Chop Swing */}
          <div
            className={`absolute bottom-6 transition-all duration-75 ${
              playerSide === 'left' ? 'left-10' : 'right-10'
            } ${isChopping ? 'animate-chop' : ''}`}
          >
            <div className="w-9 h-11 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-950 font-bold text-xs shadow-xs">
              🪓
            </div>
          </div>

          {/* Flying Wood Chip Particle */}
          {flyingWood && (
            <div
              key={flyingWood.id}
              className={`absolute bottom-10 w-4 h-3 bg-zinc-600 rounded-xs ${
                flyingWood.side === 'left' ? 'left-16 animate-fly-left' : 'right-16 animate-fly-right'
              }`}
            />
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin tugadi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">Natija: {score}</p>
              <button
                onClick={restart}
                className="py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
              >
                Qayta boshlash
              </button>
            </div>
          )}
        </div>

        {/* Minimal Tap Controls */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => chop('left')}
            className="py-5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium text-xs active:scale-95 transition-all"
          >
            Chapga
          </button>
          <button
            onClick={() => chop('right')}
            className="py-5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium text-xs active:scale-95 transition-all"
          >
            O‘ngga
          </button>
        </div>
      </div>
    </div>
  );
};
