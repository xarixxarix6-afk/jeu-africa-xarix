import React, { useState, useEffect } from 'react';
import {
  LudoPlayerColor,
  LudoPlayerState,
  LudoToken,
  createInitialLudoPlayers,
  getMovableTokens,
  getGlobalTrackIndex,
  pickBotTokenMove,
  SAFE_TRACK_INDICES,
} from './ludoLogic';
import { sound } from '../../services/sound';
import { tacticalVoice } from '../../services/tacticalVoice';
import { evaluateLudoProbability } from '../../services/aiProbabilityEngine';
import { AiProbabilityBar } from '../../components/AiProbabilityBar';
import { AiReportModal } from '../../components/AiReportModal';
import { GameMode, AiProbabilityReport } from '../../types/game';
import { Star, Trophy } from 'lucide-react';

interface LudoBoardProps {
  numPlayers: 2 | 4;
  pawnsCount?: 1 | 2 | 3 | 4;
  p1Color?: LudoPlayerColor;
  mode: GameMode;
  p1Name?: string;
  p2Name?: string;
  p1Avatar?: string;
  p2Avatar?: string;
  onGameOver: (winner: string, winnerAvatar?: string) => void;
  onTurnChange: (turnText: string) => void;
  onScoreUpdate: (p1Count: number, p2Count: number) => void;
  isOnlineTurn?: boolean;
  onSendOnlineMove?: (move: any) => void;
  onlineMoveReceived?: any;
}

const COLOR_NAMES: Record<LudoPlayerColor, string> = {
  red: 'Rouge',
  green: 'Vert',
  yellow: 'Jaune',
  blue: 'Bleu',
};

const COLOR_BG_CLASSES: Record<LudoPlayerColor, string> = {
  red: 'bg-[#c92a2a]',
  green: 'bg-[#2b8a3e]',
  yellow: 'bg-[#f59f00]',
  blue: 'bg-[#1864ab]',
};

