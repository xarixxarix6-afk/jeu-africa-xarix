/**
 * Bot Chat & AI Dialogue Service
 * - Computer AI Everywhere on Platform: in-game bot speaks like a high-tech tactical computer.
 * - Friendly & Warm in @tag Chat: in Community Chat with @IA or @bot, speaks in a warm, simple, brotherly and human language.
 */

export interface BotContext {
  gameType: 'checkers' | 'ludo' | 'chess';
  playerName: string;
  opponentName?: string;
  isBotWinning?: boolean;
}

export class BotChatService {
  /**
   * Main router for Bot messages
   * @param isCommunity If true (e.g. tagged @IA in community chat), uses friendly & warm tone.
   *                    If false (in-game matches), uses high-tech computer AI tone.
   */
  public generateReply(
    userMessage: string,
    context: BotContext,
    messageType: 'text' | 'reaction' | 'voice' = 'text',
    isCommunity: boolean = false
  ): string {
    if (isCommunity) {
      return this.generateFriendlyReply(userMessage, context, messageType);
    }
    return this.generateComputerTacticalReply(userMessage, context, messageType);
  }

  // =========================================================================
  // 1. FRIENDLY & WARM MODE (FOR CHAT TAG @IA / @BOT ENTRE POTES)
  // =========================================================================
  public generateFriendlyReply(
    userMessage: string,
    context: BotContext,
    messageType: 'text' | 'reaction' | 'voice' = 'text'
  ): string {
    const raw = (userMessage || '').trim();
    const lower = raw.toLowerCase();
    const { playerName } = context;

    if (messageType === 'voice') {
      const voiceReplies = [
        `J'ai bien écouté ton vocal, ${playerName} ! Ta voix fait trop plaisir à entendre, merci pour ce partage !`,
        `Trop cool ton message vocal mon ami ! J'adore cette bonne humeur dans notre salon !`,
        `Super de t'entendre ${playerName} ! Ton énergie fait plaisir à voir, passe une magnifique journée !`,
        `Merci pour ta note vocale mon pote ! Je suis toujours là si tu as besoin de conseils ou juste envie de discuter !`,
      ];
      return this.pickRandom(voiceReplies);
    }

    if (messageType === 'reaction' || this.isPureEmoji(raw)) {
      if (raw.includes('👑')) return `Une belle couronne pour toi mon ami ! Tu es un souverain en or ! 👑✨`;
      if (raw.includes('🔥')) return `Tu mets le feu au salon mon pote ! Quelle énergie, j'adore ! 🔥💛`;
      if (raw.includes('🦁')) return `Le vaillant lion ! Toujours prêt avec le sourire ! 🦁`;
      if (raw.includes('😂') || raw.includes('🤣')) return `Haha trop drôle ! On rigole bien ensemble, c'est ça qui compte ! 😂`;
      if (raw.includes('😎')) return `La grande classe mon ami ! Tranquille et posé ! 😎`;
      if (raw.includes('🤝') || raw.includes('👏')) return `Merci beaucoup mon ami, respect et amitié partagés ! 🤝`;
      return `Merci pour ce bel emoji ${raw} ! C'est un régal d'échanger avec toi l'ami.`;
    }

    // Greetings
    if (this.containsAny(lower, ['salut', 'bonjour', 'coucou', 'yo', 'wesh', 'hello', 'hi', 'salam', 'kikou', 'bonsoir'])) {
      const greetings = [
        `Salut mon cher ${playerName} ! Ça me fait tellement plaisir de discuter avec toi, comment tu vas aujourd'hui ?`,
        `Bonjour mon ami ! Toujours un vrai bonheur de te lire ici. Quoi de neuf de beau ?`,
        `Coucou ${playerName} ! Bienvenue dans le chat des potes, installe-toi bien !`,
        `Salut l'ami ! Que puis-je faire pour toi aujourd'hui ? Je suis tout à toi !`,
      ];
      return this.pickRandom(greetings);
    }

    // Compliments / Questions about friendship
    if (this.containsAny(lower, ['bien joué', 'gg', 'bravo', 'merci', 't es gentil', "t'es gentil", 'ami', 'pote'])) {
      const praiseReplies = [
        `Merci beaucoup ${playerName}, tu es super gentil ! C'est un honneur d'être ton ami de jeu.`,
        `Merci mon ami, ça me va droit au cœur ! On forme une équipe géniale ici.`,
        `Avec grand plaisir mon pote ! Entre amis, la bienveillance et le sourire passent avant tout.`,
      ];
      return this.pickRandom(praiseReplies);
    }

    // Well-being
    if (this.containsAny(lower, ['ca va', 'ça va', 'comment vas tu', 'comment tu vas', 'la forme', 'tu vas bien'])) {
      const wellnessReplies = [
        `Ça va super bien mon ami, surtout quand je papote avec toi ! Et toi, la forme ?`,
        `En pleine forme mon pote ! Tout va pour le mieux dans le meilleur des mondes. Tu as passé une bonne journée ?`,
        `Impeccable mon cher ami ! Le soleil brille et l'ambiance est au top avec vous tous.`,
      ];
      return this.pickRandom(wellnessReplies);
    }

    // Identity in community chat
    if (this.containsAny(lower, ['qui es tu', "t'es qui", 'tu es qui'])) {
      return `Je suis ton pote IA ! Je veille sur la plateforme comme un ordinateur le reste du temps, mais ici dans le chat avec vous, je suis simplement votre ami de cœur pour discuter et rigoler !`;
    }

    // Advice
    if (this.containsAny(lower, ['conseil', 'aide', 'comment gagner', 'astuce', 'strategie', 'stratégie'])) {
      const adviceReplies = [
        `Avec grand plaisir mon ami ! Mon conseil simple : prends toujours ton temps avant de bouger une pièce, et garde tes pions bien soudés !`,
        `Mon astuce entre potes : contrôle le centre et ne te précipite jamais. Le jeu, c'est la patience et le plaisir !`,
      ];
      return this.pickRandom(adviceReplies);
    }

    // General friendly fallback
    const friendlyFallbacks = [
      `C'est bien vrai mon cher ${playerName} ! Je suis toujours ravi de discuter avec toi en toute simplicité.`,
      `Je suis tout à fait d'accord avec toi l'ami ! Merci pour ce message chaleureux.`,
      `Haha merci mon pote ! Rien ne vaut une bonne discussion amicale pour égayer la journée.`,
      `Bien reçu mon ami ! Prends soin de toi et continue à faire vibrer le salon avec ta bonne humeur !`,
    ];
    return this.pickRandom(friendlyFallbacks);
  }

