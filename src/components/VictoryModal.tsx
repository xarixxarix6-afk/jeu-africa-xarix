import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { sound } from '../services/sound';
import { tacticalVoice } from '../services/tacticalVoice';

interface VictoryModalProps {
  winner: string;
  winnerAvatar?: string;
  isOpen: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  winnerAvatar,
  isOpen,
  onRestart,
  onHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playVictory();
      tacticalVoice.announceVictory(winner);

      // Launch multi-burst royal confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.6 },
        colors: ['#ffd700', '#d4a017', '#c92a2a', '#2b8a3e', '#f59f00', '#ffffff'],
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#2a1308] to-[#120602] border-2 border-[#ffd700] rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow halo */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#d4a017]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#8a4214] to-[#e6b800] p-1 shadow-xl mb-3 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#1e0a03] flex items-center justify-center text-3xl">
            {winnerAvatar ? (
              <span className="animate-bounce">{winnerAvatar}</span>
            ) : (
              <Trophy className="w-10 h-10 text-[#ffd700] animate-bounce" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-royal font-extrabold text-[#ffd700] uppercase tracking-wider">
          Victoire Royale !
        </h2>

        <p className="text-xs text-[#d8b28a] mt-1">
          Gloire au triomphe, à la sagesse et à la tactique
        </p>

        <div className="mt-4 px-4 py-2.5 bg-[#3f1c0b] border border-[#d4a017]/60 rounded-xl flex items-center justify-center gap-2 shadow">
          {winnerAvatar && <span className="text-xl">{winnerAvatar}</span>}
          <span className="text-sm font-bold text-amber-200">
            {winner}
          </span>
        </div>

        <div className="w-full space-y-2 mt-6">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-[#914618] to-[#5a2408] hover:from-[#aa521d] hover:to-[#6d2c0b] border border-[#ffd700] rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#ffd700]" />
            <span>Rejouer la Partie</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 bg-black/40 hover:bg-black/60 border border-[#d4a017]/30 rounded-xl text-[#d8b28a] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#cca072]" />
            <span>Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
