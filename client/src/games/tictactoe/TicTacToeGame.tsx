import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';

export const TicTacToeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, updateCoins } = useAppStore();
  const [size, setSize] = useState<3 | 5>(3);
  const [board, setBoard] = useState<(string | null)[]>(() => Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [vsBot, setVsBot] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const totalCells = size * size;

  useEffect(() => {
    setBoard(Array(totalCells).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  }, [size, totalCells]);

  useEffect(() => {
    if (vsBot && !isXNext && !winner) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isXNext, vsBot, winner, board]);

  const makeBotMove = () => {
    const emptyIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    for (const idx of emptyIndices) {
      const copy = [...board];
      copy[idx] = 'O';
      if (checkWin(copy, size)) {
        commitMove(idx, 'O');
        return;
      }
    }

    for (const idx of emptyIndices) {
      const copy = [...board];
      copy[idx] = 'X';
      if (checkWin(copy, size)) {
        commitMove(idx, 'O');
        return;
      }
    }

    if (size === 3 && board[4] === null) {
      commitMove(4, 'O');
      return;
    }

    const chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    commitMove(chosen, 'O');
  };

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;
    if (vsBot && !isXNext) return;

    commitMove(idx, isXNext ? 'X' : 'O');
  };

  const commitMove = (idx: number, symbol: string) => {
    tg.haptic('light');
    const newBoard = [...board];
    newBoard[idx] = symbol;
    setBoard(newBoard);

    const winResult = checkWin(newBoard, size);
    if (winResult) {
      setWinner(winResult.symbol);
      setWinningLine(winResult.line);
      if (winResult.symbol === 'X') {
        confetti({ particleCount: 50, spread: 60 });
        tg.haptic('success');
        if (user) updateCoins(user.coins + 15);
      }
    } else if (newBoard.every((cell) => cell !== null)) {
      setWinner('draw');
      tg.haptic('warning');
    } else {
      setIsXNext(symbol !== 'X');
    }
  };

  function checkWin(b: (string | null)[], sz: number): { symbol: string; line: number[] } | null {
    if (sz === 3) {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (const [x, y, z] of lines) {
        if (b[x] && b[x] === b[y] && b[x] === b[z]) {
          return { symbol: b[x]!, line: [x, y, z] };
        }
      }
    } else {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c <= 1; c++) {
          const l = [r * 5 + c, r * 5 + c + 1, r * 5 + c + 2, r * 5 + c + 3];
          if (b[l[0]] && l.every((i) => b[i] === b[l[0]])) return { symbol: b[l[0]]!, line: l };
        }
      }
      for (let c = 0; c < 5; c++) {
        for (let r = 0; r <= 1; r++) {
          const l = [r * 5 + c, (r + 1) * 5 + c, (r + 2) * 5 + c, (r + 3) * 5 + c];
          if (b[l[0]] && l.every((i) => b[i] === b[l[0]])) return { symbol: b[l[0]]!, line: l };
        }
      }
      for (let r = 0; r <= 1; r++) {
        for (let c = 0; c <= 1; c++) {
          const d1 = [r * 5 + c, (r + 1) * 5 + c + 1, (r + 2) * 5 + c + 2, (r + 3) * 5 + c + 3];
          if (b[d1[0]] && d1.every((i) => b[i] === b[d1[0]])) return { symbol: b[d1[0]]!, line: d1 };
        }
        for (let c = 3; c < 5; c++) {
          const d2 = [r * 5 + c, (r + 1) * 5 + c - 1, (r + 2) * 5 + c - 2, (r + 3) * 5 + c - 3];
          if (b[d2[0]] && d2.every((i) => b[i] === b[d2[0]])) return { symbol: b[d2[0]]!, line: d2 };
        }
      }
    }
    return null;
  }

  const resetGame = () => {
    tg.haptic('medium');
    setBoard(Array(totalCells).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Tic-Tac-Toe ({size}x{size})</h2>
          <span className="text-[10px] text-zinc-500 font-mono">
            Navbat: {isXNext ? 'X (Siz)' : 'O (Raqib)'}
          </span>
        </div>
        <button onClick={resetGame} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Minimal Selectors */}
        <div className="flex items-center justify-between py-1">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setSize(3)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                size === 3 ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              3x3
            </button>
            <button
              onClick={() => setSize(5)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                size === 5 ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              5x5
            </button>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setVsBot(true)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                vsBot ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              Bot
            </button>
            <button
              onClick={() => setVsBot(false)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                !vsBot ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              Lokal
            </button>
          </div>
        </div>

        {/* Minimal Board */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-800 p-2 my-auto shadow-md bg-zinc-900/30">
          <div
            className={`grid gap-1.5 w-full h-full ${
              size === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5'
            }`}
          >
            {board.map((cell, idx) => {
              const isWinning = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={`rounded-xl flex items-center justify-center font-mono font-bold transition-all border ${
                    isWinning
                      ? 'bg-zinc-700/80 border-zinc-500 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-850'
                  }`}
                >
                  {cell === 'X' && (
                    <span className={`text-zinc-100 font-light ${size === 3 ? 'text-4xl' : 'text-xl'}`}>
                      ✕
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className={`text-zinc-400 font-light ${size === 3 ? 'text-4xl' : 'text-xl'}`}>
                      ◯
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {winner && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center mt-2 animate-fade-in">
            <h3 className="text-sm font-semibold text-zinc-100">
              {winner === 'X' ? 'X g‘alaba qozondi' : winner === 'O' ? 'O g‘alaba qozondi' : 'Durrang natija'}
            </h3>
            <button
              onClick={resetGame}
              className="mt-2 py-1.5 px-4 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
            >
              Qayta o‘ynash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
