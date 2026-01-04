import React, { useState, useEffect } from 'react';
import Typewriter from './Typewriter';
import Glitch from './Glitch';
import { generateScenario } from '../services/openai';
import { playBackgroundHum, playGlitchSound, playTTS, initAudio } from '../services/audio';

const GameScreen = ({ user }) => {
    const [level, setLevel] = useState(1);
    const [corruption, setCorruption] = useState(0);
    const [gameState, setGameState] = useState('LOADING'); // LOADING, SCENARIO, CHOICE_PENDING, CONSEQUENCE, GAME_OVER
    const [currentScenario, setCurrentScenario] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingText, setLoadingText] = useState('INITIALIZING PSYCHE LINK...');
    const [statusGlitch, setStatusGlitch] = useState(null);

    // EASTER EGG: Hidden coordinates
    // 48.8566° N, 2.3522° E (Paris - Catacombs?)

    const hasInitialized = React.useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const savedState = localStorage.getItem('cod_gamestate');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setLevel(parsed.level);
                setCorruption(parsed.corruption);
                setHistory(parsed.history);
                setGameState(parsed.gameState);
                setCurrentScenario(parsed.currentScenario);
            } catch (e) {
                console.error("Save file corrupted");
                startGame();
            }
        } else {
            startGame();
        }

        const handleInteraction = () => {
            initAudio();
            playBackgroundHum();
        };
        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    // Random status bar glitch
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() < 0.1) {
                const glitches = [
                    "ERR_VOID_NULL",
                    "0xDEADBEEF",
                    "HELP",
                    "33.74, -112.63",
                    "DON'T LOOK",
                    "865-408-1212"
                ];
                setStatusGlitch(glitches[Math.floor(Math.random() * glitches.length)]);
                setTimeout(() => setStatusGlitch(null), 500);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (level > 1 || history.length > 0) {
            localStorage.setItem('cod_gamestate', JSON.stringify({
                level,
                corruption,
                history,
                gameState,
                currentScenario
            }));
        }
    }, [level, corruption, history, gameState, currentScenario]);

    const startGame = async () => {
        playGlitchSound();
        setGameState('LOADING');
        try {
            const seeds = [
                // Lieux urbains
                "Tu te réveilles enfermé dans un casier de morgue glacial.",
                "Tu es seul dans une rame de métro qui ne s'arrête plus.",
                "Tu trouves une porte inconnue dans ton propre couloir.",
                "Tu es bloqué dans un ascenseur en chute libre... qui ne touche jamais le sol.",
                "Tu reçois un SMS venant de ton propre numéro : 'Ne te retourne pas'.",
                "Tu erres dans un hôpital abandonné où les machines bipent encore.",
                "Tu es assis dans un cinéma vide, et le film à l'écran montre ta maison en direct.",
                "Tu es au volant sur une autoroute déserte, poursuivi par des phares éteints.",
                "Tu te réveilles dans une chambre d'hôtel que tu n'as jamais réservée.",
                "Tu es coincé dans un parking souterrain où les néons clignotent un message.",
                
                // Lieux naturels
                "Tu es perdu dans une forêt où les arbres semblent respirer.",
                "Tu marches sur une plage de nuit, et les vagues reculent... mais ne reviennent pas.",
                "Tu explores une grotte dont les parois sont couvertes de dessins qui te ressemblent.",
                "Tu es au milieu d'un champ de maïs, et quelque chose se rapproche dans les tiges.",
                
                // Maison/Appartement
                "Ton reflet dans le miroir a cessé de copier tes mouvements.",
                "Tu entends ta propre voix parler dans la pièce d'à côté.",
                "Ton chien fixe le coin vide du salon depuis trois heures.",
                "Tu trouves des photos de toi dormant, prises cette nuit, sur ton téléphone.",
                "La porte de ta cave est ouverte. Tu n'as pas de cave.",
                "Tu te réveilles et tous les meubles de ta chambre sont au plafond.",
                
                // Situations sociales étranges
                "Tout le monde dans le bus te fixe en souriant, sans cligner des yeux.",
                "Tu croises quelqu'un qui a exactement ton visage dans la rue.",
                "Ton meilleur ami t'appelle pour te dire qu'il est mort hier.",
                "Tu reçois une invitation à ton propre enterrement, daté de demain.",
                
                // Technologie
                "Ton ordinateur affiche une conversation que tu n'as jamais eue... avec toi-même.",
                "Ta caméra de surveillance montre quelqu'un debout derrière toi. Tu es seul.",
                "Ton GPS te guide vers une adresse qui n'existe sur aucune carte.",
                "Alexa répond à une question que tu n'as pas posée : 'Il arrive.'",
                
                // Travail/École
                "Tu te réveilles à ton bureau. Tes collègues disent que tu es mort il y a un an.",
                "L'école où tu travailles est vide, mais tu entends des enfants rire dans les murs."
            ];
            const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
            const introPrompt = `NOUVELLE PARTIE. Joueur: ${user ? user.displayName : 'Inconnu'}. 
CONTEXTE DE DÉPART: ${randomSeed}
Commence l'histoire avec ce contexte. Corruption à 0%, donc horreur SUBTILE uniquement.`;

            await loadScenario(introPrompt);
        } catch (error) {
            console.error(error);
            setLoadingText("CONNECTION FAILURE. RETRYING...");
        }
    };

    // Audio & State flow control
    useEffect(() => {
        const handleAudioFlow = async () => {
            if (!currentScenario) return;

            if (gameState === 'GAME_OVER' && currentScenario.consequence) {
                // Play death narration
                const text = currentScenario.consequence.replace(/[*_]/g, '').replace(/\[GAME OVER\]/gi, '');
                await playTTS(text);
            }
            else if (gameState === 'SHOW_CONSEQUENCE' && currentScenario.consequence) {
                const text = currentScenario.consequence.replace(/[*_]/g, '');
                // Wait for audio to finish before moving to next state
                await playTTS(text);
                // Little pause after speaking
                setTimeout(() => setGameState('SHOW_SCENARIO'), 500);
            }
            else if (gameState === 'SHOW_SCENARIO' && currentScenario.scenario) {
                const text = currentScenario.scenario.replace(/[*_]/g, '');
                playTTS(text); // No need to await here, choices will appear when Typewriter finishes
            }
        };

        handleAudioFlow();
    }, [gameState, currentScenario]);

    const loadScenario = async (prompt) => {
        setLoadingText("GENERATING NIGHTMARE...");
        try {
            const response = await generateScenario(prompt, history, level, corruption);

            if (response.data) {
                setCurrentScenario(response.data);

                // Check for GAME OVER in raw response
                if (response.raw && response.raw.includes('[GAME OVER]')) {
                    setGameState('GAME_OVER');
                } else if (response.data.consequence) {
                    setGameState('SHOW_CONSEQUENCE');
                } else {
                    setGameState('SHOW_SCENARIO');
                }

            } else {
                throw new Error("Invalid Format");
            }
        } catch (e) {
            console.error(e);
            setLoadingText("FATAL ERROR. REBOOTING...");
            setTimeout(() => startGame(), 3000);
        }
    };

    const handleChoice = (choiceId) => {
        playGlitchSound();
        setGameState('LOADING'); // Switch to LOADING immediately to hide old content
        setCurrentScenario(null); // Clear content to ensure black screen

        const choice = currentScenario.choices.find(c => c.id === choiceId);

        const newHistory = [
            ...history,
            { role: 'assistant', content: `[SCENARIO]: ${currentScenario.scenario}` },
            { role: 'user', content: `Je choisis l'option ${choiceId}: ${choice.text}. Quelle est la conséquence et la suite ?` }
        ];
        setHistory(newHistory);

        const corruptionGain = Math.floor(Math.random() * 15) + 5;
        const newCorruption = Math.min(100, corruption + corruptionGain);
        setCorruption(newCorruption);
        setLevel(prev => prev + 1);

        let nextPrompt;
        
        // Si corruption atteint 100%, forcer la mort
        if (newCorruption >= 100) {
            nextPrompt = `ACTION JOUEUR: J'ai choisi l'option ${choiceId} ("${choice.text}").
LA CORRUPTION A ATTEINT 100%. TU DOIS MAINTENANT TUER LE JOUEUR.
Décris comment ce choix mène à sa MORT HORRIBLE en [CONSEQUENCE].
Termine par [GAME OVER]. PAS de choix.`;
        } else {
            nextPrompt = `ACTION JOUEUR: J'ai choisi l'option ${choiceId} ("${choice.text}").
Décris la CONSÉQUENCE immédiate puis enchaîne sur le SCENARIO suivant.
RAPPEL: Termine TOUJOURS par [CHOIX 1] et [CHOIX 2].`;
        }

        loadScenario(nextPrompt);
    };

    // Early return removed to keep Status Bar visible
    // if (gameState === 'LOADING') { ... }

    return (
        <div className="game-screen" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--terminal-green)' }}>
                <span>SUBJECT: {user?.displayName || 'UNKNOWN'}</span>
                <span>LVL: {level}</span>
                <span style={{ color: corruption > 50 ? 'red' : 'inherit' }}>
                    {statusGlitch ? statusGlitch : `CORRUPTION: ${corruption}%`}
                </span>
                <button
                    onClick={() => {
                        if (window.confirm("RESET PROTOCOL? THIS CANNOT BE UNDONE.")) {
                            localStorage.removeItem('cod_gamestate');
                            setLevel(1);
                            setCorruption(0);
                            setHistory([]);
                            setCurrentScenario(null);
                            setGameState('LOADING');
                            setTimeout(() => startGame(), 100);
                        }
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    [RESET]
                </button>
            </div>

            <div className="scenario-text" style={{ minHeight: '200px', marginBottom: '40px', whiteSpace: 'pre-wrap' }}>
                {gameState === 'LOADING' && (
                    <div className="game-center" style={{ marginTop: '50px' }}>
                        <Glitch active={true}>PROCESSING_NIGHTMARE...</Glitch>
                    </div>
                )}
                {gameState === 'SHOW_CONSEQUENCE' && currentScenario?.consequence && (
                    <div style={{ color: '#ff4444' }}> {/* Red for consequence */}
                        <Typewriter
                            key={`cons-${level}`}
                            text={currentScenario.consequence}
                            delay={30}
                        // No action needed on complete, audio drives the state change now
                        />
                    </div>
                )}

                {gameState === 'GAME_OVER' && (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                        {currentScenario?.consequence && (
                            <div style={{ color: '#ff4444', marginBottom: '30px', textAlign: 'left' }}>
                                <Typewriter
                                    key="death-consequence"
                                    text={currentScenario.consequence}
                                    delay={30}
                                />
                            </div>
                        )}
                        <h1 style={{ color: 'red', fontSize: '4rem', textShadow: '0 0 20px red' }}>GAME OVER</h1>
                        <p style={{ color: '#aaa' }}>CORRUPTION: 100% - SIGNAL PERDU</p>
                        <button
                            onClick={() => {
                                localStorage.removeItem('cod_gamestate');
                                setLevel(1);
                                setCorruption(0);
                                setHistory([]);
                                setCurrentScenario(null);
                                setGameState('LOADING');
                                // Force new game with fresh state
                                setTimeout(() => startGame(), 100);
                            }}
                            style={{
                                background: 'transparent',
                                border: '2px solid red',
                                color: 'red',
                                padding: '20px 40px',
                                fontSize: '1.5rem',
                                marginTop: '30px',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                            }}
                            className="hover-glitch"
                        >
                            RECOMMENCER
                        </button>
                    </div>
                )}

                {(gameState === 'SHOW_SCENARIO' || gameState === 'CHOICE_PENDING') && currentScenario?.scenario && (
                    <Typewriter
                        key={`scen-${level}`}
                        text={currentScenario.scenario}
                        delay={30}
                        onComplete={() => setGameState('CHOICE_PENDING')}
                    />
                )}
            </div>

            {gameState === 'CHOICE_PENDING' && (
                <div className="choices">
                    {currentScenario.choices.map((choice) => (
                        <button
                            key={choice.id}
                            onClick={() => handleChoice(choice.id)}
                            className="choice-btn"
                            style={{
                                display: 'block',
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid var(--terminal-green)',
                                color: 'var(--terminal-green)',
                                padding: '15px',
                                marginBottom: '10px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '1.1rem'
                            }}
                        >
                            [{choice.id}] <span dangerouslySetInnerHTML={{ __html: choice.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>') }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GameScreen;
