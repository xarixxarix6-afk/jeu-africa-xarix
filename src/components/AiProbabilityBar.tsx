import React, { useState } from 'react';
import { AiProbabilityReport } from '../types/game';
import { BrainCircuit, ChevronDown, ChevronUp, Sparkles, TrendingUp } from 'lucide-react';

interface AiProbabilityBarProps {
  report: AiProbabilityReport;
  p1Label: string;
  p2Label: string;
  onOpenReport: () => void;
}

export const AiProbabilityBar: React.FC<AiProbabilityBarProps> = ({
  report,
  p1Label,
  p2Label,
  onOpenReport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Colors and values
  const p1Prob = report.p1WinProb;
  const p2Prob = report.p2WinProb;
  const drawProb = report.drawProb;

  const advantageColor =
    report.advantagePlayer === 'p1'
      ? 'text-amber-300'
      : report.advantagePlayer === 'p2'
      ? 'text-red-400'
      : 'text-stone-300';

  return (
    <div className="w-full max-w-sm px-2 pt-1 pb-1.5 z-10 select-none">
      <div className="bg-gradient-to-r from-[#200e06]/95 via-[#160a04]/95 to-[#200e06]/95 border border-[#d4a017]/60 rounded-xl p-2 shadow-lg backdrop-blur-sm transition-all">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-1 text-[11px] mb-1.5">
          <div className="flex items-center gap-1.5 text-[#ffd700] font-bold">
            <BrainCircuit className="w-3.5 h-3.5 text-[#ffd700] animate-pulse" />
            <span className="font-royal uppercase tracking-wider text-[10px]">IA Prédictive</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#421c0e] border border-[#d4a017]/40 rounded text-amber-200">
              Live
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenReport}
              className="px-2 py-0.5 bg-gradient-to-r from-[#703512] to-[#451e0a] hover:from-[#8a4217] hover:to-[#57270e] border border-[#ffd700] rounded-md text-[10px] font-bold text-[#ffd700] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Ouvrir le rapport d'analyse par IA"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Rapport IA</span>
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-[#d8b28a] hover:text-[#ffd700] p-0.5 rounded cursor-pointer"
              title={isCollapsed ? 'Déplier' : 'Réduire'}
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Visual Probability Bar */}
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-[#d4a017]/40 p-0.5 shadow-inner">
              <div
                style={{ width: `${p1Prob}%` }}
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-l-full transition-all duration-500 relative"
                title={`${p1Label} : ${p1Prob}%`}
              />
              {drawProb > 0 && (
                <div
                  style={{ width: `${drawProb}%` }}
                  className="h-full bg-stone-500 transition-all duration-500 opacity-80"
                  title={`Nulle : ${drawProb}%`}
                />
              )}
              <div
                style={{ width: `${p2Prob}%` }}
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-400 rounded-r-full transition-all duration-500"
                title={`${p2Label} : ${p2Prob}%`}
              />
            </div>

            {/* Labels under the bar */}
            <div className="flex items-center justify-between text-[10px] mt-1 text-[#d8b28a]">
              <div className="flex items-center gap-1 font-semibold text-amber-300 truncate max-w-[130px]">
                <span className="truncate">{p1Label}</span>
                <span className="font-mono font-bold text-white bg-amber-950/80 px-1 py-0.2 rounded border border-amber-600/40">
                  {p1Prob}%
                </span>
              </div>

              {drawProb > 0 && (
                <div className="text-[9px] text-stone-400 font-mono">
                  Nulle: {drawProb}%
                </div>
              )}

              <div className="flex items-center gap-1 font-semibold text-rose-300 truncate max-w-[130px] justify-end">
                <span className="font-mono font-bold text-white bg-rose-950/80 px-1 py-0.2 rounded border border-rose-600/40">
                  {p2Prob}%
                </span>
                <span className="truncate">{p2Label}</span>
              </div>
            </div>

            {/* Quick Tactical Snippet */}
            <div className="mt-1 flex items-center justify-between text-[9px] text-[#c9a785] pt-0.5 border-t border-[#d4a017]/15">
              <span className={`flex items-center gap-1 font-medium ${advantageColor}`}>
                <TrendingUp className="w-2.5 h-2.5" />
                <span>
                  {report.advantagePlayer === 'p1'
                    ? `Avantage ${p1Label} (${report.advantageMagnitude})`
                    : report.advantagePlayer === 'p2'
                    ? `Avantage ${p2Label} (${report.advantageMagnitude})`
                    : `Équilibre parfait`}
                </span>
              </span>
              <span className="text-amber-400/90 italic truncate max-w-[150px]">
                {report.tacticalFactor}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
