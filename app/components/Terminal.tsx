'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

interface TerminalProps {
  onGameStateChange: (gameState: any) => void;
  isGuest?: boolean;
  onLogout?: () => void;
  onConnectionChange: (connected: boolean) => void;
  onMapUpdate?: (mapData: any) => void;
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
  onConnectionChange,
  onMapUpdate
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const terminalInstanceRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [autoScroll, setAutoScroll] = useState(true);

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
      const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      socketRef.current = socket;

      let connectionTimeout: NodeJS.Timeout;

      socket.on('connect', () => {
        console.log('Connected to game server');
        setIsConnected(true);
        onConnectionChange(true);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        
        // Join the game session
        socket.emit('join_game', {
          userId: isGuest ? `guest_${Date.now()}` : 'user',
          isGuest: isGuest
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from game server:', reason);
        setIsConnected(false);
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
        setIsConnected(false);
        onConnectionChange(false);
      });

      socket.on('gameState', (gameState) => {
        onGameStateChange(gameState);
      });

      socket.on('command_response', (data) => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              // Apply colorblind-friendly colors based on success/failure
              if (data.success === false) {
                div.css('color', '#e74c3c'); // Bright red for errors
              } else {
                div.css('color', '#27ae60'); // Bright green for success
              }
            }
          });
          
          // Auto-scroll to bottom after adding content
          if (autoScroll) {
            setTimeout(() => {
              const container = terminalRef.current?.closest('.terminal-container');
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }, 100);
          }
        }
      });

      socket.on('game_message', (data) => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              // Apply colorblind-friendly colors
              if (data.color) {
                div.css('color', data.color);
              } else {
                div.css('color', '#f39c12'); // Orange for general messages
              }
            }
          });
          
          // Auto-scroll to bottom after adding content
          if (autoScroll) {
            setTimeout(() => {
              const container = terminalRef.current?.closest('.terminal-container');
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }, 100);
          }
        }
      });

      // Handle game session events
      socket.on('game_joined', (data) => {
        console.log('Game joined successfully:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#51cf66'); // Green for success
            }
          });
        }
      });

      socket.on('character_created', (data) => {
        console.log('Character created:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#51cf66'); // Green for success
            }
          });
        }
      });

      socket.on('character_creation_error', (data) => {
        console.log('Character creation error:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#ff6b6b'); // Red for errors
            }
          });
        }
      });

      socket.on('campaign_created', (data) => {
        console.log('Campaign created:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#51cf66'); // Green for success
            }
          });
        }
      });

      socket.on('campaign_creation_error', (data) => {
        console.log('Campaign creation error:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#ff6b6b'); // Red for errors
            }
          });
        }
      });

      socket.on('combat_started', (data) => {
        console.log('Combat started:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#ffd43b'); // Yellow for combat
            }
          });
        }
      });

      socket.on('error', (data) => {
        console.log('Server error:', data);
        if (terminalInstanceRef.current && data.message) {
          terminalInstanceRef.current.echo(data.message, {
            raw: true,
            finalize: (div: any) => {
              div.css('color', '#ff6b6b'); // Red for errors
            }
          });
        }
      });

      socket.on('map_update', (data) => {
        console.log('Map update received:', data);
        if (onMapUpdate) {
          onMapUpdate(data.map);
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
                    socket.emit('player_command', {
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
                  fontSize: fontSize,
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

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  const toggleAutoScroll = () => {
    setAutoScroll(prev => !prev);
  };

  return (
    <div className="terminal-container">
      <div className="terminal-controls">
        <div className="terminal-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="terminal-options">
          <button 
            onClick={decreaseFontSize}
            className="font-control-btn"
            title="Decrease font size"
          >
            A-
          </button>
          <span className="font-size-display">{fontSize}px</span>
          <button 
            onClick={increaseFontSize}
            className="font-control-btn"
            title="Increase font size"
          >
            A+
          </button>
          <button 
            onClick={toggleAutoScroll}
            className={`auto-scroll-btn ${autoScroll ? 'active' : ''}`}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            {autoScroll ? '📌' : '📌'}
          </button>
        </div>
      </div>
      <div 
        ref={terminalRef} 
        className="terminal" 
        style={{ fontSize: `${fontSize}px` }}
      />
    </div>
  );
}
