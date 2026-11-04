import React, { useState, useEffect } from 'react';
import {
  ChessBoard as BoardType,
  ChessColor,
  ChessMove,
  createInitialChessBoard,
  getLegalChessMoves,
  executeChessMove,
  isPlayerInCheck,
  getChessBotMove,
  findKing,
} from './chessLogic';
import { sound } from '../../services/sound';
import { tacticalVoice } from '../../services/tacticalVoice';
import { evaluateChessProbability } from '../../services/aiProbabilityEngine';
import { AiProbabilityBar } from '../../components/AiProbabilityBar';
import { AiReportModal } from '../../components/AiReportModal';
import { ChessDifficulty, GameMode, AiProbabilityReport } from '../../types/game';
import { AlertCircle, Sparkles } from 'lucide-react';

interface ChessBoardProps {
  difficulty: ChessDifficulty;
  mode: GameMode;
  p1Name?: string;
  p2Name?: string;
  p1Avatar?: string;
  p2Avatar?: string;
  onGameOver: (winner: string, winnerAvatar?: string) => void;
  onTurnChange: (turnText: string) => void;
  onScoreUpdate: (p1Count: number, p2Count: number) => void;
  isOnlineTurn?: boolean;
  onSendOnlineMove?: (move: ChessMove) => void;
  onlineMoveReceived?: ChessMove | null;
}

