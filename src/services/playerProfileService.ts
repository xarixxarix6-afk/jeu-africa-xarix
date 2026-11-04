/**
 * Player Profile & Custom Registration Service
 * Manages player inscriptions, custom pseudos, avatars, and match statistics.
 */

import { PlayerProfile } from '../types/game';
import {
  avatarGeneratorService,
  getRankTierFromWins,
  RankTier,
} from './avatarGeneratorService';

const STORAGE_KEY_PROFILES = 'afro_salon_profiles_v1';
const STORAGE_KEY_P1 = 'afro_salon_active_p1';
const STORAGE_KEY_P2 = 'afro_salon_active_p2';

export const AVAILABLE_AVATARS = [
  { id: 'crown', icon: '👑', label: 'Couronne Royale' },
  { id: 'lion', icon: '🦁', label: 'Lion Impérial' },
  { id: 'falcon', icon: '🦅', label: 'Faucon de Guerre' },
  { id: 'cheetah', icon: '🐆', label: 'Guépard Féroce' },
  { id: 'warrior', icon: '⚔️', label: 'Guerrier Élite' },
  { id: 'shield', icon: '🛡️', label: 'Bouclier Titan' },
  { id: 'cyber', icon: '⚡', label: 'Cyber Fantôme' },
  { id: 'sniper', icon: '🎯', label: 'Sniper Ombre' },
  { id: 'rhino', icon: '🦏', label: 'Rhino Blindé' },
  { id: 'cobra', icon: '🐍', label: 'Cobra Royal' },
];

export function getRankTitle(wins: number): string {
  if (wins >= 30) return 'Légende Suprême (Empereur)';
  if (wins >= 15) return 'Grand Maître Impérial';
  if (wins >= 8) return 'Commandant d’Élite';
  if (wins >= 3) return 'Guerrier Tactique';
  return 'Recrue Initiée (Bronze)';
}

