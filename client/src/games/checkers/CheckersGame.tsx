import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Crown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';

interface Piece {
  id: string;
  side: 'white' | 'black';
  isKing: boolean;
}

type BoardState = (Piece | null)[][];

export const CheckersGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, updateCoins } = useAppStore();
  const [board, setBoard] = useState<BoardState>(() => initCheckersBoard());
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [vsBot, setVsBot] = useState(true);
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);

  function initCheckersBoard(): BoardState {
    const b: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) b[r][c] = { id: `b_${r}_${c}`, side: 'black', isKing: false };
          else if (r > 4) b[r][c] = { id: `w_${r}_${c}`, side: 'white', isKing: false };
        }
      }
    }
    return b;
  }

  // Bot move
  useEffect(() => {
    if (vsBot && turn === 'black' && !winner) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [turn, vsBot, winner, board]);

  const makeBotMove = () => {
    const blackPieces: { r: number; c: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.side === 'black') blackPieces.push({ r, c });
      }
    }

    // Try jumps first
    for (const p of blackPieces) {
      for (const dr of [2, -2]) {
        for (const dc of [2, -2]) {
          const targetR = p.r + dr;
          const targetC = p.c + dc;
          if (isValidMove(p.r, p.c, targetR, targetC, board[p.r][p.c]!)) {
            executeMove(p.r, p.c, targetR, targetC);
            return;
          }
        }
      }
    }

    // Normal forward moves
    for (const p of blackPieces) {
      for (const dc of [-1, 1]) {
        const targetR = p.r + 1;
        const targetC = p.c + dc;
        if (isValidMove(p.r, p.c, targetR, targetC, board[p.r][p.c]!)) {
          executeMove(p.r, p.c, targetR, targetC);
          return;
        }
      }
    }

    setWinner('white');
  };

  const isValidMove = (r1: number, c1: number, r2: number, c2: number, piece: Piece): boolean => {
    if (r2 < 0 || r2 >= 8 || c2 < 0 || c2 >= 8) return false;
    if (board[r2][c2] !== null) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;

    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
      if (piece.isKing) return true;
      return piece.side === 'white' ? dr === -1 : dr === 1;
    }

    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
      const midR = (r1 + r2) / 2;
      const midC = (c1 + c2) / 2;
      const midPiece = board[midR][midC];
      return midPiece !== null && midPiece.side !== piece.side;
    }

    return false;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (winner || (vsBot && turn === 'black')) return;

    const piece = board[r][c];

    if (selectedPos) {
      if (selectedPos.r === r && selectedPos.c === c) {
        setSelectedPos(null);
        return;
      }

      const selPiece = board[selectedPos.r][selectedPos.c]!;
      if (isValidMove(selectedPos.r, selectedPos.c, r, c, selPiece)) {
        executeMove(selectedPos.r, selectedPos.c, r, c);
        setSelectedPos(null);
        return;
      }
    }

    if (piece && piece.side === turn) {
      tg.haptic('select');
      setSelectedPos({ r, c });
    } else {
      setSelectedPos(null);
    }
  };

  const executeMove = (r1: number, c1: number, r2: number, c2: number) => {
    tg.haptic('light');
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[r1][c1]!;
    newBoard[r1][c1] = null;

    if ((piece.side === 'white' && r2 === 0) || (piece.side === 'black' && r2 === 7)) {
      piece.isKing = true;
    }

    if (Math.abs(r2 - r1) === 2) {
      const midR = (r1 + r2) / 2;
      const midC = (c1 + c2) / 2;
      newBoard[midR][midC] = null;
    }

    newBoard[r2][c2] = piece;
    setBoard(newBoard);

    const nextTurn = turn === 'white' ? 'black' : 'white';
    const opponentPieces = newBoard.flat().filter((p) => p?.side === nextTurn);

    if (opponentPieces.length === 0) {
      setWinner(turn);
      if (turn === 'white') {
        confetti({ particleCount: 50, spread: 60 });
        tg.haptic('success');
        if (user) updateCoins(user.coins + 25);
      }
    } else {
      setTurn(nextTurn);
    }
  };

  const restart = () => {
    tg.haptic('medium');
    setBoard(initCheckersBoard());
    setTurn('white');
    setSelectedPos(null);
    setWinner(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Shashka</h2>
          <span className="text-[10px] text-zinc-500 font-mono">
            {turn === 'white' ? 'Oqlar navbati' : 'Qoralar navbati'}
          </span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* Minimal mode toggle */}
        <div className="flex items-center justify-between py-1">
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

          <span className="text-[11px] font-mono text-zinc-400">
            {turn === 'white' ? '⚪ Siz' : '⚫ Raqib'}
          </span>
        </div>

        {/* Minimal 8x8 Board */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-zinc-800 my-auto shadow-md">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                      isDark ? 'bg-[#27272a]' : 'bg-[#18181b]'
                    } ${isSelected ? '!bg-zinc-600' : ''}`}
                  >
                    {cell && (
                      <div
                        className={`w-3/4 h-3/4 rounded-full flex items-center justify-center shadow-xs transition-transform ${
                          cell.side === 'white'
                            ? 'bg-zinc-100 border border-white text-zinc-900'
                            : 'bg-zinc-800 border border-zinc-600 text-zinc-300'
                        } ${isSelected ? 'scale-105' : ''}`}
                      >
                        {cell.isKing && <Crown size={12} className="stroke-[2.5]" />}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {winner && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center mt-2 animate-fade-in">
            <h3 className="text-sm font-semibold text-zinc-100">
              {winner === 'white' ? 'Oqlar g‘alaba qozondi' : 'Qoralar g‘alaba qozondi'}
            </h3>
            <button
              onClick={restart}
              className="mt-2.5 py-1.5 px-4 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
            >
              Qayta o‘ynash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
