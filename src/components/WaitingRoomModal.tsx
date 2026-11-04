import React, { useState, useEffect } from 'react';
import { GameType, CheckersVariant, ChessDifficulty, PlayerProfile } from '../types/game';
import { peerService } from '../services/peerService';
import { tacticalVoice } from '../services/tacticalVoice';
import { liveChallengeService } from '../services/liveChallengeService';
import { sound } from '../services/sound';
import { avatarGeneratorService } from '../services/avatarGeneratorService';
import {
  Users,
  Copy,
  Check,
  Clock,
  Share2,
  Hourglass,
  Radio,
  Swords,
  X,
  Sparkles,
  Send,
  Megaphone,
  Lock,
  Globe,
  FileText,
} from 'lucide-react';

const OFFICIAL_WHATSAPP_GROUP =
  'https://chat.whatsapp.com/Hd2tGo9TU0x15Mw7GiA65T?s=cl&p=a&mlu=4&ilr=4&iam=2';

interface WaitingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHost: boolean;
  gameType: GameType;
  checkersSize?: CheckersVariant;
  chessDifficulty?: ChessDifficulty;
  ludoPlayers?: 2 | 4;
  ludoPawnsCount?: 1 | 2 | 3 | 4;
  ludoPlayerColor?: string;
  maxPlayers?: 2 | 3 | 4;
  accessType?: 'public' | 'invite';
  invitedPseudo?: string;
  activePlayer: PlayerProfile;
  initialExpirationHours?: number; // up to 7 days (168h)
  onStartGame: (joinedPlayers: PlayerProfile[]) => void;
  onShowReceipt?: () => void;
}

