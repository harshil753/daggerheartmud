'use client';

import { useState } from 'react';

interface GameControlsProps {
  onDiceRoll?: () => void;
  onSave?: () => void;
  onRest?: () => void;
  gameState?: any;
}

export default function GameControls({ 
  onDiceRoll, 
  onSave, 
  onRest, 
  gameState 
}: GameControlsProps) {
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const rollDice = () => {
    // Roll 2d12 (Hope and Fear dice)
    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const result = hopeDie - fearDie;
    
    setDiceResult(result);
    onDiceRoll?.();
    
    // Send dice roll to terminal
    const terminal = document.querySelector('.terminal');
    if (terminal) {
      // This would be handled by the WebSocket connection
      console.log(`Dice roll: Hope ${hopeDie} - Fear ${fearDie} = ${result}`);
    }
  };

  const getCharacterStats = () => {
    if (!gameState?.character) return null;
    
    const char = gameState.character;
    return {
      name: char.name,
      ancestry: char.ancestry,
      class: char.class,
      level: char.level,
      hp: `${char.hit_points_current}/${char.hit_points_max}`,
      stress: `${char.stress_current}/${char.stress_max}`,
      hope: char.hope_tokens || 0,
      fear: char.fear_tokens || 0
    };
  };

  const stats = getCharacterStats();

  return (
    <div className="game-controls">
      <div className="controls-section">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            onClick={rollDice}
            className="dice-button"
            title="Roll 2d12 (Hope - Fear dice)"
          >
            🎲 Roll Dice
          </button>
          
          <button 
            onClick={onSave}
            className="save-button"
            title="Create manual save point"
          >
            💾 Save
          </button>
          
          <button 
            onClick={onRest}
            className="rest-button"
            title="Rest to recover HP and stress"
          >
            😴 Rest
          </button>
        </div>
        
        {diceResult !== null && (
          <div className="dice-result">
            <span className="dice-label">Last Roll:</span>
            <span className={`dice-value ${diceResult >= 0 ? 'positive' : 'negative'}`}>
              {diceResult > 0 ? `+${diceResult}` : diceResult}
            </span>
          </div>
        )}
      </div>

      {stats && (
        <div className="character-stats">
          <h3>Character</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Name:</span>
              <span className="stat-value">{stats.name}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{stats.level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">HP:</span>
              <span className="stat-value">{stats.hp}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Stress:</span>
              <span className="stat-value">{stats.stress}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hope:</span>
              <span className="stat-value">{stats.hope}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fear:</span>
              <span className="stat-value">{stats.fear}</span>
            </div>
          </div>
        </div>
      )}

      <div className="help-section">
        <h3>Quick Help</h3>
        <div className="help-commands">
          <div className="command-item">
            <code>look</code> - Examine surroundings
          </div>
          <div className="command-item">
            <code>inventory</code> - View items
          </div>
          <div className="command-item">
            <code>stats</code> - Character details
          </div>
          <div className="command-item">
            <code>help</code> - Full command list
          </div>
        </div>
      </div>
    </div>
  );
}
