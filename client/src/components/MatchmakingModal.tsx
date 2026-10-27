import React, { useEffect } from 'react';
import { X, Users, Bot } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { socket } from '../services/socket.js';
import { tg } from '../services/telegram.js';

interface MatchmakingModalProps {
  onStartBotMatch: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({ onStartBotMatch }) => {
  const {
    isMatchmaking,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 relative shadow-xl text-center">
        <button
          onClick={handleCancel}
          className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80"
        >
          <X size={15} />
        </button>

        <div className="w-12 h-12 mx-auto my-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
          <Users size={20} className="animate-pulse" />
        </div>

        <h3 className="text-sm font-semibold text-zinc-100 mb-0.5">Raqib qidirilmoqda</h3>
        <p className="text-[11px] text-zinc-500 mb-3">
          Onlayn o‘yinchilar orasidan mos raqib izlanmoqda
        </p>

        <div className="inline-block px-3 py-1 bg-zinc-800/80 rounded-md text-xs font-mono text-zinc-300 mb-5 border border-zinc-700/60">
          {formatTime(matchmakingSeconds)}
        </div>

        <div className="space-y-2">
          {matchmakingSeconds >= 4 && (
            <button
              onClick={handleBotStart}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
            >
              <Bot size={14} />
              <span>Botga qarshi o‘ynash</span>
            </button>
          )}

          <button
            onClick={handleCancel}
            className="w-full py-2 px-3 rounded-xl bg-transparent hover:bg-zinc-800/50 text-zinc-400 font-medium text-xs transition-all active:scale-95"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};
