const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const generateScenario = async (prompt, history, level, corruption) => {
    try {
        const response = await fetch(`${API_URL}/generate-scenario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, history, level, corruption }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
