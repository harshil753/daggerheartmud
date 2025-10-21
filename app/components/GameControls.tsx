'use client';

import { useState } from 'react';

interface GameControlsProps {
  gameState?: any;
  currentMap?: any;
}

export default function GameControls({ 
  gameState,
  currentMap
}: GameControlsProps) {
  const [diceResult, setDiceResult] = useState<number | null>(null);
  
  // Dice counter state
  const [diceCounts, setDiceCounts] = useState({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0
  });
  
  const [diceResults, setDiceResults] = useState<{
    results: { [key: string]: number[] };
    total: number;
  } | null>(null);

  const updateDiceCount = (diceType: keyof typeof diceCounts, delta: number) => {
    setDiceCounts(prev => ({
      ...prev,
      [diceType]: Math.max(0, Math.min(99, prev[diceType] + delta))
    }));
  };

  const rollDice = (sides: number, count: number): number[] => {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    return results;
  };

  const rollAllDice = () => {
    const results: { [key: string]: number[] } = {};
    let total = 0;

    Object.entries(diceCounts).forEach(([diceType, count]) => {
      if (count > 0) {
        const sides = parseInt(diceType.substring(1));
        const diceResults = rollDice(sides, count);
        results[diceType] = diceResults;
        total += diceResults.reduce((sum, result) => sum + result, 0);
      }
    });

    setDiceResults({
      results: results,
      total: total
    });
  };

  const getTotalDiceCount = () => {
    return Object.values(diceCounts).reduce((sum, count) => sum + count, 0);
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
        <h3>Dice Pool</h3>
        <div className="dice-counter">
          <div className="dice-list">
            {Object.entries(diceCounts).map(([diceType, count]) => (
              <div key={diceType} className="dice-item">
                <span className="dice-type">{diceType}:</span>
                <div className="dice-controls">
                  <button 
                    onClick={() => updateDiceCount(diceType as keyof typeof diceCounts, -1)}
                    className="dice-btn minus-btn"
                    disabled={count === 0}
                  >
                    -
                  </button>
                  <span className="dice-count">
                    {count.toString().padStart(2, '0')}
                  </span>
                  <button 
                    onClick={() => updateDiceCount(diceType as keyof typeof diceCounts, 1)}
                    className="dice-btn plus-btn"
                    disabled={count >= 99}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={rollAllDice}
            className="roll-button"
            disabled={getTotalDiceCount() === 0}
          >
            ROLL
          </button>
          
          {diceResults && (
            <div className="dice-results">
              <div className="results-display">
                <span className="results-label">Result:</span>
                <div className="results-list">
                  {Object.entries(diceResults.results).map(([diceType, results]) => (
                    <div key={diceType} className="result-item">
                      <span className="result-dice-type">{diceType}:</span>
                      <span className="result-values">[{results.join(', ')}]</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="total-display">
                <span className="total-label">Total Sum:</span>
                <span className="total-value">{diceResults.total}</span>
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
            <code>inventory</code> - View items
          </div>
          <div className="command-item">
            <code>stats</code> - Character details
          </div>
          <div className="command-item">
            <code>help</code> - Full command list
          </div>
          <div className="command-item">
            <code>move</code> - Travel to new location
          </div>
          <div className="command-item">
            <code>talk</code> - Speak with NPCs
          </div>
          <div className="command-item">
            <code>attack</code> - Engage in combat
          </div>
          <div className="command-item">
            <code>equip</code> - Wear equipment
          </div>
          <div className="command-item">
            <code>use</code> - Use items or abilities
          </div>
          <div className="command-item">
            <code>rest</code> - Recover HP and stress
          </div>
          <div className="command-item">
            <code>save</code> - Create save point
          </div>
          <div className="command-item">
            <code>roll</code> - Make dice rolls
          </div>
        </div>
      </div>

      {currentMap && (
        <div className="map-section">
          <h3>Map</h3>
          <div className="map-display">
            <pre className="map-grid">{currentMap.grid}</pre>
            {currentMap.legend && (
              <div className="map-legend">
                <h4>Legend</h4>
                <pre className="legend-text">{currentMap.legend}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
