import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Heart, Zap, Check, X, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

interface Equation {
  text: string;
  isCorrect: boolean;
}

export const MathBattleGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, showToast } = useAppStore();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [equation, setEquation] = useState<Equation>(() => generateEquation());
  const [timeLeft, setTimeLeft] = useState(100); // percentage 100 -> 0
  const [gameOver, setGameOver] = useState(false);

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
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 9) + 2;
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

  // Timer tick (countdown 3 seconds per equation)
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 2) {
          handleAnswer(null); // Timeout is treated as wrong
          return 100;
        }
        return t - 2.5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver, lives, combo]);

  const handleAnswer = (userChoice: boolean | null) => {
    if (gameOver) return;

    if (userChoice !== null && userChoice === equation.isCorrect) {
      // Correct!
      tg.haptic('light');
      const addedPoints = 10 * combo;
      setScore((s) => s + addedPoints);
      setCombo((c) => Math.min(5, c + 1));
      setTimeLeft(100);
      setEquation(generateEquation());
    } else {
      // Wrong or timeout
      tg.haptic('error');
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Math Battle (Duel)</h2>
          <span className="text-[10px] text-slate-400">Tezkor hisoblash</span>
        </div>
        <button onClick={restartGame} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Top Status Bar: Lives & Combo & Score */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
          {/* Hearts */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                size={20}
                className={heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}
              />
            ))}
          </div>

          {/* Combo */}
          {combo > 1 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-black text-amber-400 animate-bounce">
              <Zap size={14} className="fill-amber-400" />
              <span>x{combo} COMBO</span>
            </div>
          )}

          {/* Score */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ochko</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{score}</span>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-4">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              timeLeft > 50 ? 'bg-emerald-500' : timeLeft > 25 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        {/* Big Equation Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 border-2 border-slate-800 rounded-3xl p-8 flex items-center justify-center shadow-2xl my-auto">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white drop-shadow-md">
            {equation.text}
          </span>
        </div>

        {/* Action Buttons: False or True */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="py-6 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-xl flex flex-col items-center justify-center space-y-1 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <X size={32} />
            <span className="text-sm">NOTO‘G‘RI</span>
          </button>

          <button
            onClick={() => handleAnswer(true)}
            className="py-6 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex flex-col items-center justify-center space-y-1 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Check size={32} />
            <span className="text-sm">TO‘G‘RI</span>
          </button>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
              <Trophy size={48} className="text-amber-400 mx-auto mb-2" />
              <h3 className="text-2xl font-black mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-slate-400 mb-4">
                Yakuniy natija: <span className="font-bold text-emerald-400 font-mono">{score} ochko</span>
              </p>
              <button
                onClick={restartGame}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-95"
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
