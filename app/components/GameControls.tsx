'use client';

import { useState } from 'react';

interface GameControlsProps {
  onDiceRoll?: () => void;
  gameState?: any;
}

export default function GameControls({ 
  onDiceRoll, 
  gameState 
}: GameControlsProps) {
  const [diceCounters, setDiceCounters] = useState({
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0
  });
  const [rollResults, setRollResults] = useState<{die: string, value: number}[]>([]);
  const [totalSum, setTotalSum] = useState(0);

  const updateDiceCounter = (dieType: string, change: number) => {
    setDiceCounters(prev => ({
      ...prev,
      [dieType]: Math.max(0, Math.min(99, prev[dieType as keyof typeof prev] + change))
    }));
  };

  const rollDice = () => {
    const results: {die: string, value: number}[] = [];
    let total = 0;

    Object.entries(diceCounters).forEach(([dieType, count]) => {
      if (count > 0) {
        const dieSize = parseInt(dieType.substring(1));
        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * dieSize) + 1;
          results.push({ die: dieType, value: roll });
          total += roll;
        }
      }
    });

    setRollResults(results);
    setTotalSum(total);
    onDiceRoll?.();
  };

  const canRoll = Object.values(diceCounters).some(count => count > 0);

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
        <h3>Roll Dice</h3>
        <div className="dice-pool-container">
          {Object.entries(diceCounters).map(([dieType, count]) => (
            <div key={dieType} className="dice-row">
              <span className="dice-label">{dieType}:</span>
              <button 
                onClick={() => updateDiceCounter(dieType, -1)}
                className="dice-decrement-btn"
                disabled={count === 0}
              >
                -
              </button>
              <span className="dice-counter-display">
                {count.toString().padStart(2, '0')}
              </span>
              <button 
                onClick={() => updateDiceCounter(dieType, 1)}
                className="dice-increment-btn"
                disabled={count === 99}
              >
                +
              </button>
            </div>
          ))}
          
          <button 
            onClick={rollDice}
            className="roll-button"
            disabled={!canRoll}
          >
            ROLL
          </button>
          
          {rollResults.length > 0 && (
            <div className="dice-results-section">
              <div className="result-item">
                <span className="result-label">Results:</span>
                <span className="result-values">
                  {Object.entries(
                    rollResults.reduce((acc, {die, value}) => {
                      if (!acc[die]) acc[die] = [];
                      acc[die].push(value);
                      return acc;
                    }, {} as Record<string, number[]>)
                  ).map(([die, values]) => `${die}: [${values.join(', ')}]`).join(', ')}
                </span>
              </div>
              <div className="total-sum-row">
                <span className="total-label">Total Sum:</span>
                <span className="total-value">{totalSum}</span>
              </div>
            </div>
          )}
        </div>
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
            <code>move [direction]</code> - Travel (north/south/east/west)
          </div>
          <div className="command-item">
            <code>inventory</code> - View items
          </div>
          <div className="command-item">
            <code>equip [item]</code> - Equip weapon/armor
          </div>
          <div className="command-item">
            <code>attack [target]</code> - Attack enemy
          </div>
          <div className="command-item">
            <code>cast [spell]</code> - Cast a spell
          </div>
          <div className="command-item">
            <code>use [item]</code> - Use consumable item
          </div>
          <div className="command-item">
            <code>talk [npc]</code> - Speak with NPC
          </div>
          <div className="command-item">
            <code>search</code> - Search the area
          </div>
          <div className="command-item">
            <code>take [item]</code> - Pick up items
          </div>
          <div className="command-item">
            <code>drop [item]</code> - Drop items
          </div>
          <div className="command-item">
            <code>help</code> - Full command list
          </div>
        </div>
      </div>
    </div>
  );
}
