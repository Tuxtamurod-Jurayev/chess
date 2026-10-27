import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Heart, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

interface Equation {
  text: string;
  isCorrect: boolean;
}

export const MathBattleGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [equation, setEquation] = useState<Equation>(() => generateEquation());
  const [timeLeft, setTimeLeft] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [floatingScore, setFloatingScore] = useState<{ amount: number; id: number } | null>(null);

  function generateEquation(): Equation {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 15) + 1;
    let realAns = 0;

    if (op === '+') realAns = a + b;
    else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      realAns = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      realAns = a * b;
    }

    const isCorrect = Math.random() < 0.5;
    let displayAns = realAns;
    if (!isCorrect) {
      const delta = (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
      displayAns = Math.max(0, realAns + delta);
      if (displayAns === realAns) displayAns += 2;
    }

    return {
      text: `${a} ${op} ${b} = ${displayAns}`,
      isCorrect,
    };
  }

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAnswer(null);
          return 100;
        }
        // Much longer, comfortable thinking time (7-8 seconds)
        const drain = 0.65 + Math.min(0.35, combo * 0.06);
        return t - drain;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver, lives, combo]);

  const handleAnswer = (userChoice: boolean | null) => {
    if (gameOver) return;

    if (userChoice !== null && userChoice === equation.isCorrect) {
      tg.haptic('light');
      const pts = 10 * combo;
      setScore((s) => s + pts);
      setFloatingScore({ amount: pts, id: Date.now() });
      setCombo((c) => Math.min(5, c + 1));
      setTimeLeft(100);
      setEquation(generateEquation());
    } else {
      tg.haptic('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 320);
      setCombo(1);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setGameOver(true);
        if (user) {
          api.finishSoloGame(user.id, 'math-battle', score).catch(() => {});
        }
      } else {
        setTimeLeft(100);
        setEquation(generateEquation());
      }
    }
  };

  const restartGame = () => {
    tg.haptic('medium');
    setScore(0);
    setLives(3);
    setCombo(1);
    setTimeLeft(100);
    setEquation(generateEquation());
    setGameOver(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Math Battle</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Ball: {score}</span>
        </div>
        <button onClick={restartGame} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Status */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center space-x-1">
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                size={14}
                className={h <= lives ? 'text-zinc-200 fill-zinc-200' : 'text-zinc-800'}
              />
            ))}
          </div>

          {combo > 1 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              x{combo}
            </span>
          )}

          <span className="text-xs font-mono font-semibold text-zinc-200">{score} pts</span>
        </div>

        {/* Minimal Timer Bar */}
        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden my-3">
          <div
            className="h-full bg-zinc-400 transition-all duration-75"
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        {/* Minimal Equation Card with animation */}
        <div
          className={`bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 flex items-center justify-center my-auto relative overflow-hidden transition-all ${
            isShaking ? 'animate-shake border-rose-500/60 bg-rose-950/20' : ''
          }`}
        >
          {floatingScore && (
            <span
              key={floatingScore.id}
              className="absolute top-4 right-6 text-sm font-mono font-bold text-amber-400 animate-float pointer-events-none"
            >
              +{floatingScore.amount}
            </span>
          )}
          <span className="text-3xl sm:text-4xl font-bold font-mono text-zinc-100 tracking-wide">
            {equation.text}
          </span>
        </div>

        {/* Vibrant Action Buttons */}
        <div className="grid grid-cols-2 gap-3.5 mt-4">
          <button
            onClick={() => handleAnswer(false)}
            className="py-4 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/25 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={2.5} />
            <span>NOTO‘G‘RI</span>
          </button>

          <button
            onClick={() => handleAnswer(true)}
            className="py-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>TO‘G‘RI</span>
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 text-center shadow-xl">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin tugadi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">To‘plangan ball: {score}</p>
              <button
                onClick={restartGame}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs active:scale-95"
              >
                Qayta o‘ynash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
