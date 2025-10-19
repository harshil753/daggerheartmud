'use client';

import { useState, useEffect } from 'react';
import { calculateLevelProgression, getLevelAfterChapters, shouldLevelUp } from '../utils/levelSystem';

interface GameSessionProps {
  isGuest: boolean;
  onLogout: () => void;
  totalChapters?: number;
}

interface GameState {
  playerName: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  location: string;
  inventory: string[];
  completedChapters: number;
  currentChapter: number;
}

export default function GameSession({ isGuest, onLogout, totalChapters = 10 }: GameSessionProps) {
  const progression = calculateLevelProgression(totalChapters);
  
  const [gameState, setGameState] = useState<GameState>({
    playerName: isGuest ? 'Guest Player' : 'Player',
    level: progression.startingLevel,
    experience: 0,
    health: 100,
    maxHealth: 100,
    location: 'The Tavern',
    inventory: ['Health Potion', 'Rusty Sword'],
    completedChapters: 0,
    currentChapter: 1
  });

  const [gameLog, setGameLog] = useState<string[]>([
    'Welcome to Daggerheart MUD!',
    'You find yourself in a dimly lit tavern.',
    'Adventurers whisper tales of treasure and danger...',
    `You are currently Level ${progression.startingLevel} in Chapter ${gameState.currentChapter} of ${totalChapters}`
  ]);

  const [input, setInput] = useState('');

  // Save game state to sessionStorage for guest mode
  useEffect(() => {
    if (isGuest) {
      sessionStorage.setItem('daggerheart_guest_game', JSON.stringify(gameState));
    }
  }, [gameState, isGuest]);

  // Load game state from sessionStorage for guest mode
  useEffect(() => {
    if (isGuest) {
      const saved = sessionStorage.getItem('daggerheart_guest_game');
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          setGameState(parsedState);
        } catch (error) {
          console.error('Failed to load guest game state:', error);
        }
      }
    }
  }, [isGuest]);

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    let newLog = [...gameLog];
    
    switch (cmd) {
      case 'help':
        newLog.push('Available commands: look, inventory, stats, explore, rest, complete chapter, quit');
        break;
      case 'look':
        newLog.push('You are in ' + gameState.location + '. The room is well-furnished with wooden tables and chairs.');
        break;
      case 'inventory':
        newLog.push('Your inventory: ' + gameState.inventory.join(', '));
        break;
      case 'stats':
        newLog.push(`Level: ${gameState.level}, Health: ${gameState.health}/${gameState.maxHealth}, XP: ${gameState.experience}`);
        break;
      case 'explore':
        newLog.push('You venture into the unknown...');
        setGameState(prev => ({
          ...prev,
          experience: prev.experience + 10,
          health: Math.max(1, prev.health - 5)
        }));
        break;
      case 'complete chapter':
        newLog.push('🎉 Chapter completed! You have leveled up!');
        setGameState(prev => {
          const newCompletedChapters = prev.completedChapters + 1;
          const newLevel = getLevelAfterChapters(progression.startingLevel, newCompletedChapters);
          return {
            ...prev,
            completedChapters: newCompletedChapters,
            currentChapter: Math.min(totalChapters, prev.currentChapter + 1),
            level: newLevel,
            health: 100, // Full heal on level up
            maxHealth: 100 + (newLevel - 1) * 10 // Increase max health with level
          };
        });
        break;
      case 'rest':
        newLog.push('You rest and recover some health.');
        setGameState(prev => ({
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 20)
        }));
        break;
      case 'quit':
        onLogout();
        return;
      default:
        newLog.push('Unknown command. Type "help" for available commands.');
    }
    
    setGameLog(newLog);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h1 className="text-2xl font-bold">Daggerheart MUD</h1>
          <div className="flex items-center space-x-4">
            {isGuest && (
              <span className="text-yellow-400 text-sm bg-yellow-900 bg-opacity-30 px-2 py-1 rounded">
                GUEST MODE
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Player</div>
            <div className="font-bold">{gameState.playerName}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Level</div>
            <div className="font-bold">{gameState.level}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Health</div>
            <div className="font-bold">{gameState.health}/{gameState.maxHealth}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Chapter</div>
            <div className="font-bold">{gameState.currentChapter}/{totalChapters}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-400">Location</div>
            <div className="font-bold">{gameState.location}</div>
          </div>
        </div>

        {/* Game Log */}
        <div className="bg-black p-4 rounded-lg h-96 overflow-y-auto mb-4 border border-gray-700">
          {gameLog.map((line, index) => (
            <div key={index} className="mb-1">
              {line}
            </div>
          ))}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex">
          <span className="text-green-400 mr-2">></span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
            placeholder="Enter command..."
            autoFocus
          />
        </form>

        {/* Guest Mode Warning */}
        {isGuest && (
          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded text-yellow-300 text-sm">
            <strong>Guest Mode:</strong> Your progress will not be saved. Create an account to save your game permanently.
          </div>
        )}
      </div>
    </div>
  );
}
