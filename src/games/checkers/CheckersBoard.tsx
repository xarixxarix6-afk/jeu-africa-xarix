import React, { useState, useEffect } from 'react';
import {
  CheckerBoard as BoardType,
  CheckerPlayer,
  MovePath,
  createInitialBoard,
  getLegalMovesForPlayer,
  executeMove,
  getCheckersBotMove,
} from './checkersLogic';
import { sound } from '../../services/sound';
import { tacticalVoice } from '../../services/tacticalVoice';
import { evaluateCheckersProbability } from '../../services/aiProbabilityEngine';
import { AiProbabilityBar } from '../../components/AiProbabilityBar';
import { AiReportModal } from '../../components/AiReportModal';
import { GameMode, AiProbabilityReport } from '../../types/game';
import { Crown, Sparkles } from 'lucide-react';

interface CheckersBoardProps {
  size: 10 | 8;
  mode: GameMode;
  p1Name?: string;
  p2Name?: string;
  p1Avatar?: string;
  p2Avatar?: string;
  onGameOver: (winner: string, winnerAvatar?: string) => void;
  onScoreUpdate: (p1Count: number, p2Count: number) => void;
  onTurnChange: (turnText: string) => void;
  isOnlineTurn?: boolean;
  onSendOnlineMove?: (move: MovePath) => void;
  onlineMoveReceived?: MovePath | null;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({
  size,
  mode,
  p1Name = 'Joueur 1',
  p2Name = 'Joueur 2',
  p1Avatar = '👑',
  p2Avatar = '🦁',
  onGameOver,
  onScoreUpdate,
  onTurnChange,
  isOnlineTurn = true,
  onSendOnlineMove,
  onlineMoveReceived,
}) => {
  const [board, setBoard] = useState<BoardType>(() => createInitialBoard(size));
  const [turn, setTurn] = useState<CheckerPlayer>(1);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const opponentDisplay = mode === 'bot' ? 'IA Bot Stratège' : p2Name;
  const opponentAvatar = mode === 'bot' ? '🤖' : p2Avatar;

  const isInternational = size === 10;
  const legalMoves = getLegalMovesForPlayer(board, turn, isInternational);

  // Compute live AI probability report
  const [probReport, setProbReport] = useState<AiProbabilityReport>(() =>
    evaluateCheckersProbability(board, size, turn, p1Name, opponentDisplay)
  );

  // Update counts, probabilities, and status text
  useEffect(() => {
    let p1 = 0;
    let p2 = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.player === 1) p1++;
          else p2++;
        }
      }
    }
    onScoreUpdate(p1, p2);

    const report = evaluateCheckersProbability(board, size, turn, p1Name, opponentDisplay);
    setProbReport(report);

    const turnLabel =
      turn === 1
        ? `${p1Avatar} ${p1Name} (Or)`
        : `${opponentAvatar} ${opponentDisplay} (Acajou)`;
    onTurnChange(turnLabel);

    // Check game over
    if (legalMoves.length === 0) {
      if (turn === 1) {
        onGameOver(opponentDisplay, opponentAvatar);
      } else {
        onGameOver(p1Name, p1Avatar);
      }
    }
  }, [board, turn, legalMoves.length, p1Name, opponentDisplay]);

  // Handle incoming online moves
  useEffect(() => {
    if (onlineMoveReceived && mode === 'online') {
      applyMove(onlineMoveReceived, false);
    }
  }, [onlineMoveReceived]);

  // Bot Turn Handler
  useEffect(() => {
    if (mode === 'bot' && turn === 2 && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botMove = getCheckersBotMove(board, 2, isInternational);
        if (botMove) {
          applyMove(botMove, false);
        } else {
          onGameOver(p1Name, p1Avatar);
        }
        setIsBotThinking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, board]);

  const applyMove = (move: MovePath, isLocalPlayer: boolean = true) => {
    const { newBoard, promoted } = executeMove(board, move);
    setBoard(newBoard);
    setSelectedCell(null);

    if (move.captured.length > 0) {
      sound.playCapture();
      tacticalVoice.announceCheckersCapture(move.captured.length > 1);
    } else {
      sound.playMove();
    }

    if (promoted) {
      sound.playPromotion();
      tacticalVoice.announceCheckersPromotion();
    }

    if (isLocalPlayer && onSendOnlineMove) {
      onSendOnlineMove(move);
    }

    setTurn(turn === 1 ? 2 : 1);
  };

  const handleCellClick = (r: number, c: number) => {
    // If it's bot's turn or online waiting for opponent
    if (mode === 'bot' && turn === 2) return;
    if (mode === 'online' && !isOnlineTurn) return;

    const piece = board[r][c];

    // If cell already selected and clicked a valid target square
    if (selectedCell) {
      const matchingMove = legalMoves.find(
        (m) =>
          m.fromRow === selectedCell.row &&
          m.fromCol === selectedCell.col &&
          m.toRow === r &&
          m.toCol === c
      );

      if (matchingMove) {
        applyMove(matchingMove, true);
        return;
      }
    }

    // Select piece if it belongs to current player
    if (piece && piece.player === turn) {
      // Check if this piece has legal moves
      const pieceMoves = legalMoves.filter((m) => m.fromRow === r && m.fromCol === c);
      if (pieceMoves.length > 0) {
        sound.playMove();
        setSelectedCell({ row: r, col: c });
      }
    } else {
      setSelectedCell(null);
    }
  };

  const validTargets = selectedCell
    ? legalMoves.filter((m) => m.fromRow === selectedCell.row && m.fromCol === selectedCell.col)
    : [];

  const piecesWithCapture = legalMoves
    .filter((m) => m.captured.length > 0)
    .map((m) => `${m.fromRow}-${m.fromCol}`);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Live AI Probability Bar */}
      <AiProbabilityBar
        report={probReport}
        p1Label={`${p1Avatar} ${p1Name}`}
        p2Label={`${opponentAvatar} ${opponentDisplay}`}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Checkers Board */}
      <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#4a220e] via-[#240e04] to-[#120602] border-4 border-[#d4a017] shadow-2xl">
        <div
          className="grid gap-[2px] bg-[#120803] p-1.5 rounded-xl border border-[#d4a017]/60"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            width: size === 10 ? '330px' : '320px',
            height: size === 10 ? '330px' : '320px',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isValidTarget = validTargets.some((m) => m.toRow === r && m.toCol === c);
              const mustCapture = piecesWithCapture.includes(`${r}-${c}`);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isDark ? 'wood-cell-dark' : 'wood-cell-light'
                  } ${isSelected ? '!bg-[#d4a017]/80 ring-2 ring-[#ffd700] ring-inset' : ''} ${
                    isValidTarget ? '!bg-emerald-700/60 ring-2 ring-emerald-400 ring-inset' : ''
                  }`}
                >
                  {/* Valid move dot indicator */}
                  {isValidTarget && (
                    <div className="absolute w-3 h-3 rounded-full bg-emerald-400/90 shadow-md animate-ping" />
                  )}

                  {/* Piece */}
                  {cell && (
                    <div
                      className={`relative w-[82%] h-[82%] rounded-full flex items-center justify-center transition-transform duration-200 shadow-lg ${
                        cell.player === 1
                          ? 'bg-gradient-to-br from-[#ffd54f] via-[#d4a017] to-[#8d6205] text-[#2c1a06] border-2 border-[#fff275]'
                          : 'bg-gradient-to-br from-[#c92a2a] via-[#821414] to-[#400707] text-[#f7e6d4] border-2 border-[#ff8787]'
                      } ${isSelected ? 'scale-110 shadow-2xl' : 'hover:scale-105'} ${
                        mustCapture ? 'ring-2 ring-red-400 animate-pulse' : ''
                      }`}
                    >
                      {/* Carved relief motif */}
                      <div className="w-[72%] h-[72%] rounded-full border border-black/25 flex items-center justify-center">
                        {cell.isKing ? (
                          <Crown className="w-4 h-4 text-amber-200 fill-amber-200 drop-shadow-md" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-black/30" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isBotThinking && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-[#d4a017] animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>L'adversaire IA analyse le damier...</span>
        </div>
      )}

      {/* Deep AI Report Modal */}
      <AiReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={probReport}
        p1Name={`${p1Avatar} ${p1Name}`}
        p2Name={`${opponentAvatar} ${opponentDisplay}`}
        gameTitle={size === 10 ? 'Dames 10x10 International' : 'Dames 8x8 Classique'}
      />
    </div>
  );
};
