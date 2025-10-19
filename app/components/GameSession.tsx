'use client';

import { useState, useEffect } from 'react';
import Terminal from './Terminal';
import GameControls from './GameControls';
import InventoryPanel from './InventoryPanel';
import StatsPanel from './StatsPanel';
import GuestSession from './GuestSession';

interface GameSessionProps {
  isGuest?: boolean;
  onLogout?: () => void;
  totalChapters?: number;
}

export default function GameSession({ 
  isGuest = false, 
  onLogout = () => {},
  totalChapters = 10 
}: GameSessionProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<'terminal' | 'inventory' | 'stats'>('terminal');
  const [isConnected, setIsConnected] = useState(false);

  const handleGameStateChange = (newGameState: any) => {
    setGameState(newGameState);
  };

  const handleDiceRoll = () => {
    // Dice rolling is handled by the terminal/WebSocket
    console.log('Dice roll requested');
  };

  const handleSave = () => {
    // Save command is handled by the terminal/WebSocket
    console.log('Save requested');
  };

  const handleRest = () => {
    // Rest command is handled by the terminal/WebSocket
    console.log('Rest requested');
  };

  const handleEquip = (itemId: string, slot: string) => {
    // Equipment commands are handled by the terminal/WebSocket
    console.log(`Equip ${itemId} to ${slot}`);
  };

  const handleUnequip = (slot: string) => {
    // Equipment commands are handled by the terminal/WebSocket
    console.log(`Unequip ${slot}`);
  };

  const handleUse = (itemId: string) => {
    // Use commands are handled by the terminal/WebSocket
    console.log(`Use ${itemId}`);
  };

  const handleGuestSessionStart = (sessionData: any) => {
    setGameState(sessionData);
  };

  const handleGuestSessionEnd = () => {
    setGameState(null);
    onLogout?.();
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  return (
    <div className="game-session">
      <div className="game-header">
        <div className="game-title">
          <h1>Daggerheart MUD</h1>
          <div className="game-status">
            {isGuest && <span className="guest-badge">Guest Mode</span>}
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="game-controls">
          <button 
            onClick={() => setActivePanel('terminal')}
            className={`panel-button ${activePanel === 'terminal' ? 'active' : ''}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => setActivePanel('inventory')}
            className={`panel-button ${activePanel === 'inventory' ? 'active' : ''}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActivePanel('stats')}
            className={`panel-button ${activePanel === 'stats' ? 'active' : ''}`}
          >
            Stats
          </button>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="logout-button"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="game-content">
        {isGuest && (
          <div className="guest-session-container">
            <GuestSession 
              onSessionStart={handleGuestSessionStart}
              onSessionEnd={handleGuestSessionEnd}
            />
          </div>
        )}

        <div className="game-panels">
          {activePanel === 'terminal' && (
            <div className="terminal-panel">
              <Terminal 
                onGameStateChange={handleGameStateChange}
                isGuest={isGuest}
                onLogout={onLogout}
                onConnectionChange={handleConnectionChange}
              />
            </div>
          )}

          {activePanel === 'inventory' && (
            <div className="inventory-panel">
              <InventoryPanel 
                inventory={gameState?.inventory || []}
                equipped={{
                  primary_weapon: gameState?.character?.primary_weapon,
                  secondary_weapon: gameState?.character?.secondary_weapon,
                  armor: gameState?.character?.armor
                }}
                onEquip={handleEquip}
                onUnequip={handleUnequip}
                onUse={handleUse}
              />
            </div>
          )}

          {activePanel === 'stats' && (
            <div className="stats-panel">
              <StatsPanel 
                character={gameState?.character}
                campaign={gameState?.campaign}
                combat={gameState?.combat}
              />
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <GameControls 
            onDiceRoll={handleDiceRoll}
            onSave={handleSave}
            onRest={handleRest}
            gameState={gameState}
          />
        </div>
      </div>

      <div className="game-footer">
        <div className="game-info">
          <span>Daggerheart MUD v1.0</span>
          {gameState?.campaign && (
            <span>Chapter {gameState.campaign.current_chapter} of {gameState.campaign.total_chapters}</span>
          )}
        </div>
      </div>
    </div>
  );
}