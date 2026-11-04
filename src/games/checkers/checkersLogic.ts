/**
 * African & International Checkers (Jeu de Dames)
 * Supports 10x10 International (flying kings, backward captures, majority capture) and 8x8 Classic.
 */

export type CheckerPlayer = 1 | 2; // 1 = White / Gold (bottom), 2 = Black / Mahogany (top)

export interface CheckerPiece {
  player: CheckerPlayer;
  isKing: boolean;
}

export type CheckerBoard = (CheckerPiece | null)[][];

export interface MovePath {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured: { row: number; col: number }[];
}

export function createInitialBoard(size: 10 | 8): CheckerBoard {
  const board: CheckerBoard = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  const rowsPerSide = size === 10 ? 4 : 3;

  // Player 2 at the top (rows 0 to rowsPerSide - 1)
  for (let r = 0; r < rowsPerSide; r++) {
    for (let c = 0; c < size; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { player: 2, isKing: false };
      }
    }
  }

  // Player 1 at the bottom (rows size - rowsPerSide to size - 1)
  for (let r = size - rowsPerSide; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { player: 1, isKing: false };
      }
    }
  }

  return board;
}

// Generate all valid moves for current player with mandatory maximum capture rule
export function getLegalMovesForPlayer(board: CheckerBoard, player: CheckerPlayer, isInternational: boolean = true): MovePath[] {
  const size = board.length;
  const allCaptures: MovePath[] = [];
  const regularMoves: MovePath[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        const captures = getCapturesForPiece(board, r, c, piece, isInternational);
        allCaptures.push(...captures);

        if (allCaptures.length === 0) {
          const regulars = getRegularMovesForPiece(board, r, c, piece, isInternational);
          regularMoves.push(...regulars);
        }
      }
    }
  }

  // Mandatory capture rule
  if (allCaptures.length > 0) {
    if (isInternational) {
      // Majority capture rule (prise de la majorité)
      const maxCaptured = Math.max(...allCaptures.map((m) => m.captured.length));
      return allCaptures.filter((m) => m.captured.length === maxCaptured);
    }
    return allCaptures;
  }

  return regularMoves;
}

function getRegularMovesForPiece(
  board: CheckerBoard,
  row: number,
  col: number,
  piece: CheckerPiece,
  isInternational: boolean
): MovePath[] {
  const size = board.length;
  const moves: MovePath[] = [];

  if (!piece.isKing) {
    // Normal man: moves 1 step diagonally forward
    const forwardDir = piece.player === 1 ? -1 : 1;
    const candidates = [
      { r: row + forwardDir, c: col - 1 },
      { r: row + forwardDir, c: col + 1 },
    ];

    for (const cand of candidates) {
      if (cand.r >= 0 && cand.r < size && cand.c >= 0 && cand.c < size) {
        if (!board[cand.r][cand.c]) {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: cand.r,
            toCol: cand.c,
            captured: [],
          });
        }
      }
    }
  } else {
    // King
    const dirs = [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];

    if (isInternational) {
      // Flying King (Dame volante): can move multiple squares
      for (const d of dirs) {
        let step = 1;
        while (true) {
          const nr = row + d.dr * step;
          const nc = col + d.dc * step;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          if (board[nr][nc]) break; // blocked

          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: nr,
            toCol: nc,
            captured: [],
          });
          step++;
        }
      }
    } else {
      // Classic 8x8 King: 1 step any diagonal
      for (const d of dirs) {
        const nr = row + d.dr;
        const nc = col + d.dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !board[nr][nc]) {
          moves.push({
            fromRow: row,
            fromCol: col,
            toRow: nr,
            toCol: nc,
            captured: [],
          });
        }
      }
    }
  }

  return moves;
}

