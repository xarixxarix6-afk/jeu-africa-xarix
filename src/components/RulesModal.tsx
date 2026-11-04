import React, { useState } from 'react';
import { GameType } from '../types/game';
import { X, BookOpen, Crown, Trophy, Shield } from 'lucide-react';

interface RulesModalProps {
  initialGame?: GameType;
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ initialGame = 'checkers', isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GameType>(initialGame);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1d0e07] border-2 border-[#d4a017] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#2e1509] to-[#180903] border-b border-[#d4a017]/40">
          <div className="flex items-center gap-2 text-[#ffd700] font-royal font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Livre des Règles Sacrées</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#d8b28a] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Tabs */}
        <div className="flex border-b border-[#d4a017]/30 bg-[#140803]">
          <button
            onClick={() => setActiveTab('checkers')}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'checkers'
                ? 'text-[#ffd700] border-b-2 border-[#ffd700] bg-[#2a1309]'
                : 'text-[#d8b28a]/70 hover:text-[#d8b28a]'
            }`}
          >
            👑 Dames
          </button>
          <button
            onClick={() => setActiveTab('ludo')}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'ludo'
                ? 'text-[#ffd700] border-b-2 border-[#ffd700] bg-[#2a1309]'
                : 'text-[#d8b28a]/70 hover:text-[#d8b28a]'
            }`}
          >
            🎲 Ludo Royal
          </button>
          <button
            onClick={() => setActiveTab('chess')}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'chess'
                ? 'text-[#ffd700] border-b-2 border-[#ffd700] bg-[#2a1309]'
                : 'text-[#d8b28a]/70 hover:text-[#d8b28a]'
            }`}
          >
            ⚔️ Échecs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto text-xs leading-relaxed text-[#f3e5d8] space-y-4">
          {activeTab === 'checkers' && (
            <div className="space-y-3">
              <div className="font-royal font-bold text-[#ffd700] text-sm flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Dames Internationales & Africaines (10x10 / 8x8)
              </div>
              <p>
                Le jeu de dames sur damier 10x10 est le format roi en Afrique de l'Ouest et en compétition internationale.
              </p>
              <div className="bg-[#2a140a] p-3 rounded-xl border border-[#d4a017]/20 space-y-2">
                <div className="font-semibold text-[#ffd700]">1. Prise Obligatoire & Prise en Arrière :</div>
                <p>
                  Si un pion peut capturer, il doit impérativement le faire. Les pions simples capturent aussi bien vers l'avant que vers l'arrière en sautant par-dessus la pièce adverse vers une case libre.
                </p>
                <div className="font-semibold text-[#ffd700]">2. Règle de la Majorité :</div>
                <p>
                  S'il existe plusieurs chemins de prise possibles, vous devez choisir celui qui capture le plus grand nombre de pièces adverses.
                </p>
                <div className="font-semibold text-[#ffd700]">3. Dame Volante :</div>
                <p>
                  Lorsqu'un pion atteint la ligne de fond adverse, il est sacré Dame. La dame vole sur toute la longueur de sa diagonale et peut capturer une pièce à distance en s'arrêtant sur la case de son choix au-delà.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ludo' && (
            <div className="space-y-3">
              <div className="font-royal font-bold text-[#ffd700] text-sm flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Ludo Royal (Petits Chevaux Africains)
              </div>
              <p>
                Course palpitante à 2 ou 4 joueurs où tactique, prise de risque et alliances rythment le parcours.
              </p>
              <div className="bg-[#2a140a] p-3 rounded-xl border border-[#d4a017]/20 space-y-2">
                <div className="font-semibold text-[#ffd700]">1. Sortie de la Cour :</div>
                <p>
                  Obtenir un <strong>6</strong> au dé permet de faire sortir un pion de sa cour vers sa case de départ, ou d'avancer un pion déjà en jeu.
                </p>
                <div className="font-semibold text-[#ffd700]">2. Rejouer sur un 6 ou une Capture :</div>
                <p>
                  Faire un 6 ou capturer un pion adverse vous accorde immédiatement un tour bonus de dé supplémentaire !
                </p>
                <div className="font-semibold text-[#ffd700]">3. Capture & Étoiles de Refuge :</div>
                <p>
                  Atterrir sur un pion adverse le renvoie directement dans sa cour de départ. Les cases étoilées et les cases de départ sont des zones de refuge protégées.
                </p>
                <div className="font-semibold text-[#ffd700]">4. Palais Central :</div>
                <p>
                  Le premier souverain qui parvient à faire entrer ses pions au cœur du Palais Central est couronné vainqueur !
                </p>
              </div>
            </div>
          )}

          {activeTab === 'chess' && (
            <div className="space-y-3">
              <div className="font-royal font-bold text-[#ffd700] text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Échecs des Rois
              </div>
              <p>
                Le duel impérial par excellence opposant l'Or Impérial à l'Acajou Royal.
              </p>
              <div className="bg-[#2a140a] p-3 rounded-xl border border-[#d4a017]/20 space-y-2">
                <div className="font-semibold text-[#ffd700]">1. Pièces & Pouvoirs :</div>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Roi :</strong> 1 case dans toutes les directions. Ne doit jamais rester menacé.</li>
                  <li><strong>Dame :</strong> L'atout suprême : orthogonales et diagonales sans limite.</li>
                  <li><strong>Tour :</strong> Lignes droites horizontales et verticales.</li>
                  <li><strong>Fou :</strong> Diagonales de sa couleur.</li>
                  <li><strong>Cavalier :</strong> Saut en « L » (2 cases + 1 perpendiculaire).</li>
                  <li><strong>Pion :</strong> Avance d'une case (ou 2 au départ), capture en diagonale, se transforme en Dame au bout.</li>
                </ul>
                <div className="font-semibold text-[#ffd700]">2. Échec et Mat :</div>
                <p>
                  Quand le Roi adverse est attaqué sans possibilité de fuite, d'interposition ou de capture de l'assaillant, la partie est gagnée par Échec et Mat.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer button */}
        <div className="p-3 bg-[#170803] border-t border-[#d4a017]/30 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gradient-to-r from-[#914618] to-[#5a2408] border border-[#d4a017] rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
          >
            Compris, Que le Défi Commence !
          </button>
        </div>
      </div>
    </div>
  );
};
