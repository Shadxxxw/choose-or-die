import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { initAudio } from '../services/audio';
import Typewriter from './Typewriter';

const LoginScreen = ({ onLogin }) => {
    const [error, setError] = useState(null);

    const handleLogin = async () => {
        // Initialize audio on user gesture
        initAudio();
        
        try {
            const user = await signInWithGoogle();
            onLogin(user);
        } catch (err) {
            setError("AUTHENTICATION FAILED. ACCESS DENIED.");
        }
    };

    return (
        <div className="login-container" style={{ textAlign: 'center', marginTop: '20vh' }}>
            <h1>
                <Typewriter text="CHOOSE OR DIE" delay={100} />
            </h1>
            <p>
                <Typewriter text="SECURE CONNECTION REQUIRED..." delay={50} />
            </p>
            <br />
            <button
                onClick={handleLogin}
                style={{
                    background: 'transparent',
                    color: 'var(--terminal-green)',
                    border: '2px solid var(--terminal-green)',
                    padding: '10px 20px',
                    fontFamily: 'inherit',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    textShadow: '0 0 5px var(--terminal-green)',
                    boxShadow: '0 0 5px var(--terminal-green)'
                }}
                className="hover-glitch"
            >
                &gt; INITIATE LOGIN SEQUENCE
            </button>

            {error && (
                <p style={{ color: 'red', marginTop: '20px' }} className="blink">
                    {error}
                </p>
            )}
        </div>
    );
};

export default LoginScreen;
