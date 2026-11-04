import React, { useState, useEffect } from 'react';
import { GameType, CheckersVariant, ChessDifficulty, LiveChallenge, LudoPlayerColor } from '../types/game';
import { liveChallengeService } from '../services/liveChallengeService';
import { tacticalVoice } from '../services/tacticalVoice';
import { sound } from '../services/sound';
import {
  Radio,
  Swords,
  Volume2,
  VolumeX,
  PlusCircle,
  Check,
  ShieldAlert,
  Lock,
  Globe,
  Hourglass,
  X,
  Mail,
  UserCheck,
  FileText,
} from 'lucide-react';

interface LiveChallengeRadarProps {
  activePlayerPseudo?: string;
  onAcceptChallenge: (challenge: {
    gameType: GameType;
    roomCode: string;
    checkersSize?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    maxPlayers?: 2 | 3 | 4;
    challengerName: string;
    challengerAvatar: string;
  }) => void;
  onCreateSalon: () => void;
  onReopenWaitingRoom?: (challenge: LiveChallenge) => void;
  onShowReceipt?: (challenge: LiveChallenge) => void;
}

export const LiveChallengeRadar: React.FC<LiveChallengeRadarProps> = ({
  activePlayerPseudo = 'Joueur 1',
  onAcceptChallenge,
  onCreateSalon,
  onReopenWaitingRoom,
  onShowReceipt,
}) => {
  const [challenges, setChallenges] = useState<LiveChallenge[]>(() =>
    liveChallengeService.getChallenges()
  );
  const [radarTab, setRadarTab] = useState<'public' | 'invites' | 'mySalons'>('public');
  const [voiceAnnounceEnabled, setVoiceAnnounceEnabled] = useState(true);

  // Subscribe to real live challenges
  useEffect(() => {
    const unsubscribe = liveChallengeService.subscribe((updated) => {
      setChallenges(updated);
    });

    return () => unsubscribe();
  }, []);

  const myLower = activePlayerPseudo.trim().toLowerCase();

  // Filter categories
  const publicChallenges = challenges.filter(
    (c) => c.status === 'open' && (c.accessType === 'public' || !c.accessType)
  );

  const receivedInvites = challenges.filter(
    (c) =>
      c.accessType === 'invite' &&
      c.status === 'open' &&
      c.invitedPseudo &&
      c.invitedPseudo.trim().toLowerCase() === myLower
  );

  const mySalons = challenges.filter(
    (c) =>
      c.status !== 'refused' &&
      ((c.challengerName && c.challengerName.toLowerCase() === myLower) ||
        (c.creatorPseudo && c.creatorPseudo.toLowerCase() === myLower))
  );

  const handleAccept = (ch: LiveChallenge) => {
    if (ch.status !== 'open') return;
    sound.playMove();

    liveChallengeService.acceptChallenge(ch.id, activePlayerPseudo);

    setTimeout(() => {
      onAcceptChallenge({
        gameType: ch.gameType,
        roomCode: ch.id,
        checkersSize: ch.checkersVariant,
        chessDifficulty: ch.chessDifficulty,
        ludoPlayers: ch.ludoPlayers,
        ludoPawnsCount: ch.ludoPawnsCount || 4,
        ludoPlayerColor: ch.ludoPlayerColor || 'red',
        maxPlayers: ch.maxPlayers,
        challengerName: ch.challengerName,
        challengerAvatar: ch.avatar,
      });
    }, 450);
  };

  const handleRefuse = (ch: LiveChallenge) => {
    sound.playMove();
    liveChallengeService.refuseChallenge(ch.id, activePlayerPseudo);
  };

  return (
    <div className="w-full bg-gradient-to-r from-[#381608]/95 via-[#230d04]/95 to-[#160702]/95 border-2 border-[#d4a017] rounded-2xl p-3 shadow-xl relative overflow-hidden text-left">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#d4a017]/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-royal font-bold text-[#ffd700] tracking-wider uppercase flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Radar des Salons Réels</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* AI Voice Announce Toggle */}
          <button
            onClick={() => setVoiceAnnounceEnabled(!voiceAnnounceEnabled)}
            className={`p-1 rounded-lg border text-[10px] flex items-center gap-1 transition-all ${
              voiceAnnounceEnabled
                ? 'bg-[#7a3917] border-[#ffd700] text-[#ffd700]'
                : 'bg-black/40 border-stone-600 text-stone-400'
            }`}
            title={voiceAnnounceEnabled ? 'Annonces réelles actives' : 'Annonces désactivées'}
          >
            {voiceAnnounceEnabled ? (
              <Volume2 className="w-3 h-3 text-amber-300" />
            ) : (
              <VolumeX className="w-3 h-3 text-stone-400" />
            )}
            <span className="text-[9px] font-bold">Voix IA</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 pt-2 pb-1 text-[10px] font-bold">
        <button
          onClick={() => setRadarTab('public')}
          className={`flex-1 py-1 px-1.5 rounded-lg border text-center transition-all ${
            radarTab === 'public'
              ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
              : 'bg-black/30 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          🌍 Publics ({publicChallenges.length})
        </button>

        <button
          onClick={() => setRadarTab('invites')}
          className={`flex-1 py-1 px-1.5 rounded-lg border text-center relative transition-all ${
            radarTab === 'invites'
              ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
              : 'bg-black/30 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          <span>📩 Mes Invites</span>
          {receivedInvites.length > 0 && (
            <span className="ml-1 px-1 bg-red-600 text-white rounded-full text-[9px] animate-pulse">
              {receivedInvites.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setRadarTab('mySalons')}
          className={`flex-1 py-1 px-1.5 rounded-lg border text-center transition-all ${
            radarTab === 'mySalons'
              ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
              : 'bg-black/30 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
        >
          🏰 Mes Salons ({mySalons.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-2 space-y-2">
        {/* PUBLIC CHALLENGES */}
        {radarTab === 'public' && (
          <>
            {publicChallenges.length === 0 ? (
              <div className="py-2.5 px-3 bg-black/40 border border-[#d4a017]/30 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-amber-200">
                    Aucun défi public ouvert
                  </div>
                  <div className="text-[10px] text-[#cca072] mt-0.5">
                    Créez votre salon pour défier un ami ou le monde entier.
                  </div>
                </div>
                <button
                  onClick={onCreateSalon}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow transition-all cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Lancer un Défi</span>
                </button>
              </div>
            ) : (
              publicChallenges.slice(0, 3).map((ch) => (
                <div
                  key={ch.id}
                  className="p-2.5 bg-black/50 border border-[#d4a017]/50 rounded-xl flex items-center justify-between gap-2 shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1 bg-black/50 rounded-xl border border-[#d4a017]/40 shrink-0">
                      {ch.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">
                          {ch.challengerName}
                        </span>
                        <span className="text-[9px] px-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded font-semibold">
                          {ch.maxPlayers || 2} Joueurs
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        {ch.title}
                      </div>
                      <div className="text-[9px] text-[#cca072]">
                        Code : <span className="font-mono text-amber-200">{ch.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onShowReceipt && (
                      <button
                        onClick={() => onShowReceipt(ch)}
                        className="p-2 bg-[#381608] hover:bg-[#4d1f0c] border border-[#d4a017] text-[#ffd700] rounded-xl text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                        title="Voir le reçu officiel du défi"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden xs:inline">Reçu</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleAccept(ch)}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-emerald-300 shadow flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Accepter</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* RECEIVED INVITATIONS (targeted by username) */}
        {radarTab === 'invites' && (
          <>
            {receivedInvites.length === 0 ? (
              <div className="py-2.5 px-3 bg-black/40 border border-[#d4a017]/30 rounded-xl text-center text-stone-400 text-xs">
                Aucune invitation privée directe pour <strong className="text-amber-200">@{activePlayerPseudo}</strong>.
              </div>
            ) : (
              receivedInvites.map((ch) => (
                <div
                  key={ch.id}
                  className="p-2.5 bg-gradient-to-r from-amber-950/70 to-black/80 border-2 border-amber-400 rounded-xl flex items-center justify-between gap-2 shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1 bg-black/50 rounded-xl border border-[#d4a017]/40 shrink-0">
                      {ch.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#ffd700]">
                          {ch.challengerName} vous défie !
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-200 font-semibold">
                        {ch.title}
                      </div>
                      <div className="text-[9px] text-[#cca072]">
                        Code : <span className="font-mono text-amber-200">{ch.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAccept(ch)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-bold text-xs rounded-xl border border-emerald-300 shadow flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accepter</span>
                    </button>
                    <button
                      onClick={() => handleRefuse(ch)}
                      className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-xs rounded-xl border border-red-500/60 shadow flex items-center gap-1 cursor-pointer"
                      title="Refuser le défi"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* MY ACTIVE SALONS (persist across exits) */}
        {radarTab === 'mySalons' && (
          <>
            {mySalons.length === 0 ? (
              <div className="py-2.5 px-3 bg-black/40 border border-[#d4a017]/30 rounded-xl text-center text-stone-400 text-xs">
                Vous n'avez pas de salon actif en attente.
              </div>
            ) : (
              mySalons.map((ch) => (
                <div
                  key={ch.id}
                  className="p-2.5 bg-black/60 border border-[#d4a017]/60 rounded-xl flex items-center justify-between gap-2 shadow"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {ch.title}
                      </span>
                      <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-semibold">
                        {ch.durationLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#cca072] mt-0.5">
                      Code : <span className="font-mono text-amber-200">{ch.id}</span> • {ch.accessType === 'invite' ? `Invite pour @${ch.invitedPseudo}` : 'Public'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onShowReceipt && (
                      <button
                        onClick={() => onShowReceipt(ch)}
                        className="p-1.5 bg-[#381608] hover:bg-[#4d1f0c] border border-[#d4a017] text-[#ffd700] rounded-xl text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                        title="Voir le reçu officiel du défi"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden xs:inline">Reçu</span>
                      </button>
                    )}
                    {onReopenWaitingRoom && (
                      <button
                        onClick={() => onReopenWaitingRoom(ch)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 text-black font-extrabold text-[11px] rounded-xl border border-[#ffd700] shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Hourglass className="w-3 h-3" />
                        <span>Rejoindre</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Sub Bar */}
      <div className="mt-2.5 pt-2 border-t border-[#d4a017]/20 flex items-center justify-between text-[10px]">
        <span className="text-[#8e684a]">
          {challenges.length} salon(s) actif(s) sur le réseau
        </span>

        <button
          onClick={onCreateSalon}
          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3 h-3" />
          <span>Nouveau Salon</span>
        </button>
      </div>
    </div>
  );
};
