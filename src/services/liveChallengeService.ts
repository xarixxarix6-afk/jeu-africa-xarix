/**
 * Real Live Challenge Registry & Synchronization Service
 * Manages genuinely created challenge rooms across tabs, windows, and P2P sessions.
 * NO simulated or fabricated challenges.
 * Persists across page exits, waiting rooms, and browser sessions until expiration.
 */

import { LiveChallenge, GameType, CheckersVariant, ChessDifficulty, LudoPlayerColor } from '../types/game';
import { tacticalVoice } from './tacticalVoice';

const STORAGE_KEY = 'afro_real_active_challenges_v1';
const CHANNEL_NAME = 'afro_real_challenges_channel';

type ChallengeListener = (challenges: LiveChallenge[]) => void;

class LiveChallengeService {
  private challenges: LiveChallenge[] = [];
  private listeners: ChallengeListener[] = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.loadFromStorage();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'CHALLENGE_CREATED') {
            this.handleIncomingRealChallenge(event.data.challenge, false);
          } else if (event.data?.type === 'CHALLENGE_ACCEPTED') {
            this.handleRemoteChallengeAccepted(event.data.challengeId);
          } else if (event.data?.type === 'CHALLENGE_REFUSED') {
            this.handleRemoteChallengeRefused(event.data.challengeId);
          } else if (event.data?.type === 'CHALLENGE_REMOVED') {
            this.removeChallenge(event.data.challengeId, false);
          } else if (event.data?.type === 'CALL_FOR_PLAYERS') {
            this.handleIncomingCallForPlayers(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available', e);
      }

      // Also listen to storage events across tabs
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.loadFromStorage();
          this.notifyListeners();
        }
      });
    }

    // Clean up expired challenges
    this.purgeExpired();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: LiveChallenge[] = JSON.parse(stored);
        const now = Date.now();
        // Keep only unexpired challenges
        this.challenges = parsed.filter((c) => !c.expiresAt || c.expiresAt > now);
      } else {
        this.challenges = [];
      }
    } catch {
      this.challenges = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.challenges));
    } catch {}
    this.notifyListeners();
  }

  private purgeExpired() {
    const now = Date.now();
    const beforeCount = this.challenges.length;
    this.challenges = this.challenges.filter((c) => !c.expiresAt || c.expiresAt > now);
    if (this.challenges.length !== beforeCount) {
      this.saveToStorage();
    }
  }

  public getChallenges(): LiveChallenge[] {
    this.purgeExpired();
    return [...this.challenges];
  }

  public getOpenChallenges(): LiveChallenge[] {
    return this.getChallenges().filter((c) => c.status === 'open');
  }

  /**
   * Retrieves active challenges created by me (so I can return to them)
   */
  public getMyActiveSalons(myPseudo: string): LiveChallenge[] {
    const list = this.getChallenges();
    const lower = (myPseudo || '').toLowerCase();
    return list.filter(
      (c) =>
        c.status !== 'refused' &&
        ((c.challengerName && c.challengerName.toLowerCase() === lower) ||
          (c.creatorPseudo && c.creatorPseudo.toLowerCase() === lower))
    );
  }

  /**
   * Retrieves direct invitations targeted specifically at my profile
   */
  public getReceivedInvites(myPseudo: string): LiveChallenge[] {
    const list = this.getChallenges();
    const lower = (myPseudo || '').trim().toLowerCase();
    if (!lower) return [];
    return list.filter(
      (c) =>
        c.accessType === 'invite' &&
        c.status === 'open' &&
        c.invitedPseudo &&
        c.invitedPseudo.trim().toLowerCase() === lower
    );
  }

  /**
   * Publishes a genuine challenge created by a real player
   */
  public publishRealChallenge(challenge: {
    roomCode: string;
    receiptId?: string;
    challengerName: string;
    creatorPseudo?: string;
    avatar: string;
    portraitUrl?: string;
    gameType: GameType;
    checkersVariant?: CheckersVariant;
    chessDifficulty?: ChessDifficulty;
    ludoPlayers?: 2 | 4;
    ludoPawnsCount?: 1 | 2 | 3 | 4;
    ludoPlayerColor?: LudoPlayerColor;
    maxPlayers?: 2 | 3 | 4;
    accessType?: 'public' | 'invite';
    invitedPseudo?: string;
    durationHours?: number;
  }): LiveChallenge {
    const now = Date.now();
    const duration = challenge.durationHours || 24;
    const expiresAt = now + duration * 3600 * 1000;

    let gameTitle = '';
    let gameVoiceLabel = '';
    const playerCount = challenge.maxPlayers || challenge.ludoPlayers || 2;
    const pawns = challenge.ludoPawnsCount || 4;

    if (challenge.gameType === 'checkers') {
      gameTitle = `Dames ${challenge.checkersVariant || 10}x${challenge.checkersVariant || 10} (2J)`;
      gameVoiceLabel = `Dames Africaines ${challenge.checkersVariant || 10} par ${challenge.checkersVariant || 10}`;
    } else if (challenge.gameType === 'chess') {
      gameTitle = 'Échecs des Rois Africains (2J)';
      gameVoiceLabel = 'Échecs des Rois';
    } else {
      gameTitle = `Ludo Royal (${playerCount}J • ${pawns} Pions)`;
      gameVoiceLabel = `Ludo Royal Africain à ${playerCount} joueurs et ${pawns} pions`;
    }

    const receiptId =
      challenge.receiptId ||
      `REC-${challenge.roomCode.replace(/^afro-defi-/, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const realChallenge: LiveChallenge = {
      id: challenge.roomCode,
      receiptId,
      challengerName: challenge.challengerName,
      creatorPseudo: challenge.creatorPseudo || challenge.challengerName,
      avatar: challenge.avatar,
      portraitUrl: challenge.portraitUrl,
      title: gameTitle,
      gameType: challenge.gameType,
      checkersVariant: challenge.checkersVariant,
      chessDifficulty: challenge.chessDifficulty,
      ludoPlayers: challenge.ludoPlayers,
      ludoPawnsCount: challenge.ludoPawnsCount || 4,
      ludoPlayerColor: challenge.ludoPlayerColor || 'red',
      maxPlayers: playerCount as 2 | 3 | 4,
      accessType: challenge.accessType || 'public',
      invitedPseudo: challenge.invitedPseudo?.trim(),
      prize: 'Honneur & Rang',
      timeAgo: 'À l’instant',
      status: 'open',
      createdAt: now,
      expiresAt,
      durationLabel: `${duration}h`,
    };

    // Remove any previous challenge with same room code
    this.challenges = this.challenges.filter((c) => c.id !== challenge.roomCode);
    this.challenges.unshift(realChallenge);
    this.saveToStorage();

    // Broadcast to other windows / devices
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHALLENGE_CREATED',
          challenge: realChallenge,
        });
      } catch {}
    }

    // AI Voice Announcements
    if (realChallenge.accessType === 'invite' && realChallenge.invitedPseudo) {
      tacticalVoice.announcePrivateInvite(
        realChallenge.challengerName,
        realChallenge.invitedPseudo,
        gameVoiceLabel
      );
    } else {
      tacticalVoice.announceChallengeAlert(realChallenge.challengerName, gameVoiceLabel);
    }

    return realChallenge;
  }

  private handleIncomingRealChallenge(challenge: LiveChallenge, speak: boolean = true) {
    if (!challenge || !challenge.id) return;
    this.challenges = this.challenges.filter((c) => c.id !== challenge.id);
    this.challenges.unshift(challenge);
    this.saveToStorage();

    if (speak) {
      const gameLabel =
        challenge.gameType === 'checkers'
          ? 'Dames Africaines'
          : challenge.gameType === 'chess'
          ? 'Échecs des Rois'
          : `Ludo Royal à ${challenge.maxPlayers || 2} joueurs`;

      if (challenge.accessType === 'invite' && challenge.invitedPseudo) {
        tacticalVoice.announcePrivateInvite(challenge.challengerName, challenge.invitedPseudo, gameLabel);
      } else {
        tacticalVoice.announceChallengeAlert(challenge.challengerName, gameLabel);
      }
    }
  }

  public acceptChallenge(challengeId: string, acceptedByName: string = 'Vous') {
    let acceptedChallenge: LiveChallenge | null = null;
    this.challenges = this.challenges.map((c) => {
      if (c.id === challengeId) {
        acceptedChallenge = { ...c, status: 'accepted', acceptedBy: acceptedByName };
        return acceptedChallenge;
      }
      return c;
    });
    this.saveToStorage();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHALLENGE_ACCEPTED',
          challengeId,
          acceptedByName,
        });
      } catch {}
    }

    if (acceptedChallenge) {
      tacticalVoice.announceChallengeAccepted((acceptedChallenge as LiveChallenge).challengerName);
    }

    return acceptedChallenge;
  }

  private handleRemoteChallengeAccepted(challengeId: string) {
    this.challenges = this.challenges.map((c) => {
      if (c.id === challengeId) {
        return { ...c, status: 'accepted' };
      }
      return c;
    });
    this.saveToStorage();
  }

  public refuseChallenge(challengeId: string, refusingPseudo: string) {
    let targetChallenger = 'l’adversaire';
    this.challenges = this.challenges.map((c) => {
      if (c.id === challengeId) {
        targetChallenger = c.challengerName;
        return { ...c, status: 'refused' };
      }
      return c;
    });
    this.saveToStorage();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHALLENGE_REFUSED',
          challengeId,
          refusingPseudo,
        });
      } catch {}
    }

    tacticalVoice.announceInviteRefused(refusingPseudo, targetChallenger);
  }

  private handleRemoteChallengeRefused(challengeId: string) {
    this.challenges = this.challenges.map((c) => {
      if (c.id === challengeId) {
        return { ...c, status: 'refused' };
      }
      return c;
    });
    this.saveToStorage();
  }

  /**
   * Broadcasts a call for missing players from the waiting room
   */
  public broadcastCallForPlayers(
    roomCode: string,
    challengerName: string,
    gameType: GameType,
    currentCount: number,
    targetCount: number
  ) {
    const gameLabels: Record<GameType, string> = {
      checkers: 'Dames Africaines',
      ludo: 'Ludo Royal',
      chess: 'Échecs des Rois',
    };
    const label = gameLabels[gameType] || 'Jeu';

    tacticalVoice.announceCallForPlayers(challengerName, label, currentCount, targetCount);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CALL_FOR_PLAYERS',
          roomCode,
          challengerName,
          gameType,
          currentCount,
          targetCount,
        });
      } catch {}
    }
  }

  private handleIncomingCallForPlayers(data: any) {
    if (!data) return;
    const gameLabels: Record<string, string> = {
      checkers: 'Dames Africaines',
      ludo: 'Ludo Royal',
      chess: 'Échecs des Rois',
    };
    const label = gameLabels[data.gameType] || 'Jeu';
    tacticalVoice.announceCallForPlayers(data.challengerName, label, data.currentCount, data.targetCount);
  }

  public removeChallenge(challengeId: string, broadcast: boolean = true) {
    this.challenges = this.challenges.filter((c) => c.id !== challengeId);
    this.saveToStorage();

    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CHALLENGE_REMOVED',
          challengeId,
        });
      } catch {}
    }
  }

  public subscribe(listener: ChallengeListener): () => void {
    this.listeners.push(listener);
    listener(this.getChallenges());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const list = this.getChallenges();
    this.listeners.forEach((l) => l(list));
  }
}

export const liveChallengeService = new LiveChallengeService();
