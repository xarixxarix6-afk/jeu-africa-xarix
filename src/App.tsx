/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GameMode,
  GameType,
  CheckersVariant,
  ChessDifficulty,
  LudoPlayerColor,
  LiveChallenge,
  PeerMessage,
  PlayerProfile,
} from './types/game';
import { sound } from './services/sound';
import { tacticalVoice } from './services/tacticalVoice';
import { peerService } from './services/peerService';
import { liveChallengeService } from './services/liveChallengeService';
import { playerProfileService } from './services/playerProfileService';
import { MainMenu } from './components/MainMenu';
import { RulesModal } from './components/RulesModal';
import { OnlineRoomModal } from './components/OnlineRoomModal';
import { VictoryModal } from './components/VictoryModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameChatAndReactions } from './components/GameChatAndReactions';
import { WaitingRoomModal } from './components/WaitingRoomModal';
import { CommunityChatModal } from './components/CommunityChatModal';
import { ChallengeReceiptModal } from './components/ChallengeReceiptModal';
import { ChallengeAcceptModal } from './components/ChallengeAcceptModal';
import { TechMusicPlayer } from './components/TechMusicPlayer';
import { CheckersBoard } from './games/checkers/CheckersBoard';
import { LudoBoard } from './games/ludo/LudoBoard';
import { ChessBoard } from './games/chess/ChessBoard';
import {
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  RotateCcw,
  Sparkles,
  Wifi,
  User,
  Users,
  MessageSquare,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  // Player Profiles
  const [activeP1, setActiveP1] = useState<PlayerProfile>(() => playerProfileService.getActiveP1());
  const [activeP2, setActiveP2] = useState<PlayerProfile>(() => playerProfileService.getActiveP2());

  // Navigation & Game State
  const [inGame, setInGame] = useState<boolean>(false);
  const [activeGameType, setActiveGameType] = useState<GameType>('checkers');
  const [activeGameMode, setActiveGameMode] = useState<GameMode>('bot');
  const [checkersSize, setCheckersSize] = useState<CheckersVariant>(10);
  const [chessDifficulty, setChessDifficulty] = useState<ChessDifficulty>(2);
  const [ludoPlayersCount, setLudoPlayersCount] = useState<2 | 4>(2);
  const [ludoPawnsCount, setLudoPawnsCount] = useState<1 | 2 | 3 | 4>(4);
  const [ludoPlayerColor, setLudoPlayerColor] = useState<LudoPlayerColor>('red');

  // Online P2P state
  const [isOnlineHost, setIsOnlineHost] = useState(false);
  const [isOnlineTurn, setIsOnlineTurn] = useState(true);
  const [onlineMoveToApply, setOnlineMoveToApply] = useState<any>(null);

  // HUD & Telemetry
  const [gameTimerSeconds, setGameTimerSeconds] = useState(0);
  const [turnIndicatorText, setTurnIndicatorText] = useState('Tour : --');
  const [scoreText, setScoreText] = useState('Score : 0 - 0');
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());
  const [gameKey, setGameKey] = useState(0); // For restarting component

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);
  const [isCommunityChatOpen, setIsCommunityChatOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState<LiveChallenge | null>(null);
  const [activeReceiptChallenge, setActiveReceiptChallenge] = useState<LiveChallenge | null>(null);
  const [waitingRoomConfig, setWaitingRoomConfig] = useState<{
    roomCode: string;
    gameType: GameType;
    checkersSize?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    maxPlayers?: 2 | 3 | 4;
    accessType?: 'public' | 'invite';
    invitedPseudo?: string;
    durationHours: number;
    isHost: boolean;
  } | null>(null);
  const [expiredLinkNotice, setExpiredLinkNotice] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerAvatar, setWinnerAvatar] = useState<string | undefined>(undefined);

  const refreshProfiles = () => {
    setActiveP1(playerProfileService.getActiveP1());
    setActiveP2(playerProfileService.getActiveP2());
  };

  const handleAcceptLiveChallenge = (challenge: {
    gameType: GameType;
    roomCode?: string;
    checkersSize?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    maxPlayers?: 2 | 3 | 4;
    challengerName: string;
    challengerAvatar: string;
  }) => {
    setActiveP2({
      id: `challenger_${Date.now()}`,
      pseudo: challenge.challengerName,
      avatar: challenge.challengerAvatar,
      title: 'Souverain Rival',
      createdAt: Date.now(),
      stats: { wins: 12, losses: 5, gamesPlayed: 17 },
    });

    if (challenge.ludoPawnsCount) setLudoPawnsCount(challenge.ludoPawnsCount);
    if (challenge.ludoPlayerColor) {
      const oppColors: Record<LudoPlayerColor, LudoPlayerColor> = {
        red: 'yellow',
        yellow: 'red',
        green: 'blue',
        blue: 'green',
      };
      setLudoPlayerColor(oppColors[challenge.ludoPlayerColor] || 'yellow');
    }

    if (challenge.roomCode) {
      liveChallengeService.acceptChallenge(challenge.roomCode, activeP1.pseudo);
      setWaitingRoomConfig({
        roomCode: challenge.roomCode,
        gameType: challenge.gameType,
        checkersSize: challenge.checkersSize,
        chessDifficulty: challenge.chessDifficulty,
        ludoPlayers: challenge.ludoPlayers,
        ludoPawnsCount: challenge.ludoPawnsCount,
        ludoPlayerColor: challenge.ludoPlayerColor,
        maxPlayers: challenge.maxPlayers,
        durationHours: 24,
        isHost: false,
      });
      setIsWaitingRoomOpen(true);
    } else {
      handleStartGame({
        gameType: challenge.gameType,
        mode: 'bot',
        checkersSize: challenge.checkersSize,
        chessDifficulty: challenge.chessDifficulty || 2,
        ludoPlayers: challenge.ludoPlayers || 2,
        ludoPawnsCount: challenge.ludoPawnsCount || 4,
        ludoPlayerColor: challenge.ludoPlayerColor || 'red',
      });
    }
  };

  const handleReopenWaitingRoom = (challenge: any) => {
    const code = challenge.roomCode || challenge.id;
    setWaitingRoomConfig({
      roomCode: code,
      gameType: challenge.gameType,
      checkersSize: challenge.checkersSize || challenge.checkersVariant,
      chessDifficulty: challenge.chessDifficulty,
      ludoPlayers: challenge.ludoPlayers,
      ludoPawnsCount: challenge.ludoPawnsCount,
      ludoPlayerColor: challenge.ludoPlayerColor,
      maxPlayers: challenge.maxPlayers,
      accessType: challenge.accessType,
      invitedPseudo: challenge.invitedPseudo,
      durationHours: challenge.durationHours || 24,
      isHost: true,
    });
    setIsWaitingRoomOpen(true);
  };

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (inGame && !winnerName) {
      interval = setInterval(() => {
        setGameTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inGame, winnerName]);

  // Handle URL parameter ?salon=... / ?challenge=... & ?exp=... for direct invite
  useEffect(() => {
    const rawSearch =
      window.location.search ||
      (window.location.hash.includes('?') ? `?${window.location.hash.split('?')[1]}` : '');
    const urlParams = new URLSearchParams(rawSearch);
    const roomParam = urlParams.get('salon') || urlParams.get('challenge');
    const hostParam = urlParams.get('host');
    const expParam = urlParams.get('exp');
    const gameParam = (urlParams.get('game') as GameType | null) || 'ludo';
    const playersParam = Number(urlParams.get('players')) || 2;
    const pawnsParam = Number(urlParams.get('pawns')) || 4;
    const colorParam = (urlParams.get('color') as LudoPlayerColor | null) || 'red';

    if (roomParam) {
      if (expParam) {
        const expTime = Number(expParam);
        if (!isNaN(expTime) && expTime < Date.now()) {
          setExpiredLinkNotice(
            `Ce lien de défi pour le salon [${roomParam}] a expiré. La durée de validité définie par le créateur a été dépassée.`
          );
          return;
        }
      }

      // Check if this browser session is the creator
      const isCreatorSession =
        typeof window !== 'undefined' && sessionStorage.getItem('host_room_' + roomParam) === 'true';

      // Check if challenge is already registered in service
      const existing = liveChallengeService.getChallenges().find((c) => c.id === roomParam);
      const targetChallenge =
        existing ||
        liveChallengeService.publishRealChallenge({
          roomCode: roomParam,
          challengerName: hostParam ? decodeURIComponent(hostParam) : 'Souverain Créateur',
          avatar: '👑',
          gameType: gameParam,
          ludoPlayers: (playersParam === 4 ? 4 : 2) as 2 | 4,
          ludoPawnsCount: (pawnsParam >= 1 && pawnsParam <= 4 ? pawnsParam : 4) as 1 | 2 | 3 | 4,
          ludoPlayerColor: colorParam,
          maxPlayers: (playersParam >= 2 && playersParam <= 4 ? playersParam : 2) as 2 | 3 | 4,
          accessType: 'public',
          durationHours: expParam ? Math.max(1, Math.round((Number(expParam) - Date.now()) / 3600000)) : 24,
        });

      setActiveReceiptChallenge(targetChallenge);
      setIncomingChallenge(targetChallenge);

      if (isCreatorSession) {
        handleReopenWaitingRoom(targetChallenge);
      } else {
        setIsAcceptModalOpen(true);
        tacticalVoice.announceChallengeAlert(targetChallenge.challengerName, targetChallenge.title);
      }
    }
  }, []);

  const handleConfirmAcceptIncomingChallenge = (customPseudo: string) => {
    if (!incomingChallenge) return;
    setIsAcceptModalOpen(false);

    // Save customized pseudo for P1
    playerProfileService.updatePlayer(activeP1.id, { pseudo: customPseudo });
    setActiveP1(playerProfileService.getActiveP1());

    // Set opponent P2 as the challenger
    setActiveP2({
      id: `challenger_${Date.now()}`,
      pseudo: incomingChallenge.challengerName,
      avatar: incomingChallenge.avatar || '👑',
      customPortraitUrl: incomingChallenge.portraitUrl,
      title: 'Créateur du Défi',
      createdAt: Date.now(),
      stats: { wins: 8, losses: 3, gamesPlayed: 11 },
    });

    liveChallengeService.acceptChallenge(incomingChallenge.id, customPseudo);

    setWaitingRoomConfig({
      roomCode: incomingChallenge.id,
      gameType: incomingChallenge.gameType,
      checkersSize: incomingChallenge.checkersVariant || incomingChallenge.checkersSize,
      chessDifficulty: incomingChallenge.chessDifficulty,
      ludoPlayers: incomingChallenge.ludoPlayers,
      ludoPawnsCount: incomingChallenge.ludoPawnsCount,
      ludoPlayerColor: incomingChallenge.ludoPlayerColor,
      maxPlayers: incomingChallenge.maxPlayers,
      durationHours: 24,
      isHost: false,
    });
    setIsWaitingRoomOpen(true);
  };

  // PeerJS message listener
  useEffect(() => {
    peerService.onMessage((msg: PeerMessage) => {
      if (msg.type === 'MOVE') {
        setOnlineMoveToApply(msg.payload);
        setIsOnlineTurn(true);
      } else if (msg.type === 'RESET') {
        handleRestartGame(false);
      }
    });
  }, [inGame]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartGame = (config: {
    gameType: GameType;
    mode: GameMode;
    checkersSize?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
  }) => {
    setActiveGameType(config.gameType);
    setActiveGameMode(config.mode);
    if (config.checkersSize) setCheckersSize(config.checkersSize);
    if (config.chessDifficulty) setChessDifficulty(config.chessDifficulty);
    if (config.ludoPlayers) setLudoPlayersCount(config.ludoPlayers);
    if (config.ludoPawnsCount) setLudoPawnsCount(config.ludoPawnsCount);
    if (config.ludoPlayerColor) setLudoPlayerColor(config.ludoPlayerColor);

    setGameTimerSeconds(0);
    setWinnerName(null);
    setWinnerAvatar(undefined);
    setOnlineMoveToApply(null);
    setGameKey((k) => k + 1);
    setInGame(true);

    const gameNames: Record<GameType, string> = {
      checkers: 'Dames',
      ludo: 'Ludo',
      chess: 'Échecs',
    };
    tacticalVoice.announceDuelStart(gameNames[config.gameType] || 'Jeu');
  };

  const handleStartOnlineGame = (config: {
    gameType: GameType;
    variant?: CheckersVariant;
    difficulty?: ChessDifficulty;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    isHost: boolean;
  }) => {
    setIsOnlineHost(config.isHost);
    setIsOnlineTurn(config.isHost); // Host plays first
    handleStartGame({
      gameType: config.gameType,
      mode: 'online',
      checkersSize: config.variant,
      chessDifficulty: config.difficulty,
      ludoPawnsCount: config.ludoPawnsCount,
      ludoPlayerColor: config.ludoPlayerColor,
    });
  };

  const handleRestartGame = (broadcast: boolean = true) => {
    sound.playMove();
    setGameTimerSeconds(0);
    setWinnerName(null);
    setWinnerAvatar(undefined);
    setOnlineMoveToApply(null);
    setGameKey((k) => k + 1);

    if (broadcast && activeGameMode === 'online') {
      peerService.sendMessage({
        type: 'RESET',
        gameType: activeGameType,
        payload: null,
        senderId: peerService.getMyId(),
      });
    }
  };

  const handleQuitGame = () => {
    sound.playMove();
    setInGame(false);
    setWinnerName(null);
    setWinnerAvatar(undefined);
    peerService.cleanup();
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleGameOver = (winner: string, avatar?: string) => {
    setWinnerName(winner);
    setWinnerAvatar(avatar);

    // Record win in persistent player profile service
    const isP1Win =
      winner.includes(activeP1.pseudo) ||
      (!winner.toLowerCase().includes('bot') &&
        !winner.toLowerCase().includes('ia') &&
        activeGameMode === 'bot');

    playerProfileService.recordGameResult(isP1Win ? 1 : 2);
    refreshProfiles();
  };

  const handleSendOnlineMove = (move: any) => {
    setIsOnlineTurn(false);
    peerService.sendMessage({
      type: 'MOVE',
      gameType: activeGameType,
      payload: move,
      senderId: peerService.getMyId(),
    });
  };

  const getGameDisplayTitle = () => {
    switch (activeGameType) {
      case 'checkers':
        return checkersSize === 10 ? 'DAMES 10x10 INTER.' : 'DAMES 8x8 CLASSIQUE';
      case 'ludo':
        return `LUDO ROYAL (${ludoPlayersCount}J)`;
      case 'chess':
        return 'ÉCHECS DES ROIS';
    }
  };

  return (
    <div className="w-full min-h-screen wax-pattern flex items-center justify-center p-0 sm:p-4 text-[#f3e5d8]">
      {/* Mobile/Tablet 9:16 optimized African Carved Wood Case */}
      <div className="w-full h-screen sm:h-[94vh] sm:max-h-[860px] sm:max-w-[430px] bg-gradient-to-b from-[#2e1408] via-[#1a0a04] to-[#0c0402] sm:border-4 sm:border-[#d4a017] sm:rounded-3xl flex flex-col relative shadow-[0_0_40px_rgba(212,160,23,0.3)] overflow-hidden">
        {/* Top African Carved Header */}
        <header className="h-16 bg-gradient-to-b from-[#2a1309] to-[#150803] border-b-2 border-[#d4a017] px-3.5 flex items-center justify-between z-20 shrink-0">
          {inGame ? (
            <button
              onClick={handleQuitGame}
              className="px-2.5 py-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow"
              title="Quitter la partie"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter</span>
            </button>
          ) : (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#421c0e] hover:bg-[#5c2a11] border border-[#d4a017] rounded-lg text-[#ffd700] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
              title="Gérer les profils et portraits IA"
            >
              {activeP1.customPortraitUrl ? (
                <img
                  src={activeP1.customPortraitUrl}
                  alt={activeP1.pseudo}
                  className="w-5 h-5 rounded-full border border-[#ffd700] object-cover bg-black/60 shrink-0"
                />
              ) : (
                <span className="text-sm">{activeP1.avatar}</span>
              )}
              <span className="truncate max-w-[85px]">{activeP1.pseudo}</span>
            </button>
          )}

          <div className="text-center">
            <div className="font-royal font-extrabold text-xs text-[#ffd700] tracking-wider uppercase drop-shadow">
              {inGame ? getGameDisplayTitle() : 'SALON DU DÉFI'}
            </div>
            {inGame && (
              <div className="text-[11px] font-mono text-[#d8b28a]">
                {formatTimer(gameTimerSeconds)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activeGameMode === 'online' && inGame && (
              <div
                className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400"
                title="Connecté en direct P2P"
              >
                <Wifi className="w-3.5 h-3.5" />
              </div>
            )}

            <button
              onClick={() => setIsCommunityChatOpen(true)}
              className="p-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow"
              title="Chat Général & Potes (Tag @ami / @IA)"
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
            </button>

            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow"
              title="Classement Général des Souverains"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
            </button>

            {inGame && (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
                title={`Profil : ${activeP1.pseudo} (${activeP1.avatar})`}
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsRulesOpen(true)}
              className="p-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
              title="Règles du jeu"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggleSound}
              className="p-1.5 bg-[#421c0e] hover:bg-[#5a2713] border border-[#d4a017] text-[#ffd700] rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffd700]" />}
            </button>
          </div>
        </header>

        {/* Tech Cyber Music Bar - Synchronized with Tactical AI Voice */}
        <div className="px-3 py-1 bg-gradient-to-r from-[#190903] via-[#0f0401] to-[#190903] border-b border-[#d4a017]/40 flex items-center justify-between z-15 shrink-0">
          <TechMusicPlayer />
          <div className="text-[9px] text-[#b48d62] font-mono hidden xs:block">
            SYNCHRO IA VOCALE
          </div>
        </div>

        {/* Status Bar (Turn & Score) */}
        {inGame && (
          <div className="px-3.5 py-1.5 bg-[#120804]/90 border-b border-[#d4a017]/30 flex items-center justify-between text-xs text-[#d8b28a] z-10 shrink-0">
            <span className="font-semibold text-amber-200 truncate max-w-[170px]">
              {turnIndicatorText}
            </span>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#ffd700] bg-black/40 px-2 py-0.5 rounded border border-[#d4a017]/30">
                {scoreText}
              </span>

              <button
                onClick={() => handleRestartGame(true)}
                className="px-2 py-0.5 bg-[#421c0e] hover:bg-[#572714] border border-[#d4a017]/70 text-[#ffd700] rounded text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Relancer la partie"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Relancer</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Stage Arena */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-3 relative">
          {!inGame ? (
            <MainMenu
              onStartGame={handleStartGame}
              onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
              onOpenRules={() => setIsRulesOpen(true)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onOpenCommunityChat={() => setIsCommunityChatOpen(true)}
              onAcceptChallenge={handleAcceptLiveChallenge}
              onReopenWaitingRoom={handleReopenWaitingRoom}
              onShowReceipt={(challenge) => {
                setActiveReceiptChallenge(challenge);
                setIsReceiptModalOpen(true);
              }}
              activeP1={activeP1}
              activeP2={activeP2}
            />
          ) : (
            <div className="w-full flex flex-col items-center justify-center relative">
              {activeGameType === 'checkers' && (
                <CheckersBoard
                  key={gameKey}
                  size={checkersSize}
                  mode={activeGameMode}
                  p1Name={activeP1.pseudo}
                  p1Avatar={activeP1.avatar}
                  p2Name={activeP2.pseudo}
                  p2Avatar={activeP2.avatar}
                  onGameOver={handleGameOver}
                  onTurnChange={setTurnIndicatorText}
                  onScoreUpdate={(p1, p2) => setScoreText(`${activeP1.pseudo}: ${p1} • Adv: ${p2}`)}
                  isOnlineTurn={isOnlineTurn}
                  onSendOnlineMove={handleSendOnlineMove}
                  onlineMoveReceived={onlineMoveToApply}
                />
              )}

              {activeGameType === 'ludo' && (
                <LudoBoard
                  key={gameKey}
                  numPlayers={ludoPlayersCount}
                  pawnsCount={ludoPawnsCount}
                  p1Color={ludoPlayerColor}
                  mode={activeGameMode}
                  p1Name={activeP1.pseudo}
                  p1Avatar={activeP1.avatar}
                  p2Name={activeP2.pseudo}
                  p2Avatar={activeP2.avatar}
                  onGameOver={handleGameOver}
                  onTurnChange={setTurnIndicatorText}
                  onScoreUpdate={(p1, p2) => setScoreText(`Maison: ${p1} - ${p2}`)}
                  isOnlineTurn={isOnlineTurn}
                  onSendOnlineMove={handleSendOnlineMove}
                  onlineMoveReceived={onlineMoveToApply}
                />
              )}

              {activeGameType === 'chess' && (
                <ChessBoard
                  key={gameKey}
                  difficulty={chessDifficulty}
                  mode={activeGameMode}
                  p1Name={activeP1.pseudo}
                  p1Avatar={activeP1.avatar}
                  p2Name={activeP2.pseudo}
                  p2Avatar={activeP2.avatar}
                  onGameOver={handleGameOver}
                  onTurnChange={setTurnIndicatorText}
                  onScoreUpdate={(w, b) => setScoreText(`${activeP1.pseudo}: ${w} • Adv: ${b}`)}
                  isOnlineTurn={isOnlineTurn}
                  onSendOnlineMove={handleSendOnlineMove}
                  onlineMoveReceived={onlineMoveToApply}
                />
              )}

              {/* In-Game Real-Time Written & Recorded Voice Chat + Fast Emoji Mood Reactions */}
              <GameChatAndReactions
                gameType={activeGameType}
                gameMode={activeGameMode}
                playerName={activeP1.pseudo}
                playerAvatar={activeP1.avatar}
                playerPortraitUrl={activeP1.customPortraitUrl}
                opponentName={activeGameMode === 'bot' ? (activeP2.pseudo || 'IA Impériale') : activeP2.pseudo}
                opponentPortraitUrl={activeP2.customPortraitUrl}
              />
            </div>
          )}
        </main>
      </div>

      {/* Rules Modal */}
      <RulesModal
        initialGame={activeGameType}
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Online Room Modal */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        activePlayer={activeP1}
        onStartOnlineGame={handleStartOnlineGame}
        onOpenWaitingRoom={(cfg) => {
          setWaitingRoomConfig(cfg);
          setIsWaitingRoomOpen(true);
        }}
        onShowReceipt={(challenge) => {
          setActiveReceiptChallenge(challenge);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Royal Waiting Room Modal */}
      {isWaitingRoomOpen && waitingRoomConfig && (
        <WaitingRoomModal
          isOpen={isWaitingRoomOpen}
          onClose={() => setIsWaitingRoomOpen(false)}
          roomCode={waitingRoomConfig.roomCode}
          isHost={waitingRoomConfig.isHost}
          gameType={waitingRoomConfig.gameType}
          checkersSize={waitingRoomConfig.checkersSize}
          chessDifficulty={waitingRoomConfig.chessDifficulty}
          ludoPlayers={waitingRoomConfig.ludoPlayers}
          ludoPawnsCount={waitingRoomConfig.ludoPawnsCount}
          ludoPlayerColor={waitingRoomConfig.ludoPlayerColor}
          maxPlayers={waitingRoomConfig.maxPlayers}
          accessType={waitingRoomConfig.accessType}
          invitedPseudo={waitingRoomConfig.invitedPseudo}
          activePlayer={activeP1}
          initialExpirationHours={waitingRoomConfig.durationHours}
          onShowReceipt={() => {
            const ch = liveChallengeService.getChallenges().find((c) => c.roomCode === waitingRoomConfig.roomCode || c.id === waitingRoomConfig.roomCode);
            if (ch) {
              setActiveReceiptChallenge(ch);
              setIsReceiptModalOpen(true);
            } else if (activeReceiptChallenge) {
              setIsReceiptModalOpen(true);
            }
          }}
          onStartGame={(joinedPlayers) => {
            setIsWaitingRoomOpen(false);
            if (joinedPlayers[1]) {
              setActiveP2(joinedPlayers[1]);
            }
            handleStartOnlineGame({
              gameType: waitingRoomConfig.gameType,
              variant: waitingRoomConfig.checkersSize,
              difficulty: waitingRoomConfig.chessDifficulty,
              ludoPawnsCount: waitingRoomConfig.ludoPawnsCount,
              ludoPlayerColor: waitingRoomConfig.ludoPlayerColor,
              isHost: waitingRoomConfig.isHost,
            });
          }}
        />
      )}

      {/* Direct Challenge Acceptance Modal for Shared Links */}
      <ChallengeAcceptModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        challenge={incomingChallenge}
        currentViewerPseudo={activeP1.pseudo}
        onAccept={handleConfirmAcceptIncomingChallenge}
        onViewReceipt={() => {
          setIsAcceptModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
        onRefuse={() => {
          if (incomingChallenge) {
            liveChallengeService.refuseChallenge(incomingChallenge.id, activeP1.pseudo);
          }
          setIsAcceptModalOpen(false);
        }}
      />

      {/* Royal Official Challenge Receipt Modal */}
      <ChallengeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        challenge={activeReceiptChallenge}
        currentViewerPseudo={activeP1.pseudo}
        onAcceptChallenge={(ch) => {
          setIsReceiptModalOpen(false);
          handleAcceptLiveChallenge({
            gameType: ch.gameType,
            roomCode: ch.roomCode || ch.id,
            checkersSize: ch.checkersSize || ch.checkersVariant,
            chessDifficulty: ch.chessDifficulty,
            ludoPlayers: ch.ludoPlayers,
            ludoPawnsCount: ch.ludoPawnsCount,
            ludoPlayerColor: ch.ludoPlayerColor,
            maxPlayers: ch.maxPlayers,
            challengerName: ch.challengerName,
            challengerAvatar: ch.challengerAvatar || ch.avatar || '👑',
          });
        }}
        onOpenWaitingRoom={(ch) => {
          setIsReceiptModalOpen(false);
          handleReopenWaitingRoom(ch);
        }}
      />

      {/* Community Chat Between Friends & with AI (@tagging) */}
      <CommunityChatModal
        isOpen={isCommunityChatOpen}
        onClose={() => setIsCommunityChatOpen(false)}
        activePlayer={activeP1}
        otherProfiles={[activeP2]}
      />

      {/* Expired Link Notice Modal */}
      {expiredLinkNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-4 bg-gradient-to-b from-[#3a1407] to-[#1a0702] border-2 border-red-500 rounded-2xl shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-royal font-bold text-red-200 uppercase tracking-wide">
              Lien de Défi Expiré
            </h3>
            <p className="text-xs text-[#e8cbb0] leading-relaxed">
              {expiredLinkNotice}
            </p>
            <button
              onClick={() => {
                setExpiredLinkNotice(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              className="w-full py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Player Inscription & Custom Pseudos Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfilesChanged={refreshProfiles}
      />

      {/* General Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        activePlayerId={activeP1.id}
      />

      {/* Victory Celebration Modal */}
      {winnerName && (
        <VictoryModal
          winner={winnerName}
          winnerAvatar={winnerAvatar}
          isOpen={Boolean(winnerName)}
          onRestart={() => handleRestartGame(true)}
          onHome={handleQuitGame}
        />
      )}
    </div>
  );
}
