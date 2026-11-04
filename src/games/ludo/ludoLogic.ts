/**
 * Complete Ludo Royal (Pachisi Africain) Engine
 * Standard 15x15 board with 52 perimeter steps + 5-cell home stretches per color.
 */

import { LudoPlayerColor } from '../../types/game';
export type { LudoPlayerColor };

export interface LudoToken {
  id: number; // 0 to 3
  color: LudoPlayerColor;
  step: number; // -1 = in base/yard; 0 to 50 = on outer track; 51 to 55 = in home stretch; 56 = safe in center goal
}

export interface LudoPlayerState {
  color: LudoPlayerColor;
  name: string;
  isBot: boolean;
  tokens: LudoToken[];
  hasWon: boolean;
  rank?: number;
}

export const LUDO_COLORS: LudoPlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// Starting track index on the 52-tile circuit for each color
export const COLOR_START_INDEX: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Safe squares on the 52-step board (starting points and stars)
export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Map 52 track steps to 15x15 grid (row, col)
export const TRACK_COORDS: { r: number; c: number }[] = [
  // Red side start & corridor going right (top horizontal arm)
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Going up towards top vertical arm
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, // top peak
  { r: 0, c: 8 }, // top right descent
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Green side going right
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, // right peak
  { r: 8, c: 14 }, // right bottom descent
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Going down towards bottom vertical arm
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, // bottom peak
  { r: 14, c: 6 }, // bottom left ascent
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Blue side going left
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, // left peak
  { r: 6, c: 0 }, // return to red entrance
];

// Home stretch runways (5 steps before reaching center goal 56)
export const HOME_STRETCH_COORDS: Record<LudoPlayerColor, { r: number; c: number }[]> = {
  red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
  green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
  yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
  blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
};

export const CENTER_GOAL_COORD = { r: 7, c: 7 };

// Initial 4 base positions inside the 6x6 corner yards
export const BASE_TOKEN_POSITIONS: Record<LudoPlayerColor, { r: number; c: number }[]> = {
  red: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
  green: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
  yellow: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
  blue: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
};

export function createInitialLudoPlayers(
  numPlayers: 2 | 4,
  mode: 'bot' | 'pvp' | 'online',
  p1Color: LudoPlayerColor = 'red',
  tokensCount: 1 | 2 | 3 | 4 = 4
): LudoPlayerState[] {
  let activeColors: LudoPlayerColor[];

  if (numPlayers === 2) {
    if (p1Color === 'red') activeColors = ['red', 'yellow'];
    else if (p1Color === 'yellow') activeColors = ['yellow', 'red'];
    else if (p1Color === 'green') activeColors = ['green', 'blue'];
    else activeColors = ['blue', 'green'];
  } else {
    // 4 players starting from chosen p1Color
    const order: LudoPlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const startIndex = order.indexOf(p1Color);
    activeColors = [
      order[startIndex],
      order[(startIndex + 1) % 4],
      order[(startIndex + 2) % 4],
      order[(startIndex + 3) % 4],
    ];
  }

  const validTokenCount = Math.max(1, Math.min(4, tokensCount || 4));

  return activeColors.map((color, index) => ({
    color,
    name:
      color === 'red'
        ? 'Rouge (Roi Lion)'
        : color === 'green'
        ? 'Vert (Baobab)'
        : color === 'yellow'
        ? 'Jaune (Or Saharien)'
        : 'Bleu (Nil Impérial)',
    isBot: mode === 'bot' && index > 0,
    hasWon: false,
    tokens: Array.from({ length: validTokenCount }, (_, id) => ({
      id,
      color,
      step: -1, // in base yard
    })),
  }));
}

// Global track index from color and relative step
export function getGlobalTrackIndex(color: LudoPlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  const start = COLOR_START_INDEX[color];
  return (start + step) % 52;
}

// Convert a token's step to board row/col
export function getTokenCoordinate(token: LudoToken): { r: number; c: number } {
  if (token.step === -1) {
    return BASE_TOKEN_POSITIONS[token.color][token.id];
  }
  if (token.step >= 0 && token.step <= 50) {
    const globalIdx = getGlobalTrackIndex(token.color, token.step)!;
    return TRACK_COORDS[globalIdx];
  }
  if (token.step >= 51 && token.step <= 55) {
    return HOME_STRETCH_COORDS[token.color][token.step - 51];
  }
  return CENTER_GOAL_COORD; // 56
}

// Check if a token can legally move given a dice roll
export function canTokenMove(token: LudoToken, roll: number): boolean {
  if (token.step === 56) return false; // already scored
  if (token.step === -1) {
    return roll === 6; // needs a 6 to leave base
  }
  return token.step + roll <= 56; // must not overshoot goal
}

// Get all movable tokens for player with roll
export function getMovableTokens(tokens: LudoToken[], roll: number): LudoToken[] {
  return tokens.filter((t) => canTokenMove(t, roll));
}

// Bot AI pick best token
export function pickBotTokenMove(
  movableTokens: LudoToken[],
  players: LudoPlayerState[],
  roll: number
): LudoToken | null {
  if (movableTokens.length === 0) return null;

  let bestToken = movableTokens[0];
  let bestScore = -Infinity;

  for (const token of movableTokens) {
    let score = 0;

    // Freeing a token on 6 is high priority
    if (token.step === -1 && roll === 6) {
      score += 50;
    }

    // Scored into center goal
    if (token.step + roll === 56) {
      score += 100;
    }

    // Check if move captures an opponent
    const targetStep = token.step === -1 ? 0 : token.step + roll;
    if (targetStep <= 50) {
      const globalTarget = getGlobalTrackIndex(token.color, targetStep);
      if (globalTarget !== null && !SAFE_TRACK_INDICES.includes(globalTarget)) {
        // Look for opponent tokens on this target
        for (const p of players) {
          if (p.color !== token.color) {
            for (const opp of p.tokens) {
              if (opp.step >= 0 && opp.step <= 50) {
                const oppGlobal = getGlobalTrackIndex(opp.color, opp.step);
                if (oppGlobal === globalTarget) {
                  score += 80; // Capture bonus!
                }
              }
            }
          }
        }
      }
    }

    // Prefer advancing tokens closer to home
    score += token.step * 0.8;

    if (score > bestScore) {
      bestScore = score;
      bestToken = token;
    }
  }

  return bestToken;
}
