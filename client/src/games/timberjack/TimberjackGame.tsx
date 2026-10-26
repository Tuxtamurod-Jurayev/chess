import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Trophy, Axe } from 'lucide-react';
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
    if (r < 0.4) return 'none';
    return r < 0.7 ? 'left' : 'right';
  }

  // Timer countdown
  useEffect(() => {
    if (!started || gameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleGameOver('Vaqt tugadi!');
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

    // Check if current bottom segment branch hits player
    const bottomBranch = tree[0]?.branch;
    if (bottomBranch === side) {
      handleGameOver('Shox tegdi!');
      return;
    }

    // New tree state: remove bottom, check next segment above
    const newTree = tree.slice(1);
    newTree.push({
      id: Date.now() + Math.random(),
      branch: getRandomBranch(),
    });

    // Check if new bottom segment branch now hits the player
    if (newTree[0]?.branch === side) {
      setTree(newTree);
      handleGameOver('Shox tegdi!');
      return;
    }

    setTree(newTree);
    setScore((s) => s + 1);
    setTimeLeft((t) => Math.min(100, t + 4));
  };

  const handleGameOver = (reason: string) => {
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Timberjack (Daraxt kesish)</h2>
          <span className="text-[10px] text-slate-400">Zarbalar: {score}</span>
        </div>
        <button onClick={restart} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Time Progress */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              timeLeft > 50 ? 'bg-amber-400' : timeLeft > 25 ? 'bg-orange-500' : 'bg-rose-500'
            }`}
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        {/* Tree & Woodcutter Stage */}
        <div className="relative flex-1 bg-gradient-to-b from-slate-900 to-amber-950/20 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col justify-end items-center my-2">
          {/* Tree Trunk Column */}
          <div className="w-20 flex flex-col-reverse items-center relative mb-6">
            {tree.map((seg, idx) => (
              <div
                key={seg.id}
                className="w-16 h-12 bg-amber-800 border-x-2 border-amber-900 relative flex items-center justify-center shrink-0 shadow-sm"
              >
                {/* Wood texture ring */}
                <div className="w-full h-1 bg-amber-700/60" />

                {/* Left Branch */}
                {seg.branch === 'left' && (
                  <div className="absolute right-full top-2 w-16 h-8 bg-amber-900 rounded-l-full border-t border-b border-amber-700 shadow-md">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full -left-2 -top-1 absolute" />
                  </div>
                )}

                {/* Right Branch */}
                {seg.branch === 'right' && (
                  <div className="absolute left-full top-2 w-16 h-8 bg-amber-900 rounded-r-full border-t border-b border-amber-700 shadow-md">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full -right-2 -top-1 absolute" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Player Woodcutter */}
          <div
            className={`absolute bottom-6 transition-all duration-75 ${
              playerSide === 'left' ? 'left-8' : 'right-8'
            }`}
          >
            <div className="w-12 h-14 bg-red-600 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg border border-red-500">
              <span className="text-base">🧔</span>
              <Axe size={16} className="text-amber-300" />
            </div>
          </div>

          {/* Game Over dialog */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <Trophy size={44} className="text-amber-400 mb-2" />
              <h3 className="text-2xl font-black mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-slate-400 mb-4">Kesilgan yog‘ochlar: <span className="font-bold text-amber-300">{score}</span></p>
              <button
                onClick={restart}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Qaytadan boshlash
              </button>
            </div>
          )}
        </div>

        {/* Chop Left / Right Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button
            onClick={() => chop('left')}
            className="py-6 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 flex flex-col items-center justify-center font-bold text-sm shadow-md"
          >
            <span className="text-2xl mb-1">👈</span>
            <span>CHAPGA ZARBA</span>
          </button>
          <button
            onClick={() => chop('right')}
            className="py-6 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 flex flex-col items-center justify-center font-bold text-sm shadow-md"
          >
            <span className="text-2xl mb-1">👉</span>
            <span>O‘NGGA ZARBA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
