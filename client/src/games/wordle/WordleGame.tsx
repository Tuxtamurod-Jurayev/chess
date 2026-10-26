import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Trophy, Delete } from 'lucide-react';
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
      confetti({ particleCount: 100, spread: 80 });
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

  const getLetterStatus = (letter: string, index: number, word: string) => {
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white safe-top safe-bottom select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">Wordle (So‘z topish)</h2>
          <span className="text-[10px] text-slate-400">5 harfli o‘zbekcha so‘z</span>
        </div>
        <button onClick={restart} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-xl active:scale-95">
          <RotateCcw size={18} />
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
                    status = getLetterStatus(letter, colIdx, guess);
                  } else if (isCurrentRow) {
                    letter = currentGuess[colIdx] || '';
                  }

                  let bgClass = 'bg-slate-900/60 border-slate-800 text-white';
                  if (status === 'correct') bgClass = 'bg-emerald-600 border-emerald-500 text-white';
                  else if (status === 'present') bgClass = 'bg-amber-500 border-amber-400 text-slate-950';
                  else if (status === 'absent') bgClass = 'bg-slate-800 border-slate-700 text-slate-400';

                  return (
                    <div
                      key={colIdx}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all ${bgClass}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Virtual Keyboard */}
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
                    className={`h-11 rounded-lg font-bold text-xs flex items-center justify-center active:scale-95 transition-all ${
                      isAction
                        ? 'px-3 bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'flex-1 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {k === 'DEL' ? <Delete size={16} /> : k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Game Over modal */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
              <Trophy size={44} className="text-amber-400 mx-auto mb-2" />
              <h3 className="text-2xl font-black mb-1">
                {won ? 'Topdingiz! 🎉' : 'Afsus, urinishlar tugadi!'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Yashiringan so‘z:{' '}
                <span className="font-bold text-cyan-400 text-sm tracking-widest">{targetWord}</span>
              </p>
              <button
                onClick={restart}
                className="w-full py-3 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs"
              >
                Yana o‘ynash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
