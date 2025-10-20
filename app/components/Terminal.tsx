'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

interface TerminalProps {
  onGameStateChange: (gameState: any) => void;
  isGuest?: boolean;
  onLogout?: () => void;
  onConnectionChange: (connected: boolean) => void;
}

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

export default function Terminal({ 
  onGameStateChange, 
  isGuest = false, 
  onLogout,
  onConnectionChange 
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const terminalInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (socketRef.current) {
      return;
    }

    // Load jQuery and jQuery Terminal dynamically
    const loadJQueryTerminal = async () => {
      if (typeof window === 'undefined') return;

      // Load jQuery
      if (!window.$) {
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        jqueryScript.onload = () => {
          // Load jQuery Terminal
          const terminalScript = document.createElement('script');
          terminalScript.src = 'https://cdn.jsdelivr.net/npm/jquery.terminal@2.35.0/js/jquery.terminal.min.js';
          terminalScript.onload = () => {
            initializeTerminal();
          };
          document.head.appendChild(terminalScript);

          // Load jQuery Terminal CSS
          const terminalCSS = document.createElement('link');
          terminalCSS.rel = 'stylesheet';
          terminalCSS.href = 'https://cdn.jsdelivr.net/npm/jquery.terminal@2.35.0/css/jquery.terminal.min.css';
          document.head.appendChild(terminalCSS);
        };
        document.head.appendChild(jqueryScript);
      } else {
        initializeTerminal();
      }
    };

    const initializeTerminal = () => {
      if (!terminalRef.current || !window.$) return;

      // Prevent multiple connections
      if (socketRef.current && socketRef.current.connected) {
        console.log('Socket already connected, skipping initialization');
        return;
      }

      // Initialize WebSocket connection
      const socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      socketRef.current = socket;

      let connectionTimeout: NodeJS.Timeout;

      socket.on('connect', () => {
        console.log('Connected to game server');
        onConnectionChange(true);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from game server:', reason);
        onConnectionChange(false);
        
        // Only attempt to reconnect if it wasn't a manual disconnect
        if (reason !== 'io client disconnect') {
          connectionTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            socket.connect();
          }, 5000);
        }
      });

      socket.on('connect_error', (error) => {
        console.log('Connection error:', error);
        onConnectionChange(false);
      });

      socket.on('gameState', (gameState) => {
        onGameStateChange(gameState);
      });

      socket.on('gameOutput', (data) => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              // Apply ANSI color formatting if needed
              if (data.color) {
                div.css('color', data.color);
              }
            }
          });
        }
      });

      // Initialize jQuery Terminal
      const terminal = window.$(terminalRef.current).terminal(
        (command: string) => {
          if (command.trim()) {
            // Handle special commands locally
            if (command.trim().toLowerCase() === 'logout' && onLogout) {
              terminal.echo('Logging out...');
              socket.disconnect();
              onLogout();
              return;
            }
            
            if (command.trim().toLowerCase() === 'quit') {
              terminal.echo('Goodbye!');
              socket.disconnect();
              if (onLogout) {
                onLogout();
              }
              return;
            }

            // Send command to server
            socket.emit('playerCommand', {
              command: command.trim(),
              isGuest: isGuest
            });
          }
        },
        {
          greetings: isGuest 
            ? 'Welcome to Daggerheart MUD (Guest Mode)\nType "help" for available commands.'
            : 'Welcome to Daggerheart MUD\nType "help" for available commands.',
          prompt: '> ',
          name: 'daggerheart',
          height: '100%',
          width: '100%',
          checkArity: false,
          completion: (command: string, callback: (matches: string[]) => void) => {
            // Basic command completion
            const commands = [
              'look', 'move', 'north', 'south', 'east', 'west', 'up', 'down',
              'inventory', 'stats', 'attack', 'defend', 'cast', 'use', 'equip',
              'unequip', 'save', 'rest', 'help', 'quit', 'logout'
            ];
            const matches = commands.filter(cmd => 
              cmd.toLowerCase().startsWith(command.toLowerCase())
            );
            callback(matches);
          }
        }
      );

      terminalInstanceRef.current = terminal;

      // Handle connection status
      const updateConnectionStatus = (connected: boolean) => {
        const statusClass = connected ? 'connected' : 'disconnected';
        terminal.set_prompt(`[${statusClass}] > `);
      };

      socket.on('connect', () => updateConnectionStatus(true));
      socket.on('disconnect', () => updateConnectionStatus(false));

      // Cleanup function
      return () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        if (socket) {
          socket.disconnect();
        }
        if (terminal) {
          terminal.destroy();
        }
      };
    };

    loadJQueryTerminal();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.destroy();
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="terminal-container">
      <div className="terminal-status">
        <span className="status-indicator disconnected">Disconnected</span>
      </div>
      <div ref={terminalRef} className="terminal" />
    </div>
  );
}
