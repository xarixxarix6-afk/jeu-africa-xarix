/**
 * Dynamic AI Avatar & Portrait Generator
 * Generates custom African royal portraits according to player rank:
 * - Bronze : Recrue Initiée (Argile, perles de bois, bandeau rituel)
 * - Silver : Guerrier Tactique (Argent forgé, cimier léopard/lion, peintures de guerre)
 * - Gold   : Commandant d’Élite (Or massif Ashanti, draperie Kente, torc doré)
 * - Master : Grand Maître Impérial (Plumes de faucon sacré, diadème émeraude, aura du Nil)
 * - Emperor: Empereur Suprême (Diadème solaire étincelant de Mansa Moussa, orbe impérial, halo solaire)
 */

export type RankTier = 'bronze' | 'silver' | 'gold' | 'master' | 'emperor';

export interface RankInfo {
  tier: RankTier;
  title: string;
  minWins: number;
  label: string;
  color: string;
  glowColor: string;
  badge: string;
  auraDescription: string;
}

export const RANK_TIERS: Record<RankTier, RankInfo> = {
  bronze: {
    tier: 'bronze',
    title: 'Recrue Initiée',
    minWins: 0,
    label: 'Rang Bronze (Initié)',
    color: '#cd7f32',
    glowColor: 'rgba(205, 127, 50, 0.5)',
    badge: '🥉',
    auraDescription: 'Bandeau de cuir rituel et perles de terre cuite',
  },
  silver: {
    tier: 'silver',
    title: 'Guerrier Tactique',
    minWins: 3,
    label: 'Rang Argent (Guerrier)',
    color: '#c0c0c0',
    glowColor: 'rgba(192, 192, 192, 0.6)',
    badge: '🥈',
    auraDescription: 'Casque d’argent ciselé et peintures de guerre rituelles',
  },
  gold: {
    tier: 'gold',
    title: 'Commandant d’Élite',
    minWins: 8,
    label: 'Rang Or (Commandant)',
    color: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.7)',
    badge: '🥇',
    auraDescription: 'Parures d’or massif royal et drapé Kente impérial',
  },
  master: {
    tier: 'master',
    title: 'Grand Maître Impérial',
    minWins: 15,
    label: 'Rang Saphir (Grand Maître)',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.75)',
    badge: '💎',
    auraDescription: 'Coiffe à plumes de faucon sacré et pendentif du Nil',
  },
  emperor: {
    tier: 'emperor',
    title: 'Légende Suprême (Empereur)',
    minWins: 30,
    label: 'Rang Solaire (Empereur Suprême)',
    color: '#ffaa00',
    glowColor: 'rgba(255, 170, 0, 0.9)',
    badge: '👑',
    auraDescription: 'Couronne solaire étincelante de Mansa Moussa et halo de gloire',
  },
};

export function getRankTierFromWins(wins: number): RankTier {
  if (wins >= 30) return 'emperor';
  if (wins >= 15) return 'master';
  if (wins >= 8) return 'gold';
  if (wins >= 3) return 'silver';
  return 'bronze';
}

