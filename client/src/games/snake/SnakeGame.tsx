import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleDeath();
          return prevSnake;
        }

        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleDeath();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

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
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Iloncha (Snake)</h2>
          <span className="text-[10px] text-zinc-500 font-mono">Ball: {score}</span>
        </div>
        <button onClick={restartGame} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div className="relative aspect-square w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-2 shadow-md overflow-hidden">
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
                    <div className="w-[85%] h-[85%] bg-zinc-100 rounded-xs shadow-xs" />
                  )}
                  {isBody && (
                    <div className="w-[80%] h-[80%] bg-zinc-500 rounded-xs" />
                  )}
                  {isFood && (
                    <div className="w-[60%] h-[60%] bg-amber-400 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <button
                onClick={() => setGameStarted(true)}
                className="py-2 px-5 bg-zinc-100 text-zinc-950 rounded-xl font-semibold text-xs active:scale-95"
              >
                Boshlash
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fade-in z-30">
              <h3 className="text-base font-bold text-zinc-100 mb-1">O‘yin tugadi</h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">Ball: {score}</p>
              <button
                onClick={restartGame}
                className="py-2 px-5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
              >
                Qayta o‘ynash
              </button>
            </div>
          )}
        </div>

        {/* Minimal D-Pad */}
        <div className="mt-3 flex flex-col items-center">
          <button
            onClick={() => changeDirection('UP')}
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 mb-1 text-zinc-400"
          >
            <ChevronUp size={20} />
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => changeDirection('LEFT')}
              className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => changeDirection('DOWN')}
              className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronDown size={20} />
            </button>
            <button
              onClick={() => changeDirection('RIGHT')}
              className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center active:bg-zinc-800 active:scale-95 text-zinc-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
