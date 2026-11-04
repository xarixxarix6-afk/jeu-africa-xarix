import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import {
  playerProfileService,
  AVAILABLE_AVATARS,
  getRankTitle,
} from '../services/playerProfileService';
import {
  avatarGeneratorService,
  RANK_TIERS,
  getRankTierFromWins,
  RankTier,
} from '../services/avatarGeneratorService';
import { sound } from '../services/sound';
import { tacticalVoice } from '../services/tacticalVoice';
import {
  UserPlus,
  Users,
  Check,
  Trophy,
  Award,
  X,
  Edit2,
  Trash2,
  Sparkles,
  Shield,
  RefreshCw,
  Crown,
} from 'lucide-react';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfilesChanged: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  onProfilesChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'list'>('register');
  const [newPseudo, setNewPseudo] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👑');
  const [selectedArchetype, setSelectedArchetype] = useState<'king' | 'queen' | 'warrior' | 'cyber'>('king');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPseudo, setEditPseudo] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const profiles = playerProfileService.getProfiles();
  const activeP1 = playerProfileService.getActiveP1();
  const activeP2 = playerProfileService.getActiveP2();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPseudo.trim()) return;

    sound.playPromotion();
    const created = playerProfileService.registerPlayer(newPseudo, selectedAvatar, selectedArchetype);
    playerProfileService.setActiveP1(created.id);
    setNewPseudo('');
    setFeedbackMsg(`Bienvenue dans le salon, ${created.pseudo} ! Portrait IA impérial généré.`);

    tacticalVoice.speak(`Bienvenue dans le salon de défi, ${created.pseudo}. Portrait IA généré selon votre rang.`);

    onProfilesChanged();
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('list');
    }, 1200);
  };

  const handleRegeneratePortrait = (id: string) => {
    sound.playPromotion();
    playerProfileService.regenerateAiPortrait(id, selectedArchetype);
    onProfilesChanged();
    setFeedbackMsg('Nouveau portrait IA généré selon votre rang !');
    setTimeout(() => setFeedbackMsg(null), 2000);
  };

  const handleSelectP1 = (id: string) => {
    sound.playMove();
    playerProfileService.setActiveP1(id);
    onProfilesChanged();
  };

  const handleSelectP2 = (id: string) => {
    sound.playMove();
    playerProfileService.setActiveP2(id);
    onProfilesChanged();
  };

  const handleStartEdit = (profile: PlayerProfile) => {
    setEditingId(profile.id);
    setEditPseudo(profile.pseudo);
  };

  const handleSaveEdit = (id: string) => {
    if (!editPseudo.trim()) return;
    sound.playMove();
    playerProfileService.updatePlayer(id, { pseudo: editPseudo });
    setEditingId(null);
    onProfilesChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#251006] via-[#160a04] to-[#0d0502] border-2 border-[#ffd700] rounded-2xl p-4 text-[#f3e5d8] shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d4a017]/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7a3917] to-[#d4a017] flex items-center justify-center border border-[#ffd700] shadow">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-royal font-extrabold text-[#ffd700] uppercase tracking-wide">
                Identités des Joueurs
              </h2>
              <div className="text-[10px] text-[#d8b28a]">
                Inscription • Pseudos • Avatars
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 text-[#d8b28a] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-black/40 p-1 mt-3 border border-[#d4a017]/30">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-[#7a3917] to-[#d4a017] text-white shadow'
                : 'text-[#d8b28a] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>S'inscrire</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-[#7a3917] to-[#d4a017] text-white shadow'
                : 'text-[#d8b28a] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Profils ({profiles.length})</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* TAB 1: REGISTER NEW PLAYER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="mt-3.5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#ffd700] mb-1">
                Pseudo personnalisé du joueur :
              </label>
              <input
                type="text"
                value={newPseudo}
                onChange={(e) => setNewPseudo(e.target.value)}
                placeholder="Ex : Nathan, Guerrier_Ombre, Reine_Amina..."
                maxLength={20}
                required
                className="w-full px-3 py-2 bg-black/60 border border-[#d4a017]/60 rounded-xl text-white placeholder-stone-500 text-xs focus:outline-none focus:border-[#ffd700] transition-colors"
              />
            </div>

            {/* Archetype selector for dynamic AI portrait */}
            <div>
              <label className="block text-xs font-semibold text-[#ffd700] mb-1.5 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Style du portrait IA (selon le rang) :</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'king', label: 'Roi / Empereur', icon: '👑' },
                  { id: 'queen', label: 'Reine Solaire', icon: '🧕' },
                  { id: 'warrior', label: 'Guerrier Élite', icon: '⚔️' },
                  { id: 'cyber', label: 'Cyber Stratège', icon: '⚡' },
                ].map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetype(arch.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedArchetype === arch.id
                        ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 font-bold shadow'
                        : 'bg-black/40 border-stone-700 text-stone-300 hover:bg-[#381809]'
                    }`}
                  >
                    <span className="text-base block">{arch.icon}</span>
                    <span className="text-[9px] block mt-0.5 truncate">{arch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ffd700] mb-1.5">
                Emblème royal / insigne :
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.icon;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.icon)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#8a4214] to-[#e6b800] border-2 border-white scale-105 shadow-lg'
                          : 'bg-black/40 border border-[#d4a017]/30 hover:bg-[#381809]'
                      }`}
                      title={av.label}
                    >
                      <span className="text-xl">{av.icon}</span>
                      <span className="text-[8px] text-amber-200 mt-0.5 truncate w-full text-center">
                        {av.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!newPseudo.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-[#914618] via-[#d4a017] to-[#7a3917] hover:brightness-110 disabled:opacity-50 border border-[#ffd700] rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#ffd700]" />
                <span>Créer et Générer le Portrait IA</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PROFILES LIST & PLAYER ROLES */}
        {activeTab === 'list' && (
          <div className="mt-3 space-y-2.5">
            {/* Active Players Assignment Bar */}
            <div className="p-2.5 bg-black/50 border border-[#d4a017]/40 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                Assignation des Joueurs Actifs
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2">
                  {activeP1.customPortraitUrl ? (
                    <img
                      src={activeP1.customPortraitUrl}
                      alt={activeP1.pseudo}
                      className="w-8 h-8 rounded-lg border border-[#ffd700] object-cover shrink-0 bg-black/60"
                    />
                  ) : (
                    <span className="text-xl">{activeP1.avatar}</span>
                  )}
                  <div className="truncate">
                    <div className="text-[9px] text-[#ffd700] font-bold">Joueur 1 (Or)</div>
                    <div className="font-semibold text-white truncate">{activeP1.pseudo}</div>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center gap-2">
                  {activeP2.customPortraitUrl ? (
                    <img
                      src={activeP2.customPortraitUrl}
                      alt={activeP2.pseudo}
                      className="w-8 h-8 rounded-lg border border-red-400 object-cover shrink-0 bg-black/60"
                    />
                  ) : (
                    <span className="text-xl">{activeP2.avatar}</span>
                  )}
                  <div className="truncate">
                    <div className="text-[9px] text-red-300 font-bold">Joueur 2 (Acajou)</div>
                    <div className="font-semibold text-white truncate">{activeP2.pseudo}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profiles Cards */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {profiles.map((p) => {
                const isP1 = p.id === activeP1.id;
                const isP2 = p.id === activeP2.id;
                const total = p.stats.gamesPlayed || 0;
                const winRate = total > 0 ? Math.round((p.stats.wins / total) * 100) : 0;
                const isEditing = editingId === p.id;
                const rankTier = p.rankTier || getRankTierFromWins(p.stats.wins);
                const rankInfo = RANK_TIERS[rankTier];

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isP1
                        ? 'bg-[#3b1c0b] border-[#ffd700] shadow'
                        : isP2
                        ? 'bg-[#2e1008] border-red-500/60 shadow'
                        : 'bg-black/40 border-[#d4a017]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.customPortraitUrl ? (
                          <img
                            src={p.customPortraitUrl}
                            alt={p.pseudo}
                            className="w-10 h-10 rounded-xl border-2 object-cover shrink-0 bg-black/60"
                            style={{ borderColor: rankInfo.color }}
                          />
                        ) : (
                          <span className="text-2xl p-1 bg-black/40 rounded-lg border border-[#d4a017]/30">
                            {p.avatar}
                          </span>
                        )}

                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editPseudo}
                                onChange={(e) => setEditPseudo(e.target.value)}
                                className="px-1.5 py-0.5 bg-black text-xs text-white border border-[#ffd700] rounded w-28"
                              />
                              <button
                                onClick={() => handleSaveEdit(p.id)}
                                className="p-1 bg-emerald-600 rounded text-white text-[10px]"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white">{p.pseudo}</span>
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="text-stone-400 hover:text-amber-300 cursor-pointer"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          <div className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1">
                            <span style={{ color: rankInfo.color }}>{rankInfo.badge}</span>
                            <span style={{ color: rankInfo.color }} className="font-bold">
                              {rankInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Select as P1 / P2 buttons & Regenerate */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRegeneratePortrait(p.id)}
                          className="p-1 rounded bg-black/50 text-[#ffd700] hover:bg-black/70 border border-[#d4a017]/40 text-[10px] transition-all cursor-pointer"
                          title="Régénérer portrait IA selon mon rang"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleSelectP1(p.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            isP1
                              ? 'bg-[#ffd700] text-black'
                              : 'bg-black/50 text-[#d8b28a] hover:text-white border border-[#d4a017]/40'
                          }`}
                          title="Assigner en Joueur 1"
                        >
                          P1 {isP1 && '✓'}
                        </button>

                        <button
                          onClick={() => handleSelectP2(p.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            isP2
                              ? 'bg-red-500 text-white'
                              : 'bg-black/50 text-[#d8b28a] hover:text-white border border-[#d4a017]/40'
                          }`}
                          title="Assigner en Joueur 2"
                        >
                          P2 {isP2 && '✓'}
                        </button>
                      </div>
                    </div>

                    {/* Stats snippet */}
                    <div className="mt-2 pt-1.5 border-t border-[#d4a017]/15 flex items-center justify-between text-[10px] text-[#c9a785]">
                      <span>
                        Victoires: <strong className="text-amber-300">{p.stats.wins}</strong> /{' '}
                        {p.stats.gamesPlayed}
                      </span>
                      <span>
                        Taux: <strong className="text-emerald-400">{winRate}%</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-[#d4a017]/30">
          <button
            onClick={onClose}
            className="w-full py-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/30 rounded-xl text-[#d8b28a] text-xs font-semibold cursor-pointer transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
