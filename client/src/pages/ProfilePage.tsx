import React, { useState } from 'react';
import { User, Coins, Flame, Award, ShoppingBag, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const ProfilePage: React.FC = () => {
  const { user, updateCoins, showToast } = useAppStore();
  const [purchasedSkins, setPurchasedSkins] = useState<string[]>(['default']);

  if (!user) return null;

  const winRate = user.totalMatches > 0 ? Math.round((user.totalWins / user.totalMatches) * 100) : 0;

  const storeItems = [
    {
      id: 'skin_chess_neon',
      name: 'Neon Shaxmat Doskasi',
      description: 'Zamonaviy kiber-neon uslubidagi doska va donalar',
      priceCoins: 150,
      icon: '♟',
    },
    {
      id: 'skin_knife_gold',
      name: 'Oltin Pichoq (Knife Hit)',
      description: 'Zarhal oltin bilan bezatilgan maxsus pichoq',
      priceCoins: 200,
      icon: '🗡',
    },
    {
      id: 'skin_snake_cyber',
      name: 'Kiber Ilon (Snake)',
      description: 'Yorqin iz qoldiruvchi futuristik iloncha',
      priceCoins: 100,
      icon: '🐍',
    },
    {
      id: 'stars_coins_pack',
      name: '500 Tangalar To‘plami',
      description: 'Telegram Stars orqali tezkor tanga xaridi',
      priceStars: 50,
      icon: '⭐',
    },
  ];

  const handleBuy = (item: typeof storeItems[0]) => {
    tg.haptic('medium');
    if (purchasedSkins.includes(item.id)) {
      showToast('Bu buyum allaqachon sotib olingan!');
      return;
    }

    if (item.priceCoins) {
      if (user.coins < item.priceCoins) {
        showToast('Tangalaringiz yetarli emas! O‘yinlar o‘ynab tanga to‘plang.');
        return;
      }
      updateCoins(user.coins - item.priceCoins);
      setPurchasedSkins((prev) => [...prev, item.id]);
      confetti({ particleCount: 70, spread: 60 });
      showToast(`${item.name} xarid qilindi!`);
    } else if (item.priceStars) {
      // Mock Stars purchase
      updateCoins(user.coins + 500);
      confetti({ particleCount: 90, spread: 70 });
      showToast('Telegram Stars: +500 tanga hisobingizga qo‘shildi!');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center relative overflow-hidden shadow-xl">
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400 p-1 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={36} />
          )}
        </div>

        <h3 className="text-lg font-black text-white">{user.firstName}</h3>
        <p className="text-xs text-slate-400 font-mono">@{user.username}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">O‘yinlar</span>
            <span className="text-sm font-black text-white font-mono">{user.totalMatches}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">G‘alabalar</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{user.totalWins}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">G‘alaba %</span>
            <span className="text-sm font-black text-blue-400 font-mono">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award size={15} className="text-amber-400" />
          <span>Shaxsiy ELO Reytinglari</span>
        </h4>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 divide-y divide-slate-800/80">
          <div className="py-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Shaxmat (Chess)</span>
            <span className="font-mono font-bold text-amber-400">{user.eloRating?.chess || 1200} ELO</span>
          </div>
          <div className="py-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Shashka (Checkers)</span>
            <span className="font-mono font-bold text-amber-400">{user.eloRating?.checkers || 1200} ELO</span>
          </div>
          <div className="py-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Math Battle</span>
            <span className="font-mono font-bold text-amber-400">{user.eloRating?.['math-battle'] || 1200} ELO</span>
          </div>
        </div>
      </div>

      {/* In-Game Store */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShoppingBag size={15} className="text-blue-400" />
          <span>O‘yin Do‘koni & Skinlar</span>
        </h4>

        <div className="space-y-3">
          {storeItems.map((item) => {
            const isOwned = purchasedSkins.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">{item.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={isOwned}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1 ${
                    isOwned
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : item.priceCoins
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Check size={13} />
                      <span>Olingan</span>
                    </>
                  ) : item.priceCoins ? (
                    <>
                      <Coins size={13} />
                      <span>{item.priceCoins}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>{item.priceStars} Stars</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
