/**
 * Common types and models for African Challenge Salon
 */

export type GameType = 'checkers' | 'ludo' | 'chess';

export type GameMode = 'bot' | 'pvp' | 'online';

export type ChessDifficulty = 1 | 2 | 3; // 1: Initié, 2: Guerrier, 3: Grand Maître

export type CheckersVariant = 10 | 8; // 10x10 International or 8x8 Classic

export type LudoPlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface GameScore {
  player1: number;
  player2: number;
  draws: number;
}

export interface PlayerProfile {
  id: string;
  pseudo: string;
  avatar: string; // Emoji or icon key
  customPortraitUrl?: string; // AI Generated dynamic portrait SVG/image
  rankTier?: 'bronze' | 'silver' | 'gold' | 'master' | 'emperor';
  title: string; // e.g. "Commandant Impérial"
  createdAt: number;
  stats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
  };
}

export interface AiProbabilityReport {
  p1WinProb: number; // 0 to 100
  p2WinProb: number; // 0 to 100
  drawProb: number; // 0 to 100
  advantagePlayer: 'p1' | 'p2' | 'even';
  advantageMagnitude: 'légère' | 'modérée' | 'décisive' | 'totale';
  summary: string;
  keyThreat: string;
  recommendedMove: string;
  tacticalFactor: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  portraitUrl?: string;
  type: 'text' | 'voice' | 'reaction';
  text?: string;
  audioBase64?: string;
  emoji?: string;
  timestamp: number;
}

export interface LiveChallenge {
  id: string;
  roomCode?: string;
  receiptId?: string;
  challengerName: string;
  creatorPseudo?: string;
  avatar: string;
  challengerAvatar?: string;
  portraitUrl?: string;
  title: string;
  gameType: GameType;
  checkersVariant?: CheckersVariant;
  checkersSize?: CheckersVariant;
  chessDifficulty?: ChessDifficulty;
  ludoPlayers?: 2 | 4;
  ludoPawnsCount?: 1 | 2 | 3 | 4;
  ludoPlayerColor?: LudoPlayerColor;
  maxPlayers?: 2 | 3 | 4;
  accessType?: 'public' | 'invite';
  invitedPseudo?: string;
  prize?: string;
  timeAgo: string;
  status: 'open' | 'accepted' | 'in_progress' | 'refused';
  acceptedBy?: string;
  createdAt?: number;
  expiresAt?: number;
  durationLabel?: string;
}

/* PeerJS Online Sync Payload */
export interface PeerMessage {
  type: 'INIT_STATE' | 'MOVE' | 'RESET' | 'CHAT' | 'REACTION' | 'SYNC_REQUEST' | 'PLAYER_JOINED' | 'START_MATCH';
  gameType: GameType;
  payload: any;
  senderId: string;
}
