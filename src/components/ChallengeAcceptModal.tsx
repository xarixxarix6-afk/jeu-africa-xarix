import React, { useState } from 'react';
import { LiveChallenge, LudoPlayerColor } from '../types/game';
import { sound } from '../services/sound';
import {
  Swords,
  Clock,
  Shield,
  FileText,
  X,
  Sparkles,
  Users,
  Award,
  Crown,
} from 'lucide-react';

interface ChallengeAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: LiveChallenge | null;
  currentViewerPseudo?: string;
  onAccept: (customPseudo: string) => void;
  onViewReceipt: () => void;
  onRefuse?: () => void;
}

const COLOR_NAMES: Record<string, string> = {
  red: '🔴 Rouge (Roi Lion)',
  green: '🟢 Vert (Baobab Sacré)',
  yellow: '🟡 Jaune (Or Saharien)',
  blue: '🔵 Bleu (Nil Impérial)',
};

export const ChallengeAcceptModal: React.FC<ChallengeAcceptModalProps> = ({
  isOpen,
  onClose,
  challenge,
  currentViewerPseudo = 'Challenger',
  onAccept,
  onViewReceipt,
  onRefuse,
}) => {
  const [pseudoInput, setPseudoInput] = useState(() => {
    // If default pseudo is Nathan and host is Nathan, offer a clean challenger pseudo
    if (
      currentViewerPseudo.toLowerCase() === 'nathan' &&
      challenge?.challengerName.toLowerCase() === 'nathan'
    ) {
      return 'Guerrier Invité';
    }
    return currentViewerPseudo || 'Guerrier Invité';
  });

  if (!isOpen || !challenge) return null;

  const gameDisplay =
    challenge.gameType === 'checkers'
      ? `👑 Dames Africaines ${challenge.checkersVariant || 10}x${challenge.checkersVariant || 10}`
      : challenge.gameType === 'chess'
      ? '⚔️ Échecs des Rois Africains'
      : `🎲 Ludo Royal Africain (${challenge.ludoPawnsCount || 4} pions à rentrer)`;

  const dateExp = challenge.expiresAt
    ? new Date(challenge.expiresAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '24h';

  const handleConfirmAccept = () => {
    const finalPseudo = pseudoInput.trim() || 'Challenger';
    sound.playPromotion();
    onAccept(finalPseudo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2f1408] via-[#1a0a04] to-[#0c0402] border-2 border-[#ffd700] rounded-3xl shadow-[0_0_60px_rgba(255,215,0,0.5)] overflow-hidden flex flex-col">
        {/* Crown Accent Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#441909] via-[#2c1005] to-[#1a0803] border-b-2 border-[#d4a017] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl border border-amber-200 shadow-md">
              <Swords className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-royal font-black text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                <span>Défi Royal Reçu !</span>
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[9px] font-sans">
                  En Direct
                </span>
              </h2>
              <p className="text-[10px] text-[#cca072]">
                Vous êtes invité à livrer un duel d'honneur
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-[#f3e5d8]">
          {/* Challenger Banner */}
          <div className="p-3.5 bg-gradient-to-r from-[#200c05] to-[#120502] rounded-2xl border border-[#ffd700]/50 shadow-inner flex items-center gap-3">
            {challenge.portraitUrl ? (
              <img
                src={challenge.portraitUrl}
                alt={challenge.challengerName}
                className="w-14 h-14 rounded-2xl border-2 border-[#ffd700] shadow object-cover shrink-0 bg-black/60"
              />
            ) : (
              <span className="text-3xl p-2.5 bg-black/60 rounded-2xl border border-[#d4a017]/50 shrink-0">
                {challenge.avatar}
              </span>
            )}

            <div className="flex-1 truncate">
              <div className="text-[10px] text-amber-300 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Créateur du Défi</span>
              </div>
              <div className="text-base font-black text-white truncate">
                {challenge.challengerName}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Prêt dans l'arène • En attente de votre confirmation</span>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-3 bg-black/50 rounded-2xl border border-[#d4a017]/40 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Discipline :</span>
              <span className="font-bold text-amber-200">{gameDisplay}</span>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Combattants :</span>
              <span className="font-bold text-white">
                {challenge.maxPlayers || challenge.ludoPlayers || 2} Joueurs
              </span>
            </div>

            {challenge.gameType === 'ludo' && (
              <>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Pions à rentrer :</span>
                  <span className="font-bold text-amber-300">
                    {challenge.ludoPawnsCount || 4} pions (tous requis pour gagner)
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Camp du Créateur :</span>
                  <span className="font-bold text-stone-200">
                    {COLOR_NAMES[challenge.ludoPlayerColor || 'red'] || 'Rouge'}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-stone-400 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Expire à :</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">{dateExp}</span>
            </div>
          </div>

          {/* Player Pseudo Input Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#ffd700] uppercase tracking-wider block">
              Entrez votre Pseudo de Combat :
            </label>
            <input
              type="text"
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value)}
              placeholder="Ex: Tigre Noir, Souverain, Nathan..."
              maxLength={20}
              className="w-full px-3.5 py-2.5 bg-black/70 border-2 border-[#d4a017] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-[#ffd700] placeholder:text-stone-500 shadow-inner"
            />
            <span className="text-[10px] text-[#cca072] block">
              Ce nom sera affiché sur le plateau et annoncé à haute voix par l'IA.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleConfirmAccept}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl border border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Swords className="w-5 h-5 text-white" />
              <span>Accepter le Défi & Rejoindre le Duel</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onViewReceipt}
                className="py-2.5 px-2 bg-[#381608] hover:bg-[#4d1f0c] border border-[#d4a017] text-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow"
              >
                <FileText className="w-3.5 h-3.5 text-[#ffd700]" />
                <span>Voir le Reçu Officiel</span>
              </button>

              <button
                onClick={() => {
                  if (onRefuse) onRefuse();
                  onClose();
                }}
                className="py-2.5 px-2 bg-black/50 hover:bg-black/70 border border-stone-600 text-stone-300 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>Décliner / Plus tard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-[#200c05] to-[#140602] border-t border-[#d4a017]/40 text-center text-[10px] text-[#cca072]">
          Plateforme Afro-Tactique 2050 • Connexion temps réel synchronisée
        </div>
      </div>
    </div>
  );
};
