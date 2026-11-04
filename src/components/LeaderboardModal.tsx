import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { playerProfileService } from '../services/playerProfileService';
import { Trophy, Medal, Crown, X, Flame, Award, Shield, User } from 'lucide-react';
import { sound } from '../services/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayerId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  activePlayerId,
}) => {
  const [filter, setFilter] = useState<'all' | 'top5'>('all');
  const allRanked = playerProfileService.getLeaderboard();

  if (!isOpen) return null;

  const top3 = allRanked.slice(0, 3);
  const displayList = filter === 'top5' ? allRanked.slice(0, 5) : allRanked;

  const handleClose = () => {
    sound.playMove();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-b from-[#2e1408] via-[#1a0a04] to-[#0c0402] border-2 border-[#d4a017] rounded-3xl shadow-[0_0_50px_rgba(212,160,23,0.35)] flex flex-col overflow-hidden">
        {/* Top Carved Header */}
        <div className="p-4 bg-gradient-to-b from-[#3a180a] to-[#200c05] border-b-2 border-[#d4a017] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl border border-amber-300 shadow">
              <Trophy className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-royal font-bold text-[#ffd700] tracking-wide uppercase">
                Classement Général
              </h2>
              <p className="text-[11px] text-[#cca072]">
                Panthéon des Maîtres & Souverains Africains
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Podium Top 3 */}
          {top3.length >= 3 && (
            <div className="pt-2 pb-1 px-1">
              <div className="grid grid-cols-3 gap-2 items-end">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-1">
                    {top3[1].customPortraitUrl ? (
                      <img
                        src={top3[1].customPortraitUrl}
                        alt={top3[1].pseudo}
                        className="w-12 h-12 rounded-2xl border-2 border-stone-300 object-cover shadow bg-black/60"
                      />
                    ) : (
                      <span className="text-2xl p-1.5 bg-black/50 rounded-2xl border border-stone-400 inline-block">
                        {top3[1].avatar}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-stone-300 text-stone-900 font-extrabold text-[10px] rounded-full flex items-center justify-center border border-white shadow">
                      2
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-stone-200 truncate max-w-[85px] text-center">
                    {top3[1].pseudo}
                  </div>
                  <div className="text-[10px] text-stone-300 font-mono font-bold">
                    {top3[1].stats.wins} victoires
                  </div>
                  <div className="w-full h-16 mt-2 bg-gradient-to-t from-stone-800 to-stone-600 rounded-t-xl border-t-2 border-x border-stone-400 flex flex-col items-center justify-center shadow-inner">
                    <Medal className="w-4 h-4 text-stone-200" />
                    <span className="text-[10px] font-bold text-stone-200 uppercase">Argent</span>
                  </div>
                </div>

                {/* 1st Place (King / Champion) */}
                <div className="flex flex-col items-center">
                  <Crown className="w-5 h-5 text-amber-300 drop-shadow animate-bounce mb-0.5" />
                  <div className="relative mb-1">
                    {top3[0].customPortraitUrl ? (
                      <img
                        src={top3[0].customPortraitUrl}
                        alt={top3[0].pseudo}
                        className="w-14 h-14 rounded-2xl border-2 border-[#ffd700] object-cover shadow-[0_0_15px_rgba(255,215,0,0.5)] bg-black/60"
                      />
                    ) : (
                      <span className="text-3xl p-2 bg-black/60 rounded-2xl border-2 border-[#ffd700] inline-block shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                        {top3[0].avatar}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-300 to-amber-600 text-black font-extrabold text-xs rounded-full flex items-center justify-center border border-white shadow">
                      1
                    </span>
                  </div>
                  <div className="text-xs font-black text-[#ffd700] truncate max-w-[95px] text-center drop-shadow">
                    {top3[0].pseudo}
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono font-bold">
                    {top3[0].stats.wins} victoires
                  </div>
                  <div className="w-full h-22 mt-2 bg-gradient-to-t from-[#57270b] via-[#853e14] to-[#a3521b] rounded-t-xl border-t-2 border-x-2 border-[#ffd700] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(212,160,23,0.3)]">
                    <Trophy className="w-5 h-5 text-[#ffd700] drop-shadow" />
                    <span className="text-[11px] font-extrabold text-[#ffd700] uppercase tracking-wider">
                      Or 1er
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-1">
                    {top3[2].customPortraitUrl ? (
                      <img
                        src={top3[2].customPortraitUrl}
                        alt={top3[2].pseudo}
                        className="w-12 h-12 rounded-2xl border-2 border-amber-700 object-cover shadow bg-black/60"
                      />
                    ) : (
                      <span className="text-2xl p-1.5 bg-black/50 rounded-2xl border border-amber-700 inline-block">
                        {top3[2].avatar}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-700 text-amber-100 font-extrabold text-[10px] rounded-full flex items-center justify-center border border-amber-400 shadow">
                      3
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-300 truncate max-w-[85px] text-center">
                    {top3[2].pseudo}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono font-bold">
                    {top3[2].stats.wins} victoires
                  </div>
                  <div className="w-full h-12 mt-2 bg-gradient-to-t from-[#361708] to-[#692e10] rounded-t-xl border-t-2 border-x border-amber-700 flex flex-col items-center justify-center shadow-inner">
                    <Medal className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Bronze</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center justify-between border-y border-[#d4a017]/30 py-2">
            <span className="text-xs font-bold text-amber-200">
              Total Souverains : {allRanked.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-[#7a3917] text-[#ffd700] border border-[#ffd700]'
                    : 'bg-black/30 text-stone-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('top5')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === 'top5'
                    ? 'bg-[#7a3917] text-[#ffd700] border border-[#ffd700]'
                    : 'bg-black/30 text-stone-400 hover:text-white'
                }`}
              >
                Top 5
              </button>
            </div>
          </div>

          {/* Full List */}
          <div className="space-y-2">
            {displayList.map((player, idx) => {
              const rank = idx + 1;
              const isCurrent = player.id === activePlayerId;
              const winRate =
                player.stats.gamesPlayed > 0
                  ? Math.round((player.stats.wins / player.stats.gamesPlayed) * 100)
                  : 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#4d230f] to-[#2c1206] border-[#ffd700] ring-1 ring-[#ffd700]/50 shadow-md'
                      : rank === 1
                      ? 'bg-[#3b190a]/80 border-amber-500/60'
                      : 'bg-black/40 border-[#d4a017]/30 hover:border-[#d4a017]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-black font-extrabold shadow'
                          : rank === 2
                          ? 'bg-stone-300 text-stone-900 font-bold'
                          : rank === 3
                          ? 'bg-amber-700 text-amber-100 font-bold'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Avatar / Dynamic Portrait */}
                    {player.customPortraitUrl ? (
                      <img
                        src={player.customPortraitUrl}
                        alt={player.pseudo}
                        className="w-8 h-8 rounded-lg border border-[#ffd700]/70 object-cover shrink-0 bg-black/60"
                      />
                    ) : (
                      <span className="text-xl p-1 bg-black/40 rounded-lg border border-[#d4a017]/30">
                        {player.avatar}
                      </span>
                    )}

                    {/* Pseudo & Title */}
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate max-w-[110px] ${
                            isCurrent ? 'text-[#ffd700]' : 'text-stone-100'
                          }`}
                        >
                          {player.pseudo}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/40">
                            VOUS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#c9a785] truncate max-w-[130px]">
                        {player.title}
                      </div>
                    </div>
                  </div>

                  {/* Stats columns */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-200">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{player.stats.wins} vict.</span>
                    </div>
                    <div className="text-[10px] text-[#cca072] mt-0.5">
                      {winRate}% ratio • {player.stats.gamesPlayed} m.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-[#200c05] to-[#140602] border-t border-[#d4a017]/40 flex items-center justify-between text-[11px] text-[#cca072]">
          <span>Gagnez des parties pour grimper au Panthéon</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-gradient-to-r from-[#7a3917] to-[#451b08] hover:from-[#92451d] hover:to-[#57230b] border border-[#d4a017] rounded-xl text-white font-bold text-xs shadow transition-all active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
