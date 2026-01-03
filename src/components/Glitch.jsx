import React from 'react';
import '../styles/terminal.css';

const Glitch = ({ children, active }) => {
    if (!active) return children;

    return (
        <div className="glitch-wrapper">
            <div className="glitch-text" data-text={children}>
                {children}
            </div>
            <style>{`
        .glitch-wrapper {
          position: relative;
          display: inline-block;
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 red;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim-1 5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -1px 0 blue;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim-2 5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip: rect(20px, 9999px, 80px, 0); }
          20% { clip: rect(60px, 9999px, 10px, 0); }
          40% { clip: rect(10px, 9999px, 90px, 0); }
          60% { clip: rect(90px, 9999px, 5px, 0); }
          80% { clip: rect(30px, 9999px, 40px, 0); }
          100% { clip: rect(50px, 9999px, 20px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(90px, 9999px, 5px, 0); }
          20% { clip: rect(20px, 9999px, 80px, 0); }
          40% { clip: rect(50px, 9999px, 20px, 0); }
          60% { clip: rect(10px, 9999px, 90px, 0); }
          80% { clip: rect(60px, 9999px, 10px, 0); }
          100% { clip: rect(30px, 9999px, 40px, 0); }
        }
      `}</style>
        </div>
    );
};

export default Glitch;
