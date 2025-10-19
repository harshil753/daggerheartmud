'use client';

import { useState, useEffect } from 'react';
import GameSession from './components/GameSession';

type GameMode = 'login' | 'guest' | 'playing';

export default function Home() {
  const [gameMode, setGameMode] = useState<GameMode>('login');
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for existing guest session
    const guestSession = sessionStorage.getItem('daggerheart_guest_game');
    if (guestSession) {
      setGameMode('playing');
      setIsGuest(true);
    }
  }, []);

  const handleGuestMode = () => {
    setIsGuest(true);
    setGameMode('playing');
  };

  const handleLogin = () => {
    // TODO: Implement actual login functionality
    setIsGuest(false);
    setGameMode('playing');
  };

  const handleLogout = () => {
    setGameMode('login');
    setIsGuest(false);
    // Clear guest session data
    sessionStorage.removeItem('daggerheart_guest_game');
  };

  if (gameMode === 'playing') {
    return (
      <GameSession 
        isGuest={isGuest}
        onLogout={handleLogout}
        totalChapters={10}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Daggerheart MUD
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              A text-based multiplayer dungeon adventure
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In / Create Account
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            <button
              onClick={handleGuestMode}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Play as Guest
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Guest mode allows you to try the game without creating an account.
              <br />
              Progress will not be saved between sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
