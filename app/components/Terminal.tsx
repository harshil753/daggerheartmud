'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface TerminalProps {
  isGuest: boolean;
  onLogout: () => void;
  totalChapters?: number;
}

export default function Terminal({ isGuest, onLogout, totalChapters = 10 }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [terminal, setTerminal] = useState<any>(null);

  useEffect(() => {
    // Dynamically import xterm only on client side
    const initTerminal = async () => {
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
    };

    initTerminal();
  }, []);

  // Rest of your component logic...
  // (socket connection, game state management, etc.)
}