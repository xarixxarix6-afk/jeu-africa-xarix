/**
 * Complete Chess Engine (Échecs des Rois)
 * Standard rules: Legal move generation, check/checkmate detection, castling, promotion,
 * and 3-tier AI (Initié, Guerrier, Grand Maître).
 */

export type ChessColor = 'w' | 'b'; // 'w' = White / Gold, 'b' = Black / Mahogany
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  color: ChessColor;
  type: PieceType;
  hasMoved?: boolean;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface ChessMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured?: ChessPiece;
  isCastling?: boolean;
  promotion?: PieceType;
}

// Initial board setup
export function createInitialChessBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const backRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  // Black pieces (row 0 & 1)
  for (let c = 0; c < 8; c++) {
    board[0][c] = { color: 'b', type: backRow[c], hasMoved: false };
    board[1][c] = { color: 'b', type: 'p', hasMoved: false };
  }

  // White pieces (row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { color: 'w', type: 'p', hasMoved: false };
    board[7][c] = { color: 'w', type: backRow[c], hasMoved: false };
  }

  return board;
}

// Check if square (targetRow, targetCol) is attacked by pieces of byColor
export function isSquareAttacked(
  board: ChessBoard,
  targetRow: number,
  targetCol: number,
  byColor: ChessColor
): boolean {
  // 1. Pawn attacks: a pawn of byColor attacks diagonally forward towards its target
  const pawnPushDir = byColor === 'w' ? -1 : 1;
  const pawnOriginRow = targetRow - pawnPushDir;
  if (pawnOriginRow >= 0 && pawnOriginRow < 8) {
    for (const dc of [-1, 1]) {
      const pawnOriginCol = targetCol + dc;
      if (pawnOriginCol >= 0 && pawnOriginCol < 8) {
        const piece = board[pawnOriginRow][pawnOriginCol];
        if (piece && piece.color === byColor && piece.type === 'p') {
          return true;
        }
      }
    }
  }

  // 2. Knight attacks
  const knightDeltas = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightDeltas) {
    const r = targetRow + dr;
    const c = targetCol + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece && piece.color === byColor && piece.type === 'n') {
        return true;
      }
    }
  }

  // 3. King attacks (adjacent 1 square)
  const kingDeltas = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  for (const [dr, dc] of kingDeltas) {
    const r = targetRow + dr;
    const c = targetCol + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece && piece.color === byColor && piece.type === 'k') {
        return true;
      }
    }
  }

  // 4. Orthogonal rays (Rooks and Queens)
  const orthogonalDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of orthogonalDirs) {
    let step = 1;
    while (true) {
      const r = targetRow + dr * step;
      const c = targetCol + dc * step;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      const piece = board[r][c];
      if (piece) {
        if (piece.color === byColor && (piece.type === 'r' || piece.type === 'q')) {
          return true;
        }
        break; // Any piece blocks ray
      }
      step++;
    }
  }

  // 5. Diagonal rays (Bishops and Queens)
  const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagonalDirs) {
    let step = 1;
    while (true) {
      const r = targetRow + dr * step;
      const c = targetCol + dc * step;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      const piece = board[r][c];
      if (piece) {
        if (piece.color === byColor && (piece.type === 'b' || piece.type === 'q')) {
          return true;
        }
        break; // Any piece blocks ray
      }
      step++;
    }
  }

  return false;
}

// Find king position
export function findKing(board: ChessBoard, color: ChessColor): { row: number; col: number } | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && piece.type === 'k') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Check if player's king is in check
export function isPlayerInCheck(board: ChessBoard, color: ChessColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor: ChessColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponentColor);
}

// Apply a move temporarily to test board state
function makeMove(board: ChessBoard, move: ChessMove): ChessBoard {
  const next: ChessBoard = board.map((row) => [...row]);
  const movingPiece = next[move.fromRow][move.fromCol]!;

  next[move.fromRow][move.fromCol] = null;

  // Handle castling rook movement
  if (move.isCastling) {
    if (move.toCol === 6) {
      // King-side
      const rook = next[move.fromRow][7];
      next[move.fromRow][7] = null;
      next[move.fromRow][5] = rook ? { ...rook, hasMoved: true } : null;
    } else if (move.toCol === 2) {
      // Queen-side
      const rook = next[move.fromRow][0];
      next[move.fromRow][0] = null;
      next[move.fromRow][3] = rook ? { ...rook, hasMoved: true } : null;
    }
  }

  // Handle promotion
  const finalType = move.promotion || movingPiece.type;

  next[move.toRow][move.toCol] = {
    ...movingPiece,
    type: finalType,
    hasMoved: true,
  };

  return next;
}

