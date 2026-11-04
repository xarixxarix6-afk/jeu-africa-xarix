/**
 * Real-time AI Probability & Predictive Tactical Engine
 * Computes live win/loss probabilities, advantage evaluation, and strategic advice
 * for Checkers (10x10 & 8x8), Ludo Royal, Chess, and Battle Arena FPS.
 */

import { AiProbabilityReport } from '../types/game';
import { CheckerBoard, CheckerPlayer } from '../games/checkers/checkersLogic';
import { ChessBoard, ChessColor, isPlayerInCheck } from '../games/chess/chessLogic';
import { LudoPlayerState } from '../games/ludo/ludoLogic';

/**
 * 1. CHECKERS (Dames 10x10 & 8x8) EVALUATION
 */
export function evaluateCheckersProbability(
  board: CheckerBoard,
  size: number,
  turn: CheckerPlayer,
  p1Name: string = 'Joueur 1',
  p2Name: string = 'Joueur 2 / Bot'
): AiProbabilityReport {
  let p1Pawns = 0;
  let p1Kings = 0;
  let p2Pawns = 0;
  let p2Kings = 0;
  let p1CenterControl = 0;
  let p2CenterControl = 0;
  let p1Advancement = 0;
  let p2Advancement = 0;

  const centerMin = Math.floor(size / 2) - 1;
  const centerMax = Math.ceil(size / 2);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isCenter = r >= centerMin && r <= centerMax && c >= centerMin && c <= centerMax;

      if (piece.player === 1) {
        if (piece.isKing) {
          p1Kings++;
        } else {
          p1Pawns++;
          p1Advancement += size - 1 - r; // player 1 moves up (decreasing row)
        }
        if (isCenter) p1CenterControl++;
      } else {
        if (piece.isKing) {
          p2Kings++;
        } else {
          p2Pawns++;
          p2Advancement += r; // player 2 moves down (increasing row)
        }
        if (isCenter) p2CenterControl++;
      }
    }
  }

  const totalP1 = p1Pawns + p1Kings;
  const totalP2 = p2Pawns + p2Kings;

  // Immediate game over check
  if (totalP1 === 0) {
    return {
      p1WinProb: 0,
      p2WinProb: 100,
      drawProb: 0,
      advantagePlayer: 'p2',
      advantageMagnitude: 'totale',
      summary: `Victoire imminente pour ${p2Name}. Toutes les pièces de ${p1Name} ont été capturées.`,
      keyThreat: 'Élimination totale de vos forces.',
      recommendedMove: 'Fin de partie - Aucune manœuvre disponible.',
      tacticalFactor: 'Épuisement matériel complet.',
    };
  }

  if (totalP2 === 0) {
    return {
      p1WinProb: 100,
      p2WinProb: 0,
      drawProb: 0,
      advantagePlayer: 'p1',
      advantageMagnitude: 'totale',
      summary: `Triomphe tactique de ${p1Name}. L'adversaire n'a plus de pièces actives.`,
      keyThreat: 'Aucune menace restante.',
      recommendedMove: 'Partie terminée.',
      tacticalFactor: 'Domination absolue du damier.',
    };
  }

  // Material evaluation: King is worth 3.2 pawns, advancement worth 0.2, center worth 0.4
  const p1Score = p1Pawns * 1.0 + p1Kings * 3.2 + p1CenterControl * 0.4 + (p1Advancement / (size * 2)) * 0.5;
  const p2Score = p2Pawns * 1.0 + p2Kings * 3.2 + p2CenterControl * 0.4 + (p2Advancement / (size * 2)) * 0.5;

  const scoreDiff = p1Score - p2Score;
  // Logistic function to compute probability
  const sigmoid = 1 / (1 + Math.exp(-scoreDiff * 0.85));
  let p1Prob = Math.round(sigmoid * 94 + 3); // bounds 3% - 97%
  let drawProb = 0;

  // Endgame with few kings often leads to draws
  if (p1Kings >= 1 && p2Kings >= 1 && totalP1 <= 2 && totalP2 <= 2) {
    drawProb = 25;
    p1Prob = Math.max(10, Math.min(80, Math.round(p1Prob * 0.75)));
  } else {
    drawProb = Math.max(3, Math.min(12, Math.round(15 - Math.abs(scoreDiff) * 3)));
  }

  let p2Prob = 100 - p1Prob - drawProb;
  if (p2Prob < 1) {
    p2Prob = 1;
    p1Prob = 100 - drawProb - p2Prob;
  }

  const advantagePlayer = scoreDiff > 0.4 ? 'p1' : scoreDiff < -0.4 ? 'p2' : 'even';
  const absDiff = Math.abs(scoreDiff);
  const advantageMagnitude = absDiff > 4 ? 'décisive' : absDiff > 1.8 ? 'modérée' : 'légère';

  let summary = '';
  let keyThreat = '';
  let recommendedMove = '';
  let tacticalFactor = '';

  if (advantagePlayer === 'p1') {
    summary = `${p1Name} tient les rênes avec une avance matérielle nette (+${scoreDiff.toFixed(1)} pts).`;
    keyThreat = p2Kings > 0 ? `Dame volante de ${p2Name} capable de traverser le damier.` : `Tentative d'infiltration adverse sur les ailes.`;
    recommendedMove = p1Kings > 0 ? `Utiliser la dame pour restreindre les cases d'évasion ennemies.` : `Pousser les pions centraux pour obtenir une promotion en dame royale.`;
    tacticalFactor = p1Kings > p2Kings ? 'Supériorité des Dames volantes' : 'Solidité de la chaîne centrale';
  } else if (advantagePlayer === 'p2') {
    summary = `${p2Name} dicte le tempo du jeu avec une pression matérielle soutenue.`;
    keyThreat = `Infiltration adverse en profondeur avec menace de promotion imminente.`;
    recommendedMove = `Recentrer les pions arrières et forcer un échange de pièces pour casser l'élan adverse.`;
    tacticalFactor = 'Contrôle des diagonales majeures';
  } else {
    summary = `Partie équilibrée. Les lignes de front sont verrouillées dans une bataille de patience.`;
    keyThreat = `Tout sacrifice mal calculé offrira une opportunité de saut multiple décisif.`;
    recommendedMove = `Maintenir la ligne de fond défensive intacte et chercher une faiblesse latérale.`;
    tacticalFactor = 'Équilibre de tension aux avants-postes';
  }

  return {
    p1WinProb: p1Prob,
    p2WinProb: p2Prob,
    drawProb,
    advantagePlayer,
    advantageMagnitude,
    summary,
    keyThreat,
    recommendedMove,
    tacticalFactor,
  };
}

