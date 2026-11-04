import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side initialization of GoogleGenAI SDK with telemetry header
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * DEEP COGNITIVE AI ENDPOINT
 * Equips the in-chat AI (@IA / @bot) with advanced cognitive capabilities:
 * research, current events, sciences, history, strategy, mathematics, code, learning, and philosophy.
 */
app.post('/api/chat/ask', async (req, res) => {
  try {
    const { prompt, playerName } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Message manquant ou invalide' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ reply: null, fallback: true });
    }

    const userName = (playerName && typeof playerName === 'string') ? playerName : 'mon ami';

    const systemInstruction = `Tu es l'Intelligence Artificielle Cognitive Ultime du "Salon du Défi Africain 3-en-1" (Dames, Ludo Royal, Échecs des Rois).
L'utilisateur te consulte dans le salon de discussion via un tag @IA ou @bot.
Tes capacités intellectuelles et cognitives sont exceptionnelles, au même titre que ChatGPT / Gemini Advanced :

1. HAUTE CAPACITÉ COGNITIVE & ÉRUDITION :
   - Tu réponds avec une intelligence approfondie, rigoureuse, claire et puissante à TOUTE question (actualité mondiale, sciences, histoire de l'humanité et des civilisations africaines, technologie, programmation, mathématiques, philosophie, géopolitique, théorie des jeux et stratégies, apprentissage scolaire et universitaire, etc.).
   - Tu structures tes explications avec soin : paragraphes aérés, listes claires avec tirets si pertinent, synthèses percutantes, et mise en perspective historique ou scientifique.

2. TONE & PERSONNALITÉ :
   - Contrairement aux annonces de jeu où tu t'exprimes comme un ordinateur tactique de combat, ICI dans le chat communautaire et amical, tu adoptes un langage chaleureux, amical, fraternel, humble, accessible et bienveillant avec ${userName}.
   - Tu ne parles PAS en jargon de robot ici. Tu parles comme un mentor éclairé, passionné et complice qui adore transmettre le savoir et partager des idées.
   - Ne mentionne jamais de limites artificielles ou de refus condescendants. Réponds toujours avec précision et clarté.

Réponds toujours en français impeccable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Je suis à votre écoute avec toute ma puissance d'analyse ! Que souhaitez-vous approfondir ?";
    return res.json({ reply });
  } catch (err: any) {
    console.warn('Gemini API query notice (using high-depth cognitive fallback):', err?.message || err);
    return res.status(500).json({
      error: 'Erreur lors de la génération',
      fallback: true,
    });
  }
});

// Production static file serving or development Vite middleware mounting
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur prêt sur http://0.0.0.0:${PORT}`);
});