// Find multi-jump captures recursively
function getCapturesForPiece(
  board: CheckerBoard,
  row: number,
  col: number,
  piece: CheckerPiece,
  isInternational: boolean,
  visitedCaptures: { row: number; col: number }[] = []
): MovePath[] {
  const size = board.length;
  const dirs = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 },
  ];

  const fullPaths: MovePath[] = [];

  if (!piece.isKing) {
    // Man capture: both forward & backward in International & African rules
    for (const d of dirs) {
      const midR = row + d.dr;
      const midC = col + d.dc;
      const endR = row + d.dr * 2;
      const endC = col + d.dc * 2;

      if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
        const victim = board[midR][midC];
        const alreadyCaptured = visitedCaptures.some((v) => v.row === midR && v.col === midC);

        if (victim && victim.player !== piece.player && !alreadyCaptured && !board[endR][endC]) {
          const nextVisited = [...visitedCaptures, { row: midR, col: midC }];
          // Recursively find further jumps from endR, endC
          const subJumps = getCapturesForPiece(board, endR, endC, piece, isInternational, nextVisited);

          if (subJumps.length > 0) {
            for (const sub of subJumps) {
              fullPaths.push({
                fromRow: row,
                fromCol: col,
                toRow: sub.toRow,
                toCol: sub.toCol,
                captured: [{ row: midR, col: midC }, ...sub.captured],
              });
            }
          } else {
            fullPaths.push({
              fromRow: row,
              fromCol: col,
              toRow: endR,
              toCol: endC,
              captured: [{ row: midR, col: midC }],
            });
          }
        }
      }
    }
  } else {
    // King capture
    if (isInternational) {
      // Flying King capture (Dame volante)
      for (const d of dirs) {
        let step = 1;
        let victimPos: { row: number; col: number } | null = null;

        while (true) {
          const r = row + d.dr * step;
          const c = col + d.dc * step;
          if (r < 0 || r >= size || c < 0 || c >= size) break;

          const currentPiece = board[r][c];
          if (!victimPos) {
            if (currentPiece) {
              if (currentPiece.player === piece.player) break; // own piece blocks
              const alreadyCaptured = visitedCaptures.some((v) => v.row === r && v.col === c);
              if (alreadyCaptured) break;
              victimPos = { row: r, col: c };
            }
          } else {
            // We already passed the victim, landing squares must be free
            if (currentPiece) break;

            const nextVisited = [...visitedCaptures, victimPos];
            const subJumps = getCapturesForPiece(board, r, c, piece, isInternational, nextVisited);

            if (subJumps.length > 0) {
              for (const sub of subJumps) {
                fullPaths.push({
                  fromRow: row,
                  fromCol: col,
                  toRow: sub.toRow,
                  toCol: sub.toCol,
                  captured: [victimPos, ...sub.captured],
                });
              }
            } else {
              fullPaths.push({
                fromRow: row,
                fromCol: col,
                toRow: r,
                toCol: c,
                captured: [victimPos],
              });
            }
          }
          step++;
        }
      }
    } else {
      // Classic 8x8 King single-jump capture
      for (const d of dirs) {
        const midR = row + d.dr;
        const midC = col + d.dc;
        const endR = row + d.dr * 2;
        const endC = col + d.dc * 2;

        if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
          const victim = board[midR][midC];
          const alreadyCaptured = visitedCaptures.some((v) => v.row === midR && v.col === midC);

          if (victim && victim.player !== piece.player && !alreadyCaptured && !board[endR][endC]) {
            const nextVisited = [...visitedCaptures, { row: midR, col: midC }];
            const subJumps = getCapturesForPiece(board, endR, endC, piece, isInternational, nextVisited);
            if (subJumps.length > 0) {
              for (const sub of subJumps) {
                fullPaths.push({
                  fromRow: row,
                  fromCol: col,
                  toRow: sub.toRow,
                  toCol: sub.toCol,
                  captured: [{ row: midR, col: midC }, ...sub.captured],
                });
              }
            } else {
              fullPaths.push({
                fromRow: row,
                fromCol: col,
                toRow: endR,
                toCol: endC,
                captured: [{ row: midR, col: midC }],
              });
            }
          }
        }
      }
    }
  }

  return fullPaths;
}

export function executeMove(board: CheckerBoard, move: MovePath): { newBoard: CheckerBoard; promoted: boolean } {
  const size = board.length;
  const newBoard: CheckerBoard = board.map((row) => [...row]);

  const piece = newBoard[move.fromRow][move.fromCol]!;
  newBoard[move.fromRow][move.fromCol] = null;

  // Remove captured pieces
  for (const cap of move.captured) {
    newBoard[cap.row][cap.col] = null;
  }

  // Promotion check
  let promoted = false;
  let isKing = piece.isKing;
  if (!isKing) {
    if (piece.player === 1 && move.toRow === 0) {
      isKing = true;
      promoted = true;
    } else if (piece.player === 2 && move.toRow === size - 1) {
      isKing = true;
      promoted = true;
    }
  }

  newBoard[move.toRow][move.toCol] = {
    player: piece.player,
    isKing,
  };

  return { newBoard, promoted };
}

// Bot AI for Checkers
export function getCheckersBotMove(board: CheckerBoard, botPlayer: CheckerPlayer, isInternational: boolean): MovePath | null {
  const legalMoves = getLegalMovesForPlayer(board, botPlayer, isInternational);
  if (legalMoves.length === 0) return null;

  // Evaluate each move
  let bestScore = -Infinity;
  let bestMoves: MovePath[] = [];

  for (const move of legalMoves) {
    const { newBoard, promoted } = executeMove(board, move);
    let score = move.captured.length * 10;
    if (promoted) score += 8;

    // Favor advancement and center control
    const targetRow = move.toRow;
    const centerDist = Math.abs(move.toCol - (board.length - 1) / 2);
    score += (botPlayer === 2 ? targetRow : board.length - 1 - targetRow) * 0.5;
    score -= centerDist * 0.3;

    // Check if opponent can immediately counter-capture
    const opponent = botPlayer === 1 ? 2 : 1;
    const oppMoves = getLegalMovesForPlayer(newBoard, opponent, isInternational);
    const maxOppCapture = oppMoves.length > 0 ? Math.max(...oppMoves.map((m) => m.captured.length), 0) : 0;
    score -= maxOppCapture * 11;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