/**
 * 2. LUDO ROYAL EVALUATION
 */
export function evaluateLudoProbability(
  players: LudoPlayerState[],
  currentTurnIdx: number,
  p1Name: string = 'Joueur 1',
  p2Name: string = 'Joueur 2 / Bot'
): AiProbabilityReport {
  if (players.length === 0) {
    return {
      p1WinProb: 50,
      p2WinProb: 50,
      drawProb: 0,
      advantagePlayer: 'even',
      advantageMagnitude: 'légère',
      summary: 'Partie en initialisation.',
      keyThreat: 'Début de course.',
      recommendedMove: 'Lancer le dé.',
      tacticalFactor: 'Sortie des écuries',
    };
  }

  // Calculate score for each player based on distance traveled towards home
  // Goal: 4 tokens home (each token home = 150 pts)
  // Distance max = 56 steps. Token in yard (-1) = 0 pts. Token on track (0-50) = 15 + step * 1.8 pts. Token in home stretch (51-55) = 70 + step * 5 pts.
  const playerScores: number[] = players.map((p) => {
    let score = 0;
    for (const t of p.tokens) {
      if (t.step === 56) {
        score += 150;
      } else if (t.step === -1) {
        score += 0;
      } else if (t.step >= 51 && t.step <= 55) {
        score += 70 + t.step * 5;
      } else {
        score += 15 + t.step * 1.8;
      }
    }
    return score;
  });

  const p1Score = playerScores[0] || 1;
  const p2Score = playerScores[1] || 1;
  const totalScore = p1Score + p2Score + 0.1;

  let p1Prob = Math.min(96, Math.max(4, Math.round((p1Score / totalScore) * 100)));
  let p2Prob = 100 - p1Prob;

  // Leading player
  const scoreDiff = p1Score - p2Score;
  const advantagePlayer = scoreDiff > 25 ? 'p1' : scoreDiff < -25 ? 'p2' : 'even';
  const absDiff = Math.abs(scoreDiff);
  const advantageMagnitude = absDiff > 100 ? 'décisive' : absDiff > 45 ? 'modérée' : 'légère';

  const p1TokensHome = players[0]?.tokens.filter((t) => t.step === 56).length || 0;
  const p2TokensHome = players[1]?.tokens.filter((t) => t.step === 56).length || 0;

  let summary = '';
  let keyThreat = '';
  let recommendedMove = '';
  let tacticalFactor = '';

  if (p1TokensHome >= 3) {
    summary = `${p1Name} est à 1 pion de la consécration au palais royal !`;
    recommendedMove = `Privilégier l'entrée du dernier pion au centre en toute sécurité.`;
    keyThreat = `Capture in extremis d'un pion sur le chemin de retour.`;
    tacticalFactor = 'Sprint final royal';
  } else if (p2TokensHome >= 3) {
    summary = `${p2Name} mène la course avec 3 pions couronnés dans le palais.`;
    recommendedMove = `Tenter une interception d'urgence en sortant tous les pions disponibles sur un 6.`;
    keyThreat = `Victoire adverse imminente sur le prochain bon lancer de dé.`;
    tacticalFactor = 'Alerte rouge défensive';
  } else if (advantagePlayer === 'p1') {
    summary = `${p1Name} possède un net avantage de course (${p1TokensHome} couronnés contre ${p2TokensHome}).`;
    recommendedMove = `Abriter les pions avancés sur les cases étoiles sanctuaires.`;
    keyThreat = `Pions adverses en embuscade à portée de 1 à 6 cases derrière vos coureurs.`;
    tacticalFactor = 'Progression protégée sur les étoiles';
  } else if (advantagePlayer === 'p2') {
    summary = `${p2Name} a pris les devants grâce à des lancers de 6 opportuns.`;
    recommendedMove = `Chasser les pions isolés de l'adversaire pour les renvoyer dans leur cour.`;
    keyThreat = `Déferlement adverse vers le couloir de gloire sécurisé.`;
    tacticalFactor = 'Pression des dés adverses';
  } else {
    summary = `Duel au coude-à-coude sur le grand circuit d'Afrique.`;
    recommendedMove = `Sortir un maximum de pions pour multiplier les options de capture tactique.`;
    keyThreat = `Risque d'élimination sur les cases neutres non protégées.`;
    tacticalFactor = 'Course effrénée et captures opportunistes';
  }

  return {
    p1WinProb: p1Prob,
    p2WinProb: p2Prob,
    drawProb: 0, // No draw in Ludo
    advantagePlayer,
    advantageMagnitude,
    summary,
    keyThreat,
    recommendedMove,
    tacticalFactor,
  };
}

