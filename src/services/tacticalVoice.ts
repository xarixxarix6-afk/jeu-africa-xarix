/**
 * Tactical Cyber-Computer Voice Synthesizer
 * Operates across the platform as a high-tech computer AI and tactical cybersecurity system.
 */

import { sound } from './sound';
import { techMusic } from './techMusicService';

class TacticalVoiceService {
  private synth: SpeechSynthesis | null = null;
  private frenchVoice: SpeechSynthesisVoice | null = null;
  private isEnabled: boolean = true;
  private lastSpokenTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize high-quality tech French voices
    const frVoice =
      voices.find((v) => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Thomas') || v.name.includes('Audrey') || v.name.includes('Julie'))) ||
      voices.find((v) => v.lang.startsWith('fr')) ||
      null;
    this.frenchVoice = frVoice;
  }

  public speak(
    phrase: string,
    priorityOrOnEnd: 'normal' | 'high' | (() => void) = 'normal',
    onEndCallback?: () => void
  ) {
    const priority = typeof priorityOrOnEnd === 'string' ? priorityOrOnEnd : 'normal';
    const onEnd = typeof priorityOrOnEnd === 'function' ? priorityOrOnEnd : onEndCallback;

    if (sound.getMuted() || !this.isEnabled || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const now = Date.now();
    if (priority === 'normal' && now - this.lastSpokenTime < 900) {
      if (onEnd) onEnd();
      return;
    }
    this.lastSpokenTime = now;

    try {
      this.synth.cancel();
      techMusic.unduck();

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.08; // Fast, precise computer processor pace
      utterance.pitch = 0.95; // Deep, authoritative high-tech tone
      utterance.lang = 'fr-FR';

      if (this.frenchVoice) {
        utterance.voice = this.frenchVoice;
      }

      // Smoothly duck music when AI voice begins
      utterance.onstart = () => {
        techMusic.duck();
      };

      utterance.onend = () => {
        techMusic.unduck();
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        techMusic.unduck();
        if (onEnd) onEnd();
      };

      // Anticipate ducking immediately
      techMusic.duck();
      this.synth.speak(utterance);
    } catch {
      techMusic.unduck();
      if (onEnd) onEnd();
    }
  }

  // Checkers (Dames) captures & events
  public announceCheckersCapture(isMulti: boolean = false) {
    const lines = isMulti
      ? [
          'Combo d’assaut : double pion neutralisé ! Trajectoire sécurisée.',
          'Rafale de capture : brèche majeure dans la défense adverse.',
          'Protocole multi-capture exécuté. Secteur dominé.',
        ]
      : [
          'Alerte intrusion : pion adverse neutralisé !',
          'Impact confirmé : cible effacée du damier.',
          'Pion intercepté et détruit. Poursuivez la progression.',
          'Menace éliminée du périmètre.',
        ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.speak(picked);
  }

  public announceCheckersPromotion() {
    const lines = [
      'Accès administrateur racine accordé : unité sacrée Dame Volante !',
      'Élévation tactique maximale : pion couronné en Dame suprême !',
      'Protocole d’ascension validé : la Dame prend le contrôle du damier.',
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  // Ludo Royal captures & events
  public announceLudoCapture() {
    const lines = [
      'Bouffé ! Unité ennemie neutralisée et renvoyée en zone de quarantaine.',
      'Interception critique ! Pion adverse éjecté du circuit, retour immédiat à la base de départ.',
      'Frappe chirurgicale : pion mangé, droit de rejouer accordé.',
      'Cible écrasée ! Retour forcé à la case de départ.',
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.speak(picked);
  }

  public announceLudoSix() {
    this.speak('Puissance maximale : Six détecté ! Déploiement tactique autorisé.');
  }

  // Chess (Échecs) captures & events
  public announceChessCapture(capturedPieceType: string) {
    const names: Record<string, string> = {
      p: 'Pion',
      n: 'Cavalier',
      b: 'Fou',
      r: 'Tour',
      q: 'Dame impériale',
    };
    const pieceName = names[capturedPieceType] || 'Pièce';
    const lines = [
      `${pieceName} adverse neutralisé et effacé de la grille !`,
      `Impact cyber : ${pieceName} adverse capturé. Défense affaiblie.`,
      `Sécurité du Roi renforcée : ${pieceName} ennemi éliminé.`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.speak(picked);
  }

  public announceChessPromotion(promotedTo: string = 'q') {
    const names: Record<string, string> = {
      q: 'Reine Impériale',
      r: 'Tour Blindée',
      b: 'Grand Fou Tactique',
      n: 'Cavalier d’Assaut',
    };
    const title = names[promotedTo] || 'Reine Impériale';
    this.speak(`Promotion validée par le système ! Le pion devient ${title} !`, 'high');
  }

  public announceCheck() {
    this.speak('Alerte rouge cybernétique : mise en Échec du Roi détectée !', 'high');
  }

  public announceCheckmate(winner: string) {
    this.speak(`Échec et Mat absolu. Victoire confirmée pour : ${winner} !`, 'high');
  }

  public announceVictory(winner: string, gameLabel?: string) {
    const context = gameLabel ? ` en ${gameLabel}` : '';
    const lines = [
      `Protocole de victoire exécuté : triomphe absolu de ${winner}${context} !`,
      `Fin de session : ${winner} valide une suprématie stratégique totale${context} !`,
      `Analyse terminée : victoire éclatante enregistrée pour ${winner}${context} !`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  public announceDuelStart(gameLabel: string) {
    const lines = [
      `Initialisation du protocole de duel en ${gameLabel}. Déploiement des unités !`,
      `Systèmes opérationnels. Début de l'affrontement en ${gameLabel}. Que le meilleur esprit l'emporte !`,
      `Connexion établie. Duel engagé en ${gameLabel} !`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  // Live Challenge Radar AI Announcements
  public announceChallengeAlert(challenger: string, gameLabel: string) {
    const lines = [
      `Alerte Défi Radar : ${challenger} vient d'ouvrir un salon de duel en ${gameLabel} !`,
      `Nouveau salon détecté sur le radar : défi lancé par ${challenger} en ${gameLabel}.`,
      `Appel au duel souverain : ${challenger} attend un rival en ${gameLabel}.`,
    ];
    const picked = lines[Math.floor(Math.random() * lines.length)];
    this.speak(picked, 'high');
  }

  public announceChallengeAccepted(challenger: string) {
    const lines = [
      `Défi accepté contre ${challenger} ! Protocole de duel enclenché.`,
      `Affrontement validé ! Connexion sécurisée établie avec ${challenger}.`,
      `Défi accepté ! Analyse tactique en cours.`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  // Quick Emoji Mood Reactions
  public announceMoodReaction(emoji: string, sender: string) {
    const reactions: Record<string, string> = {
      '👑': `${sender} revendique la couronne souveraine !`,
      '🦁': `Rugissement de guerre de ${sender} détecté sur le réseau !`,
      '🔥': `${sender} passe en surchauffe tactique !`,
      '😎': `${sender} active le mode maîtrise et sang-froid !`,
      '💀': `${sender} annonce le coup de grâce !`,
      '😱': `${sender} subit un impact tactique critique !`,
      '😤': `${sender} refuse la défaite et intensifie l'assaut !`,
      '🎯': `Précision chirurgicale validée par ${sender} !`,
      '👏': `Respect tactique accordé par ${sender} !`,
      '⚡': `Impulsion électrique foudroyante émise par ${sender} !`,
      '🏆': `${sender} vise le panthéon impérial !`,
    };
    if (reactions[emoji]) {
      this.speak(reactions[emoji], 'normal');
    }
  }

  // Waiting Room Announcements
  public announceWaitingRoomJoined(playerName: string, currentCount: number, targetCount: number) {
    this.speak(
      `Connexion validée : ${playerName} a rejoint le salon d'attente. ${currentCount} sur ${targetCount} unités présentes.`,
      'normal'
    );
  }

  public announceCallForPlayers(challenger: string, gameLabel: string, currentCount: number, targetCount: number) {
    const lines = [
      `Alerte mobilisation générale : ${challenger} attend des combattants dans le salon en ${gameLabel} !`,
      `Signal radar : ${challenger} est en attente de renforts pour lancer l'arène en ${gameLabel} !`,
      `Appel tactique : des rivaux sont requis par ${challenger} pour débuter le duel en ${gameLabel} !`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  public announcePrivateInvite(challenger: string, targetPseudo: string, gameLabel: string) {
    const lines = [
      `Alerte Défi Privé : ${challenger} a émis un défi ciblé exclusif pour ${targetPseudo} en ${gameLabel} !`,
      `Transmission cryptée : ${targetPseudo}, le souverain ${challenger} t'attend en duel direct sur ${gameLabel} !`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'high');
  }

  public announceInviteRefused(targetPseudo: string, challenger: string) {
    this.speak(
      `Mise à jour statut : ${targetPseudo} a décliné le défi de ${challenger}. Salon réouvert au réseau.`,
      'normal'
    );
  }

  public announceMatchStarting() {
    this.speak(
      'Alerte générale : tous les combattants sont synchronisés ! Début du duel impérial.',
      'high'
    );
  }
}

export const tacticalVoice = new TacticalVoiceService();
