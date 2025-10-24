'use client';

import { useState } from 'react';
import ChatTerminal from '../components/ChatTerminal';
import SimplifiedInventoryPanel from '../components/SimplifiedInventoryPanel';
import SimplifiedStatsPanel from '../components/SimplifiedStatsPanel';

export default function Test() {
  // Game state management
  const [gameState, setGameState] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<'inventory' | 'stats' | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [currentMap, setCurrentMap] = useState<any>(null);

  const handleGameStateChange = (newGameState: any) => {
    setGameState(newGameState);
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  const handleMapUpdate = (mapData: any) => {
    setCurrentMap(mapData);
  };

  const handleLogout = () => {
    // Reset to login state if needed
    console.log('Logout requested');
  };

  return (
    <div className="game-session">
      {/* Game Header */}
      <div className="game-header">
        {/* Game Title Section */}
        <div className="game-title">
          <h1>Daggerheart MUD - Test Mode</h1>
          <div className="game-status">
            <span className="guest-badge">Test Mode</span>
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Test Info Header */}
        <div className="guest-info-header">
          <h2>AI Studio Test Interface</h2>
          <p>Testing conversation sessions with @google/genai package. Upload seed data and interact with the AI.</p>
        </div>
        
        {/* Game Controls */}
        <div className="game-controls">
          <button 
            className="panel-button active"
          >
            Terminal
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'inventory' ? null : 'inventory')}
            className={`panel-button ${activePanel === 'inventory' ? 'active' : ''}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActivePanel(activePanel === 'stats' ? null : 'stats')}
            className={`panel-button ${activePanel === 'stats' ? 'active' : ''}`}
          >
            Stats
          </button>
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="game-content">
        <div className="game-main-layout">
          {/* Left Section - 75% width */}
          <div className="game-left-section" style={{ width: '75%' }}>
            <div className="game-panels">
              {/* Chat Terminal - Always visible */}
              <div className="terminal-panel visible">
                <ChatTerminal 
                  onGameStateChange={handleGameStateChange}
                  isGuest={true}
                  onLogout={handleLogout}
                  onConnectionChange={handleConnectionChange}
                  onMapUpdate={handleMapUpdate}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - 25% width */}
          <div className="game-sidebar" style={{ width: '25%' }}>
            {activePanel === 'inventory' && (
              <div className="inventory-panel">
                <SimplifiedInventoryPanel 
                  inventory={gameState?.inventory || []}
                  equipped={{
                    primary_weapon: gameState?.character?.primary_weapon,
                    secondary_weapon: gameState?.character?.secondary_weapon,
                    armor: gameState?.character?.armor
                  }}
                />
              </div>
            )}

            {activePanel === 'stats' && (
              <div className="stats-panel">
                <SimplifiedStatsPanel 
                  character={gameState?.character}
                  campaign={gameState?.campaign}
                  combat={gameState?.combat}
                />
              </div>
            )}

            {/* Default sidebar content when no panel is active */}
            {!activePanel && (
              <div className="sidebar-default">
                <h3>Test Interface</h3>
                <p>Click Inventory or Stats to view panels.</p>
                <p>Use the chat terminal to interact with the AI.</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>🤖 Using @google/genai package</p>
                  <p>💬 Session state maintained</p>
                  <p>📝 System instructions loaded</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="game-footer">
        <div className="game-info">
          <span>Daggerheart MUD Test v1.0</span>
          <span>AI Studio Integration</span>
        </div>
      </div>
    </div>
  );
}