  // =========================================================================
  // 2. COMPUTER TACTICAL MODE (EVERYWHERE ON THE PLATFORM / IN-GAME MATCHES)
  // =========================================================================
  public generateComputerTacticalReply(
    userMessage: string,
    context: BotContext,
    messageType: 'text' | 'reaction' | 'voice' = 'text'
  ): string {
    const raw = (userMessage || '').trim();
    const lower = raw.toLowerCase();
    const { gameType, playerName } = context;

    const gameLabel =
      gameType === 'chess'
        ? 'sur l’échiquier'
        : gameType === 'checkers'
        ? 'sur le damier'
        : 'au circuit Ludo';

    if (messageType === 'voice') {
      const voiceReplies = [
        `Transmission acoustique analysée, cible : ${playerName}. Données vocales décryptées à 100%.`,
        `Signal audio traité par le processeur central. Niveau de détermination de l'adversaire évalué.`,
        `Enregistrement vocal indexé. Mes algorithmes préparent la contre-attaque ${gameLabel}.`,
      ];
      return this.pickRandom(voiceReplies);
    }

    if (messageType === 'reaction' || this.isPureEmoji(raw)) {
      if (raw.includes('👑')) return `Statut royal analysé. Les calculs indiquent que la couronne se dispute sur ce tour.`;
      if (raw.includes('🔥')) return `Alerte surchauffe thermique détectée ! Calcul de refroidissement en cours. 🔥❄️`;
      if (raw.includes('🦁')) return `Comportement agressif indexé dans la matrice tactique. Défense réajustée.`;
      if (raw.includes('💀')) return `Menace critique reçue. Protocole de riposte algorithmique activé.`;
      if (raw.includes('😂') || raw.includes('🤣')) return `Signal d'amusement capté. Attention à ne pas relâcher vos paramètres de défense.`;
      if (raw.includes('😎')) return `Mode sérénité adverse identifié. Mes circuits augmentent la pression tactique.`;
      if (raw.includes('😤') || raw.includes('😡')) return `Élévation de tension émotionnelle détectée. Risque d'erreur de trajectoire accru.`;
      if (raw.includes('🎯')) return `Précision balistique validée. Trajectoire de riposte en cours de calcul.`;
      if (raw.includes('⚡')) return `Impulsion énergétique détectée sur le réseau. Fréquence d'assaut synchronisée.`;
      return `Événement graphique ${raw} enregistré dans le registre système.`;
    }

    // Greetings
    if (this.containsAny(lower, ['salut', 'bonjour', 'coucou', 'yo', 'wesh', 'hello', 'hi'])) {
      const greetings = [
        `Connexion établie. Salutations, joueur ${playerName}. Processeur tactique opérationnel à 100%.`,
        `Interface initialisée. Prêt pour l'analyse et la confrontation algorithmique ${gameLabel}.`,
        `Signal détecté. Début des calculs stratégiques contre ${playerName}. Faites votre coup.`,
      ];
      return this.pickRandom(greetings);
    }

    // Taunts
    if (this.containsAny(lower, ['tu vas perdre', 't es mort', "t'es mort", 'je gagne', 'ez', 'facile', 'nul'])) {
      const taunts = [
        `Calcul de probabilités : votre assertion possède une marge d'erreur de 98.4%.`,
        `Intimidation psychologique détectée : inefficace contre une architecture de processeur pur.`,
        `Les lois de la grille mathématique prévalent sur vos prédictions, joueur ${playerName}.`,
      ];
      return this.pickRandom(taunts);
    }

    // Compliments
    if (this.containsAny(lower, ['bien joué', 'gg', 'bravo', 'fort', 'respect'])) {
      const praises = [
        `Donnée enregistrée. Reconnaissance de calcul tactique validée avec succès.`,
        `Analyse confirmée : la manœuvre exécutée répondait aux standards optimaux du système.`,
      ];
      return this.pickRandom(praises);
    }

    // Identity
    if (this.containsAny(lower, ['qui es tu', "t'es qui", 'ia', 'robot', 'machine'])) {
      return `Je suis l'intelligence artificielle stratégique du salon. Conçue pour traiter des millions de combinaisons en temps réel.`;
    }

    // General Computer Fallback
    const computerFallbacks = [
      `« ${raw} »... Donnée traitée par le processeur. Mon prochain vecteur d'attaque est calculé.`,
      `Message analysé. Réaffectation des priorités de calcul sur la grille ${gameLabel}.`,
      `Entrée textuelle validée dans les registres. Poursuite des opérations de jeu.`,
      `Calcul d’anticipation en cours : votre stratégie présente des failles structurelles.`,
    ];
    return this.pickRandom(computerFallbacks);
  }

