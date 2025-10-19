'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  onGameStateChange?: (gameState: any) => void;
  isGuest?: boolean;
}

export default function Terminal({ onGameStateChange, isGuest = false }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    initializeTerminal();
    initializeWebSocket();

    return () => {
      cleanup();
    };
  }, []);

  const initializeTerminal = () => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new XTerm({
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00',
        cursor: '#00ff00',
        selection: '#ffffff40',
        black: '#000000',
        red: '#ff0000',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#0000ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#404040',
        brightRed: '#ff4040',
        brightGreen: '#40ff40',
        brightYellow: '#ffff40',
        brightBlue: '#4040ff',
        brightMagenta: '#ff40ff',
        brightCyan: '#40ffff',
        brightWhite: '#ffffff'
      },
      fontFamily: 'Courier New, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Mount terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    terminal.onData(handleTerminalInput);

    // Initial welcome message
    terminal.writeln('\x1b[1;32mWelcome to Daggerheart MUD!\x1b[0m');
    terminal.writeln('\x1b[33mType "help" for available commands or "create character" to begin.\x1b[0m');
    terminal.writeln('');

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const initializeWebSocket = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
      writeToTerminal('\x1b[32mConnected to game server!\x1b[0m\r\n');
      
      // Join game
      socket.emit('join_game', { 
        userId: isGuest ? null : 'user123', // TODO: Get from auth
        isGuest 
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      writeToTerminal('\x1b[31mDisconnected from game server!\x1b[0m\r\n');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      writeToTerminal(`\x1b[31mConnection error: ${error.message}\x1b[0m\r\n`);
    });

    // Game events
    socket.on('game_joined', (data) => {
      console.log('Game joined:', data);
      setGameState(data.gameState);
      onGameStateChange?.(data.gameState);
      writeToTerminal('\x1b[32mGame session started!\x1b[0m\r\n');
    });

    socket.on('game_message', (data) => {
      writeToTerminal(`\x1b[36m${data.message}\x1b[0m\r\n`);
    });

    socket.on('command_response', (data) => {
      if (data.success) {
        writeToTerminal(`\x1b[33m${data.message}\x1b[0m\r\n`);
      } else {
        writeToTerminal(`\x1b[31m${data.message}\x1b[0m\r\n`);
      }
    });

    socket.on('character_created', (data) => {
      writeToTerminal(`\x1b[32mCharacter created: ${data.character.name}\x1b[0m\r\n`);
      setGameState(prev => ({ ...prev, character: data.character }));
      onGameStateChange?.({ ...gameState, character: data.character });
    });

    socket.on('campaign_created', (data) => {
      writeToTerminal(`\x1b[32mCampaign created: ${data.campaign.title}\x1b[0m\r\n`);
      setGameState(prev => ({ ...prev, campaign: data.campaign }));
      onGameStateChange?.({ ...gameState, campaign: data.campaign });
    });

    socket.on('combat_started', (data) => {
      writeToTerminal(`\x1b[31mCombat has begun!\x1b[0m\r\n`);
      setGameState(prev => ({ ...prev, combat: data.combat }));
      onGameStateChange?.({ ...gameState, combat: data.combat });
    });

    socket.on('error', (data) => {
      writeToTerminal(`\x1b[31mError: ${data.message}\x1b[0m\r\n`);
    });

    // Keep-alive ping
    socket.on('pong', () => {
      // Connection is alive
    });
  };

  const handleTerminalInput = (data: string) => {
    if (!socketRef.current || !isConnected) {
      writeToTerminal('\x1b[31mNot connected to game server!\x1b[0m\r\n');
      return;
    }

    // Handle special keys
    if (data === '\r') {
      // Enter key - process command
      const currentLine = getCurrentLine();
      if (currentLine.trim()) {
        processCommand(currentLine.trim());
        writeToTerminal('\r\n');
      } else {
        writeToTerminal('\r\n');
      }
    } else if (data === '\x7f') {
      // Backspace
      writeToTerminal('\b \b');
    } else if (data >= ' ') {
      // Printable characters
      writeToTerminal(data);
    }
  };

  const getCurrentLine = (): string => {
    // This is a simplified implementation
    // In a real implementation, you'd track the current input line
    return '';
  };

  const processCommand = (command: string) => {
    if (!socketRef.current) return;

    // Echo the command
    writeToTerminal(`\x1b[37m> ${command}\x1b[0m\r\n`);

    // Send command to server
    socketRef.current.emit('player_command', { command });
  };

  const writeToTerminal = (text: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(text);
    }
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }
  };

  return (
    <div className="terminal-container">
      <div 
        ref={terminalRef} 
        className="terminal"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px'
        }}
      />
      <div className="terminal-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </span>
      </div>
    </div>
  );
}
