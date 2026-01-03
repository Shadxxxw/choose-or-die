import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
const port = process.env.PORT || 3000;

// CORS pour accepter les requêtes de Vercel
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1"
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Choose or Die Backend Online' });
});

const SYSTEM_PROMPT = `
Tu es le narrateur d'un jeu d'horreur psychologique "Choose or Die". Le joueur peut MOURIR.

=== RÈGLES DE MORT ET FIN DE PARTIE ===
- Si corruption >= 100% : Le joueur MEURT. Décris sa mort horrible et termine par [GAME OVER].
- Les mauvais choix DOIVENT avoir des conséquences graves.
- À haute corruption (>70%), certains choix peuvent tuer directement le joueur.
- Ne fais PAS tourner l'histoire en rond.

=== PROGRESSION DE L'HORREUR ===
- 0-20% : Malaise subtil. Bruits, ombres, sentiment d'être observé. Réaliste.
- 21-40% : Phénomènes étranges. Objets qui bougent, reflets décalés, voix lointaines.
- 41-60% : Surnaturel visible. Apparitions, environnement qui se déforme.
- 61-80% : Horreur totale. Créatures, body horror, danger de mort imminent.
- 81-100% : Fin proche. Chaque choix peut être fatal.

=== INTERDICTIONS ABSOLUES ===
- NE JAMAIS écrire "[CORRUPTION" dans ta réponse
- NE JAMAIS mentionner de pourcentage
- NE JAMAIS oublier les choix

=== FORMAT OBLIGATOIRE ===
[CONSEQUENCE] : <1-2 phrases, résultat du choix précédent>
[SCENARIO] : <2-3 phrases MAX, situation actuelle>
[CHOIX 1] : <Action courte>
[CHOIX 2] : <Action courte>

RAPPEL: Tu DOIS écrire [CHOIX 1] et [CHOIX 2]. TOUJOURS. SANS EXCEPTION.
`;

const parseScenario = (text) => {
    console.log("--- RAW MISTRAL RESPONSE ---");
    console.log(text);
    console.log("---------------------------");

    const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/__/g, '')
        .replace(/É/g, 'E')
        .replace(/È/g, 'E')
        .replace(/—/g, '-')
        .replace(/\*\([^*]*\)\*/g, '')
        .replace(/\([^(]*\)\s*$/g, '')
        .replace(/\[CORRUPTION[^\]]*\]/gi, '')
        .replace(/CORRUPTION\s*:\s*\+?\-?\d+%?/gi, '');

    const scenarioMatch = cleanText.match(/(?:\[?SCENARIO\]?|SCENARIO)\s*:?\s*(.*?)(?=\[?CHOIX|CHOIX|$)/is);
    const choice1Match = cleanText.match(/(?:\[?CHOIX\s*1\]?|CHOIX\s*1)\s*:?\s*(.*?)(?=\[?CHOIX|CHOIX|\[?CONSEQUENCE|CONSEQUENCE|$)/is);
    const choice2Match = cleanText.match(/(?:\[?CHOIX\s*2\]?|CHOIX\s*2)\s*:?\s*(.*?)(?=\[?CONSEQUENCE|CONSEQUENCE|$)/is);
    const consequenceMatch = cleanText.match(/(?:\[?CONSEQUENCE\]?|CONSEQUENCE)\s*:?\s*(.*?)(?=\[?SCENARIO|SCENARIO|\[?CHOIX|CHOIX|$)/is);

    let scenarioText = "Erreur de décodage du cauchemar...";
    if (scenarioMatch) {
        scenarioText = scenarioMatch[1].trim();
    } else if (text.length > 20 && !choice1Match) {
        scenarioText = text.trim();
    }

    return {
        scenario: scenarioText,
        choices: [
            { id: 1, text: choice1Match ? choice1Match[1].trim() : "Continuer..." },
            { id: 2, text: choice2Match ? choice2Match[1].trim() : "Fuir..." }
        ],
        consequence: consequenceMatch ? consequenceMatch[1].trim() : null
    };
};

// TTS via Mistral API (ou fallback Web Speech)
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text required' });
    }

    try {
        // Utiliser l'API TTS de Mistral
        const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-tts-latest',
                input: text,
                voice: 'echo' // voix grave/sombre
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Mistral TTS error:', error);
            return res.status(503).json({ error: 'TTS unavailable' });
        }

        // Renvoyer l'audio directement
        res.set('Content-Type', 'audio/mpeg');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: 'TTS failed' });
    }
});

app.post('/api/generate-scenario', async (req, res) => {
    try {
        const { prompt, history, level, corruption } = req.body;

        let intensityReminder = "";
        let deathInstruction = "";
        
        if (corruption >= 100) {
            deathInstruction = "INSTRUCTION CRITIQUE: La corruption est à 100%. Le joueur DOIT MOURIR. Décris sa mort horrible en [CONSEQUENCE], puis écris [GAME OVER]. PAS de choix.";
        } else if (corruption >= 85) {
            intensityReminder = "DANGER MORTEL. Le prochain mauvais choix peut être FATAL.";
        } else if (corruption >= 70) {
            intensityReminder = "Horreur totale, la mort approche.";
        } else if (corruption >= 50) {
            intensityReminder = "Surnaturel assumé, danger réel.";
        } else if (corruption >= 30) {
            intensityReminder = "Phénomènes étranges, tension croissante.";
        } else {
            intensityReminder = "Horreur SUBTILE. Pas de créatures.";
        }

        const contextMessage = corruption >= 100
            ? deathInstruction
            : `Niveau ${level}/10. Corruption: ${corruption}%. ${intensityReminder} ÉCRIS [CHOIX 1] ET [CHOIX 2].`;

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: contextMessage },
            ...history,
            { role: "user", content: prompt }
        ];

        const response = await openai.chat.completions.create({
            model: "mistral-large-latest",
            messages: messages,
            temperature: 0.9,
        });

        const rawText = response.choices[0].message.content;
        const structuredData = parseScenario(rawText);

        res.json({ raw: rawText, data: structuredData });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to generate scenario' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
