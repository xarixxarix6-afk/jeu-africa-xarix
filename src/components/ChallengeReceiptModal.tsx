import React, { useState } from 'react';
import { LiveChallenge } from '../types/game';
import { sound } from '../services/sound';
import {
  FileText,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Shield,
  Clock,
  Users,
  Award,
  Crown,
  Lock,
  Globe,
  X,
  Swords,
  Hourglass,
} from 'lucide-react';

interface ChallengeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: LiveChallenge | null;
  currentViewerPseudo?: string;
  onAcceptChallenge?: (challenge: LiveChallenge) => void;
  onOpenWaitingRoom?: (challenge: LiveChallenge) => void;
}

const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/Hd2tGo9TU0x15Mw7GiA65T?s=cl&p=a&mlu=4&ilr=4&iam=2';

const COLOR_NAMES: Record<string, string> = {
  red: '🔴 Rouge (Roi Lion)',
  green: '🟢 Vert (Baobab Sacré)',
  yellow: '🟡 Jaune (Or Saharien)',
  blue: '🔵 Bleu (Nil Impérial)',
};

export const ChallengeReceiptModal: React.FC<ChallengeReceiptModalProps> = ({
  isOpen,
  onClose,
  challenge,
  currentViewerPseudo = 'Joueur',
  onAcceptChallenge,
  onOpenWaitingRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  if (!isOpen || !challenge) return null;

  const isActualHostSession =
    typeof window !== 'undefined' &&
    Boolean(
      sessionStorage.getItem('host_room_' + challenge.id) === 'true' ||
      sessionStorage.getItem('host_room_' + (challenge.roomCode || '')) === 'true'
    );

  const isCreator =
    isActualHostSession ||
    (!isActualHostSession &&
      typeof window !== 'undefined' &&
      !window.location.search.includes('salon=') &&
      ((challenge.challengerName || '').toLowerCase() === currentViewerPseudo.toLowerCase() ||
        (challenge.creatorPseudo || '').toLowerCase() === currentViewerPseudo.toLowerCase()));

  const isGuest = !isCreator;
  const isOpenStatus = challenge.status === 'open';

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const shareUrl = `${baseUrl}?salon=${encodeURIComponent(challenge.id)}&host=${encodeURIComponent(
    challenge.challengerName || 'Souverain'
  )}&game=${challenge.gameType}&players=${
    challenge.maxPlayers || challenge.ludoPlayers || 2
  }&pawns=${challenge.ludoPawnsCount || 4}&color=${challenge.ludoPlayerColor || 'red'}&exp=${
    challenge.expiresAt || Date.now() + 24 * 3600 * 1000
  }`;

  const receiptId = challenge.receiptId || `REC-${challenge.id.toUpperCase()}`;
  const dateEmis = new Date(challenge.createdAt || Date.now()).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateExp = challenge.expiresAt
    ? new Date(challenge.expiresAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '24 Heures';

  const gameDisplay =
    challenge.gameType === 'checkers'
      ? `👑 Dames Africaines ${challenge.checkersVariant || 10}x${challenge.checkersVariant || 10}`
      : challenge.gameType === 'chess'
      ? '⚔️ Échecs des Rois Africains'
      : `🎲 Ludo Royal Africain (${challenge.ludoPawnsCount || 4} pions à rentrer)`;

  const formattedReceiptText = `👑 *SALON DU DÉFI AFRICAIN - REÇU OFFICIEL DE DUEL* 👑
━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 *N° REÇU :* #${receiptId}
👤 *Créateur du Défi :* ${challenge.challengerName}
🎮 *Discipline de Combat :* ${gameDisplay}
👥 *Nombre de Combattants :* ${challenge.maxPlayers || challenge.ludoPlayers || 2} Joueurs
🎲 *Nombre de Pions :* ${challenge.ludoPawnsCount || 4} pions (tous doivent rentrer pour gagner)
🛡️ *Camp & Couleur :* ${COLOR_NAMES[challenge.ludoPlayerColor || 'red'] || 'Rouge'}
🔐 *Accessibilité :* ${challenge.accessType === 'invite' ? `Réservé à @${challenge.invitedPseudo}` : 'Public (Ouvert à tous)'}
⏳ *Date d'Émission :* ${dateEmis}
⌛ *Date Limite de Validité :* ${dateExp}
📍 *Statut :* ${isOpenStatus ? 'OUVERT - En attente de combattant' : 'DÉFI ACCEPTÉ'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *LIEN DUEL DIRECT (Accessible dans tout navigateur web) :*
${shareUrl}

Rejoins l'arène dès maintenant pour relever le duel !`;

  const handleCopyLink = () => {
    sound.playMove();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyReceipt = () => {
    sound.playMove();
    navigator.clipboard.writeText(formattedReceiptText);
    setCopiedReceipt(true);
    setShowCopiedToast(true);
    setTimeout(() => {
      setCopiedReceipt(false);
      setShowCopiedToast(false);
    }, 2500);
  };

  const handleShareToWhatsAppGroup = () => {
    sound.playPromotion();
    // Copy full receipt text to clipboard automatically
    navigator.clipboard.writeText(formattedReceiptText);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 3000);

    // Open designated WhatsApp group
    const link = document.createElement('a');
    link.href = WHATSAPP_GROUP_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none animate-in fade-in">
      <div className="w-full max-w-lg max-h-[94vh] bg-gradient-to-b from-[#2d1509] via-[#1a0a04] to-[#0d0402] border-2 border-[#d4a017] rounded-3xl shadow-[0_0_60px_rgba(212,160,23,0.45)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#3e1809] to-[#200c05] border-b-2 border-[#d4a017] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl border border-amber-300 shadow">
              <FileText className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-sm font-royal font-black text-[#ffd700] uppercase tracking-wide flex items-center gap-1.5">
                <span>Reçu Officiel de Défi</span>
                <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full text-[9px]">
                  Vérifié
                </span>
              </h2>
              <p className="text-[10px] text-[#cca072] font-mono">
                #{receiptId}
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

        {/* Receipt Parchment Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-[#f3e5d8]">
          {showCopiedToast && (
            <div className="p-2.5 bg-gradient-to-r from-emerald-700 to-green-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg animate-pulse">
              <Check className="w-4 h-4" />
              <span>Texte du reçu complet & lien copiés dans le presse-papier !</span>
            </div>
          )}

          {/* Parchment Container */}
          <div className="relative p-4 sm:p-5 bg-gradient-to-b from-[#2a1308] via-[#1f0d05] to-[#140602] border border-[#d4a017]/70 rounded-2xl shadow-inner space-y-3.5 font-sans">
            {/* Watermark / Seal */}
            <div className="absolute top-3 right-3 opacity-15 pointer-events-none">
              <Crown className="w-24 h-24 text-[#ffd700]" />
            </div>

            {/* Official Header */}
            <div className="border-b border-[#d4a017]/30 pb-3 text-center">
              <div className="font-royal text-base sm:text-lg font-black text-[#ffd700] uppercase tracking-widest drop-shadow">
                👑 SALON DU DÉFI AFRICAIN 👑
              </div>
              <div className="text-[10px] text-[#cca072] font-semibold uppercase tracking-wider mt-0.5">
                Certificat de Défi & Protocole de Duel en Ligne
              </div>
              <div className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-[#d4a017]/50 text-[10px] font-mono text-amber-300">
                N° REÇU : <strong className="text-white">#{receiptId}</strong>
              </div>
            </div>

            {/* Challenger Profile Banner */}
            <div className="flex items-center gap-3 p-2.5 bg-black/40 rounded-xl border border-[#d4a017]/30">
              {challenge.portraitUrl ? (
                <img
                  src={challenge.portraitUrl}
                  alt={challenge.challengerName}
                  className="w-12 h-12 rounded-xl border border-[#ffd700] shadow object-cover shrink-0 bg-black/60"
                />
              ) : (
                <span className="text-3xl p-1.5 bg-black/60 rounded-xl border border-[#d4a017]/40 shrink-0">
                  {challenge.avatar}
                </span>
              )}
              <div className="flex-1 truncate">
                <div className="text-[10px] text-amber-300/80 uppercase tracking-wide font-bold">
                  Créateur du Défi
                </div>
                <div className="text-sm font-black text-white truncate">
                  {challenge.challengerName}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Souverain en attente d'adversaire</span>
                </div>
              </div>
            </div>

            {/* Key Receipt Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  🎮 Jeu Sélectionné
                </span>
                <span className="text-white font-semibold">
                  {challenge.gameType === 'checkers'
                    ? `Dames ${challenge.checkersVariant || 10}x${challenge.checkersVariant || 10}`
                    : challenge.gameType === 'chess'
                    ? 'Échecs des Rois'
                    : 'Ludo Royal Africain'}
                </span>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  👥 Nombre de Joueurs
                </span>
                <span className="text-white font-semibold">
                  {challenge.maxPlayers || challenge.ludoPlayers || 2} Joueurs
                </span>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  🎲 Nombre de Pions
                </span>
                <span className="text-white font-semibold">
                  {challenge.ludoPawnsCount || 4} pions par joueur
                </span>
                <span className="text-[9px] text-stone-400 block">
                  (tous doivent rentrer pour gagner)
                </span>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  🛡️ Camp & Couleur
                </span>
                <span className="text-white font-semibold">
                  {COLOR_NAMES[challenge.ludoPlayerColor || 'red'] || 'Rouge'}
                </span>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  🔐 Accessibilité
                </span>
                <span className="text-white font-semibold flex items-center gap-1">
                  {challenge.accessType === 'invite' ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-300" />
                      <span>Invitation : @{challenge.invitedPseudo}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Public (Ouvert à tous)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  📍 Statut du Défi
                </span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    isOpenStatus ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {isOpenStatus ? '🟢 OUVERT (Non accepté)' : '⚔️ ACCEPTÉ / EN COURS'}
                </span>
              </div>
            </div>

            {/* Dates & Validity */}
            <div className="p-2.5 bg-black/60 rounded-xl border border-[#d4a017]/30 flex items-center justify-between text-[10px]">
              <div>
                <span className="text-stone-400">Émis le :</span>{' '}
                <strong className="text-stone-200">{dateEmis}</strong>
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                <Clock className="w-3 h-3" />
                <span>Expire : <strong className="text-amber-100">{dateExp}</strong></span>
              </div>
            </div>

            {/* Link Gravé en bas */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>🔗 Lien Direct d'Accès au Duel :</span>
                <span className="text-[9px] text-[#cca072] normal-case">
                  Accessible sur tout navigateur
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-2.5 py-1.5 bg-black/80 border border-[#d4a017]/50 rounded-xl text-[10px] text-amber-200 font-mono truncate select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Dispatch Section */}
          <div className="p-3 bg-gradient-to-r from-[#0c2a16] via-[#091f11] to-[#0c2a16] border-2 border-emerald-500/80 rounded-2xl space-y-2 text-center shadow-lg">
            <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
              <span>📲 Transmission Officielle sur WhatsApp</span>
            </div>
            <p className="text-[10px] text-emerald-100/90 leading-tight">
              Envoyez le reçu complet, le lien du duel et les tags directement sur le groupe officiel de la communauté.
            </p>

            <button
              onClick={handleShareToWhatsAppGroup}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-black" />
              <span>Envoyer sur le Groupe WhatsApp</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyReceipt}
              className="py-2.5 px-2 bg-[#381608] hover:bg-[#4a1f0b] border border-[#d4a017] text-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow"
            >
              {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#ffd700]" />}
              <span>{copiedReceipt ? 'Reçu Copié !' : 'Copier le Reçu'}</span>
            </button>

            {/* If guest and open: Accepter et Jouer ! */}
            {isGuest && isOpenStatus && onAcceptChallenge && (
              <button
                onClick={() => onAcceptChallenge(challenge)}
                className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-emerald-300 shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>Accepter & Jouer</span>
              </button>
            )}

            {/* If host or already accepted: Accéder à la salle */}
            {(!isGuest || !isOpenStatus) && onOpenWaitingRoom && (
              <button
                onClick={() => onOpenWaitingRoom(challenge)}
                className="py-2.5 px-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Hourglass className="w-4 h-4" />
                <span>Salle d'Attente</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-[#200c05] to-[#140602] border-t border-[#d4a017]/40 flex items-center justify-between text-[11px] text-[#cca072]">
          <span>Valable jusqu'au {dateExp}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-black/50 hover:bg-black/70 border border-[#d4a017]/40 rounded-xl text-stone-300 hover:text-white font-medium transition-all cursor-pointer shrink-0"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
