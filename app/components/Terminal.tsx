'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface TerminalProps {
  isGuest: boolean;
  onLogout: () => void;
  totalChapters?: number;
  onGameStateChange?: (gameState: any) => void;
}

export default function Terminal({ isGuest, onLogout, totalChapters = 10, onGameStateChange }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [terminal, setTerminal] = useState<any>(null);

  useEffect(() => {
    // Dynamically import xterm only on client side
    const initTerminal = async () => {
      try {
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');
        
        const term = new Terminal({
          theme: {
            background: '#1a1a1a',
            foreground: '#00ff00',
            cursor: '#00ff00',
          },
          fontFamily: 'Courier New, monospace',
          fontSize: 14,
          rows: 30,
          cols: 80,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        if (terminalRef.current) {
          term.open(terminalRef.current);
          fitAddon.fit();
          setTerminal(term);
        }
      } catch (error) {
        console.error('Failed to load terminal:', error);
      }
    };

    initTerminal();
  }, []);

  // Add your socket connection logic here
  useEffect(() => {
    // Socket connection logic
  }, []);

  // Add your game state management here
  useEffect(() => {
    if (onGameStateChange && gameState) {
      onGameStateChange(gameState);
    }
  }, [gameState, onGameStateChange]);

  // IMPORTANT: Return JSX
  return (
    <div className="terminal-container">
      <div ref={terminalRef} className="terminal-display" />
      {/* Add any other UI elements you need */}
    </div>
  );
}