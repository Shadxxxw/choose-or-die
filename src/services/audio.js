// Web Audio API wrapper for procedural horror sounds

let audioContext = null;
let humOscillator = null;
let humGain = null;
let audioInitialized = false;

// Call this once after a user gesture (click, keypress, etc.)
export const initAudio = () => {
    if (audioInitialized) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        console.log('Audio initialized');
    } catch (e) {
        console.warn('AudioContext not supported');
    }
};

const ensureAudio = () => {
    if (!audioContext) return false;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return true;
};

export const playBackgroundHum = () => {
    if (!ensureAudio()) return;
    if (humOscillator) return; // Already playing

    humOscillator = audioContext.createOscillator();
    humGain = audioContext.createGain();

    humOscillator.type = 'sawtooth';
    humOscillator.frequency.value = 50; // Low frequency hum

    // Low pass filter to make it muffled
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    humOscillator.connect(filter);
    filter.connect(humGain);
    humGain.connect(audioContext.destination);

    humGain.gain.setValueAtTime(0.02, audioContext.currentTime); // Very quiet
    humOscillator.start();
};

export const playGlitchSound = () => {
    if (!ensureAudio()) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'square';
    // Random frequency between 100 and 2000
    osc.frequency.setValueAtTime(100 + Math.random() * 1000, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
};

export const playTypingSound = () => {
    if (!ensureAudio()) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // High pitched short blip
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);

    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.03);
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let currentSource = null;

export const playTTS = async (text) => {
    // Stop any currently playing TTS to avoid overlap
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) { /* ignore if already stopped */ }
        currentSource = null;
    }

    // Skip TTS if audio not initialized
    if (!ensureAudio()) {
        console.log('Audio not ready, skipping TTS');
        return Promise.resolve();
    }

    try {
        const response = await fetch(`${API_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            // TTS not available, silently skip
            console.log('TTS not available');
            return Promise.resolve();
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Advanced Audio Context playback for Reverb
        if (!ensureAudio()) return Promise.resolve();
        const audioBuffer = await fetch(url).then(res => res.arrayBuffer()).then(arr => audioContext.decodeAudioData(arr));

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 0.95; // Slight slow down

        // Reverb Effect (Impulse Response)
        // Simulating a dark room programmatically
        const convolver = audioContext.createConvolver();
        const rate = audioContext.sampleRate;
        const length = rate * 2.0; // 2 seconds reverb
        const impulse = audioContext.createBuffer(2, length, rate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 4); // Exponential decay
            impulseL[i] = (Math.random() * 2 - 1) * decay;
            impulseR[i] = (Math.random() * 2 - 1) * decay;
        }
        convolver.buffer = impulse;

        // Gain nodes for Wet/Dry mix
        const dryGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        dryGain.gain.value = 0.8; // Original voice
        wetGain.gain.value = 0.4; // Reverb tail

        source.connect(dryGain);
        dryGain.connect(audioContext.destination);

        // Source -> Convolver -> WetGain -> Dest
        source.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(audioContext.destination);

        return new Promise((resolve) => {
            currentSource = source; // Track current source
            source.onended = () => {
                if (currentSource === source) currentSource = null;
                resolve();
            };
            source.start();
        });
    } catch (e) {
        console.error("TTS Playback Error", e);
        return Promise.resolve(); // Resolve anyway on error to not block game
    }
};
