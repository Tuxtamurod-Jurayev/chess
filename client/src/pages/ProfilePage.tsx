import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
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
      name: 'Minimal Shaxmat Doskasi',
      description: 'Qora-oq toza kontrastli minimalist doska',
      priceCoins: 150,
      icon: '♟',
    },
    {
      id: 'skin_knife_gold',
      name: 'Klassik Pichoq (Knife Hit)',
      description: 'Po‘lat qoplamali minimalist pichoq',
      priceCoins: 200,
      icon: '🗡',
    },
    {
      id: 'skin_snake_cyber',
      name: 'Neon Ilon (Snake)',
      description: 'Toza yashil minimalist iloncha',
      priceCoins: 100,
      icon: '🐍',
    },
    {
      id: 'stars_coins_pack',
      name: '500 Tangalar To‘plami',
      description: 'Telegram Stars orqali xarid qilish',
      priceStars: 50,
      icon: '⭐',
    },
  ];

  const handleBuy = (item: typeof storeItems[0]) => {
    tg.haptic('medium');
    if (purchasedSkins.includes(item.id)) {
      showToast('Allaqachon mavjud');
      return;
    }

    if (item.priceCoins) {
      if (user.coins < item.priceCoins) {
        showToast('Tangalar yetarli emas');
        return;
      }
      updateCoins(user.coins - item.priceCoins);
      setPurchasedSkins((prev) => [...prev, item.id]);
      confetti({ particleCount: 40, spread: 50 });
      showToast(`${item.name} xarid qilindi`);
    } else if (item.priceStars) {
      updateCoins(user.coins + 500);
      confetti({ particleCount: 50, spread: 60 });
      showToast('+500 tanga qo‘shildi');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      {/* Profile Overview Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 text-center">
        <div className="w-14 h-14 mx-auto mb-2.5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 overflow-hidden">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>

        <h3 className="text-sm font-bold text-zinc-100">{user.firstName}</h3>
        <p className="text-[11px] text-zinc-500 font-mono">@{user.username}</p>

        {/* 3 Stats Minimal */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-center">
          <div>
            <span className="text-[10px] text-zinc-500 block">O‘yinlar</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{user.totalMatches}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">G‘alabalar</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{user.totalWins}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">G‘alaba %</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* ELO Summary */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 divide-y divide-zinc-800/60 text-xs">
        <div className="py-1.5 flex items-center justify-between">
          <span className="text-zinc-400">Shaxmat ELO</span>
          <span className="font-mono font-semibold text-zinc-200">{user.eloRating?.chess || 1200}</span>
        </div>
        <div className="py-1.5 flex items-center justify-between">
          <span className="text-zinc-400">Shashka ELO</span>
          <span className="font-mono font-semibold text-zinc-200">{user.eloRating?.checkers || 1200}</span>
        </div>
        <div className="py-1.5 flex items-center justify-between">
          <span className="text-zinc-400">Math Battle ELO</span>
          <span className="font-mono font-semibold text-zinc-200">{user.eloRating?.['math-battle'] || 1200}</span>
        </div>
      </div>

      {/* Store Items */}
      <div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
          Do‘kon
        </span>
        <div className="space-y-1.5">
          {storeItems.map((item) => {
            const isOwned = purchasedSkins.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span className="font-medium text-zinc-200 block">{item.name}</span>
                    <span className="text-[10px] text-zinc-500">{item.description}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={isOwned}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center space-x-1 ${
                    isOwned
                      ? 'bg-zinc-800/60 text-zinc-500'
                      : 'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Check size={12} />
                      <span>Olingan</span>
                    </>
                  ) : item.priceCoins ? (
                    <span>{item.priceCoins} tanga</span>
                  ) : (
                    <span>{item.priceStars} Stars</span>
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
