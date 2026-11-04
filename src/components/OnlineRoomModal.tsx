import React, { useState, useEffect } from 'react';
import { GameType, CheckersVariant, ChessDifficulty, PlayerProfile, LudoPlayerColor, LiveChallenge } from '../types/game';
import { peerService } from '../services/peerService';
import { liveChallengeService } from '../services/liveChallengeService';
import {
  Share2,
  Copy,
  Check,
  Users,
  ArrowRight,
  X,
  Loader2,
  Clock,
  Send,
  Hourglass,
  Globe,
  Lock,
  UserCheck,
} from 'lucide-react';

interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayer?: PlayerProfile;
  onStartOnlineGame: (config: {
    gameType: GameType;
    variant?: CheckersVariant;
    difficulty?: ChessDifficulty;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    isHost: boolean;
  }) => void;
  onOpenWaitingRoom?: (config: {
    roomCode: string;
    gameType: GameType;
    variant?: CheckersVariant;
    difficulty?: ChessDifficulty;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    durationHours: number;
    maxPlayers?: 2 | 3 | 4;
    accessType?: 'public' | 'invite';
    invitedPseudo?: string;
    isHost: boolean;
  }) => void;
  onShowReceipt?: (challenge: LiveChallenge) => void;
}

const VALIDITY_OPTIONS = [
  { label: '15 min (Express)', hours: 0.25 },
  { label: '1 heure', hours: 1 },
  { label: '6 heures', hours: 6 },
  { label: '24 heures (1j)', hours: 24 },
  { label: '3 jours', hours: 72 },
  { label: '7 jours (Max)', hours: 168 },
];

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  activePlayer,
  onStartOnlineGame,
  onOpenWaitingRoom,
  onShowReceipt,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [selectedGame, setSelectedGame] = useState<GameType>('checkers');
  const [checkersSize, setCheckersSize] = useState<CheckersVariant>(10);
  const [chessDifficulty, setChessDifficulty] = useState<ChessDifficulty>(2);
  const [ludoPawnsCount, setLudoPawnsCount] = useState<1 | 2 | 3 | 4>(4);
  const [ludoPlayerColor, setLudoPlayerColor] = useState<LudoPlayerColor>('red');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2);
  const [accessType, setAccessType] = useState<'public' | 'invite'>('public');
  const [targetPseudo, setTargetPseudo] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(24);
  const [roomId, setRoomId] = useState<string>('');
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'generating' | 'waiting' | 'connected' | 'error'
  >('idle');

  // Handle URL room param on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('salon');
    if (roomFromUrl) {
      setInputJoinCode(roomFromUrl);
      setTab('join');
    }
  }, []);

  const handleCreateRoom = async () => {
    setConnectionStatus('generating');
    try {
      const generatedId = await peerService.init(true);
      setRoomId(generatedId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('host_room_' + generatedId, 'true');
      }

      // Register persistent real challenge
      const myPseudo = activePlayer?.pseudo || 'Souverain';
      const myAvatar = activePlayer?.avatar || '👑';
      const myPortrait = activePlayer?.customPortraitUrl;

      const publishedChallenge = liveChallengeService.publishRealChallenge({
        roomCode: generatedId,
        challengerName: myPseudo,
        creatorPseudo: myPseudo,
        avatar: myAvatar,
        portraitUrl: myPortrait,
        gameType: selectedGame,
        checkersVariant: checkersSize,
        chessDifficulty,
        ludoPlayers: selectedGame === 'ludo' ? (maxPlayers as 2 | 4) : 2,
        ludoPawnsCount,
        ludoPlayerColor,
        maxPlayers,
        accessType,
        invitedPseudo: accessType === 'invite' ? targetPseudo.trim() : undefined,
        durationHours: selectedDuration,
      });

      setConnectionStatus('waiting');

      // Show Official Receipt and allow direct dispatch
      if (onShowReceipt) {
        onShowReceipt(publishedChallenge);
        onClose();
        return;
      }

      // Auto-open waiting room so host stays in and can wait / share
      if (onOpenWaitingRoom) {
        onOpenWaitingRoom({
          roomCode: generatedId,
          gameType: selectedGame,
          variant: checkersSize,
          difficulty: chessDifficulty,
          ludoPawnsCount,
          ludoPlayerColor,
          durationHours: selectedDuration,
          maxPlayers,
          accessType,
          invitedPseudo: accessType === 'invite' ? targetPseudo.trim() : undefined,
          isHost: true,
        });
        onClose();
        return;
      }

      peerService.onStatus((status, count) => {
        if (status === 'connected' || count >= 2) {
          setConnectionStatus('connected');
          setTimeout(() => {
            onStartOnlineGame({
              gameType: selectedGame,
              variant: checkersSize,
              difficulty: chessDifficulty,
              ludoPawnsCount,
              ludoPlayerColor,
              isHost: true,
            });
            onClose();
          }, 800);
        }
      });
    } catch {
      setConnectionStatus('error');
    }
  };

  const handleJoinRoom = async () => {
    let cleanCode = inputJoinCode.trim();
    if (!cleanCode) return;

    // If user pasted a full URL (e.g. from WhatsApp/browser)
    if (cleanCode.includes('salon=')) {
      try {
        const urlObj = new URL(cleanCode.startsWith('http') ? cleanCode : `https://example.com/${cleanCode}`);
        const parsedCode = urlObj.searchParams.get('salon');
        if (parsedCode) {
          cleanCode = parsedCode;
        }
      } catch {
        const match = cleanCode.match(/salon=([^&]+)/);
        if (match && match[1]) {
          cleanCode = decodeURIComponent(match[1]);
        }
      }
    }

    setConnectionStatus('generating');

    try {
      await peerService.init(false, cleanCode);
      setConnectionStatus('waiting');

      peerService.onStatus((status) => {
        if (status === 'connected') {
          setConnectionStatus('connected');
          setTimeout(() => {
            onStartOnlineGame({
              gameType: selectedGame,
              variant: checkersSize,
              difficulty: chessDifficulty,
              ludoPawnsCount,
              ludoPlayerColor,
              isHost: false,
            });
            onClose();
          }, 800);
        }
      });
    } catch {
      setConnectionStatus('error');
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?salon=${roomId}&host=${encodeURIComponent(
      activePlayer?.pseudo || 'Souverain'
    )}&exp=${Date.now() + selectedDuration * 3600 * 1000}&game=${selectedGame}&players=${maxPlayers}&pawns=${ludoPawnsCount}&color=${ludoPlayerColor}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md max-h-[92vh] bg-[#1d0e07] border-2 border-[#d4a017] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#2e1509] to-[#180903] border-b border-[#d4a017]/40">
          <div className="flex items-center gap-2 text-[#ffd700] font-royal font-bold text-sm">
            <Users className="w-4 h-4" />
            <span>Création de Défis & Salons Persistants</span>
          </div>
          <button
            onClick={() => {
              peerService.cleanup();
              onClose();
            }}
            className="p-1 text-[#d8b28a] hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#d4a017]/30 bg-[#140803]">
          <button
            onClick={() => {
              setTab('create');
              setConnectionStatus('idle');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              tab === 'create'
                ? 'text-[#ffd700] border-b-2 border-[#ffd700] bg-[#2a1309]'
                : 'text-[#d8b28a]/70 hover:text-[#d8b28a]'
            }`}
          >
            🌟 Créer un Salon de Défi
          </button>
          <button
            onClick={() => {
              setTab('join');
              setConnectionStatus('idle');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              tab === 'join'
                ? 'text-[#ffd700] border-b-2 border-[#ffd700] bg-[#2a1309]'
                : 'text-[#d8b28a]/70 hover:text-[#d8b28a]'
            }`}
          >
            🔗 Rejoindre avec un Code
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-[#f3e5d8]">
          {tab === 'create' ? (
            <>
              {connectionStatus === 'idle' && (
                <div className="space-y-3">
                  {/* Game Choice */}
                  <div>
                    <label className="block text-[#ffd700] font-semibold mb-1">
                      1. Choisissez la discipline :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGame('checkers');
                          setMaxPlayers(2);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedGame === 'checkers'
                            ? 'bg-[#d4a017]/20 border-[#ffd700] text-[#ffd700] font-bold shadow'
                            : 'bg-[#2a140a] border-white/10 hover:border-white/30 text-stone-300'
                        }`}
                      >
                        👑 Dames
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGame('ludo')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedGame === 'ludo'
                            ? 'bg-[#d4a017]/20 border-[#ffd700] text-[#ffd700] font-bold shadow'
                            : 'bg-[#2a140a] border-white/10 hover:border-white/30 text-stone-300'
                        }`}
                      >
                        🎲 Ludo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGame('chess');
                          setMaxPlayers(2);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedGame === 'chess'
                            ? 'bg-[#d4a017]/20 border-[#ffd700] text-[#ffd700] font-bold shadow'
                            : 'bg-[#2a140a] border-white/10 hover:border-white/30 text-stone-300'
                        }`}
                      >
                        ⚔️ Échecs
                      </button>
                    </div>
                  </div>

                  {/* Player Count Selector: 2, 3 or 4 players */}
                  <div>
                    <label className="block text-[#ffd700] font-semibold mb-1">
                      2. Nombre de combattants dans l'arène :
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMaxPlayers(2)}
                        className={`py-1.5 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          maxPlayers === 2
                            ? 'bg-[#7a3917] border-[#ffd700] text-amber-200'
                            : 'bg-black/30 border-white/10 text-stone-400'
                        }`}
                      >
                        ⚔️ 2 Joueurs (1v1)
                      </button>
                      <button
                        type="button"
                        disabled={selectedGame !== 'ludo'}
                        onClick={() => setMaxPlayers(3)}
                        className={`py-1.5 px-2 rounded-xl border text-center font-bold transition-all ${
                          selectedGame !== 'ludo'
                            ? 'opacity-40 cursor-not-allowed border-stone-800'
                            : maxPlayers === 3
                            ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 cursor-pointer'
                            : 'bg-black/30 border-white/10 text-stone-400 cursor-pointer'
                        }`}
                        title={selectedGame !== 'ludo' ? 'Disponible en Ludo' : '3 Joueurs'}
                      >
                        🛡️ 3 Joueurs
                      </button>
                      <button
                        type="button"
                        disabled={selectedGame !== 'ludo'}
                        onClick={() => setMaxPlayers(4)}
                        className={`py-1.5 px-2 rounded-xl border text-center font-bold transition-all ${
                          selectedGame !== 'ludo'
                            ? 'opacity-40 cursor-not-allowed border-stone-800'
                            : maxPlayers === 4
                            ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 cursor-pointer'
                            : 'bg-black/30 border-white/10 text-stone-400 cursor-pointer'
                        }`}
                        title={selectedGame !== 'ludo' ? 'Disponible en Ludo' : '4 Joueurs'}
                      >
                        👑 4 Joueurs
                      </button>
                    </div>
                  </div>

                  {/* Ludo specific options: Pawns Count & Color Camp */}
                  {selectedGame === 'ludo' && (
                    <div className="p-2.5 bg-black/40 border border-[#d4a017]/40 rounded-xl space-y-2.5 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-[#ffd700] mb-1">
                          Nombre de pions par joueur (Tous doivent rentrer au palais) :
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {([1, 2, 3, 4] as const).map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setLudoPawnsCount(count)}
                              className={`py-1 px-1 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                                ludoPawnsCount === count
                                  ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
                                  : 'bg-black/40 border-stone-700 text-stone-300'
                              }`}
                            >
                              {count} {count > 1 ? 'Pions' : 'Pion'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#ffd700] mb-1">
                          Votre Camp & Couleur de départ :
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLudoPlayerColor('red')}
                            className={`py-1 px-2 rounded-lg border text-left font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                              ludoPlayerColor === 'red'
                                ? 'bg-red-950 border-red-500 text-red-200 shadow ring-1 ring-red-400'
                                : 'bg-black/40 border-stone-700 text-stone-300'
                            }`}
                          >
                            <span>🔴</span>
                            <span>Rouge (Lion)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLudoPlayerColor('green')}
                            className={`py-1 px-2 rounded-lg border text-left font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                              ludoPlayerColor === 'green'
                                ? 'bg-green-950 border-green-500 text-green-200 shadow ring-1 ring-green-400'
                                : 'bg-black/40 border-stone-700 text-stone-300'
                            }`}
                          >
                            <span>🟢</span>
                            <span>Vert (Baobab)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLudoPlayerColor('yellow')}
                            className={`py-1 px-2 rounded-lg border text-left font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                              ludoPlayerColor === 'yellow'
                                ? 'bg-amber-950 border-amber-500 text-amber-200 shadow ring-1 ring-amber-400'
                                : 'bg-black/40 border-stone-700 text-stone-300'
                            }`}
                          >
                            <span>🟡</span>
                            <span>Jaune (Sahara)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLudoPlayerColor('blue')}
                            className={`py-1 px-2 rounded-lg border text-left font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                              ludoPlayerColor === 'blue'
                                ? 'bg-blue-950 border-blue-500 text-blue-200 shadow ring-1 ring-blue-400'
                                : 'bg-black/40 border-stone-700 text-stone-300'
                            }`}
                          >
                            <span>🔵</span>
                            <span>Bleu (Nil)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Public vs Targeted Invitation */}
                  <div>
                    <label className="block text-[#ffd700] font-semibold mb-1">
                      3. Type d'accès au Défi :
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccessType('public')}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                          accessType === 'public'
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow'
                            : 'bg-black/30 border-white/10 text-stone-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🌍 Défi Public (Tous)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccessType('invite')}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                          accessType === 'invite'
                            ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow'
                            : 'bg-black/30 border-white/10 text-stone-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>🔒 Invitation Ciblée</span>
                      </button>
                    </div>

                    {/* Target player name input if invite */}
                    {accessType === 'invite' && (
                      <div className="mt-2 p-2.5 bg-black/50 border border-amber-500/40 rounded-xl space-y-1 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-amber-400" />
                          <span>Pseudo du joueur à défier personnellement :</span>
                        </label>
                        <input
                          type="text"
                          value={targetPseudo}
                          onChange={(e) => setTargetPseudo(e.target.value)}
                          placeholder="Ex: Nathan, Kwame, Amina..."
                          className="w-full px-2.5 py-1.5 bg-black/70 border border-[#d4a017]/60 rounded-lg text-xs text-amber-200 focus:outline-none focus:border-[#ffd700]"
                        />
                        <p className="text-[10px] text-[#cca072]">
                          Ce joueur verra l'invitation sur son radar avec le choix d'Accepter ou Refuser.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Custom Validity Duration */}
                  <div>
                    <label className="block text-[#ffd700] font-semibold mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>4. Durée de validité du salon (Persistant) :</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {VALIDITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.hours}
                          type="button"
                          onClick={() => setSelectedDuration(opt.hours)}
                          className={`p-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer ${
                            selectedDuration === opt.hours
                              ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 font-bold shadow'
                              : 'bg-black/30 border-white/10 text-stone-300 hover:bg-black/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-400/90 mt-1">
                      ✓ Même si vous quittez l'app ou fermez le salon, le défi reste actif jusqu'à expiration !
                    </p>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={accessType === 'invite' && !targetPseudo.trim()}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-[#914618] to-[#5a2408] border border-[#d4a017] rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4 text-[#ffd700]" />
                    <span>Lancer le Défi & Ouvrir la Salle d'Attente</span>
                  </button>
                </div>
              )}

              {connectionStatus === 'generating' && (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#ffd700] animate-spin" />
                  <p className="text-stone-300">Enregistrement du défi persistant...</p>
                </div>
              )}
            </>
          ) : (
            /* Join Room Tab */
            <div className="space-y-3">
              <label className="block text-[#ffd700] font-semibold">
                Entrez le code ou collez le lien du salon :
              </label>
              <input
                type="text"
                placeholder="Ex: afro-defi-XXXXXX"
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value)}
                className="w-full p-3 bg-[#2a140a] border border-[#d4a017]/60 rounded-xl text-[#ffd700] font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
              />

              <button
                onClick={handleJoinRoom}
                disabled={!inputJoinCode.trim() || connectionStatus === 'generating'}
                className="w-full py-3 bg-gradient-to-r from-[#914618] to-[#5a2408] border border-[#d4a017] rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {connectionStatus === 'generating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[#ffd700]" />
                )}
                <span>Rejoindre le Salon</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
