import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Flame, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { tg } from '../services/telegram.js';

export const DailyBonusModal: React.FC = () => {
  const { user, setUser, dailyModalOpen, setDailyModalOpen, showToast } = useAppStore();
  const [loading, setLoading] = useState(false);

  if (!dailyModalOpen || !user) return null;

  const currentStreak = user.dailyStreak || 1;
  const days = [1, 2, 3, 4, 5, 6, 7];

  const handleClaim = async () => {
    setLoading(true);
    tg.haptic('medium');
    try {
      const res = await api.claimDailyBonus(user.id);
      if (res.success && res.user) {
        setUser(res.user);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        showToast(res.message);
        setTimeout(() => setDailyModalOpen(false), 1200);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('Bonus olishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 relative shadow-xl text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            tg.haptic('light');
            setDailyModalOpen(false);
          }}
          className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-500">
          <Flame size={20} />
        </div>

        <h3 className="text-base font-semibold text-zinc-100 mb-0.5">Kunlik Bonus</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Har kuni kirib seriyani uzmang va tangalarni oling
        </p>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {days.map((day) => {
            const isCompleted = day < currentStreak;
            const isCurrent = day === currentStreak;
            const reward = day * 50;

            return (
              <div
                key={day}
                className={`py-2 px-1 rounded-lg border text-center transition-all ${
                  isCompleted
                    ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                    : isCurrent
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-semibold'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-600'
                }`}
              >
                <span className="text-[9px] block text-zinc-500">{day}d</span>
                <div className="my-1 flex items-center justify-center h-4">
                  {isCompleted ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400">+{reward}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Olinmoqda...' : 'Bonusni Olish'}
        </button>
      </div>
    </div>
  );
};
