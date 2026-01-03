import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';
import './styles/terminal.css';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Terminal><div style={{ padding: '2rem' }}>INITIALIZING SECURITY PROTOCOLS...</div></Terminal>;

  return (
    <Terminal>
      {!user ? (
        <LoginScreen onLogin={setUser} />
      ) : (
        <GameScreen user={user} />
      )}
    </Terminal>
  );
}

export default App;
