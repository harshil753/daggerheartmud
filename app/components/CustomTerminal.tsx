'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface CustomTerminalProps {
  isGuest: boolean;
  onLogout?: () => void;
  onGameStateChange?: (newGameState: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'system';
  content: string;
  timestamp: Date;
}

const CustomTerminal: React.FC<CustomTerminalProps> = ({ 
  isGuest, 
  onLogout, 
  onGameStateChange,
  onConnectionChange
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add a line to the terminal
  const addLine = useCallback((type: 'input' | 'output' | 'system', content: string) => {
    setLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  }, []);

  // Process commands
  const processCommand = useCallback((command: string) => {
    const cmd = command.trim().toLowerCase();
    
    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add input line
    addLine('input', `> ${command}`);
    
    // Send command to backend if connected
    if (socket && isConnected) {
      socket.emit('command', command);
      return; // Let backend handle the command
    }
    
    // Fallback to local command processing if not connected
    switch (cmd) {
      case 'start':
        addLine('output', '🚀 Starting your Daggerheart adventure...');
        addLine('output', 'Welcome to the world of Daggerheart! Your journey begins now.');
        addLine('output', 'Type "help" to see available commands.');
        break;
        
      case 'help':
        addLine('output', `
╔══════════════════════════════════════════════════════════════════════════════╗
║                              🎮 GAME COMMANDS                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ start - Begin your adventure                                               ║
║ look - Examine your surroundings                                            ║
║ move <direction> - Move in a direction (north, south, east, west)          ║
║ talk <npc> - Talk to an NPC                                                ║
║ attack <target> - Attack a target                                          ║
║ cast <spell> - Cast a spell                                                ║
║ rest - Rest to recover health                                               ║
║                                                                              ║
║                              👤 CHARACTER COMMANDS                          ║
║ character - View your character sheet                                       ║
║ stats - Show your current stats                                             ║
║ level - Check your level and experience                                     ║
║ inventory - View your items and equipment                                  ║
║ equip <item> - Equip an item                                               ║
║ use <item> - Use an item                                                    ║
║                                                                              ║
║                              🗺️ WORLD COMMANDS                             ║
║ map - View the current area map                                             ║
║ search - Search the current area for items                                  ║
║ examine <item> - Examine an item or object                                 ║
║                                                                              ║
║                              📖 INFO COMMANDS                              ║
║ rules - Learn the game rules                                                ║
║ help - Show this help menu                                                 ║
║ quit - Exit the game                                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
        `);
        break;
        
      case 'character':
        addLine('output', '👤 Character Sheet:');
        addLine('output', 'Name: [Your Character Name]');
        addLine('output', 'Level: 1');
        addLine('output', 'Class: [Choose your class]');
        addLine('output', 'Health: 100/100');
        addLine('output', 'Mana: 50/50');
        addLine('output', 'Type "start" to begin character creation.');
        break;
        
      case 'look':
        addLine('output', '🔍 You look around...');
        addLine('output', 'You find yourself in a mysterious dungeon entrance.');
        addLine('output', 'The air is thick with ancient magic.');
        addLine('output', 'A stone archway leads deeper into the darkness.');
        addLine('output', 'Type "start" to begin your adventure.');
        break;
        
      case 'inventory':
        addLine('output', '🎒 Inventory:');
        addLine('output', 'Empty - You have no items yet.');
        addLine('output', 'Type "start" to begin and receive starting equipment.');
        break;
        
      case 'stats':
        addLine('output', '📊 Character Stats:');
        addLine('output', 'Strength: 10');
        addLine('output', 'Dexterity: 10');
        addLine('output', 'Intelligence: 10');
        addLine('output', 'Wisdom: 10');
        addLine('output', 'Constitution: 10');
        addLine('output', 'Charisma: 10');
        break;
        
      case 'test':
        addLine('output', '✅ Terminal is working perfectly!');
        addLine('output', 'All input and output functions are operational.');
        addLine('output', 'You can type commands and see the results.');
        break;
        
      case 'quit':
        addLine('output', '👋 Thanks for playing Daggerheart MUD!');
        if (onLogout) {
          onLogout();
        }
        break;
        
      default:
        addLine('output', `❓ Unknown command: "${command}"`);
        addLine('output', '💡 Type "help" to see all available commands.');
        addLine('output', '🎮 Type "start" to begin your adventure!');
        addLine('output', '🧪 Type "test" to verify terminal is working!');
        break;
    }
    
    // Clear input
    setCurrentInput('');
  }, [addLine, onLogout, socket, isConnected]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        processCommand(currentInput);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex] || '');
        }
      }
    }
  }, [currentInput, processCommand, commandHistory, historyIndex]);

  // Initialize terminal
  useEffect(() => {
    if (isGuest) {
      addLine('system', `
╔══════════════════════════════════════════════════════════════════════════════╗
║                              👤 GUEST MODE                               ║
║                                                                              ║
║ ⚠️  Progress will NOT be saved between sessions                             ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                              🎯 GETTING STARTED                           ║
║                                                                              ║
║ Welcome to Daggerheart MUD! Here's how to get started:                      ║
║                                                                              ║
║ 🚀 QUICK START:                                                             ║
║ 1. Type 'start' to begin your adventure                                     ║
║ 2. Type 'help' to see all available commands                               ║
║ 3. Type 'character' to create your character                               ║
║                                                                              ║
║ 📝 ESSENTIAL COMMANDS:                                                      ║
║ 'start' - Begin your adventure                                             ║
║ 'help' - Show all available commands                                        ║
║ 'character' - Create or view your character                                 ║
║ 'look' - Examine your surroundings                                         ║
║ 'inventory' - Check your items and equipment                                ║
║ 'stats' - View your character stats                                         ║
║                                                                              ║
║ 💡 TIP: Type 'help' for a complete list of commands                         ║
║ 🎮 TIP: Type 'start' to begin your adventure!                              ║
║ 🎲 TIP: Use the Quick Actions panel on the right for common actions         ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
    } else {
      addLine('system', `
╔══════════════════════════════════════════════════════════════════════════════╗
║                              🎮 DAGGERHEART MUD                            ║
║                                                                              ║
║ Welcome to Daggerheart MUD! Here's how to get started:                      ║
║                                                                              ║
║ 🚀 QUICK START:                                                             ║
║ 1. Type 'start' to begin your adventure                                     ║
║ 2. Type 'help' to see all available commands                               ║
║ 3. Type 'character' to create your character                               ║
║                                                                              ║
║ 📝 ESSENTIAL COMMANDS:                                                      ║
║ 'start' - Begin your adventure                                             ║
║ 'help' - Show all available commands                                        ║
║ 'character' - Create or view your character                                 ║
║ 'look' - Examine your surroundings                                         ║
║ 'inventory' - Check your items and equipment                                ║
║ 'stats' - View your character stats                                         ║
║                                                                              ║
║ 💡 TIP: Type 'help' for a complete list of commands                         ║
║ 🎮 TIP: Type 'start' to begin your adventure!                              ║
║ 🎲 TIP: Use the Quick Actions panel on the right for common actions         ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);
    }
    
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGuest, addLine]);

  // WebSocket connection
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // Only attempt connection if we don't already have a socket
    if (socket) {
      return;
    }

    // Skip WebSocket connection if backend URL is not properly configured
    if (!backendUrl || backendUrl.includes('undefined') || backendUrl.includes('null')) {
      console.log('Backend URL not configured, running in offline mode');
      setIsConnected(false);
      onConnectionChange?.(false);
      return;
    }

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000, // 5 second timeout
      reconnection: false, // Disable automatic reconnection to prevent loops
      forceNew: false // Don't force new connections
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      clearTimeout(connectionTimeout); // Clear the timeout since we connected
      setIsConnected(true);
      onConnectionChange?.(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('Connection failed, running in offline mode:', error.message);
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    // Set a timeout to give up on connection after 10 seconds
    const connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.log('Connection timeout, running in offline mode');
        newSocket.close();
        setIsConnected(false);
        onConnectionChange?.(false);
      }
    }, 10000);

    newSocket.on('gameState', (gameState) => {
      console.log('Received game state:', gameState);
      onGameStateChange?.(gameState);
    });

    newSocket.on('gameOutput', (output) => {
      console.log('Received game output:', output);
      addLine('output', output);
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(connectionTimeout);
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []); // Empty dependency array to prevent re-connection loops

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="custom-terminal-container">
      <div 
        ref={terminalRef}
        className="custom-terminal-output"
        style={{
          height: '350px',
          overflowY: 'auto',
          backgroundColor: '#1a1a1a',
          color: '#00ff00',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          padding: '10px',
          border: '1px solid #333',
          borderRadius: '4px',
          marginBottom: '10px'
        }}
      >
        {lines.map((line, index) => (
          <div 
            key={index}
            style={{
              color: line.type === 'input' ? '#00ff00' : 
                     line.type === 'system' ? '#ffff00' : '#00ff00',
              whiteSpace: 'pre-wrap',
              marginBottom: '2px'
            }}
          >
            {line.content}
          </div>
        ))}
      </div>
      
      <div className="custom-terminal-input" style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#00ff00', marginRight: '5px' }}>&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            color: '#00ff00',
            border: 'none',
            outline: 'none',
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            padding: '5px'
          }}
          placeholder="Type a command and press Enter..."
        />
      </div>
    </div>
  );
};

export default CustomTerminal;
