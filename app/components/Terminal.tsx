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
    // Prevent multiple initializations
    if (terminal) {
      console.log('Terminal already initialized, skipping...');
      return;
    }

    // Check if terminal already exists in DOM
    if (terminalRef.current && terminalRef.current.querySelector('.xterm')) {
      console.log('Terminal already exists in DOM, skipping initialization');
      return;
    }

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
          displayWelcomeMessage(term, isGuest);
          
          // Set up input handling immediately after opening
          // Use a persistent variable that won't be cleared on re-renders
          if (!(window as any).terminalInput) {
            (window as any).terminalInput = '';
          }
          
          const handleInput = (data: string) => {
            console.log('Input received:', data, 'charCode:', data.charCodeAt(0));
            if (data === '\r' || data === '\n') {
              // Enter key pressed - process the command
              const currentInput = (window as any).terminalInput || '';
              console.log('Enter pressed, processing command:', currentInput);
              if (currentInput.trim()) {
                term.write('\r\n');
                handleCommand(currentInput.trim(), term, isGuest, onLogout);
                (window as any).terminalInput = '';
              } else {
                term.write('\r\n> ');
              }
            } else if (data === '\u007f' || data === '\b') {
              // Backspace
              const currentInput = (window as any).terminalInput || '';
              if (currentInput.length > 0) {
                (window as any).terminalInput = currentInput.slice(0, -1);
                term.write('\b \b');
                console.log('Backspace, new input:', (window as any).terminalInput);
              }
            } else if (data.length === 1 && data >= ' ') {
              // Regular character input
              (window as any).terminalInput = ((window as any).terminalInput || '') + data;
              term.write(data);
              console.log('Character added, new input:', (window as any).terminalInput);
              // Force terminal to update display and ensure cursor is visible
              term.refresh(0, term.rows - 1);
              term.scrollToBottom();
            }
          };

          term.onData(handleInput);
          
          setTimeout(() => {
            term.focus();
            // Ensure the terminal container is also focused
            if (terminalRef.current) {
              terminalRef.current.focus();
            }
            console.log('Terminal initialized and focused');
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load terminal:', error);
      }
    };

    initTerminal();

    // Cleanup function
    return () => {
      if (terminal) {
        terminal.dispose();
        setTerminal(null);
      }
    };
  }, [terminal]);

  // Socket connection logic - DISABLED to prevent WebSocket errors
  useEffect(() => {
    // Force offline mode to prevent WebSocket connection issues
    console.log('Running in offline mode - WebSocket disabled to prevent connection errors');
    setIsConnected(false);
    onConnectionChange?.(false);
    
    // TODO: Re-enable WebSocket connection once backend is properly configured
    // const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    // const socket = io(backendUrl, {
    //   transports: ['websocket', 'polling']
    // });
    // ... rest of socket setup
  }, []);

  // Add your game state management here
  useEffect(() => {
    if (onGameStateChange && gameState) {
      onGameStateChange(gameState);
    }
  }, [gameState]); // Remove onGameStateChange dependency to prevent infinite loop


  // IMPORTANT: Return JSX
  return (
    <div className="terminal-container h-full w-full flex flex-col">
      {/* Terminal Header */}
      <div className="bg-gray-800 text-green-400 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">●</span>
          <span className="font-mono text-sm">Daggerheart MUD Terminal</span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className={`px-2 py-1 rounded ${isConnected ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>
            {isConnected ? 'Connected' : 'Offline Mode'}
          </span>
          {isGuest && (
            <span className="px-2 py-1 rounded bg-yellow-600 text-white">
              Guest Mode
            </span>
          )}
        </div>
      </div>
      
      {/* Terminal Display */}
      <div className="flex-1 bg-black">
        <div 
          ref={terminalRef} 
          className="terminal-display h-full w-full cursor-text"
          style={{ 
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
          onClick={() => {
            if (terminal) {
              terminal.focus();
              console.log('Terminal clicked, focused');
            }
          }}
          tabIndex={0}
        />
      </div>
      
      {/* Terminal Footer */}
      <div className="bg-gray-800 text-gray-400 px-4 py-2 border-t border-gray-700 text-xs">
        <div className="flex justify-between items-center">
          <span>Type 'help' for commands • Type 'start' to begin</span>
          <span>Press Ctrl+C to exit</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to display welcome message and instructions
const displayWelcomeMessage = (terminal: any, isGuest: boolean) => {
  const welcomeText = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           🎮 DAGGERHEART MUD 🎮                              ║
║                        Text-Based Adventure Game                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ${isGuest ? '👤 GUEST MODE' : '👤 PLAYER MODE'}                                                      ║
║  ${isGuest ? '⚠️  Progress will NOT be saved between sessions' : '✅ Progress will be saved'}        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           🎯 GETTING STARTED                                 ║
║                                                                              ║
║  Welcome to Daggerheart MUD! Here's how to get started:                     ║
║                                                                              ║
║  🚀 QUICK START:                                                             ║
║    1. Type 'start' to begin your adventure                                  ║
║    2. Type 'help' to see all available commands                             ║
║    3. Type 'character' to create your character                            ║
║                                                                              ║
║  📝 ESSENTIAL COMMANDS:                                                     ║
║    'start'          - Begin your adventure                                 ║
║    'help'           - Show all available commands                          ║
║    'character'      - Create or view your character                        ║
║    'look'           - Examine your surroundings                             ║
║    'inventory'      - Check your items and equipment                       ║
║    'stats'          - View your character stats                             ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  💡 TIP: Type 'help' for a complete list of commands                        ║
║  🎮 TIP: Type 'start' to begin your adventure!                              ║
║  🎲 TIP: Use the Quick Actions panel on the right for common actions        ║
╚══════════════════════════════════════════════════════════════════════════════╝

> `;
  
  terminal.write(welcomeText);
};

// Command handler function
const handleCommand = (input: string, terminal: any, isGuest: boolean, onLogout: () => void) => {
  const command = input.toLowerCase();
  
  // Echo the command
  terminal.write(`\r\n> ${input}\r\n`);
  
  switch (command) {
    case 'help':
      terminal.write(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                              📝 COMMAND HELP                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🎮 GAME COMMANDS:                                                          ║
║    start          - Begin your adventure                                    ║
║    look           - Look around the current area                            ║
║    move <direction> - Move in a direction (north, south, east, west)        ║
║    talk <npc>     - Talk to an NPC                                          ║
║    attack <target> - Attack a target                                        ║
║    cast <spell>  - Cast a spell                                           ║
║    rest           - Rest to recover health                                  ║
║                                                                              ║
║  👤 CHARACTER COMMANDS:                                                     ║
║    character      - View your character sheet                               ║
║    stats          - Show your current stats                                 ║
║    level          - Check your level and experience                         ║
║    inventory      - View your items and equipment                           ║
║    equip <item>   - Equip an item                                           ║
║    use <item>     - Use an item                                              ║
║                                                                              ║
║  🗺️  WORLD COMMANDS:                                                        ║
║    map            - View the current area map                               ║
║    search         - Search the current area for items                       ║
║    examine <item> - Examine an item or object                               ║
║                                                                              ║
║  📖 INFO COMMANDS:                                                          ║
║    rules          - Learn the game rules                                    ║
║    help           - Show this help menu                                     ║
║    quit           - Exit the game                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
      break;
      
    case 'start':
      terminal.write(`
🎮 Welcome to your Daggerheart adventure!

You find yourself in a dimly lit tavern. The air is thick with the smell of ale and 
roasted meat. A few patrons sit at wooden tables, speaking in hushed tones. 
A hooded figure in the corner catches your eye.

What would you like to do?
- Type 'look' to examine your surroundings
- Type 'talk <npc>' to speak with someone
- Type 'help' for more commands

`);
      break;
      
    case 'character':
      terminal.write(`
👤 CHARACTER SHEET

Name: ${isGuest ? 'Guest Adventurer' : 'Player'}
Level: 1
Health: 100/100
Class: Not Selected
Ancestry: Not Selected

To create your character, type 'create character' or visit a character creation area.
`);
      break;
      
    case 'rules':
      terminal.write(`
📖 DAGGERHEART RULES

This is a turn-based text adventure game based on the Daggerheart system.

🎯 OBJECTIVE: Complete chapters to level up and progress through your campaign.

🎲 COMBAT: Turn-based combat where you and enemies take turns acting.

📈 LEVELING: You level up by completing chapters, not by gaining experience points.

💡 TIP: Type 'help' anytime to see available commands!
`);
      break;
      
    case 'test':
      terminal.write(`
✅ Terminal is working! You can type commands.

Try these commands:
- 'help' - Show all commands
- 'start' - Begin adventure
- 'character' - View character

`);
      break;
      
    case 'testinput':
      terminal.write('\r\n✅ Testing input handling...\r\n');
      terminal.write('Type any character to test: ');
      break;
      
    case 'quit':
    case 'exit':
      terminal.write(`
👋 Thanks for playing Daggerheart MUD!

${isGuest ? 'Remember: Your progress will not be saved in guest mode.' : 'Your progress has been saved.'}

`);
      onLogout();
      break;
      
    default:
      terminal.write(`
❓ Unknown command: "${input}"

💡 Type 'help' to see all available commands.
🎮 Type 'start' to begin your adventure!
🧪 Type 'test' to verify terminal is working!

`);
  }
  
  // Always show the prompt
  terminal.write('\r\n> ');
};