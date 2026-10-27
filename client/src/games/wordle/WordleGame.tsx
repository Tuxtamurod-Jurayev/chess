import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Delete } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { tg } from '../../services/telegram.js';

const UZBEK_WORDS = [
  'KITOB', 'SHAHAR', 'BAHOR', 'QUYOSH', 'DUNYO', 'VAQTI', 'INSON', 'DAVLAT',
  'MEHRI', 'ZAMON', 'HAYOT', 'ORZUS', 'UMMON', 'KATTA', 'BILIM', 'OSMON',
  'SHODIK', 'SAODAT', 'BULOQ', 'OLMOS', 'YULDUZ'
].filter(w => w.length === 5);

export const WordleGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, updateCoins } = useAppStore();
  const [targetWord, setTargetWord] = useState(() => getRandomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  function getRandomWord() {
    return UZBEK_WORDS[Math.floor(Math.random() * UZBEK_WORDS.length)] || 'KITOB';
  }

  const handleKeyPress = (letter: string) => {
    if (gameOver) return;
    if (currentGuess.length < 5) {
      tg.haptic('light');
      setCurrentGuess((prev) => prev + letter);
    }
  };

  const handleDelete = () => {
    if (gameOver) return;
    tg.haptic('light');
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (gameOver || currentGuess.length !== 5) return;

    tg.haptic('medium');
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
      confetti({ particleCount: 50, spread: 60 });
      tg.haptic('success');
      if (user) updateCoins(user.coins + 25);
    } else if (newGuesses.length >= 6) {
      setGameOver(true);
      tg.haptic('error');
    }

    setCurrentGuess('');
  };

  const restart = () => {
    tg.haptic('medium');
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
  };

  const getLetterStatus = (letter: string, index: number) => {
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 safe-top safe-bottom select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-semibold text-zinc-100">Wordle</h2>
          <span className="text-[10px] text-zinc-500 font-mono">5 harfli so‘z</span>
        </div>
        <button onClick={restart} className="p-1.5 -mr-1.5 text-zinc-400 hover:text-white rounded-lg active:scale-95">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full p-4 flex flex-col justify-between">
        {/* 6x5 Grid */}
        <div className="space-y-1.5 my-auto">
          {Array.from({ length: 6 }).map((_, rowIdx) => {
            const guess = guesses[rowIdx];
            const isCurrentRow = rowIdx === guesses.length;

            return (
              <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }).map((_, colIdx) => {
                  let letter = '';
                  let status = 'empty';

                  if (guess) {
                    letter = guess[colIdx];
                    status = getLetterStatus(letter, colIdx);
                  } else if (isCurrentRow) {
                    letter = currentGuess[colIdx] || '';
                  }

                  let bgClass = 'bg-zinc-900/60 border-zinc-800 text-zinc-300';
                  if (status === 'correct') bgClass = 'bg-zinc-200 border-zinc-200 text-zinc-950 font-bold';
                  else if (status === 'present') bgClass = 'bg-zinc-700 border-zinc-600 text-zinc-100';
                  else if (status === 'absent') bgClass = 'bg-zinc-900 border-zinc-850 text-zinc-600';

                  return (
                    <div
                      key={colIdx}
                      className={`h-11 rounded-lg border flex items-center justify-center font-mono font-bold text-sm transition-all ${bgClass}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Minimal Keyboard */}
        <div className="space-y-1.5 mt-4">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map((k) => {
                const isAction = k === 'ENTER' || k === 'DEL';
                return (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === 'ENTER') handleEnter();
                      else if (k === 'DEL') handleDelete();
                      else handleKeyPress(k);
                    }}
                    className={`h-10 rounded-md font-mono font-medium text-[11px] flex items-center justify-center active:scale-95 transition-colors ${
                      isAction
                        ? 'px-2.5 bg-zinc-850 text-zinc-300'
                        : 'flex-1 bg-zinc-900 border border-zinc-800/80 text-zinc-200'
                    }`}
                  >
                    {k === 'DEL' ? <Delete size={14} /> : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 text-center shadow-xl">
              <h3 className="text-base font-bold text-zinc-100 mb-1">
                {won ? 'Topdingiz' : 'Urinishlar tugadi'}
              </h3>
              <p className="text-xs text-zinc-500 mb-4 font-mono">
                So‘z: <span className="text-zinc-200 font-semibold">{targetWord}</span>
              </p>
              <button
                onClick={restart}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs active:scale-95"
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
