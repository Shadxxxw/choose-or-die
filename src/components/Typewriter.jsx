import React, { useState, useEffect, useRef } from 'react';
import { playTypingSound } from '../services/audio';

// Helper to sanitize and parse simple markdown to HTML
const parseMarkdown = (text) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>')     // Italic
        .replace(/\n/g, '<br/>');                // Line breaks
    return html;
};

const Typewriter = ({ text, delay = 50, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const indexRef = useRef(0);
    const timeoutRef = useRef(null);
    const hasCompletedRef = useRef(false);

    // Reset when text changes
    useEffect(() => {
        setDisplayedContent('');
        indexRef.current = 0;
        hasCompletedRef.current = false;

        // Start typing
        typeCharacter();

        return () => clearTimeout(timeoutRef.current);
    }, [text]);

    const typeCharacter = () => {
        if (indexRef.current < text.length) {
            const nextChar = text[indexRef.current];
            const currentSubString = text.substring(0, indexRef.current + 1);

            setDisplayedContent(parseMarkdown(currentSubString));
            playTypingSound();

            indexRef.current += 1;

            // Randomize delay slightly for realism
            const randomDelay = delay + (Math.random() * 20 - 10);
            timeoutRef.current = setTimeout(typeCharacter, randomDelay);
        } else {
            if (!hasCompletedRef.current && onComplete) {
                hasCompletedRef.current = true;
                onComplete();
            }
        }
    };

    return <span dangerouslySetInnerHTML={{ __html: displayedContent }} />;
};

export default Typewriter;