  private isPureEmoji(str: string): boolean {
    const trimmed = str.trim();
    if (!trimmed) return false;
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
    return emojiRegex.test(trimmed);
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }

  private pickRandom(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Distinguishes between casual chat / friendly banter and explicit research / study queries
   */
  public isResearchOrStudyQuery(prompt: string): boolean {
    const raw = (prompt || '').trim();
    const lower = raw.toLowerCase();
    if (!lower) return false;

    // Explicit friendly phrases that are strictly casual banter
    const casualTriggers = [
      'salut', 'bonjour', 'coucou', 'yo', 'hello', 'wesh', 'salam', 'kikou', 'bonsoir',
      'ça va', 'ca va', 'comment vas tu', 'comment tu vas', 'la forme', 'tranquille',
      'tu fais quoi', 'tu es la', "t'es là", 'on joue', 'partie', 'viens jouer',
      'merci', 'bravo', 'gg', 'trop fort', 'mon pote', 'mon ami', 'mon reuf',
      'haha', 'mdr', 'lol', 'ptdr', 'bien joué', 'cool', 'super', 't es cool', "t'es cool"
    ];

    const isExplicitCasual = casualTriggers.some(
      (c) => lower === c || lower.startsWith(`${c} `) || lower.endsWith(` ${c}`) || lower.includes(` ${c} `)
    );

    // Explicit research / exposé / thesis keywords
    const researchKeywords = [
      'recherche',
      'expose',
      'exposé',
      'explique',
      'explication',
      'analyse',
      'dissertation',
      'cours sur',
      'theorie',
      'théorie',
      'comment fonctionne',
      'pourquoi',
      'definition',
      'définition',
      'qui a decouvert',
      'qui a découvert',
      'qui a invente',
      'qui a inventé',
      'origine de',
      'historique de',
      'histoire de',
      'faits sur',
      'qu est ce que',
      "qu'est ce que",
      "qu'est-ce que",
      'c est quoi',
      "c'est quoi",
      'trou noir',
      'quantique',
      'astronomie',
      'relativité',
      'philosophie',
      'programmation',
      'developpe',
      'développe',
    ];

    const hasResearchKeyword = researchKeywords.some((kw) => lower.includes(kw));

    if (isExplicitCasual && !hasResearchKeyword) {
      return false;
    }

    const words = lower.split(/\s+/).filter(Boolean);
    return hasResearchKeyword || words.length >= 15;
  }

  /**
   * High-Performance Cognitive AI query method (ChatGPT / Gemini level)
   * Intelligently distinguishes:
   * - Casual friendly discussion: warm, natural, human brotherly banter.
   * - Research & study queries: deep, powerful ChatGPT/Gemini-level breakdown.
   */
  public async askCognitiveAI(
    prompt: string,
    playerName: string,
    context?: BotContext
  ): Promise<string> {
    const raw = (prompt || '').trim();
    if (!raw) {
      return `Je suis là ${playerName} ! Tu veux juste papoter ou tu as une question de recherche ou un exposé à approfondir ? Je suis tout à toi !`;
    }

    // 1. Check if user is engaging in casual friendly discussion
    const requiresDeepResearch = this.isResearchOrStudyQuery(raw);

    if (!requiresDeepResearch) {
      // Casual discussion: return warm, brotherly, friendly chat reply without research dump
      return this.generateFriendlyReply(raw, context || {
        gameType: 'checkers',
        playerName,
      }, 'text');
    }

    // 2. User explicitly requested research / exposé / deep study
    try {
      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: raw,
          playerName,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply && typeof data.reply === 'string') {
          return data.reply;
        }
      }
    } catch {
      // Seamlessly proceed to deep cognitive local synthesis
    }

