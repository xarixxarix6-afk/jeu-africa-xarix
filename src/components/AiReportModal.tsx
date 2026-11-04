import React, { useState } from 'react';
import { AiProbabilityReport } from '../types/game';
import { tacticalVoice } from '../services/tacticalVoice';
import { sound } from '../services/sound';
import {
  BrainCircuit,
  Volume2,
  X,
  ShieldAlert,
  Target,
  Zap,
  TrendingUp,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AiProbabilityReport;
  p1Name: string;
  p2Name: string;
  gameTitle: string;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({
  isOpen,
  onClose,
  report,
  p1Name,
  p2Name,
  gameTitle,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleSpeakReport = () => {
    sound.playMove();
    setIsSpeaking(true);

    const speechText = `Rapport d'analyse tactique IA pour ${gameTitle}. Probabilités prédictives : ${p1Name} ${report.p1WinProb} pour cent de chances de victoire. ${p2Name} ${report.p2WinProb} pour cent. Diagnostic : ${report.summary}. Facteur clé : ${report.tacticalFactor}. Menace identifiée : ${report.keyThreat}. Conseil recommandé : ${report.recommendedMove}.`;

    tacticalVoice.speak(speechText, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#241007] via-[#160a04] to-[#0c0502] border-2 border-[#ffd700] rounded-2xl p-4 text-[#f3e5d8] shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d4a017]/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center border border-[#ffd700] shadow">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-royal font-extrabold text-[#ffd700] uppercase tracking-wide">
                Rapport IA Cognitive
              </h2>
              <div className="text-[10px] text-[#d8b28a] flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>{gameTitle} • Analyse Temps Réel</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 text-[#d8b28a] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Probability Matrix */}
        <div className="mt-3.5 p-3 bg-black/50 border border-[#d4a017]/50 rounded-xl space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#d8b28a]">Matrice des Probabilités</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono">
              99.8% Précision
            </span>
          </div>

          {/* Bar */}
          <div className="w-full h-4 bg-black/80 rounded-full overflow-hidden flex border border-[#ffd700]/50 p-0.5 shadow">
            <div
              style={{ width: `${report.p1WinProb}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-l-full flex items-center justify-center text-[9px] font-bold text-black font-mono transition-all duration-500"
            >
              {report.p1WinProb >= 15 ? `${report.p1WinProb}%` : ''}
            </div>
            {report.drawProb > 0 && (
              <div
                style={{ width: `${report.drawProb}%` }}
                className="h-full bg-stone-500 flex items-center justify-center text-[8px] font-bold text-white font-mono opacity-80"
              >
                {report.drawProb >= 10 ? `${report.drawProb}%` : ''}
              </div>
            )}
            <div
              style={{ width: `${report.p2WinProb}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-r-full flex items-center justify-center text-[9px] font-bold text-white font-mono transition-all duration-500"
            >
              {report.p2WinProb >= 15 ? `${report.p2WinProb}%` : ''}
            </div>
          </div>

          {/* Probability Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
              <div className="text-[11px] text-amber-200 truncate font-semibold">{p1Name}</div>
              <div className="text-xl font-extrabold text-[#ffd700] font-mono mt-0.5">
                {report.p1WinProb}%
              </div>
              <div className="text-[9px] text-[#e0b892]">Victoire projetée</div>
            </div>

            <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40">
              <div className="text-[11px] text-red-200 truncate font-semibold">{p2Name}</div>
              <div className="text-xl font-extrabold text-red-400 font-mono mt-0.5">
                {report.p2WinProb}%
              </div>
              <div className="text-[9px] text-[#e0b892]">Victoire projetée</div>
            </div>
          </div>

          {report.drawProb > 0 && (
            <div className="text-center text-[10px] text-stone-400">
              Probabilité d'enlisement ou match nul : <span className="font-bold text-stone-200">{report.drawProb}%</span>
            </div>
          )}
        </div>

        {/* Detailed AI Insights */}
        <div className="mt-3 space-y-2.5 text-xs">
          {/* Situation Synthesis */}
          <div className="p-2.5 rounded-xl bg-[#2e1509] border border-[#d4a017]/30">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>Diagnostic de Situation</span>
            </div>
            <p className="text-[#f3e5d8] text-[11px] leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Key Tactical Factor */}
          <div className="p-2.5 rounded-xl bg-[#2a1207] border border-[#d4a017]/30">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Facteur Clé Décisif</span>
            </div>
            <p className="text-[#e2d5c8] text-[11px]">
              {report.tacticalFactor}
            </p>
          </div>

          {/* Primary Threat */}
          <div className="p-2.5 rounded-xl bg-[#2b0d09] border border-red-500/40">
            <div className="flex items-center gap-1.5 text-red-300 font-bold text-[11px] mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Menace Immédiate Identifiée</span>
            </div>
            <p className="text-red-100 text-[11px]">
              {report.keyThreat}
            </p>
          </div>

          {/* Recommended Move */}
          <div className="p-2.5 rounded-xl bg-[#142616] border border-emerald-500/40">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommandation Tactique IA</span>
            </div>
            <p className="text-emerald-100 text-[11px]">
              {report.recommendedMove}
            </p>
          </div>
        </div>

        {/* Tactical Voice Readout Button */}
        <div className="mt-4 pt-2 border-t border-[#d4a017]/30 flex flex-col gap-2">
          <button
            onClick={handleSpeakReport}
            disabled={isSpeaking}
            className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-[#8c4217] to-amber-700 hover:brightness-110 border border-[#ffd700] rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-yellow-300' : 'text-amber-200'}`} />
            <span>{isSpeaking ? 'Transmission Vocale en Cours...' : 'Écouter le Rapport (Voix IA)'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/30 rounded-xl text-[#d8b28a] text-xs font-semibold cursor-pointer transition-all"
          >
            Fermer le rapport
          </button>
        </div>
      </div>
    </div>
  );
};
