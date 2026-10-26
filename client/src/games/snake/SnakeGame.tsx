import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';
import { api } from '../../services/api.js';

const GRID_SIZE = 18;
type Point = { x: number; y: number };

export const SnakeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAppStore();
  const [snake, setSnake] = useState<Point[]>([
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ]);
  const [food, setFood] = useState<Point>({ x: 12, y: 9 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  function spawnFood(currentSnake: Point[]): Point {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }

  const changeDirection = (newDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    tg.haptic('light');
    if (!gameStarted) setGameStarted(true);

    const cur = directionRef.current;
    if (newDir === 'UP' && cur !== 'DOWN') setDirection('UP');
    else if (newDir === 'DOWN' && cur !== 'UP') setDirection('DOWN');
    else if (newDir === 'LEFT' && cur !== 'RIGHT') setDirection('LEFT');
    else if (newDir === 'RIGHT' && cur !== 'LEFT') setDirection('RIGHT');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') changeDirection('UP');
      else if (e.key === 'ArrowDown') changeDirection('DOWN');
      else if (e.key === 'ArrowLeft') changeDirection('LEFT');
      else if (e.key === 'ArrowRight') changeDirection('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const speed = Math.max(80, 140 - Math.floor(score / 5) * 5);
    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleDeath();
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleDeath();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          tg.haptic('medium');
          setScore((s) => s + 10);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, food, score]);

  const handleDeath = () => {
    tg.haptic('error');
    setGameOver(true);
    if (user) {
      api.finishSoloGame(user.id, 'snake', score).catch(() => {});
    }
  };

  const restartGame = () => {
    tg.haptic('medium');
    const init = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    setSnake(init);
    setFood(spawnFood(init));
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Snake (Iloncha)</h2>
          <span className="text-[10px] text-slate-400">Ochko: {score}</span>
        </div>
        <button onClick={restartGame} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Canvas / Grid Area */}
        <div className="relative aspect-square w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-2 shadow-2xl overflow-hidden">
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);

              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.slice(1).some((seg) => seg.x === x && seg.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div key={idx} className="flex items-center justify-center">
                  {isHead && (
                    <div className="w-[90%] h-[90%] bg-emerald-400 rounded-md shadow-sm border border-emerald-300" />
                  )}
                  {isBody && (
                    <div className="w-[85%] h-[85%] bg-emerald-600 rounded-sm" />
                  )}
                  {isFood && (
                    <div className="w-[85%] h-[85%] bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Start message if not started */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <span className="text-sm font-bold mb-2">Boshlash uchun tugmalardan birini bosing</span>
              <button
                onClick={() => setGameStarted(true)}
                className="py-2.5 px-6 bg-emerald-600 rounded-xl font-bold text-xs shadow-md"
              >
                Boshlash
              </button>
            </div>
          )}

          {/* Game Over modal */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <Trophy size={40} className="text-amber-400 mb-2" />
              <h3 className="text-xl font-black mb-1">O‘yin tugadi!</h3>
              <p className="text-xs text-slate-400 mb-4">To‘plangan ochko: <span className="text-emerald-400 font-bold">{score}</span></p>
              <button
                onClick={restartGame}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs"
              >
                Qaytadan o‘ynash
              </button>
            </div>
          )}
        </div>

        {/* D-Pad Controls */}
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={() => changeDirection('UP')}
            className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 mb-1.5 shadow-sm"
          >
            <ChevronUp size={24} />
          </button>
          <div className="flex space-x-6">
            <button
              onClick={() => changeDirection('LEFT')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => changeDirection('DOWN')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 shadow-sm"
            >
              <ChevronDown size={24} />
            </button>
            <button
              onClick={() => changeDirection('RIGHT')}
              className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