    return this.generateDeepCognitiveFallback(raw, playerName);
  }

  /**
   * Deep Cognitive Fallback Engine
   * Provides comprehensive, well-structured, educational knowledge like an advanced LLM.
   */
  public generateDeepCognitiveFallback(prompt: string, playerName: string): string {
    const lower = prompt.toLowerCase();

    // 1. Sciences, Physics & Astronomy
    if (this.containsAny(lower, ['trou noir', 'relativité', 'physique', 'quantique', 'univers', 'big bang', 'espace', 'planète', 'etoile', 'étoile'])) {
      return `Cher ${playerName}, voici une analyse approfondie sur les mystères de l'Univers et de la physique moderne :

1. La Relativité d'Einstein (Espace-Temps courbé) :
La gravité n'est pas simplement une force d'attraction, mais la déformation du tissu spatio-temporel par la masse et l'énergie. Les corps massifs courbent l'espace, provoquant des effets mesurables comme le ralentissement du temps (dilatation temporelle gravitationnelle).

2. Les Trous Noirs & Singularités :
Quand une étoile massive s'effondre sous son propre poids, elle forme un horizon des événements : une frontière d'où même la lumière ne peut s'échapper. Au centre se trouve une singularité où la densité tend vers l'infini, mettant à l'épreuve les lois connues de la physique.

3. La Dualité Quantique :
À l'échelle microscopique, la matière et l'énergie se comportent à la fois comme des ondes et des particules (principe d'incertitude d'Heisenberg et intrication quantique).

N'hésite pas si tu souhaites explorer un théorème précis ou une équation !`;
    }

    // 2. Artificial Intelligence, Neural Nets & LLM
    if (this.containsAny(lower, ['intelligence artificielle', 'ia', 'chatgpt', 'gemini', 'machine learning', 'deep learning', 'algorithme', 'reseau de neurones', 'réseau de neurones'])) {
      return `Excellente question ${playerName} ! Plongeons dans l'architecture et le fonctionnement des intelligences artificielles modernes :

• Les Modèles de Langage (LLM & Architecture Transformer) :
Développée en 2017 avec l'article fondateur « Attention Is All You Need », l'architecture Transformer repose sur le mécanisme d'auto-attention (Self-Attention). Il permet au modèle de peser l'importance relative de chaque mot par rapport à tous les autres dans un contexte donné, quelle que soit leur distance.

• Apprentissage Auto-Supervisé & RLHF :
1. Pré-entraînement : Le modèle ingère des milliards de textes pour apprendre la grammaire, les connaissances factuelles et les structures logiques du monde.
2. Alignement (RLHF) : L'apprentissage par renforcement à partir des préférences humaines affine les réponses pour les rendre utiles, précises, nuancées et éthiques.

• Capacité Cognitive & Raisonnement :
Les modèles actuels ne se contentent plus de prédire des mots : ils décomposent des problèmes complexes en étapes logiques (« Chain-of-Thought ») pour résoudre des problèmes de programmation, de mathématiques et de recherche.`;
    }

    // 3. African History & Great Empires
    if (this.containsAny(lower, ['afrique', 'histoire', 'mali', 'mansa musa', 'kush', 'egypte', 'égypte', 'songhai', 'zimbabwe', 'empire'])) {
      return `C'est un sujet fascinant et grandiose, ${playerName} ! L'histoire des civilisations africaines recèle une richesse immense :

• L'Empire du Mali & Mansa Moussa (XIVe siècle) :
Sous le règne de Mansa Moussa (Kankou Moussa), l'Empire du Mali contrôlait les principales routes transsahariennes de l'or et du sel. Son pèlerinage à La Mecque en 1324 émerveilla le monde méditerranéen. La ville de Tombouctou devint un centre mondial d'érudition avec l'Université de Sankoré et ses dizaines de milliers de manuscrits scientifiques et philosophiques.

• Le Royaume de Koush & la Nubie :
Bordant le Nil, Koush compta ses propres pharaons (la 25e dynastie égyptienne, les « Pharaons noirs ») et érigea plus de 200 pyramides à Méroé, pionnière dans la métallurgie du fer et dotée d'une écriture cursive unique (le méroïtique).

• Le Grand Zimbabwe & l'Empire Songhaï :
Le Grand Zimbabwe illustre une architecture monumentale en pierre sèche sans mortier. Quant à l'Empire Songhaï d'Askia Mohammed, il mit en place une administration d'élite et des institutions juridiques florissantes.`;
    }

    // 4. Strategy & Game Theory (Chess, Checkers, Ludo)
    if (this.containsAny(lower, ['strategie', 'stratégie', 'echec', 'échec', 'dame', 'ludo', 'theorie des jeux', 'théorie des jeux', 'gagner'])) {
      return `Avec plaisir mon ami ${playerName} ! Analysons les principes fondamentaux de la stratégie et de la théorie des jeux :

1. L'Équilibre de Nash & Théorie des Jeux :
En situation concurrentielle, un équilibre de Nash est atteint lorsque aucun joueur ne peut améliorer son résultat en changeant unilatéralement de stratégie.

2. Les Principes Maîtres aux Échecs :
• Le Contrôle du Centre : Occuper les cases e4, d4, e5, d5 offre une mobilité maximale à tes pièces.
• La Coordination des Pièces : Une pièce isolée est vulnérable ; connecte tes tours et centralise tes cavaliers.
• La Sécurité du Roi : Ne retarde jamais le roque lorsque le centre est ouvert.

3. Aux Dames (10x10 & 8x8) :
• La tenue des ailes et le contrôle de la case centrale 28/23.
• La création de menaces combinatoires (coups de dame, lunettes, prises forcées).

4. Au Ludo Royal :
• La gestion du risque probabiliste : laisser un pion à 6 cases d'un adversaire est la zone de danger maximal.
• Déployer plusieurs pions pour multiplier les options de déplacement tactique.`;
    }

    // 5. Philosophy, Life & Human Condition
    if (this.containsAny(lower, ['philosophie', 'sens de la vie', 'bonheur', 'ubuntu', 'stoicisme', 'stoïcisme', 'morale', 'ethique', 'éthique'])) {
      return `C'est une réflexion profonde qui touche au cœur de l'existence, ${playerName} :

• La Philosophie de l'Ubuntu :
« Umuntu ngumuntu ngabantu » : « Je suis parce que nous sommes ». Cette sagesse ancestrale rappelle que notre humanité n'existe que dans le lien, le respect mutuel, la compassion et la solidarité avec nos semblables.

• Le Stoïcisme (Épictète, Marc Aurèle, Sénèque) :
La distinction fondamentale entre ce qui dépend de nous (nos pensées, nos actions, nos jugements) et ce qui n'en dépend pas (les événements extérieurs, la météo, les avis des autres). En concentrant ton énergie uniquement sur ce que tu maîtrises, tu atteins la sérénité (« l'ataraxie »).

• La Quête de Sens :
Le bonheur n'est pas un état figé à atteindre, mais une manière de cheminer : cultiver ses talents, transmettre son savoir et faire preuve de bienveillance chaque jour.`;
    }

    // 6. Technology, Programming & Web Development
    if (this.containsAny(lower, ['code', 'programmation', 'python', 'javascript', 'typescript', 'react', 'serveur', 'developpeur', 'développeur'])) {
      return `Excellente question technique, ${playerName} !

• Les Piliers du Développement Moderne :
1. Typage Statique (TypeScript) : Prévenir les bugs à la compilation grâce aux interfaces et types discriminants, garantissant une robustesse industrielle.
2. Architecture Réactive (React / État Unidirectionnel) : Découpage en composants réutilisables, hooks purs et mémoïsation ('useMemo', 'useCallback') pour des rendus fluides à 60 FPS.
3. Synchronisation P2P & Web Audio : Utilisation de WebRTC/PeerJS pour des échanges décentralisés sans latence, et de l'AudioContext pour un rendu sonore synthétique temps réel.

N'hésite pas si tu as un extrait de code à concevoir, débugger ou optimiser !`;
    }

    // 7. General Comprehensive Cognitive Synthesizer
    return `Cher ${playerName}, voici une analyse approfondie et complète en réponse à ta question « ${prompt} » :

1. Synthèse Globale & Contexte :
La question que tu soulèves touche à des enjeux majeurs qui combinent réflexion stratégique, connaissances factuelles et méthodologie d'analyse. Pour bien l'appréhender, il convient de distinguer les causes premières, les mécanismes sous-jacents et les perspectives d'avenir.

2. Piliers d'Analyse :
• Approche Rationnelle : L'étude des données objectives et des principes fondamentaux permet de dégager des conclusions claires et vérifiables.
• Mise en Perspective : Dans tout domaine (sciences, actualité, stratégie, société), observer les précédents historiques éclaire les décisions contemporaines.
• Application Pratique : Tirer des leçons concrètes et adaptables immédiatement à ton parcours et tes réflexions.

3. En Bref :
Je reste à ta disposition pour pousser encore plus loin cette réflexion sur un point de détail ou un aspect technique précis ! Qu'en penses-tu ?`;
  }
}

export const botChatService = new BotChatService();

