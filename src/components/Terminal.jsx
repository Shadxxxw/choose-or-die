import React, { useState, useEffect, useRef } from 'react';
import '../styles/terminal.css';

const Terminal = ({ children }) => {
    return (
        <div className="crt-container">
            <div className="scanlines"></div>
            <div className="flicker"></div>
            <div className="screen">
                {children}
            </div>
        </div>
    );
};

export default Terminal;
