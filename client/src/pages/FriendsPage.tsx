import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const FriendsPage: React.FC = () => {
  const { user, showToast } = useAppStore();
  const [copied, setCopied] = useState(false);

  const botUsername = 'my_game001_bot';
  const inviteLink = `https://t.me/${botUsername}?startapp=ref_${user?.telegramId || '123'}`;

  const handleShare = () => {
    tg.haptic('medium');
    const text = '🎮 Do‘stlar bilan birga o‘ynash uchun taklifnoma:';
    tg.openShare(text, inviteLink);
  };

  const handleCopy = () => {
    tg.haptic('light');
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      showToast('Havola nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      <div>
        <h2 className="text-base font-bold text-zinc-100">Do‘stlarni Taklif Qilish</h2>
        <p className="text-xs text-zinc-500">
          Har bir taklif qilingan do‘stingiz uchun <span className="text-zinc-200 font-semibold">+100 tanga</span>
        </p>
      </div>

      {/* Link card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 bg-transparent text-xs text-zinc-300 font-mono outline-hidden px-1 truncate"
          />
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition-all"
            title="Nusxalash"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <Share2 size={14} />
          <span>Telegram orqali ulashish</span>
        </button>
      </div>

      <div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
          Taklif qilinganlar (0)
        </span>
        <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 text-center text-zinc-500 text-xs">
          Do‘stlaringizga havola yuborib birgalikda o‘ynang.
        </div>
      </div>
    </div>
  );
};