class PlayerProfileService {
  private profiles: PlayerProfile[] = [];
  private activeP1Id: string = '';
  private activeP2Id: string = '';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (stored) {
        this.profiles = JSON.parse(stored);
      }
    } catch {
      this.profiles = [];
    }

    // Default initial profiles if empty
    if (this.profiles.length === 0) {
      const p1Tier = getRankTierFromWins(8);
      const defaultP1: PlayerProfile = {
        id: 'user_nathan_default',
        pseudo: 'Nathan',
        avatar: '👑',
        rankTier: p1Tier,
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg(p1Tier, 'Nathan', 'king'),
        title: 'Commandant d’Élite',
        createdAt: Date.now(),
        stats: { wins: 8, losses: 1, gamesPlayed: 9 },
      };
      const p2Tier = getRankTierFromWins(2);
      const defaultP2: PlayerProfile = {
        id: 'user_guest_default',
        pseudo: 'Challenger',
        avatar: '🦁',
        rankTier: p2Tier,
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg(p2Tier, 'Challenger', 'warrior'),
        title: 'Recrue Initiée',
        createdAt: Date.now(),
        stats: { wins: 2, losses: 3, gamesPlayed: 5 },
      };
      this.profiles = [defaultP1, defaultP2];
      this.saveToStorage();
    } else {
      // Ensure all loaded profiles have their rankTier and dynamic portrait URL
      let needsSave = false;
      this.profiles = this.profiles.map((p) => {
        const tier = getRankTierFromWins(p.stats.wins);
        if (!p.rankTier || !p.customPortraitUrl) {
          needsSave = true;
          return {
            ...p,
            rankTier: tier,
            customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg(tier, p.pseudo),
          };
        }
        return p;
      });
      if (needsSave) {
        this.saveToStorage();
      }
    }

    this.activeP1Id = localStorage.getItem(STORAGE_KEY_P1) || this.profiles[0].id;
    this.activeP2Id = localStorage.getItem(STORAGE_KEY_P2) || (this.profiles[1]?.id || this.profiles[0].id);
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(this.profiles));
    localStorage.setItem(STORAGE_KEY_P1, this.activeP1Id);
    localStorage.setItem(STORAGE_KEY_P2, this.activeP2Id);
  }

  public getProfiles(): PlayerProfile[] {
    return [...this.profiles];
  }

  public getActiveP1(): PlayerProfile {
    const p1 = this.profiles.find((p) => p.id === this.activeP1Id);
    return p1 || this.profiles[0];
  }

  public getActiveP2(): PlayerProfile {
    const p2 = this.profiles.find((p) => p.id === this.activeP2Id);
    return p2 || this.profiles[1] || this.profiles[0];
  }

  public setActiveP1(id: string) {
    this.activeP1Id = id;
    this.saveToStorage();
  }

  public setActiveP2(id: string) {
    this.activeP2Id = id;
    this.saveToStorage();
  }

  // Register a brand new player
  public registerPlayer(pseudo: string, avatar: string, archetype: 'king' | 'queen' | 'warrior' | 'cyber' = 'king'): PlayerProfile {
    const trimmed = pseudo.trim() || `Guerrier_${Math.floor(Math.random() * 900 + 100)}`;
    const tier = getRankTierFromWins(0);
    const portraitUrl = avatarGeneratorService.generateRankPortraitSvg(tier, trimmed, archetype);

    const newProfile: PlayerProfile = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pseudo: trimmed,
      avatar: avatar || '👑',
      rankTier: tier,
      customPortraitUrl: portraitUrl,
      title: 'Recrue Initiée (Bronze)',
      createdAt: Date.now(),
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      },
    };

    this.profiles.push(newProfile);
    this.saveToStorage();
    return newProfile;
  }

  // Regenerate dynamic AI portrait according to current rank and chosen archetype
  public regenerateAiPortrait(id: string, archetype: 'king' | 'queen' | 'warrior' | 'cyber' = 'king'): string {
    let newUrl = '';
    this.profiles = this.profiles.map((p) => {
      if (p.id === id) {
        const tier = getRankTierFromWins(p.stats.wins);
        newUrl = avatarGeneratorService.generateRankPortraitSvg(tier, p.pseudo, archetype);
        return {
          ...p,
          rankTier: tier,
          customPortraitUrl: newUrl,
        };
      }
      return p;
    });
    this.saveToStorage();
    return newUrl;
  }

  // Update an existing player's profile
  public updatePlayer(id: string, updates: Partial<{ pseudo: string; avatar: string; customPortraitUrl?: string }>) {
    this.profiles = this.profiles.map((p) => {
      if (p.id === id) {
        const newPseudo = updates.pseudo !== undefined ? updates.pseudo.trim() : p.pseudo;
        const tier = getRankTierFromWins(p.stats.wins);
        const portraitUrl =
          updates.customPortraitUrl ||
          (updates.pseudo !== undefined
            ? avatarGeneratorService.generateRankPortraitSvg(tier, newPseudo)
            : p.customPortraitUrl);

        return {
          ...p,
          pseudo: newPseudo,
          avatar: updates.avatar !== undefined ? updates.avatar : p.avatar,
          customPortraitUrl: portraitUrl,
          rankTier: tier,
        };
      }
      return p;
    });
    this.saveToStorage();
  }

  // Record game outcome and evolve portrait if rank increases
  public recordGameResult(winnerPlayerNum: 1 | 2) {
    const p1 = this.getActiveP1();
    const p2 = this.getActiveP2();

    this.profiles = this.profiles.map((p) => {
      if (p.id === p1.id) {
        const isWin = winnerPlayerNum === 1;
        const newWins = isWin ? p.stats.wins + 1 : p.stats.wins;
        const newTier = getRankTierFromWins(newWins);
        const portrait =
          newTier !== p.rankTier
            ? avatarGeneratorService.generateRankPortraitSvg(newTier, p.pseudo)
            : p.customPortraitUrl;

        return {
          ...p,
          title: getRankTitle(newWins),
          rankTier: newTier,
          customPortraitUrl: portrait,
          stats: {
            wins: newWins,
            losses: isWin ? p.stats.losses : p.stats.losses + 1,
            gamesPlayed: p.stats.gamesPlayed + 1,
          },
        };
      }
      if (p.id === p2.id && p2.id !== p1.id) {
        const isWin = winnerPlayerNum === 2;
        const newWins = isWin ? p.stats.wins + 1 : p.stats.wins;
        const newTier = getRankTierFromWins(newWins);
        const portrait =
          newTier !== p.rankTier
            ? avatarGeneratorService.generateRankPortraitSvg(newTier, p.pseudo)
            : p.customPortraitUrl;

        return {
          ...p,
          title: getRankTitle(newWins),
          rankTier: newTier,
          customPortraitUrl: portrait,
          stats: {
            wins: newWins,
            losses: isWin ? p.stats.losses : p.stats.losses + 1,
            gamesPlayed: p.stats.gamesPlayed + 1,
          },
        };
      }
      return p;
    });

    this.saveToStorage();
  }

  // General leaderboard of all players sorted by wins & win rate
  public getLeaderboard(): PlayerProfile[] {
    const legends: PlayerProfile[] = [
      {
        id: 'legend_mansa',
        pseudo: 'Roi Mansa Moussa',
        avatar: '👑',
        rankTier: 'emperor',
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg('emperor', 'Mansa Moussa', 'king'),
        title: 'Légende Suprême (Empereur)',
        createdAt: 1700000000000,
        stats: { wins: 48, losses: 4, gamesPlayed: 52 },
      },
      {
        id: 'legend_nzinga',
        pseudo: 'Reine Nzinga',
        avatar: '🦅',
        rankTier: 'master',
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg('master', 'Nzinga', 'queen'),
        title: 'Grand Maître Impérial',
        createdAt: 1700000000001,
        stats: { wins: 36, losses: 6, gamesPlayed: 42 },
      },
      {
        id: 'legend_chaka',
        pseudo: 'Guerrier Chaka',
        avatar: '⚔️',
        rankTier: 'gold',
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg('gold', 'Chaka', 'warrior'),
        title: 'Commandant d’Élite',
        createdAt: 1700000000002,
        stats: { wins: 24, losses: 8, gamesPlayed: 32 },
      },
      {
        id: 'legend_kwame',
        pseudo: 'Maître Kwame',
        avatar: '🦁',
        rankTier: 'silver',
        customPortraitUrl: avatarGeneratorService.generateRankPortraitSvg('silver', 'Kwame', 'warrior'),
        title: 'Guerrier Tactique',
        createdAt: 1700000000003,
        stats: { wins: 14, losses: 7, gamesPlayed: 21 },
      },
    ];

    // Merge existing user profiles with legends if user profiles don't already contain them
    const all = [...this.profiles];
    for (const leg of legends) {
      if (!all.some((p) => p.id === leg.id || p.pseudo === leg.pseudo)) {
        all.push(leg);
      }
    }

    // Sort primarily by wins descending, secondarily by win rate descending
    return all.sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins;
      }
      const rateA = a.stats.gamesPlayed > 0 ? a.stats.wins / a.stats.gamesPlayed : 0;
      const rateB = b.stats.gamesPlayed > 0 ? b.stats.wins / b.stats.gamesPlayed : 0;
      return rateB - rateA;
    });
  }
}

export const playerProfileService = new PlayerProfileService();