class AvatarGeneratorService {
  /**
   * Generates a rich SVG data URL portrait dynamically crafted according to rank & archetype
   */
  public generateRankPortraitSvg(
    rankTier: RankTier,
    pseudo: string,
    archetype: 'king' | 'queen' | 'warrior' | 'cyber' = 'king'
  ): string {
    const info = RANK_TIERS[rankTier];
    const initial = (pseudo.trim()[0] || 'A').toUpperCase();

    // Color palettes per tier
    const palettes: Record<
      RankTier,
      {
        bg1: string;
        bg2: string;
        accent: string;
        crownColor: string;
        haloGlow: string;
        patternColor: string;
        details: string;
      }
    > = {
      bronze: {
        bg1: '#3d1c0e',
        bg2: '#1a0904',
        accent: '#cd7f32',
        crownColor: '#a0522d',
        haloGlow: '#8b4513',
        patternColor: 'rgba(205,127,50,0.25)',
        details: 'Perles de terre cuite & Cuir rituel',
      },
      silver: {
        bg1: '#1c2430',
        bg2: '#0d1117',
        accent: '#c0c0c0',
        crownColor: '#e2e8f0',
        haloGlow: '#94a3b8',
        patternColor: 'rgba(226,232,240,0.25)',
        details: 'Cimier de guerre d’Argent forgé',
      },
      gold: {
        bg1: '#4a2608',
        bg2: '#1e0c03',
        accent: '#ffd700',
        crownColor: '#ffd700',
        haloGlow: '#f59e0b',
        patternColor: 'rgba(255,215,0,0.3)',
        details: 'Collier royal Ashanti & Kente d’Or',
      },
      master: {
        bg1: '#0f2744',
        bg2: '#051120',
        accent: '#38bdf8',
        crownColor: '#7dd3fc',
        haloGlow: '#0284c7',
        patternColor: 'rgba(56,189,248,0.35)',
        details: 'Faucon sacré & Améthyste du Nil',
      },
      emperor: {
        bg1: '#581c87',
        bg2: '#2e0854',
        accent: '#f59e0b',
        crownColor: '#fbbf24',
        haloGlow: '#ffd700',
        patternColor: 'rgba(255,215,0,0.4)',
        details: 'Couronne Solaire Suprême de Mansa Moussa',
      },
    };

    const pal = palettes[rankTier];

    // SVG elements based on tier
    let crownSvg = '';
    let haloSvg = '';
    let marksSvg = '';

    if (rankTier === 'bronze') {
      crownSvg = `
        <!-- Bronze Headband -->
        <path d="M40 70 Q100 55 160 70 L155 85 Q100 70 45 85 Z" fill="#8b4513" stroke="#cd7f32" stroke-width="2" />
        <circle cx="100" cy="68" r="7" fill="#cd7f32" stroke="#fff" stroke-width="1.5" />
        <circle cx="75" cy="73" r="5" fill="#d2691e" />
        <circle cx="125" cy="73" r="5" fill="#d2691e" />
      `;
      marksSvg = `
        <line x1="72" y1="110" x2="85" y2="125" stroke="#cd7f32" stroke-width="2.5" stroke-linecap="round" />
        <line x1="128" y1="110" x2="115" y2="125" stroke="#cd7f32" stroke-width="2.5" stroke-linecap="round" />
      `;
    } else if (rankTier === 'silver') {
      haloSvg = `
        <circle cx="100" cy="100" r="88" fill="none" stroke="${pal.haloGlow}" stroke-width="3" stroke-dasharray="6,4" opacity="0.6" />
      `;
      crownSvg = `
        <!-- Silver Warrior Crest -->
        <path d="M45 68 L100 35 L155 68 L140 85 L100 70 L60 85 Z" fill="url(#silverGrad)" stroke="#fff" stroke-width="2" />
        <polygon points="100,20 108,35 92,35" fill="#f8fafc" />
        <circle cx="100" cy="55" r="6" fill="#38bdf8" />
      `;
      marksSvg = `
        <path d="M65 105 L80 120 L75 130" fill="none" stroke="#e2e8f0" stroke-width="2" />
        <path d="M135 105 L120 120 L125 130" fill="none" stroke="#e2e8f0" stroke-width="2" />
      `;
    } else if (rankTier === 'gold') {
      haloSvg = `
        <circle cx="100" cy="100" r="90" fill="none" stroke="${pal.haloGlow}" stroke-width="4" opacity="0.8" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#ffd700" stroke-width="1" stroke-dasharray="8,4" />
      `;
      crownSvg = `
        <!-- Solid Gold Ashanti Crown -->
        <path d="M40 70 L55 35 L75 55 L100 25 L125 55 L145 35 L160 70 Q100 85 40 70 Z" fill="url(#goldGrad)" stroke="#fff" stroke-width="2" filter="url(#glow)" />
        <circle cx="100" cy="45" r="7" fill="#ef4444" stroke="#ffd700" stroke-width="1.5" />
        <circle cx="75" cy="58" r="5" fill="#10b981" />
        <circle cx="125" cy="58" r="5" fill="#10b981" />
      `;
      marksSvg = `
        <!-- Gold necklace pectorals -->
        <path d="M60 170 Q100 195 140 170" fill="none" stroke="#ffd700" stroke-width="6" />
        <path d="M70 180 Q100 205 130 180" fill="none" stroke="#f59e0b" stroke-width="4" />
      `;
    } else if (rankTier === 'master') {
      haloSvg = `
        <circle cx="100" cy="100" r="92" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="12,6" filter="url(#glow)" />
        <polygon points="100,6 104,18 96,18" fill="#38bdf8" />
        <polygon points="194,100 182,104 182,96" fill="#38bdf8" />
        <polygon points="100,194 104,182 96,182" fill="#38bdf8" />
        <polygon points="6,100 18,104 18,96" fill="#38bdf8" />
      `;
      crownSvg = `
        <!-- Sacred Falcon / Master Diadem -->
        <path d="M35 75 Q100 40 165 75 L150 90 Q100 65 50 90 Z" fill="url(#sapphireGrad)" stroke="#38bdf8" stroke-width="2.5" />
        <path d="M100 15 L118 45 L100 70 L82 45 Z" fill="#38bdf8" stroke="#fff" stroke-width="2" filter="url(#glow)" />
        <circle cx="100" cy="45" r="8" fill="#1e3a8a" stroke="#fff" stroke-width="2" />
      `;
      marksSvg = `
        <!-- Glowing mystic eye marks -->
        <circle cx="75" cy="115" r="3" fill="#38bdf8" filter="url(#glow)" />
        <circle cx="125" cy="115" r="3" fill="#38bdf8" filter="url(#glow)" />
        <path d="M65 170 Q100 200 135 170" fill="none" stroke="#38bdf8" stroke-width="5" />
      `;
    } else {
      // EMPEROR (Mansa Moussa Solar Diadem)
      haloSvg = `
        <!-- Blazing Solar Rays -->
        <g stroke="#ffd700" stroke-width="3" opacity="0.9" filter="url(#glow)">
          <line x1="100" y1="5" x2="100" y2="25" />
          <line x1="195" y1="100" x2="175" y2="100" />
          <line x1="100" y1="195" x2="100" y2="175" />
          <line x1="5" y1="100" x2="25" y2="100" />
          <line x1="33" y1="33" x2="48" y2="48" />
          <line x1="167" y1="33" x2="152" y2="48" />
          <line x1="33" y1="167" x2="48" y2="152" />
          <line x1="167" y1="167" x2="152" y2="152" />
        </g>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#ffd700" stroke-width="5" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,3" />
      `;
      crownSvg = `
        <!-- Supreme Emperor Diamond Gold Crown -->
        <path d="M30 65 L45 20 L75 50 L100 10 L125 50 L155 20 L170 65 Q100 85 30 65 Z" fill="url(#emperorGrad)" stroke="#ffffff" stroke-width="2.5" filter="url(#glow)" />
        <polygon points="100,5 110,22 90,22" fill="#ffffff" filter="url(#glow)" />
        <circle cx="100" cy="38" r="9" fill="#ef4444" stroke="#ffd700" stroke-width="2" />
        <circle cx="65" cy="50" r="6" fill="#3b82f6" stroke="#fff" stroke-width="1.5" />
        <circle cx="135" cy="50" r="6" fill="#10b981" stroke="#fff" stroke-width="1.5" />
      `;
      marksSvg = `
        <path d="M50 165 Q100 205 150 165" fill="none" stroke="#ffd700" stroke-width="8" filter="url(#glow)" />
        <path d="M60 180 Q100 220 140 180" fill="none" stroke="#f59e0b" stroke-width="5" />
      `;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="${pal.bg1}" />
            <stop offset="100%" stop-color="${pal.bg2}" />
          </radialGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8d5524" />
            <stop offset="50%" stop-color="#5a2d0c" />
            <stop offset="100%" stop-color="#3b1a05" />
          </linearGradient>
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="50%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="40%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe" />
            <stop offset="50%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="emperorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffdf0" />
            <stop offset="35%" stop-color="#ffd700" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#7c2d12" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background Circular Base -->
        <circle cx="100" cy="100" r="96" fill="url(#bgGrad)" stroke="${pal.accent}" stroke-width="3" />

        <!-- Halo of Rank -->
        ${haloSvg}

        <!-- Torso & Shoulders -->
        <path d="M40 196 C40 145, 160 145, 160 196 Z" fill="url(#skinGrad)" />
        <path d="M48 196 C55 155, 145 155, 152 196 Z" fill="${pal.accent}" opacity="0.3" />

        <!-- Neck -->
        <rect x="85" y="130" width="30" height="25" rx="5" fill="url(#skinGrad)" />

        <!-- Head Face -->
        <ellipse cx="100" cy="105" rx="36" ry="42" fill="url(#skinGrad)" stroke="${pal.accent}" stroke-width="1.5" />

        <!-- Facial Features (Eyes, Eyebrows, Nose, Mouth) -->
        <path d="M80 88 Q88 84 96 88" stroke="#1c0b04" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M104 88 Q112 84 120 88" stroke="#1c0b04" stroke-width="3" stroke-linecap="round" fill="none" />
        
        <ellipse cx="88" cy="98" rx="6" ry="4" fill="#1c0b04" />
        <circle cx="89" cy="97" r="1.5" fill="#fff" />
        <ellipse cx="112" cy="98" rx="6" ry="4" fill="#1c0b04" />
        <circle cx="113" cy="97" r="1.5" fill="#fff" />

        <!-- Nose -->
        <path d="M96 104 Q100 115 104 104" fill="none" stroke="#2e1104" stroke-width="2.5" />

        <!-- Confident Smile -->
        <path d="M86 124 Q100 134 114 124" fill="none" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" />

        <!-- Tribal Rank Marks -->
        ${marksSvg}

        <!-- Crown / Regalia -->
        ${crownSvg}

        <!-- Initial badge at bottom -->
        <circle cx="100" cy="180" r="14" fill="#000000" stroke="${pal.accent}" stroke-width="2" />
        <text x="100" y="185" font-family="'Cinzel', serif" font-size="12" font-weight="900" fill="${pal.accent}" text-anchor="middle">
          ${initial}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generates or fetches an AI-styled dynamic portrait based on the player's profile and rank
   */
  public generateDynamicPortrait(
    wins: number,
    pseudo: string,
    archetype?: 'king' | 'queen' | 'warrior' | 'cyber'
  ): {
    portraitUrl: string;
    tier: RankTier;
    rankInfo: RankInfo;
  } {
    const tier = getRankTierFromWins(wins);
    const rankInfo = RANK_TIERS[tier];
    const portraitUrl = this.generateRankPortraitSvg(tier, pseudo, archetype);

    return {
      portraitUrl,
      tier,
      rankInfo,
    };
  }
}

export const avatarGeneratorService = new AvatarGeneratorService();