// Pseudo-legal moves for a piece (ignoring checks on own king)
function getPseudoLegalMoves(board: ChessBoard, r: number, c: number, piece: ChessPiece): ChessMove[] {
  const moves: ChessMove[] = [];
  const color = piece.color;
  const oppColor: ChessColor = color === 'w' ? 'b' : 'w';

  if (piece.type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    // 1 step forward
    const nextR = r + dir;
    if (nextR >= 0 && nextR < 8 && !board[nextR][c]) {
      if (nextR === promoRow) {
        moves.push({ fromRow: r, fromCol: c, toRow: nextR, toCol: c, promotion: 'q' });
      } else {
        moves.push({ fromRow: r, fromCol: c, toRow: nextR, toCol: c });
      }

      // 2 steps forward from start row
      const doubleR = r + dir * 2;
      if (r === startRow && !board[doubleR][c]) {
        moves.push({ fromRow: r, fromCol: c, toRow: doubleR, toCol: c });
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const capC = c + dc;
      if (capC >= 0 && capC < 8 && nextR >= 0 && nextR < 8) {
        const target = board[nextR][capC];
        if (target && target.color === oppColor) {
          if (nextR === promoRow) {
            moves.push({ fromRow: r, fromCol: c, toRow: nextR, toCol: capC, captured: target, promotion: 'q' });
          } else {
            moves.push({ fromRow: r, fromCol: c, toRow: nextR, toCol: capC, captured: target });
          }
        }
      }
    }
  } else if (piece.type === 'n') {
    const knightDeltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of knightDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = board[nr][nc];
        if (!target || target.color === oppColor) {
          moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc, captured: target || undefined });
        }
      }
    }
  } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
    const directions: number[][] = [];
    if (piece.type === 'b' || piece.type === 'q') {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (piece.type === 'r' || piece.type === 'q') {
      directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of directions) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

        const target = board[nr][nc];
        if (!target) {
          moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
        } else {
          if (target.color === oppColor) {
            moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc, captured: target });
          }
          break;
        }
        step++;
      }
    }
  } else if (piece.type === 'k') {
    const kingDeltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    for (const [dr, dc] of kingDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = board[nr][nc];
        if (!target || target.color === oppColor) {
          moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc, captured: target || undefined });
        }
      }
    }

    // Castling
    if (!piece.hasMoved && !isPlayerInCheck(board, color)) {
      // King-side
      const rookK = board[r][7];
      if (
        rookK &&
        rookK.type === 'r' &&
        !rookK.hasMoved &&
        !board[r][5] &&
        !board[r][6] &&
        !isSquareAttacked(board, r, 5, oppColor) &&
        !isSquareAttacked(board, r, 6, oppColor)
      ) {
        moves.push({ fromRow: r, fromCol: c, toRow: r, toCol: 6, isCastling: true });
      }

      // Queen-side
      const rookQ = board[r][0];
      if (
        rookQ &&
        rookQ.type === 'r' &&
        !rookQ.hasMoved &&
        !board[r][1] &&
        !board[r][2] &&
        !board[r][3] &&
        !isSquareAttacked(board, r, 2, oppColor) &&
        !isSquareAttacked(board, r, 3, oppColor)
      ) {
        moves.push({ fromRow: r, fromCol: c, toRow: r, toCol: 2, isCastling: true });
      }
    }
  }

  return moves;
}

// Strictly legal moves (guarantee own king is not in check after move)
export function getLegalChessMoves(board: ChessBoard, color: ChessColor): ChessMove[] {
  const legal: ChessMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const rawMoves = getPseudoLegalMoves(board, r, c, piece);
        for (const m of rawMoves) {
          const testBoard = makeMove(board, m);
          if (!isPlayerInCheck(testBoard, color)) {
            legal.push(m);
          }
        }
      }
    }
  }

  return legal;
}

// Execute move permanently
export function executeChessMove(board: ChessBoard, move: ChessMove): ChessBoard {
  return makeMove(board, move);
}

// Piece material values
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simple positional evaluation tables
function evaluateBoard(board: ChessBoard): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type];

        // Center control bonus
        const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        val += (7 - centerDist) * 3;

        // Advance pawns
        if (piece.type === 'p') {
          val += (piece.color === 'w' ? (7 - r) * 5 : r * 5);
        }

        if (piece.color === 'w') {
          score += val;
        } else {
          score -= val;
        }
      }
    }
  }

  return score;
}

// AI Bot Move Generator
export function getChessBotMove(board: ChessBoard, botColor: ChessColor, difficulty: 1 | 2 | 3): ChessMove | null {
  const legalMoves = getLegalChessMoves(board, botColor);
  if (legalMoves.length === 0) return null;

  // Level 1: Initié (Basic greedy captures + safe moves)
  if (difficulty === 1) {
    const captures = legalMoves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.7) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Level 2 & 3: Minimax with Alpha-Beta Pruning
  const depth = difficulty === 2 ? 2 : 3;
  const isMaximizing = botColor === 'w';

  let bestMove: ChessMove = legalMoves[0];
  let bestVal = isMaximizing ? -Infinity : Infinity;

  // Shuffle moves slightly for non-repetitive play
  const shuffled = [...legalMoves].sort(() => 0.5 - Math.random());

  for (const move of shuffled) {
    const nextBoard = makeMove(board, move);
    const value = minimax(nextBoard, depth - 1, -Infinity, Infinity, !isMaximizing);

    if (isMaximizing) {
      if (value > bestVal) {
        bestVal = value;
        bestMove = move;
      }
    } else {
      if (value < bestVal) {
        bestVal = value;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

function minimax(
  board: ChessBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const color: ChessColor = isMaximizing ? 'w' : 'b';
  const moves = getLegalChessMoves(board, color);

  if (moves.length === 0) {
    if (isPlayerInCheck(board, color)) {
      return isMaximizing ? -50000 : 50000; // Checkmate
    }
    return 0; // Stalemate
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalVal = minimax(nextBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = makeMove(board, move);
      const evalVal = minimax(nextBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
