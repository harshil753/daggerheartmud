'use client';

import { useState, useEffect } from 'react';

interface GuestSessionProps {
  onSessionStart: (sessionData: any) => void;
  onSessionEnd: () => void;
}

export default function GuestSession({ onSessionStart, onSessionEnd }: GuestSessionProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing guest session
    const existingSession = sessionStorage.getItem('daggerheart_guest_game');
    if (existingSession) {
      try {
        const parsed = JSON.parse(existingSession);
        setSessionData(parsed);
        onSessionStart(parsed);
      } catch (error) {
        console.error('Error parsing guest session:', error);
        sessionStorage.removeItem('daggerheart_guest_game');
      }
    }
  }, []); // Remove onSessionStart dependency to prevent infinite loop

  const startGuestSession = () => {
    setIsLoading(true);
    
    // Generate unique session ID
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession = {
      sessionId,
      isGuest: true,
      userId: null,
      character: null,
      campaign: null,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // Store in sessionStorage
    sessionStorage.setItem('daggerheart_guest_game', JSON.stringify(newSession));
    
    setSessionData(newSession);
    onSessionStart(newSession);
    setIsLoading(false);
  };

  const endGuestSession = () => {
    // Clear session data
    sessionStorage.removeItem('daggerheart_guest_game');
    setSessionData(null);
    onSessionEnd();
  };

  const saveGuestProgress = (gameState: any) => {
    if (!sessionData) return;

    const updatedSession = {
      ...sessionData,
      ...gameState,
      lastActivity: new Date().toISOString()
    };

    sessionStorage.setItem('daggerheart_guest_game', JSON.stringify(updatedSession));
    setSessionData(updatedSession);
  };

  if (sessionData) {
    return (
      <div className="guest-session">
        <div className="guest-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <strong>Guest Mode:</strong> Your progress will not be saved between browser sessions.
            Create an account to save your character and campaign permanently.
          </div>
        </div>

        <button 
          onClick={endGuestSession}
          className="end-session-button"
        >
          End Guest Session
        </button>
      </div>
    );
  }

  return (
    <div className="guest-session-setup">
      <div className="guest-actions">
        <button 
          onClick={startGuestSession}
          disabled={isLoading}
          className="start-guest-button"
        >
          {isLoading ? 'Starting...' : 'Start Guest Session'}
        </button>
      </div>
    </div>
  );
}
