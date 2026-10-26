import React, { useState } from 'react';
import { Users, Gift, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { tg } from '../services/telegram.js';

export const FriendsPage: React.FC = () => {
  const { user, showToast } = useAppStore();
  const [copied, setCopied] = useState(false);

  const botUsername = 'TelegramGamesPortalBot'; // Configure your bot username
  const inviteLink = `https://t.me/${botUsername}?startapp=ref_${user?.telegramId || '123'}`;

  const handleShare = () => {
    tg.haptic('medium');
    const text = '🎮 Telegram Mini-O‘yinlar portalida men bilan 1v1 Shaxmat yoki boshqa 10 xil o‘yinda bellashing! Bepul tangalar oling!';
    tg.openShare(text, inviteLink);
  };

  const handleCopy = () => {
    tg.haptic('light');
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      showToast('Havola nusxalandi!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Users size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-black text-white">Do‘stlarni Taklif Qilish</h2>
        <p className="text-xs text-slate-400 mt-1">
          Har bir taklif qilingan do‘stingiz uchun <span className="text-amber-400 font-bold">+100 tanga</span> oling!
        </p>
      </div>

      {/* Rewards Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Gift size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Taklif Bonusi</h4>
            <p className="text-[11px] text-slate-400">Do‘stingiz portalga kirganda ikkalangizga ham bonus beriladi</p>
          </div>
        </div>

        {/* Invite link box */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2 mt-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 bg-transparent text-xs text-slate-300 font-mono outline-hidden px-1 truncate"
          />
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
            title="Nusxalash"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Share buttons */}
        <button
          onClick={handleShare}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <Share2 size={16} />
          <span>Telegram orqali ulashish</span>
        </button>
      </div>

      {/* Friends list mock */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Taklif qilingan do‘stlar (0)
        </h4>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-500 text-xs">
          Hozircha hech kim taklif qilinmagan. Havolani yuboring va birinchi bo‘lib bonuslarni yig‘ing!
        </div>
      </div>
    </div>
  );
};
