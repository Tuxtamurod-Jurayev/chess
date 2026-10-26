import React, { useEffect } from 'react';
import { Loader2, Bot, X, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { socket } from '../services/socket.js';
import { tg } from '../services/telegram.js';

interface MatchmakingModalProps {
  onStartBotMatch: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({ onStartBotMatch }) => {
  const {
    isMatchmaking,
    matchmakingGameId,
    matchmakingSeconds,
    incrementMatchmakingSeconds,
    setMatchmaking,
  } = useAppStore();

  useEffect(() => {
    let timer: any;
    if (isMatchmaking) {
      timer = setInterval(() => {
        incrementMatchmakingSeconds();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMatchmaking, incrementMatchmakingSeconds]);

  if (!isMatchmaking) return null;

  const handleCancel = () => {
    tg.haptic('light');
    socket.emit('leave_queue');
    setMatchmaking(false);
  };

  const handleBotStart = () => {
    tg.haptic('medium');
    socket.emit('leave_queue');
    setMatchmaking(false);
    onStartBotMatch();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl text-center">
        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X size={18} />
        </button>

        {/* Radar Animation */}
        <div className="relative w-28 h-28 mx-auto my-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border border-blue-500/40 animate-pulse"></div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Users size={28} className="text-white animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Raqib qidirilmoqda...</h3>
        <p className="text-xs text-slate-400 mb-2">
          Sizning reytingingizga mos keluvchi o‘yinchi izlanyapti
        </p>

        <div className="inline-block px-3 py-1 bg-slate-800/80 rounded-full text-xs font-mono text-blue-400 mb-6 border border-slate-700/60">
          Kutilmoqda: {formatTime(matchmakingSeconds)}
        </div>

        <div className="space-y-2.5">
          {matchmakingSeconds >= 5 && (
            <button
              onClick={handleBotStart}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all active:scale-95 animate-fade-in"
            >
              <Bot size={16} />
              <span>Kutmasdan Botga qarshi o‘ynash</span>
            </button>
          )}

          <button
            onClick={handleCancel}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
          >
            Qidiruvni bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};
