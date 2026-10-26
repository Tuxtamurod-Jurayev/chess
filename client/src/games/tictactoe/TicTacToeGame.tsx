import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Bot, Users, Trophy } from 'lucide-react';
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

  // Bot move
  useEffect(() => {
    if (vsBot && !isXNext && !winner) {
      const delay = 400;
      const timer = setTimeout(() => {
        makeBotMove();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isXNext, vsBot, winner, board]);

  const makeBotMove = () => {
    const emptyIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    // Check if bot can win immediately
    for (const idx of emptyIndices) {
      const copy = [...board];
      copy[idx] = 'O';
      if (checkWin(copy, size)) {
        commitMove(idx, 'O');
        return;
      }
    }

    // Check if player can win next, and block
    for (const idx of emptyIndices) {
      const copy = [...board];
      copy[idx] = 'X';
      if (checkWin(copy, size)) {
        commitMove(idx, 'O');
        return;
      }
    }

    // Prefer center in 3x3
    if (size === 3 && board[4] === null) {
      commitMove(4, 'O');
      return;
    }

    // Random choice
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
        confetti({ particleCount: 80, spread: 70 });
        tg.haptic('success');
        if (user) updateCoins(user.coins + 15);
      } else {
        tg.haptic('error');
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
      // 5x5: need 4 in a row
      // Rows
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c <= 1; c++) {
          const l = [r * 5 + c, r * 5 + c + 1, r * 5 + c + 2, r * 5 + c + 3];
          if (b[l[0]] && l.every((i) => b[i] === b[l[0]])) return { symbol: b[l[0]]!, line: l };
        }
      }
      // Cols
      for (let c = 0; c < 5; c++) {
        for (let r = 0; r <= 1; r++) {
          const l = [r * 5 + c, (r + 1) * 5 + c, (r + 2) * 5 + c, (r + 3) * 5 + c];
          if (b[l[0]] && l.every((i) => b[i] === b[l[0]])) return { symbol: b[l[0]]!, line: l };
        }
      }
      // Diagonals
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Tic-Tac-Toe ({size}x{size})</h2>
          <span className="text-[10px] text-slate-400">{vsBot ? 'Botga qarshi' : '1v1 Lokal'}</span>
        </div>
        <button onClick={resetGame} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Mode & Grid Size selectors */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSize(3)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                size === 3 ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              3x3
            </button>
            <button
              onClick={() => setSize(5)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                size === 5 ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              5x5
            </button>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setVsBot(true)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                vsBot ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Bot size={13} />
              <span>Bot</span>
            </button>
            <button
              onClick={() => setVsBot(false)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                !vsBot ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Users size={13} />
              <span>1v1</span>
            </button>
          </div>
        </div>

        {/* Turn indicator */}
        <div className="text-center my-3">
          <span className="text-xs text-slate-400">Navbat: </span>
          <span className={`font-black text-sm ${isXNext ? 'text-blue-400' : 'text-pink-400'}`}>
            {isXNext ? 'X (Siz)' : vsBot ? 'O (Bot)' : 'O (Do‘st)'}
          </span>
        </div>

        {/* Board Grid */}
        <div className="relative aspect-square w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-3 shadow-2xl flex items-center justify-center">
          <div
            className={`grid gap-2.5 w-full h-full ${
              size === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5'
            }`}
          >
            {board.map((cell, idx) => {
              const isWinningCell = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={`rounded-2xl flex items-center justify-center font-black transition-all active:scale-95 shadow-sm border ${
                    isWinningCell
                      ? 'bg-amber-400/20 border-amber-400 animate-pulse'
                      : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-700/80'
                  }`}
                >
                  {cell === 'X' && (
                    <span className={`text-blue-400 drop-shadow-md ${size === 3 ? 'text-4xl' : 'text-2xl'}`}>
                      X
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className={`text-pink-400 drop-shadow-md ${size === 3 ? 'text-4xl' : 'text-2xl'}`}>
                      O
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result Overlay */}
        {winner && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center mt-4">
            <h3 className="text-lg font-bold">
              {winner === 'X' ? 'X g‘alaba qozondi! 🎉' : winner === 'O' ? 'O g‘alaba qozondi! 🤖' : 'Durrang! 🤝'}
            </h3>
            <button
              onClick={resetGame}
              className="mt-2 py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs active:scale-95"
            >
              Yana o‘ynash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