/**
 * 3. CHESS EVALUATION (Échecs des Rois)
 */
export function evaluateChessProbability(
  board: ChessBoard,
  turn: ChessColor,
  p1Name: string = 'Blancs',
  p2Name: string = 'Noirs / Bot'
): AiProbabilityReport {
  const PIECE_VALUES: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000,
  };

  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whiteCenter = 0;
  let blackCenter = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const isCenter = (r === 3 || r === 4) && (c === 3 || c === 4);

      if (piece.color === 'w') {
        whiteMaterial += val;
        if (isCenter) whiteCenter += 40;
      } else {
        blackMaterial += val;
        if (isCenter) blackCenter += 40;
      }
    }
  }

  const whiteCheck = isPlayerInCheck(board, 'w');
  const blackCheck = isPlayerInCheck(board, 'b');

  // Material evaluation without the 20000 king bonus
  const whiteActiveMat = whiteMaterial - 20000;
  const blackActiveMat = blackMaterial - 20000;
  let evalScore = (whiteActiveMat - blackActiveMat) + (whiteCenter - blackCenter);

  if (whiteCheck) evalScore -= 120;
  if (blackCheck) evalScore += 120;

  // Convert to Win Probability via standard logistic formula (1 pawn = ~100 cp = ~57%)
  const centipawns = evalScore;
  const winProbFloat = 1 / (1 + Math.exp(-centipawns / 380));
  let p1Prob = Math.round(winProbFloat * 90 + 5);

  let drawProb = 0;
  const totalPieces = whiteActiveMat + blackActiveMat;
  if (totalPieces < 800) {
    drawProb = 35;
    p1Prob = Math.round(p1Prob * 0.65);
  } else {
    drawProb = Math.max(5, Math.min(18, Math.round(20 - Math.abs(centipawns) / 60)));
  }

  let p2Prob = 100 - p1Prob - drawProb;
  if (p2Prob < 1) {
    p2Prob = 1;
    p1Prob = 100 - drawProb - p2Prob;
  }

  const advantagePlayer = centipawns > 120 ? 'p1' : centipawns < -120 ? 'p2' : 'even';
  const absCp = Math.abs(centipawns);
  const advantageMagnitude = absCp > 500 ? 'décisive' : absCp > 250 ? 'modérée' : 'légère';

  let summary = '';
  let keyThreat = '';
  let recommendedMove = '';
  let tacticalFactor = '';

  if (whiteCheck) {
    keyThreat = `Le Roi Blanc est attaqué directement ! Échec en cours.`;
    recommendedMove = `Parer l'échec immédiatement par blocage, fuite ou capture de l'attaquant.`;
  } else if (blackCheck) {
    keyThreat = `Le Roi Noir est sous le feu d'un échec royal.`;
    recommendedMove = `Coordonner une seconde pièce pour transformer l'échec en échec et mat irréversible.`;
  } else {
    keyThreat = advantagePlayer === 'p2' ? `Pression des pièces lourdes adverses sur les colonnes ouvertes.` : `Attaque potentielle de fourchette ou clouage.`;
    recommendedMove = `Contrôler le centre, activer les fous et roquer pour sécuriser le roi.`;
  }

  if (advantagePlayer === 'p1') {
    summary = `${p1Name} domine l'échiquier avec un avantage positionnel et matériel de +${(absCp / 100).toFixed(1)} pions.`;
    tacticalFactor = 'Avantage matériel et coordination des cavaliers/fous';
  } else if (advantagePlayer === 'p2') {
    summary = `${p2Name} a pris l'initiative avec une solide pression tactique (+${(absCp / 100).toFixed(1)} pions).`;
    tacticalFactor = 'Supériorité matérielle adverse';
  } else {
    summary = `Équilibre parfait sur l'échiquier. La bataille se jouera sur la moindre imprécision.`;
    tacticalFactor = 'Parité dynamique des forces';
  }

  return {
    p1WinProb: p1Prob,
    p2WinProb: p2Prob,
    drawProb,
    advantagePlayer,
    advantageMagnitude,
    summary,
    keyThreat,
    recommendedMove,
    tacticalFactor,
  };
}