export const VALIDITY_OPTIONS = [
  { label: '15 Min (Express)', hours: 0.25 },
  { label: '1 Heure', hours: 1 },
  { label: '6 Heures', hours: 6 },
  { label: '24 Heures (1 Jour)', hours: 24 },
  { label: '3 Jours', hours: 72 },
  { label: '7 Jours (Max)', hours: 168 },
];

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  isHost,
  gameType,
  checkersSize,
  chessDifficulty,
  ludoPlayers,
  ludoPawnsCount = 4,
  ludoPlayerColor = 'red',
  maxPlayers,
  accessType = 'public',
  invitedPseudo,
  activePlayer,
  initialExpirationHours = 24,
  onStartGame,
  onShowReceipt,
}) => {
  const totalSlotsNeeded = maxPlayers || (gameType === 'ludo' && ludoPlayers === 4 ? 4 : 2);
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(initialExpirationHours);
  const [expiresAt, setExpiresAt] = useState<number>(() => Date.now() + initialExpirationHours * 3600 * 1000);
  const [copied, setCopied] = useState(false);
  const [callBroadcasted, setCallBroadcasted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Joined players in room (starting with active player)
  const [playersInRoom, setPlayersInRoom] = useState<PlayerProfile[]>([activePlayer]);

  // Update expiration when host picks a different duration
  const handleDurationChange = (hours: number) => {
    setSelectedDurationHours(hours);
    const newExp = Date.now() + hours * 3600 * 1000;
    setExpiresAt(newExp);
  };

  // Remaining validity time string
  const [remainingTimeStr, setRemainingTimeStr] = useState('');
  useEffect(() => {
    const updateRemaining = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setRemainingTimeStr('Expiré');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setRemainingTimeStr(`${days}j ${hours}h ${mins}m`);
      } else if (hours > 0) {
        setRemainingTimeStr(`${hours}h ${mins}m ${secs}s`);
      } else {
        setRemainingTimeStr(`${mins}m ${secs}s`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Construct full shareable URL with parameters including host and pawn configuration
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?salon=${encodeURIComponent(
        roomCode
      )}&host=${encodeURIComponent(activePlayer.pseudo)}&game=${gameType}&players=${totalSlotsNeeded}&pawns=${
        ludoPawnsCount || 4
      }&color=${ludoPlayerColor || 'red'}&exp=${expiresAt}`
    : '';

  // Peer initialization & real-time synchronization
  const [peerState, setPeerState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    if (!isOpen || !roomCode) return;
    let isMounted = true;

    // Connect or host
    peerService
      .init(isHost, isHost ? undefined : roomCode, isHost ? roomCode : undefined)
      .then((myId) => {
        if (!isMounted) return;
        setPeerState('connecting');

        // If guest, announce presence immediately and retry after a short delay
        if (!isHost) {
          const announce = () => {
            peerService.sendMessage({
              type: 'PLAYER_JOINED',
              gameType,
              payload: activePlayer,
              senderId: myId,
            });
          };
          announce();
          setTimeout(announce, 1000);
          setTimeout(announce, 2500);
        }
      })
      .catch((err) => {
        console.warn('Waiting room peer init error', err);
        if (isMounted) setPeerState('error');
      });

    peerService.onStatus((status, count) => {
      if (!isMounted) return;
      if (status === 'connected' || count >= 2) {
        setPeerState('connected');
        if (!isHost) {
          peerService.sendMessage({
            type: 'PLAYER_JOINED',
            gameType,
            payload: activePlayer,
            senderId: peerService.getMyId(),
          });
        }
      } else if (status === 'error') {
        setPeerState('error');
      } else if (status === 'disconnected') {
        setPeerState('disconnected');
      }
    });

    peerService.onMessage((msg) => {
      if (!isMounted) return;

      if (msg.type === 'PLAYER_JOINED') {
        const newPlayer: PlayerProfile = msg.payload;
        addPlayerToRoom(newPlayer);

        // If host, send back INIT_STATE with host profile so guest sees host
        if (isHost) {
          peerService.sendMessage({
            type: 'INIT_STATE',
            gameType,
            payload: { host: activePlayer },
            senderId: peerService.getMyId(),
          });
        }
      } else if (msg.type === 'INIT_STATE') {
        if (msg.payload?.host) {
          addPlayerToRoom(msg.payload.host);
        }
      } else if (msg.type === 'START_MATCH') {
        triggerStartMatchSequence(msg.payload?.allPlayers || playersInRoom, false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, roomCode, isHost]);

  const addPlayerToRoom = (newPlayer: PlayerProfile) => {
    sound.playPromotion();
    setPlayersInRoom((prev) => {
      if (prev.some((p) => p.pseudo.toLowerCase() === newPlayer.pseudo.toLowerCase())) return prev;
      const updated = [...prev, newPlayer];

      // Voice announce newcomer
      tacticalVoice.announceWaitingRoomJoined(newPlayer.pseudo, updated.length, totalSlotsNeeded);

      // Check if room is full
      if (updated.length >= totalSlotsNeeded) {
        triggerStartMatchSequence(updated, true);
      }

      return updated;
    });
  };

  // Broadcast call for players to AI Voice & Radar
  const handleBroadcastCall = () => {
    sound.playMove();
    liveChallengeService.broadcastCallForPlayers(
      roomCode,
      activePlayer.pseudo,
      gameType,
      playersInRoom.length,
      totalSlotsNeeded
    );
    setCallBroadcasted(true);
    setTimeout(() => setCallBroadcasted(false), 5000);
  };

  const triggerStartMatchSequence = (allPlayers: PlayerProfile[], broadcast: boolean = true) => {
    if (broadcast) {
      peerService.sendMessage({
        type: 'START_MATCH',
        gameType,
        payload: { allPlayers },
        senderId: peerService.getMyId(),
      });
    }

    tacticalVoice.announceMatchStarting();
    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          onStartGame(allPlayers);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    sound.playMove();
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `👑 Défi Royal Africain ! Rejoins mon salon en ${
    gameType === 'checkers' ? 'Dames Africaines' : gameType === 'chess' ? 'Échecs des Rois' : 'Ludo Royal'
  }. Lien valide jusqu’à ${remainingTimeStr} : ${shareUrl}`;

  const shareOnWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  const missingPlayersCount = Math.max(0, totalSlotsNeeded - playersInRoom.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md max-h-[92vh] bg-gradient-to-b from-[#2e1408] via-[#1a0a04] to-[#0c0402] border-2 border-[#d4a017] rounded-3xl shadow-[0_0_50px_rgba(212,160,23,0.35)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-b from-[#3a180a] to-[#200c05] border-b-2 border-[#d4a017] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl border border-amber-300 shadow">
              <Hourglass className="w-5 h-5 text-amber-100 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-royal font-bold text-[#ffd700] uppercase tracking-wide flex items-center gap-1.5">
                <span>Salle d'Attente Royale ({totalSlotsNeeded} Joueurs)</span>
              </h2>
              <p className="text-[10px] text-[#cca072] flex items-center gap-1">
                <span>Code :</span> <strong className="font-mono text-amber-200">{roomCode}</strong>
                <span>•</span>
                {accessType === 'invite' ? (
                  <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Pour @{invitedPseudo || 'ami'}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Globe className="w-2.5 h-2.5" /> Public
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              // Keeps the salon alive in persistent registry
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer la vue (le salon reste actif)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-[#f3e5d8]">
          {/* Match Starting Countdown Banner */}
          {countdown !== null ? (
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-950 border-2 border-emerald-400 rounded-2xl text-center space-y-2 animate-bounce">
              <div className="text-base font-royal font-bold text-emerald-200 uppercase">
                ⚔️ Tous les Souverains sont prêts !
              </div>
              <div className="text-3xl font-extrabold text-white">
                Départ dans {countdown}s...
              </div>
              <div className="text-[11px] text-emerald-300">
                Protocole de duel impérial enclenché par l'IA.
              </div>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="p-3 bg-black/50 border border-[#d4a017]/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <div>
                    <span className="font-bold text-amber-200">
                      {playersInRoom.length} / {totalSlotsNeeded} Combattants Présents
                    </span>
                    <div className="text-[10px] text-[#cca072]">
                      {missingPlayersCount > 0
                        ? `${missingPlayersCount} souverain${missingPlayersCount > 1 ? 's' : ''} manquant${missingPlayersCount > 1 ? 's' : ''}`
                        : 'Tous les combattants sont réunis !'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#421c0e] border border-[#d4a017]/50 rounded-xl text-[10px] text-[#ffd700] font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{remainingTimeStr}</span>
                </div>
              </div>

              {/* Call for Players Announcement Alert */}
              {callBroadcasted && (
                <div className="p-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg animate-pulse">
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span>Appel vocal diffusé à haute voix par l'IA sur toute la plateforme !</span>
                </div>
              )}

              {/* Slots Roster */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                  Places dans l'Arène ({totalSlotsNeeded} Joueurs)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: totalSlotsNeeded }).map((_, idx) => {
                    const player = playersInRoom[idx];
                    const slotNum = idx + 1;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                          player
                            ? 'bg-gradient-to-r from-[#3b190a] to-[#200c05] border-[#ffd700] shadow-md'
                            : 'bg-black/40 border-dashed border-[#d4a017]/40 text-stone-400'
                        }`}
                      >
                        {player ? (
                          <>
                            {player.customPortraitUrl ? (
                              <img
                                src={player.customPortraitUrl}
                                alt={player.pseudo}
                                className="w-11 h-11 rounded-xl border border-[#ffd700] shadow object-cover shrink-0 bg-black/60"
                              />
                            ) : (
                              <span className="text-2xl p-1 bg-black/50 rounded-xl border border-[#d4a017]/40 shrink-0">
                                {player.avatar}
                              </span>
                            )}
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white text-xs truncate max-w-[95px]">
                                  {player.pseudo}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[8px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-bold">
                                    CRÉATEUR
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-amber-300/80 mt-0.5 truncate">
                                {player.title}
                              </div>
                              <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>Prêt au combat</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2.5 w-full py-1">
                            <div className="w-10 h-10 rounded-xl bg-black/30 border border-stone-600 flex items-center justify-center shrink-0">
                              <Hourglass className="w-4 h-4 text-stone-500 animate-spin" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[11px] font-bold text-stone-300">
                                Combattant {slotNum}
                              </div>
                              <div className="text-[9px] text-stone-400">
                                {invitedPseudo && slotNum === 2
                                  ? `Invité : @${invitedPseudo}`
                                  : "En attente de connexion..."}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patienter & Lancer l'Appel au Duel */}
              {missingPlayersCount > 0 && (
                <div className="p-3 bg-gradient-to-r from-[#381608] to-[#1c0b04] border border-[#d4a017]/50 rounded-2xl flex items-center justify-between gap-2 shadow">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-amber-200">
                        Patienter dans la salle
                      </div>
                      <div className="text-[10px] text-[#cca072]">
                        L'IA annoncera le duel dès l'arrivée des souverains.
                      </div>
                    </div>
                  </div>

                  {/* Bouton demandé par l'utilisateur: lancer l'annonce qu'on attend des joueurs */}
                  <button
                    onClick={handleBroadcastCall}
                    className="px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer shrink-0"
                    title="L'IA annonce à haute voix que vous attendez des joueurs"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Lancer l'Appel</span>
                  </button>
                </div>
              )}

              {/* Custom Duration Selector (for creator) */}
              {isHost && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-[#ffd700] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Validité du lien (le défi reste accessible même en quittant) :</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VALIDITY_OPTIONS.map((opt) => {
                      const isSelected = selectedDurationHours === opt.hours;
                      return (
                        <button
                          key={opt.hours}
                          type="button"
                          onClick={() => handleDurationChange(opt.hours)}
                          className={`p-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 font-bold shadow'
                              : 'bg-black/40 border-[#d4a017]/30 text-stone-300 hover:bg-black/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shareable Link & 1-Click Social Sharing */}
              <div className="p-3 bg-black/60 border border-[#d4a017]/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ffd700] flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Inviter via le lien du salon</span>
                  </span>
                  <span className="text-[9px] text-[#cca072]">
                    Accessible par n'importe quel navigateur web
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-2.5 py-1.5 bg-black/70 border border-[#d4a017]/50 rounded-xl text-[10px] text-amber-200 font-mono truncate select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow transition-all cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                {/* 1-Click Social Sharing & WhatsApp Group */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareText);
                      const link = document.createElement('a');
                      link.href = OFFICIAL_WHATSAPP_GROUP;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      link.click();
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-black" />
                    <span>Envoyer sur le Groupe WhatsApp Officiel</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={shareOnWhatsApp}
                      className="py-2 px-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/60 rounded-xl text-[#25D366] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Partager WhatsApp</span>
                    </button>

                    <button
                      onClick={shareOnFacebook}
                      className="py-2 px-2 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/60 rounded-xl text-[#1877F2] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Messenger / Réseaux</span>
                    </button>
                  </div>
                </div>

                {/* Receipt & Guest Instant Play Actions */}
                <div className="pt-2 border-t border-[#d4a017]/30 flex items-center gap-2">
                  {onShowReceipt && (
                    <button
                      onClick={onShowReceipt}
                      className="flex-1 py-2 px-2 bg-[#381608] hover:bg-[#4d1f0c] border border-[#d4a017] text-[#ffd700] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Voir le Reçu Officiel</span>
                    </button>
                  )}

                  <button
                    onClick={() => triggerStartMatchSequence(playersInRoom, true)}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Swords className="w-4 h-4 text-white" />
                    <span>{isHost ? 'Lancer le Combat' : 'Prêt ! Lancer la Partie'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-[#200c05] to-[#140602] border-t border-[#d4a017]/40 flex items-center justify-between text-[11px] text-[#cca072]">
          <span className="truncate max-w-[200px]">
            Ce salon reste actif jusqu'à expiration ({remainingTimeStr})
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-xl text-stone-300 hover:text-white font-medium transition-all cursor-pointer shrink-0"
          >
            Fermer la vue
          </button>
        </div>
      </div>
    </div>
  );
};
