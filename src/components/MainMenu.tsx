import React, { useState } from 'react';
import {
  GameMode,
  GameType,
  CheckersVariant,
  ChessDifficulty,
  LudoPlayerColor,
  LiveChallenge,
  PlayerProfile,
} from '../types/game';
import {
  Crown,
  Bot,
  Swords,
  Globe,
  ArrowLeft,
  Shield,
  Users,
  Trophy,
  Play,
  FileText,
} from 'lucide-react';
import { sound } from '../services/sound';
import { LiveChallengeRadar } from './LiveChallengeRadar';

interface MainMenuProps {
  onStartGame: (config: {
    gameType: GameType;
    mode: GameMode;
    checkersSize?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
  }) => void;
  onOpenOnlineModal: () => void;
  onOpenRules: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenCommunityChat: () => void;
  onShowReceipt?: (challenge: LiveChallenge) => void;
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
  onReopenWaitingRoom?: (challenge: any) => void;
  activeP1: PlayerProfile;
  activeP2: PlayerProfile;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenOnlineModal,
  onOpenRules,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenCommunityChat,
  onShowReceipt,
  onAcceptChallenge,
  onReopenWaitingRoom,
  activeP1,
  activeP2,
}) => {
  const [activeMenu, setActiveMenu] = useState<
    'main' | 'game-select' | 'chess-diff' | 'ludo-setup'
  >('main');
  const [selectedMode, setSelectedMode] = useState<GameMode>('bot');
  const [ludoPlayerCount, setLudoPlayerCount] = useState<2 | 4>(2);
  const [ludoPawnsCount, setLudoPawnsCount] = useState<1 | 2 | 3 | 4>(4);
  const [ludoPlayerColor, setLudoPlayerColor] = useState<LudoPlayerColor>('red');

  const handleSelectMode = (mode: GameMode) => {
    sound.playMove();
    if (mode === 'online') {
      onOpenOnlineModal();
    } else {
      setSelectedMode(mode);
      setActiveMenu('game-select');
    }
  };

  const handleSelectGame = (game: GameType, variantParam?: number) => {
    sound.playMove();
    if (game === 'checkers') {
      onStartGame({
        gameType: 'checkers',
        mode: selectedMode,
        checkersSize: (variantParam as CheckersVariant) || 10,
      });
    } else if (game === 'ludo') {
      setActiveMenu('ludo-setup');
    } else if (game === 'chess') {
      if (selectedMode === 'bot') {
        setActiveMenu('chess-diff');
      } else {
        onStartGame({
          gameType: 'chess',
          mode: selectedMode,
          chessDifficulty: 2,
        });
      }
    }
  };

  const handleSelectChessDifficulty = (diff: ChessDifficulty) => {
    sound.playMove();
    onStartGame({
      gameType: 'chess',
      mode: 'bot',
      chessDifficulty: diff,
    });
  };

  const handleStartLudoGame = () => {
    sound.playMove();
    onStartGame({
      gameType: 'ludo',
      mode: selectedMode,
      ludoPlayers: ludoPlayerCount,
      ludoPawnsCount,
      ludoPlayerColor,
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 text-center select-none relative z-10">
      {/* 1. Main View */}
      {activeMenu === 'main' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7a3917] via-[#481c09] to-[#1e0a03] border-2 border-[#d4a017] flex items-center justify-center shadow-2xl">
              <Crown className="w-10 h-10 text-[#ffd700] drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-[#d4a017] rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider shadow">
              3-en-1
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black font-royal tracking-wider text-[#ffd700] drop-shadow-md uppercase">
              Salon du Défi Africain
            </h1>
            <p className="text-xs text-[#cca072] mt-1 font-medium">
              Dames Internationales & 8x8 • Ludo Royal • Échecs des Rois
            </p>
          </div>

          {/* Active Player Profile Banner & Leaderboard */}
          <div className="w-full flex items-center gap-2">
            <div
              onClick={onOpenProfile}
              className="flex-1 flex items-center justify-between p-2.5 bg-gradient-to-r from-[#381809]/95 to-[#1c0b04]/95 hover:from-[#4a200b] hover:to-[#240e05] border-2 border-[#d4a017]/70 hover:border-[#ffd700] rounded-2xl cursor-pointer transition-all shadow-md group"
              title="Gérer les profils et créer un pseudo personnalisé"
            >
              <div className="flex items-center gap-2">
                {activeP1.customPortraitUrl ? (
                  <img
                    src={activeP1.customPortraitUrl}
                    alt={activeP1.pseudo}
                    className="w-10 h-10 rounded-xl border border-[#ffd700] object-cover group-hover:scale-105 transition-transform shadow bg-black/60"
                  />
                ) : (
                  <span className="text-2xl p-1 bg-black/50 rounded-xl border border-[#d4a017]/40 group-hover:scale-110 transition-transform shadow">
                    {activeP1.avatar}
                  </span>
                )}
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="truncate max-w-[95px]">{activeP1.pseudo}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-[#7a3917] text-amber-200 rounded font-medium border border-amber-600/40">
                      {activeP1.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#cca072] mt-0.5">
                    {activeP1.stats.wins} victoires • {activeP1.stats.gamesPlayed > 0 ? Math.round((activeP1.stats.wins / activeP1.stats.gamesPlayed) * 100) : 0}% ratio
                  </div>
                </div>
              </div>
            </div>

            {/* General Leaderboard Trophy Button */}
            <button
              onClick={onOpenLeaderboard}
              className="p-2.5 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-2 border-[#ffd700] rounded-2xl text-black font-extrabold flex flex-col items-center justify-center gap-0.5 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
              title="Classement Général de tous les joueurs"
            >
              <Trophy className="w-5 h-5 text-amber-100 drop-shadow" />
              <span className="text-[9px] uppercase tracking-tight text-white font-black">
                Rang
              </span>
            </button>
          </div>

          {/* Real-Time Live Challenge Radar with Tech AI Voice Announcements & "Accepter" */}
          <LiveChallengeRadar
            activePlayerPseudo={activeP1.pseudo}
            onAcceptChallenge={onAcceptChallenge}
            onCreateSalon={onOpenOnlineModal}
            onReopenWaitingRoom={onReopenWaitingRoom}
            onShowReceipt={onShowReceipt}
          />

          {/* Dedicated Community Chat "Entre Potes" Button */}
          <button
            onClick={onOpenCommunityChat}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 hover:brightness-110 border-2 border-purple-400 rounded-xl text-purple-200 font-bold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-300" />
            <span>💬 Salon Discussion & Potes (Tag @ami ou @IA)</span>
          </button>

          <div className="w-full space-y-2 pt-1">
            <button
              onClick={() => handleSelectMode('bot')}
              className="w-full p-3.5 bg-gradient-to-r from-[#7a3917] to-[#451b08] hover:from-[#92451d] hover:to-[#57230b] border-2 border-[#d4a017] rounded-xl text-white font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
            >
              <Bot className="w-5 h-5 text-[#ffd700]" />
              <span>🤖 Entraînement vs Bot</span>
            </button>

            <button
              onClick={() => handleSelectMode('pvp')}
              className="w-full p-3.5 bg-gradient-to-r from-[#5a2408] to-[#301305] hover:from-[#722f0c] hover:to-[#411907] border-2 border-[#d4a017]/80 rounded-xl text-white font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
            >
              <Swords className="w-5 h-5 text-amber-300" />
              <span>⚔️ 2 Joueurs Local (Pass & Play)</span>
            </button>

            <button
              onClick={() => handleSelectMode('online')}
              className="w-full p-3.5 bg-gradient-to-r from-[#411805] to-[#200c03] hover:from-[#582107] hover:to-[#321204] border-2 border-[#ffd700] rounded-xl text-[#ffd700] font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
            >
              <Globe className="w-5 h-5 text-amber-400" />
              <span>🌍 Défi Salon Partagé (Lien P2P)</span>
            </button>
          </div>

          <div className="pt-3 flex items-center gap-4">
            <button
              onClick={onOpenRules}
              className="text-xs text-[#d8b28a] hover:text-[#ffd700] underline underline-offset-4 transition-colors font-medium"
            >
              📖 Voir les règles du salon & des jeux
            </button>
          </div>

          <div className="text-[11px] text-[#8e684a] pt-1">
            Voix IA Tactique • Bois sculpté & Motifs Wax
          </div>
        </div>
      )}

      {/* 2. Choose Game Screen */}
      {activeMenu === 'game-select' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-3">
          <h2 className="text-lg font-royal font-bold text-[#ffd700] uppercase">
            Choisissez Votre Jeu
          </h2>
          <p className="text-xs text-[#d8b28a] mb-2">
            Mode : {selectedMode === 'bot' ? 'Entraînement vs Bot' : '2 Joueurs Local'}
          </p>

          <div className="w-full space-y-2.5">
            <button
              onClick={() => handleSelectGame('checkers', 10)}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-[#d4a017] rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <div>
                <div className="font-bold text-sm text-amber-200">👑 Dames 10x10 International</div>
                <div className="text-[11px] text-[#c9a785]">Règle africaine : Dames volantes, prises obligatoires & voix IA</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>

            <button
              onClick={() => handleSelectGame('checkers', 8)}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-[#d4a017]/70 rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <div>
                <div className="font-bold text-sm text-amber-200">👑 Dames 8x8 Classique</div>
                <div className="text-[11px] text-[#c9a785]">Damier rapide et condensé (12 pions)</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>

            <button
              onClick={() => handleSelectGame('ludo')}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-[#d4a017] rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <div>
                <div className="font-bold text-sm text-amber-200">🎲 Ludo Royal Africain (Pachisi)</div>
                <div className="text-[11px] text-[#c9a785]">Course au palais avec capture de pions & dé 3D</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>

            <button
              onClick={() => handleSelectGame('chess')}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-[#d4a017] rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <div>
                <div className="font-bold text-sm text-amber-200">⚔️ Échecs des Rois Africains</div>
                <div className="text-[11px] text-[#c9a785]">Stratégie impériale, calcul des chances IA en direct</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>
          </div>

          <button
            onClick={() => setActiveMenu('main')}
            className="mt-4 px-4 py-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-xl text-[#d8b28a] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au menu</span>
          </button>
        </div>
      )}

      {/* 3. Chess Difficulty Screen */}
      {activeMenu === 'chess-diff' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-3">
          <h2 className="text-lg font-royal font-bold text-[#ffd700] uppercase">
            Difficulté de l'IA
          </h2>
          <p className="text-xs text-[#d8b28a] mb-2">
            Affrontez les maîtres de la stratégie impériale
          </p>

          <div className="w-full space-y-2">
            <button
              onClick={() => handleSelectChessDifficulty(1)}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-amber-500/50 rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer"
            >
              <div>
                <div className="font-bold text-sm text-emerald-400">Niveau 1 : Initié</div>
                <div className="text-[11px] text-[#c9a785]">Pour apprendre et parfaire ses coups</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>

            <button
              onClick={() => handleSelectChessDifficulty(2)}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-amber-500 rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer"
            >
              <div>
                <div className="font-bold text-sm text-amber-300">Niveau 2 : Guerrier</div>
                <div className="text-[11px] text-[#c9a785]">Anticipation tactique et contrôle du centre</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>

            <button
              onClick={() => handleSelectChessDifficulty(3)}
              className="w-full p-3.5 bg-[#381809] hover:bg-[#52240f] border border-[#ffd700] rounded-xl text-left text-white flex items-center justify-between transition-all active:scale-95 cursor-pointer"
            >
              <div>
                <div className="font-bold text-sm text-red-400">Niveau 3 : Grand Maître</div>
                <div className="text-[11px] text-[#c9a785]">Minimax & Élagage Alpha-Bêta impitoyable</div>
              </div>
              <span className="text-amber-400 font-bold">➔</span>
            </button>
          </div>

          <button
            onClick={() => setActiveMenu('game-select')}
            className="mt-4 px-4 py-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-xl text-[#d8b28a] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Changer de jeu</span>
          </button>
        </div>
      )}

      {/* 4. Ludo Setup Screen with Pawns & Camp Selection */}
      {activeMenu === 'ludo-setup' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-3.5">
          <div>
            <h2 className="text-lg font-royal font-bold text-[#ffd700] uppercase">
              Configuration Ludo Royal
            </h2>
            <p className="text-xs text-[#d8b28a] mt-0.5">
              Personnalisez les règles de la bataille
            </p>
          </div>

          {/* 1. Player Count (2 or 4) */}
          <div className="w-full p-3 bg-black/50 border border-[#d4a017]/50 rounded-2xl space-y-1.5 text-left">
            <span className="text-xs font-bold text-[#ffd700] block">
              1. Nombre de Combattants :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLudoPlayerCount(2)}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  ludoPlayerCount === 2
                    ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
                    : 'bg-black/30 border-white/10 text-stone-400'
                }`}
              >
                ⚔️ Duel 2 Joueurs
              </button>
              <button
                type="button"
                onClick={() => setLudoPlayerCount(4)}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  ludoPlayerCount === 4
                    ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow'
                    : 'bg-black/30 border-white/10 text-stone-400'
                }`}
              >
                👑 Tournoi 4 Joueurs
              </button>
            </div>
          </div>

          {/* 2. Number of Pawns (1, 2, 3, or 4) */}
          <div className="w-full p-3 bg-black/50 border border-[#d4a017]/50 rounded-2xl space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ffd700]">
                2. Nombre de Pions par Joueur :
              </span>
              <span className="text-[10px] text-amber-300 font-semibold font-mono">
                {ludoPawnsCount} {ludoPawnsCount > 1 ? 'Pions' : 'Pion'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([1, 2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setLudoPawnsCount(count)}
                  className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    ludoPawnsCount === count
                      ? 'bg-[#7a3917] border-[#ffd700] text-amber-200 shadow ring-1 ring-amber-300'
                      : 'bg-black/30 border-white/10 text-stone-300 hover:bg-black/50'
                  }`}
                >
                  {count} {count > 1 ? 'Pions' : 'Pion'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">
              ✓ Condition de victoire : tous les {ludoPawnsCount} pions doivent être rentrés au palais !
            </p>
          </div>

          {/* 3. Camp / Color Selection */}
          <div className="w-full p-3 bg-black/50 border border-[#d4a017]/50 rounded-2xl space-y-1.5 text-left">
            <span className="text-xs font-bold text-[#ffd700] block">
              3. Choisissez Votre Camp & Couleur :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLudoPlayerColor('red')}
                className={`py-1.5 px-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  ludoPlayerColor === 'red'
                    ? 'bg-red-950 border-red-500 text-red-200 shadow ring-1 ring-red-400'
                    : 'bg-black/30 border-stone-700 text-stone-300'
                }`}
              >
                <span className="text-base">🔴</span>
                <span className="truncate">Rouge (Lion)</span>
              </button>
              <button
                type="button"
                onClick={() => setLudoPlayerColor('green')}
                className={`py-1.5 px-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  ludoPlayerColor === 'green'
                    ? 'bg-green-950 border-green-500 text-green-200 shadow ring-1 ring-green-400'
                    : 'bg-black/30 border-stone-700 text-stone-300'
                }`}
              >
                <span className="text-base">🟢</span>
                <span className="truncate">Vert (Baobab)</span>
              </button>
              <button
                type="button"
                onClick={() => setLudoPlayerColor('yellow')}
                className={`py-1.5 px-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  ludoPlayerColor === 'yellow'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 shadow ring-1 ring-amber-400'
                    : 'bg-black/30 border-stone-700 text-stone-300'
                }`}
              >
                <span className="text-base">🟡</span>
                <span className="truncate">Jaune (Or)</span>
              </button>
              <button
                type="button"
                onClick={() => setLudoPlayerColor('blue')}
                className={`py-1.5 px-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  ludoPlayerColor === 'blue'
                    ? 'bg-blue-950 border-blue-500 text-blue-200 shadow ring-1 ring-blue-400'
                    : 'bg-black/30 border-stone-700 text-stone-300'
                }`}
              >
                <span className="text-base">🔵</span>
                <span className="truncate">Bleu (Nil)</span>
              </button>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleStartLudoGame}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 border-2 border-[#ffd700] rounded-xl text-black font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Lancer la Bataille Ludo</span>
          </button>

          <button
            onClick={() => setActiveMenu('game-select')}
            className="mt-1 px-4 py-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-xl text-[#d8b28a] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Changer de jeu</span>
          </button>
        </div>
      )}
    </div>
  );
};
