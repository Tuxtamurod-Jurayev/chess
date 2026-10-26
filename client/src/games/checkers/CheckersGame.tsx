import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Bot, Users, Trophy, Crown } from 'lucide-react';
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
      }, 500);
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

    // No moves = white wins
    setWinner('white');
  };

  const isValidMove = (r1: number, c1: number, r2: number, c2: number, piece: Piece): boolean => {
    if (r2 < 0 || r2 >= 8 || c2 < 0 || c2 >= 8) return false;
    if (board[r2][c2] !== null) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;

    // Normal 1-step move
    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
      if (piece.isKing) return true;
      return piece.side === 'white' ? dr === -1 : dr === 1;
    }

    // 2-step jump capture
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

    // Check King promotion
    if ((piece.side === 'white' && r2 === 0) || (piece.side === 'black' && r2 === 7)) {
      piece.isKing = true;
      tg.haptic('medium');
    }

    // Check if jump captured
    if (Math.abs(r2 - r1) === 2) {
      const midR = (r1 + r2) / 2;
      const midC = (c1 + c2) / 2;
      newBoard[midR][midC] = null;
      tg.haptic('heavy');
    }

    newBoard[r2][c2] = piece;
    setBoard(newBoard);

    // Check if any pieces remaining for opponent
    const nextTurn = turn === 'white' ? 'black' : 'white';
    const opponentPieces = newBoard.flat().filter((p) => p?.side === nextTurn);

    if (opponentPieces.length === 0) {
      setWinner(turn);
      if (turn === 'white') {
        confetti({ particleCount: 90, spread: 80 });
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Shashka (Checkers)</h2>
          <span className="text-[10px] text-slate-400">Navbat: {turn === 'white' ? 'Oqlar' : 'Qoralar'}</span>
        </div>
        <button onClick={restart} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Rejim:</span>
            <button
              onClick={() => setVsBot(!vsBot)}
              className="px-3 py-1 bg-slate-800 text-blue-400 font-bold rounded-lg text-xs"
            >
              {vsBot ? '🤖 Botga qarshi' : '👥 1v1 Lokal'}
            </button>
          </div>
          <span className="text-xs font-bold text-slate-300">
            {turn === 'white' ? '⚪ Oqlar yurishi' : '⚫ Qoralar yurishi'}
          </span>
        </div>

        {/* 8x8 Board */}
        <div className="relative aspect-square w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-2 shadow-2xl my-auto">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-2xl overflow-hidden">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center cursor-pointer ${
                      isDark ? 'bg-amber-900/80' : 'bg-amber-100/90'
                    } ${isSelected ? '!bg-amber-400' : ''}`}
                  >
                    {cell && (
                      <div
                        className={`w-4/5 h-4/5 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          cell.side === 'white'
                            ? 'bg-slate-100 border-2 border-slate-300 text-slate-900'
                            : 'bg-slate-950 border-2 border-slate-700 text-amber-400'
                        } ${isSelected ? 'scale-110' : ''}`}
                      >
                        {cell.isKing && <Crown size={14} className="fill-current" />}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {winner && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center mt-2">
            <h3 className="text-lg font-bold">
              {winner === 'white' ? 'Oqlar g‘alaba qozondi! 🎉' : 'Qoralar g‘alaba qozondi! 🤖'}
            </h3>
            <button
              onClick={restart}
              className="mt-2 py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs"
            >
              Qayta o‘ynash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