// African Royal Chess Symbols & Stylized Icons
const PIECE_SYMBOLS: Record<string, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  difficulty,
  mode,
  p1Name = 'Blancs',
  p2Name = 'Noirs',
  p1Avatar = '👑',
  p2Avatar = '🦁',
  onGameOver,
  onTurnChange,
  onScoreUpdate,
  isOnlineTurn = true,
  onSendOnlineMove,
  onlineMoveReceived,
}) => {
  const [board, setBoard] = useState<BoardType>(createInitialChessBoard);
  const [turn, setTurn] = useState<ChessColor>('w');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const diffNames = { 1: 'Initié', 2: 'Guerrier', 3: 'Grand Maître' };
  const opponentDisplay = mode === 'bot' ? `IA (${diffNames[difficulty]})` : p2Name;
  const opponentAvatar = mode === 'bot' ? '🤖' : p2Avatar;

  const legalMoves = getLegalChessMoves(board, turn);
  const inCheck = isPlayerInCheck(board, turn);

  // Live probability report
  const [probReport, setProbReport] = useState<AiProbabilityReport>(() =>
    evaluateChessProbability(board, turn, p1Name, opponentDisplay)
  );

  // Update HUD text, score counts and probabilities
  useEffect(() => {
    let whiteCount = 0;
    let blackCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.color === 'w') whiteCount++;
          else blackCount++;
        }
      }
    }
    onScoreUpdate(whiteCount, blackCount);

    const report = evaluateChessProbability(board, turn, p1Name, opponentDisplay);
    setProbReport(report);

    const turnStr =
      turn === 'w'
        ? `${p1Avatar} ${p1Name} (Or/Blancs)`
        : `${opponentAvatar} ${opponentDisplay} (Acajou/Noirs)`;
    onTurnChange(`${turnStr} ${inCheck ? '⚠️ ÉCHEC !' : ''}`);

    // Check game over
    if (legalMoves.length === 0) {
      if (inCheck) {
        sound.playVictory();
        if (turn === 'w') {
          onGameOver(opponentDisplay, opponentAvatar);
        } else {
          onGameOver(p1Name, p1Avatar);
        }
      } else {
        onGameOver('Match Nul (Pat)');
      }
    }
  }, [turn, legalMoves.length, inCheck, board, p1Name, opponentDisplay]);

  // Handle incoming online move
  useEffect(() => {
    if (onlineMoveReceived && mode === 'online') {
      applyMove(onlineMoveReceived, false);
    }
  }, [onlineMoveReceived]);

  // Automated bot move
  useEffect(() => {
    if (mode === 'bot' && turn === 'b' && !isBotThinking) {
      setIsBotThinking(true);
      const thinkTime = difficulty === 1 ? 500 : difficulty === 2 ? 800 : 1100;

      const timer = setTimeout(() => {
        const botMove = getChessBotMove(board, 'b', difficulty);
        if (botMove) {
          applyMove(botMove, false);
        } else {
          onGameOver(p1Name, p1Avatar);
        }
        setIsBotThinking(false);
      }, thinkTime);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, board]);

  const applyMove = (move: ChessMove, isLocal: boolean = true) => {
    const nextBoard = executeChessMove(board, move);
    setBoard(nextBoard);
    setSelectedCell(null);
    setLastMove({
      from: [move.fromRow, move.fromCol],
      to: [move.toRow, move.toCol],
    });

    if (move.captured) {
      sound.playCapture();
      tacticalVoice.announceChessCapture(move.captured.type);
    } else {
      sound.playMove();
    }

    if (move.promotion) {
      sound.playPromotion();
      tacticalVoice.announceChessPromotion(move.promotion);
    }

    if (isLocal && onSendOnlineMove) {
      onSendOnlineMove(move);
    }

    const nextTurn = turn === 'w' ? 'b' : 'w';
    setTurn(nextTurn);

    // Announce check if target king is under fire
    const enemyInCheck = isPlayerInCheck(nextBoard, nextTurn);
    if (enemyInCheck) {
      sound.playHitMarker();
      tacticalVoice.announceCheck();
    }
  };

  const handleCellClick = (r: number, c: number) => {
    // Restrict if not player's turn
    if (mode === 'bot' && turn === 'b') return;
    if (mode === 'online' && !isOnlineTurn) return;

    const piece = board[r][c];

    // Attempt to make move if already selected
    if (selectedCell) {
      const match = legalMoves.find(
        (m) =>
          m.fromRow === selectedCell.row &&
          m.fromCol === selectedCell.col &&
          m.toRow === r &&
          m.toCol === c
      );

      if (match) {
        applyMove(match, true);
        return;
      }
    }

    // Select piece if owned by turn player
    if (piece && piece.color === turn) {
      const pieceMoves = legalMoves.filter((m) => m.fromRow === r && m.fromCol === c);
      if (pieceMoves.length > 0) {
        sound.playMove();
        setSelectedCell({ row: r, col: c });
      } else {
        setSelectedCell(null);
      }
    } else {
      setSelectedCell(null);
    }
  };

  const validTargets = selectedCell
    ? legalMoves.filter((m) => m.fromRow === selectedCell.row && m.fromCol === selectedCell.col)
    : [];

  const kingPos = inCheck ? findKing(board, turn) : null;

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Live AI Probability Bar */}
      <AiProbabilityBar
        report={probReport}
        p1Label={`${p1Avatar} ${p1Name}`}
        p2Label={`${opponentAvatar} ${opponentDisplay}`}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Royal African Chess Board */}
      <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#4a220e] via-[#240e04] to-[#120602] border-4 border-[#d4a017] shadow-2xl">
        <div
          className="grid grid-cols-8 gap-[1.5px] bg-[#120803] p-1.5 rounded-xl border border-[#d4a017]/60"
          style={{ width: '320px', height: '320px' }}
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isValidTarget = validTargets.some((m) => m.toRow === r && m.toCol === c);
              const isKingInCheckSquare = kingPos && kingPos.row === r && kingPos.col === c;
              const isLastMoveSquare =
                (lastMove?.from[0] === r && lastMove?.from[1] === c) ||
                (lastMove?.to[0] === r && lastMove?.to[1] === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isDark ? 'wood-cell-dark' : 'wood-cell-light'
                  } ${isSelected ? '!bg-[#d4a017]/80 ring-2 ring-[#ffd700] ring-inset' : ''} ${
                    isValidTarget ? '!bg-emerald-700/60 ring-2 ring-emerald-400 ring-inset' : ''
                  } ${isLastMoveSquare && !isSelected ? 'ring-1 ring-amber-400/50 ring-inset' : ''} ${
                    isKingInCheckSquare ? '!bg-red-700/80 animate-pulse ring-2 ring-red-400' : ''
                  }`}
                >
                  {/* Valid move target dot or ring */}
                  {isValidTarget && (
                    <div
                      className={`absolute rounded-full ${
                        piece ? 'w-full h-full ring-2 ring-red-400/80' : 'w-3 h-3 bg-emerald-400/90 shadow'
                      }`}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      className={`text-2xl sm:text-3xl font-serif select-none transition-transform duration-150 drop-shadow-md ${
                        piece.color === 'w'
                          ? 'text-[#fff7eb] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                          : 'text-[#1c0f08] drop-shadow-[0_2px_3px_rgba(255,215,0,0.3)]'
                      } ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
                      style={{
                        WebkitTextStroke: piece.color === 'b' ? '0.5px rgba(212,160,23,0.6)' : undefined,
                      }}
                    >
                      {PIECE_SYMBOLS[piece.type][piece.color]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {inCheck && (
        <div className="mt-2 px-3 py-1 bg-red-950/80 border border-red-500/70 rounded-full flex items-center gap-1.5 text-xs text-red-200 animate-bounce">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Le Roi est sous la menace (Échec) !</span>
        </div>
      )}

      {isBotThinking && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#d4a017] animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Calcul des variantes stratégiques par IA...</span>
        </div>
      )}

      {/* Deep AI Report Modal */}
      <AiReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={probReport}
        p1Name={`${p1Avatar} ${p1Name}`}
        p2Name={`${opponentAvatar} ${opponentDisplay}`}
        gameTitle="Échecs des Rois"
      />
    </div>
  );
};
