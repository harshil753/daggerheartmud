'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface TerminalProps {
  isGuest: boolean;
  onLogout: () => void;
  totalChapters?: number;
  onGameStateChange?: (gameState: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function Terminal({ isGuest, onLogout, totalChapters = 10, onGameStateChange, onConnectionChange }: TerminalProps) {
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

  // Socket connection logic
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
      onConnectionChange?.(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    socket.on('gameState', (data) => {
      setGameState(data);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Add your game state management here
  useEffect(() => {
    if (onGameStateChange && gameState) {
      onGameStateChange(gameState);
    }
  }, [gameState]); // Remove onGameStateChange dependency to prevent infinite loop

  // IMPORTANT: Return JSX
  return (
    <div className="terminal-container">
      <div ref={terminalRef} className="terminal-display" />
      {/* Add any other UI elements you need */}
    </div>
  );
}