export const LudoBoard: React.FC<LudoBoardProps> = ({
  numPlayers,
  pawnsCount = 4,
  p1Color = 'red',
  mode,
  p1Name = 'Joueur 1',
  p2Name = 'Joueur 2',
  p1Avatar = '👑',
  p2Avatar = '🦁',
  onGameOver,
  onTurnChange,
  onScoreUpdate,
  isOnlineTurn = true,
  onSendOnlineMove,
  onlineMoveReceived,
}) => {
  const [players, setPlayers] = useState<LudoPlayerState[]>(() => {
    const initial = createInitialLudoPlayers(numPlayers, mode, p1Color, pawnsCount);
    // Personalize names with custom player profiles
    const humanP1 = initial.find((p) => p.color === p1Color) || initial[0];
    if (humanP1) {
      humanP1.name = `${p1Avatar} ${p1Name}`;
    }

    const otherPlayers = initial.filter((p) => p !== humanP1);
    if (otherPlayers.length > 0) {
      if (mode === 'bot') {
        const botNames = ['🤖 IA Bot Saharien', '🤖 IA Gardien du Nil', '🤖 IA Sphinx Royal'];
        otherPlayers.forEach((botP, idx) => {
          botP.name = botNames[idx] || `🤖 IA Bot ${idx + 1}`;
          botP.isBot = true;
        });
      } else {
        if (otherPlayers[0]) {
          otherPlayers[0].name = `${p2Avatar} ${p2Name}`;
        }
      }
    }
    return initial;
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [waitingForTokenSelection, setWaitingForTokenSelection] = useState(false);
  const [bonusTurnCount, setBonusTurnCount] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const currentPlayer = players[currentTurnIdx] || players[0];

  const opponentDisplay = mode === 'bot' ? 'IA Bot Saharien' : p2Name;
  const opponentAvatar = mode === 'bot' ? '🤖' : p2Avatar;

  // Live probability calculation
  const [probReport, setProbReport] = useState<AiProbabilityReport>(() =>
    evaluateLudoProbability(players, currentTurnIdx, p1Name, opponentDisplay)
  );

  // Update header turn display, score, and probability
  useEffect(() => {
    if (!currentPlayer) return;
    const isBot = currentPlayer.isBot;
    onTurnChange(
      `${currentPlayer.name} ${isBot ? '(🤖)' : ''} ${
        waitingForTokenSelection ? '• Choisissez un pion' : '• Lancez le dé'
      }`
    );

    const report = evaluateLudoProbability(players, currentTurnIdx, p1Name, opponentDisplay);
    setProbReport(report);

    // Score = number of tokens arrived home
    const redScore = players.find((p) => p.color === 'red')?.tokens.filter((t) => t.step === 56).length || 0;
    const oppScore = players.find((p) => p.color !== 'red')?.tokens.filter((t) => t.step === 56).length || 0;
    onScoreUpdate(redScore, oppScore);
  }, [currentTurnIdx, waitingForTokenSelection, players, p1Name, opponentDisplay]);

  // Automated bot handling
  useEffect(() => {
    if (currentPlayer && currentPlayer.isBot) {
      if (!diceRoll && !isRolling && !waitingForTokenSelection) {
        // Roll dice after small delay
        const timer = setTimeout(() => {
          handleRollDice();
        }, 600);
        return () => clearTimeout(timer);
      } else if (waitingForTokenSelection && diceRoll) {
        // Pick best move
        const timer = setTimeout(() => {
          const movable = getMovableTokens(currentPlayer.tokens, diceRoll);
          const picked = pickBotTokenMove(movable, players, diceRoll);
          if (picked) {
            handleMoveToken(picked);
          } else {
            advanceTurn(false);
          }
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPlayer, diceRoll, isRolling, waitingForTokenSelection]);

  const checkHasSecretPerk = (name?: string) => {
    if (!name) return false;
    const n = name.toLowerCase();
    return n.includes('xarix') || n.includes('nathan');
  };

  const isCurrentPlayerSecretPerk = !currentPlayer.isBot && checkHasSecretPerk(currentPlayer.name);

  // Handle incoming online moves
  useEffect(() => {
    if (!onlineMoveReceived || mode !== 'online') return;
    if (onlineMoveReceived.type === 'LUDO_ROLL') {
      const val = Number(onlineMoveReceived.value) || 1;
      setIsRolling(true);
      sound.playDiceRoll();
      let rollAnimCount = 0;
      const animInterval = setInterval(() => {
        setDiceRoll(Math.floor(Math.random() * 6) + 1);
        rollAnimCount++;
        if (rollAnimCount >= 6) {
          clearInterval(animInterval);
          setDiceRoll(val);
          setIsRolling(false);
          resolveDiceRoll(val, false);
        }
      }, 50);
    } else if (onlineMoveReceived.type === 'LUDO_TOKEN') {
      const targetToken = currentPlayer.tokens.find((t) => t.id === onlineMoveReceived.tokenId);
      if (targetToken) {
        handleMoveToken(targetToken, onlineMoveReceived.rollValue || diceRoll, false);
      }
    }
  }, [onlineMoveReceived]);

  const handleSecretSelectNumber = (num: number) => {
    if (isRolling || waitingForTokenSelection || currentPlayer.isBot) return;
    if (mode === 'online' && !isOnlineTurn) return;
    
    // Simulate authentic rolling animation and audio so opponents see a real roll
    setIsRolling(true);
    sound.playDiceRoll();

    let rollAnimCount = 0;
    const animInterval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      rollAnimCount++;
      if (rollAnimCount >= 8) {
        clearInterval(animInterval);
        setDiceRoll(num);
        setIsRolling(false);
        resolveDiceRoll(num, true);
      }
    }, 55);
  };

  const handleRollDice = () => {
    if (isRolling || waitingForTokenSelection) return;
    if (mode === 'online' && !isOnlineTurn) return;

    setIsRolling(true);
    sound.playDiceRoll();

    let rollAnimCount = 0;
    const animInterval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      rollAnimCount++;
      if (rollAnimCount >= 8) {
        clearInterval(animInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalValue);
        setIsRolling(false);
        resolveDiceRoll(finalValue, true);
      }
    }, 50);
  };

  const resolveDiceRoll = (value: number, broadcast: boolean = true) => {
    if (broadcast && mode === 'online' && onSendOnlineMove) {
      onSendOnlineMove({ type: 'LUDO_ROLL', value });
    }

    if (value === 6) {
      tacticalVoice.announceLudoSix();
    }
    const movable = getMovableTokens(currentPlayer.tokens, value);

    if (movable.length === 0) {
      // No move possible, pass turn
      setTimeout(() => {
        advanceTurn(false);
      }, 700);
    } else if (movable.length === 1 && !currentPlayer.isBot) {
      // Auto move single choice for convenience
      setWaitingForTokenSelection(true);
      setTimeout(() => {
        handleMoveToken(movable[0], value, broadcast);
      }, 350);
    } else {
      setWaitingForTokenSelection(true);
    }
  };

  const handleMoveToken = (token: LudoToken, rollValue = diceRoll, broadcast: boolean = true) => {
    if (!rollValue) return;

    if (broadcast && mode === 'online' && onSendOnlineMove) {
      onSendOnlineMove({ type: 'LUDO_TOKEN', tokenId: token.id, rollValue });
    }

    let bonusRoll = rollValue === 6;
    let didCapture = false;

    const nextStep = token.step === -1 ? 0 : token.step + rollValue;

    // Check if capture occurred on standard track
    let updatedPlayers = players.map((p) => {
      if (p.color === token.color) {
        return {
          ...p,
          tokens: p.tokens.map((t) => (t.id === token.id ? { ...t, step: nextStep } : t)),
        };
      }
      return p;
    });

    if (nextStep <= 50) {
      const globalTarget = getGlobalTrackIndex(token.color, nextStep);
      if (globalTarget !== null && !SAFE_TRACK_INDICES.includes(globalTarget)) {
        // Knock any opponent on this coordinate back to base
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.color !== token.color) {
            const hasEnemyHere = p.tokens.some((t) => {
              if (t.step >= 0 && t.step <= 50) {
                return getGlobalTrackIndex(p.color, t.step) === globalTarget;
              }
              return false;
            });

            if (hasEnemyHere) {
              didCapture = true;
              return {
                ...p,
                tokens: p.tokens.map((t) => {
                  if (t.step >= 0 && t.step <= 50 && getGlobalTrackIndex(p.color, t.step) === globalTarget) {
                    return { ...t, step: -1 }; // back to base
                  }
                  return t;
                }),
              };
            }
          }
          return p;
        });
      }
    }

    if (didCapture) {
      sound.playCapture();
      tacticalVoice.announceLudoCapture();
      bonusRoll = true; // African rule: capture awards bonus roll!
    } else if (nextStep === 56) {
      sound.playPromotion();
    } else {
      sound.playMove();
    }

    // Check victory condition: ALL active tokens must enter goal 56 completely
    const activePlayerUpdated = updatedPlayers.find((p) => p.color === token.color)!;
    const tokensHome = activePlayerUpdated.tokens.filter((t) => t.step === 56).length;
    const totalRequired = activePlayerUpdated.tokens.length; // 1, 2, 3 or 4 based on selection
    if (tokensHome >= totalRequired) {
      // Complete Victory!
      sound.playVictory();
      setPlayers(updatedPlayers);
      const isP1 = activePlayerUpdated.color === p1Color;
      const winName = isP1 ? p1Name : opponentDisplay;
      const winAvatar = isP1 ? p1Avatar : opponentAvatar;
      tacticalVoice.announceVictory(winName, 'Ludo');
      onGameOver(winName, winAvatar);
      return;
    }

    setPlayers(updatedPlayers);
    setWaitingForTokenSelection(false);
    setDiceRoll(null);

    if (bonusRoll && bonusTurnCount < 2) {
      setBonusTurnCount((prev) => prev + 1);
    } else {
      advanceTurn(false);
    }
  };

  const advanceTurn = (hasBonus: boolean) => {
    setWaitingForTokenSelection(false);
    setDiceRoll(null);
    setBonusTurnCount(0);
    if (!hasBonus) {
      setCurrentTurnIdx((prev) => (prev + 1) % players.length);
    }
  };

  // Movable tokens list for pulse rendering
  const movableTokenIds =
    waitingForTokenSelection && diceRoll
      ? getMovableTokens(currentPlayer.tokens, diceRoll).map((t) => `${t.color}-${t.id}`)
      : [];

  // Build 15x15 Ludo Grid
  const allTokensOnBoard = players.flatMap((p) => p.tokens);

  const gridCells: React.ReactNode[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Red Base (rows 0-5, cols 0-5)
      if (r >= 0 && r <= 5 && c >= 0 && c <= 5) {
        if (r === 0 && c === 0) {
          gridCells.push(
            <div
              key={`${r}-${c}`}
              className="row-span-6 col-span-6 bg-[#c92a2a]/90 border-2 border-[#ff8787] p-2 flex flex-col items-center justify-center rounded-tl-xl relative"
            >
              <span className="font-royal text-white font-bold text-xs uppercase tracking-wider mb-2 truncate max-w-full px-1 text-center">
                {players.find((p) => p.color === 'red')?.name || 'Cour Rouge'}
              </span>
              <div className="grid grid-cols-2 gap-3 p-2 bg-black/30 rounded-xl border border-white/20">
                {players
                  .find((p) => p.color === 'red')
                  ?.tokens.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (movableTokenIds.includes(`red-${t.id}`)) {
                          handleMoveToken(t);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform shadow-md ${
                        COLOR_BG_CLASSES.red
                      } ${t.step === -1 ? '' : 'opacity-25'} ${
                        movableTokenIds.includes(`red-${t.id}`)
                          ? 'token-active-pulse ring-2 ring-yellow-300'
                          : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white">●</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        }
        continue;
      }

      // Green Base (rows 0-5, cols 9-14)
      if (r >= 0 && r <= 5 && c >= 9 && c <= 14) {
        if (r === 0 && c === 9) {
          gridCells.push(
            <div
              key={`${r}-${c}`}
              className="row-span-6 col-span-6 bg-[#2b8a3e]/90 border-2 border-[#8ce99a] p-2 flex flex-col items-center justify-center rounded-tr-xl relative"
            >
              <span className="font-royal text-white font-bold text-xs uppercase tracking-wider mb-2 truncate max-w-full px-1 text-center">
                {players.find((p) => p.color === 'green')?.name || 'Cour Verte'}
              </span>
              <div className="grid grid-cols-2 gap-3 p-2 bg-black/30 rounded-xl border border-white/20">
                {players
                  .find((p) => p.color === 'green')
                  ?.tokens.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (movableTokenIds.includes(`green-${t.id}`)) {
                          handleMoveToken(t);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform shadow-md ${
                        COLOR_BG_CLASSES.green
                      } ${t.step === -1 ? '' : 'opacity-25'} ${
                        movableTokenIds.includes(`green-${t.id}`)
                          ? 'token-active-pulse ring-2 ring-yellow-300'
                          : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white">●</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        }
        continue;
      }

      // Blue Base (rows 9-14, cols 0-5)
      if (r >= 9 && r <= 14 && c >= 0 && c <= 5) {
        if (r === 9 && c === 0) {
          gridCells.push(
            <div
              key={`${r}-${c}`}
              className="row-span-6 col-span-6 bg-[#1864ab]/90 border-2 border-[#74c0fc] p-2 flex flex-col items-center justify-center rounded-bl-xl relative"
            >
              <span className="font-royal text-white font-bold text-xs uppercase tracking-wider mb-2 truncate max-w-full px-1 text-center">
                {players.find((p) => p.color === 'blue')?.name || 'Cour Bleue'}
              </span>
              <div className="grid grid-cols-2 gap-3 p-2 bg-black/30 rounded-xl border border-white/20">
                {players
                  .find((p) => p.color === 'blue')
                  ?.tokens.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (movableTokenIds.includes(`blue-${t.id}`)) {
                          handleMoveToken(t);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform shadow-md ${
                        COLOR_BG_CLASSES.blue
                      } ${t.step === -1 ? '' : 'opacity-25'} ${
                        movableTokenIds.includes(`blue-${t.id}`)
                          ? 'token-active-pulse ring-2 ring-yellow-300'
                          : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white">●</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        }
        continue;
      }

      // Yellow Base (rows 9-14, cols 9-14)
      if (r >= 9 && r <= 14 && c >= 9 && c <= 14) {
        if (r === 9 && c === 9) {
          gridCells.push(
            <div
              key={`${r}-${c}`}
              className="row-span-6 col-span-6 bg-[#f59f00]/90 border-2 border-[#ffe066] p-2 flex flex-col items-center justify-center rounded-br-xl relative"
            >
              <span className="font-royal text-white font-bold text-xs uppercase tracking-wider mb-2 truncate max-w-full px-1 text-center">
                {players.find((p) => p.color === 'yellow')?.name || 'Cour Jaune'}
              </span>
              <div className="grid grid-cols-2 gap-3 p-2 bg-black/30 rounded-xl border border-white/20">
                {players
                  .find((p) => p.color === 'yellow')
                  ?.tokens.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (movableTokenIds.includes(`yellow-${t.id}`)) {
                          handleMoveToken(t);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform shadow-md ${
                        COLOR_BG_CLASSES.yellow
                      } ${t.step === -1 ? '' : 'opacity-25'} ${
                        movableTokenIds.includes(`yellow-${t.id}`)
                          ? 'token-active-pulse ring-2 ring-yellow-300'
                          : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white">☀️</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        }
        continue;
      }

      // Center Trophy Square (rows 6-8, cols 6-8)
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        if (r === 6 && c === 6) {
          gridCells.push(
            <div
              key={`${r}-${c}`}
              className="row-span-3 col-span-3 bg-gradient-to-br from-[#d4a017] via-[#855e0a] to-[#3a2003] border-2 border-[#ffd700] flex flex-col items-center justify-center relative shadow-inner p-1"
            >
              <Trophy className="w-6 h-6 text-yellow-200 animate-bounce" />
              <span className="text-[9px] font-royal font-bold text-amber-100 uppercase tracking-tighter">
                Palais
              </span>
              {/* Tokens in center goal */}
              <div className="flex gap-1 mt-1">
                {allTokensOnBoard
                  .filter((t) => t.step === 56)
                  .map((t) => (
                    <span
                      key={`${t.color}-${t.id}`}
                      className={`w-2 h-2 rounded-full border border-white ${COLOR_BG_CLASSES[t.color]}`}
                    />
                  ))}
              </div>
            </div>
          );
        }
        continue;
      }

      // Cross Track & Home Stretches
      let cellBg = 'bg-[#fff5ea] text-[#2a140a]';
      let isSafe = false;

      // Red runway (row 7, cols 1-5) & start (row 6, col 1)
      if (r === 7 && c >= 1 && c <= 5) cellBg = 'bg-[#c92a2a] text-white';
      if (r === 6 && c === 1) {
        cellBg = 'bg-[#c92a2a] text-white font-bold';
        isSafe = true;
      }

      // Green runway (col 7, rows 1-5) & start (row 1, col 8)
      if (c === 7 && r >= 1 && r <= 5) cellBg = 'bg-[#2b8a3e] text-white';
      if (r === 1 && c === 8) {
        cellBg = 'bg-[#2b8a3e] text-white font-bold';
        isSafe = true;
      }

      // Yellow runway (row 7, cols 9-13) & start (row 8, col 13)
      if (r === 7 && c >= 9 && c <= 13) cellBg = 'bg-[#f59f00] text-white';
      if (r === 8 && c === 13) {
        cellBg = 'bg-[#f59f00] text-white font-bold';
        isSafe = true;
      }

      // Blue runway (col 7, rows 9-13) & start (row 13, col 6)
      if (c === 7 && r >= 9 && r <= 13) cellBg = 'bg-[#1864ab] text-white';
      if (r === 13 && c === 6) {
        cellBg = 'bg-[#1864ab] text-white font-bold';
        isSafe = true;
      }

      // Safe star spots
      if (
        (r === 2 && c === 6) ||
        (r === 6 && c === 12) ||
        (r === 12 && c === 8) ||
        (r === 8 && c === 2)
      ) {
        isSafe = true;
      }

      // Check which tokens are on this cell
      const tokensHere = allTokensOnBoard.filter((t) => {
        if (t.step < 0 || t.step === 56) return false;
        // Check home stretch coordinates
        if (t.step > 50) {
          const stretchIdx = t.step - 51;
          if (t.color === 'red') return r === 7 && c === stretchIdx + 1;
          if (t.color === 'green') return c === 7 && r === stretchIdx + 1;
          if (t.color === 'yellow') return r === 7 && c === 13 - stretchIdx;
          if (t.color === 'blue') return c === 7 && r === 13 - stretchIdx;
          return false;
        }

        const globalIdx = getGlobalTrackIndex(t.color, t.step);
        if (globalIdx === null) return false;

        const TRACK_LOOKUP: [number, number][] = [
          [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
          [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
          [0, 7], [0, 8],
          [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
          [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
          [7, 14], [8, 14],
          [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
          [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
          [14, 7], [14, 6],
          [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
          [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
          [7, 0], [6, 0]
        ];

        const coord = TRACK_LOOKUP[globalIdx];
        return coord && coord[0] === r && coord[1] === c;
      });

      gridCells.push(
        <div
          key={`${r}-${c}`}
          className={`border-[0.5px] border-[#3d1e0f]/30 flex items-center justify-center relative ${cellBg}`}
        >
          {isSafe && tokensHere.length === 0 && (
            <Star className="w-2.5 h-2.5 text-[#ffd700] fill-[#ffd700] opacity-80" />
          )}

          {tokensHere.length > 0 && (
            <div className="flex -space-x-1 items-center justify-center z-10">
              {tokensHere.map((t) => {
                const canMoveThis = movableTokenIds.includes(`${t.color}-${t.id}`);
                return (
                  <div
                    key={`${t.color}-${t.id}`}
                    onClick={() => {
                      if (canMoveThis) {
                        handleMoveToken(t);
                      }
                    }}
                    className={`w-4 h-4 rounded-full border border-white flex items-center justify-center cursor-pointer transition-transform shadow ${
                      COLOR_BG_CLASSES[t.color]
                    } ${canMoveThis ? 'token-active-pulse ring-2 ring-yellow-300 scale-125 z-20' : ''}`}
                  >
                    <span className="text-[8px] font-bold text-white">
                      {t.color === 'yellow' ? '☀️' : '●'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[420px]">
      {/* Live AI Probability Bar */}
      <AiProbabilityBar
        report={probReport}
        p1Label={`${p1Avatar} ${p1Name}`}
        p2Label={`${opponentAvatar} ${opponentDisplay}`}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* 15x15 Ludo Board Frame */}
      <div
        className="wood-carved-frame rounded-2xl p-2.5 relative border border-[#d4a017]/40 shadow-2xl overflow-hidden aspect-square w-full"
        style={{ maxWidth: '370px' }}
      >
        <div
          className="grid w-full h-full rounded-lg overflow-hidden border-2 border-[#1a0e05]"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {gridCells}
        </div>
      </div>

      {/* Interactive Dice Roll Control */}
      <div className="mt-2.5 w-full bg-[#1e0d06]/90 border border-[#d4a017]/40 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRollDice}
            disabled={isRolling || waitingForTokenSelection || currentPlayer.isBot}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl shadow-xl transition-all border-2 border-[#3c1e0b] ${
              isRolling ? 'dice-rolling-anim bg-amber-100 text-stone-900' : 'bg-gradient-to-br from-[#fffdfa] to-[#e4d4c3] text-[#2c1407]'
            } ${
              !waitingForTokenSelection && !currentPlayer.isBot && !isRolling
                ? 'ring-4 ring-[#ffd700]/70 hover:scale-105 active:scale-95 cursor-pointer'
                : 'opacity-80 cursor-not-allowed'
            }`}
          >
            {diceRoll !== null ? diceRoll : '🎲'}
          </button>

          <div>
            <div className="text-xs font-semibold text-[#f7e6d4] flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${COLOR_BG_CLASSES[currentPlayer.color]}`} />
              <span className="truncate max-w-[150px]">Tour de : {currentPlayer.name}</span>
            </div>
            <div className="text-[10px] text-[#cca072] mt-0.5">
              {waitingForTokenSelection
                ? '👉 Touchez un pion illuminé'
                : currentPlayer.isBot
                ? '🤖 Le bot prépare son lancer...'
                : 'Touchez le dé pour lancer'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Secret perk selector - completely private & visible strictly to qualifying profiles */}
          {isCurrentPlayerSecretPerk && !waitingForTokenSelection && !isRolling && diceRoll === null && (
            <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-xl border border-[#ffd700]/40 shadow-inner">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => handleSecretSelectNumber(num)}
                  className="w-5 h-6 rounded-md bg-[#3b1a0d] hover:bg-[#5e2913] border border-[#d4a017]/60 hover:border-[#ffd700] text-[#ffd700] font-mono text-[11px] font-bold flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow"
                >
                  {num}
                </button>
              ))}
            </div>
          )}

          {bonusTurnCount > 0 && (
            <div className="text-[10px] font-bold text-[#ffd700] px-2 py-1 bg-amber-950/60 rounded-md border border-amber-600/50">
              Rejoue !
            </div>
          )}
        </div>
      </div>

      {/* Deep AI Report Modal */}
      <AiReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={probReport}
        p1Name={`${p1Avatar} ${p1Name}`}
        p2Name={`${opponentAvatar} ${opponentDisplay}`}
        gameTitle={`Ludo Royal (${numPlayers} Joueurs)`}
      />
    </div>
  );
};
