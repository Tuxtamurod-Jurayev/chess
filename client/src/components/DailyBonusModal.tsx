import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Flame, Gift, Check, Sparkles } from 'lucide-react';
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
    tg.haptic('heavy');
    try {
      const res = await api.claimDailyBonus(user.id);
      if (res.success && res.user) {
        setUser(res.user);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast(res.message);
        setTimeout(() => setDailyModalOpen(false), 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            tg.haptic('light');
            setDailyModalOpen(false);
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Flame size={32} className="text-slate-950 fill-slate-950" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Kunlik Kirish Bonusi</h3>
        <p className="text-xs text-slate-400 mb-6">
          Har kuni kirib seriyani uzmang va oshirilgan tangalarga ega bo‘ling!
        </p>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {days.map((day) => {
            const isCompleted = day < currentStreak;
            const isCurrent = day === currentStreak;
            const reward = day * 50;

            return (
              <div
                key={day}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center relative transition-all ${
                  isCompleted
                    ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                    : isCurrent
                    ? 'bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider mb-1">
                  {day}-kun
                </span>
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center my-0.5">
                    <Check size={14} className="text-emerald-400" />
                  </div>
                ) : (
                  <Gift size={20} className={isCurrent ? 'text-amber-400 animate-bounce' : 'text-slate-600'} />
                )}
                <span className="text-[11px] font-bold mt-1">+{reward}</span>
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Sparkles size={18} />
          <span>{loading ? 'Olinmoqda...' : 'Bugungi Bonusni Olish'}</span>
        </button>
      </div>
    </div>
  );
};
