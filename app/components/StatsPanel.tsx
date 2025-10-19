'use client';

interface StatsPanelProps {
  character?: any;
  campaign?: any;
  combat?: any;
}

export default function StatsPanel({ character, campaign, combat }: StatsPanelProps) {
  if (!character) {
    return (
      <div className="stats-panel">
        <h3>Character Stats</h3>
        <div className="no-character">
          No character created yet
        </div>
      </div>
    );
  }

  const getTraitModifier = (trait: number) => {
    return trait >= 0 ? `+${trait}` : `${trait}`;
  };

  const getHPPercentage = () => {
    return Math.round((character.hit_points_current / character.hit_points_max) * 100);
  };

  const getStressPercentage = () => {
    return Math.round((character.stress_current / character.stress_max) * 100);
  };

  const getEquippedWeapon = () => {
    if (character.primary_weapon_id) {
      return character.primary_weapon?.name || 'Unknown Weapon';
    }
    return 'Unarmed';
  };

  const getEquippedArmor = () => {
    if (character.armor_id) {
      return character.armor?.name || 'Unknown Armor';
    }
    return 'No Armor';
  };

  return (
    <div className="stats-panel">
      <div className="character-header">
        <h3>{character.name}</h3>
        <div className="character-basics">
          <span className="ancestry">{character.ancestry}</span>
          <span className="class">{character.class}</span>
          <span className="level">Level {character.level}</span>
        </div>
      </div>

      <div className="health-section">
        <h4>Health & Resources</h4>
        <div className="health-bar">
          <div className="health-label">HP</div>
          <div className="health-value">
            {character.hit_points_current}/{character.hit_points_max}
          </div>
          <div className="health-percentage">
            {getHPPercentage()}%
          </div>
        </div>
        
        <div className="stress-bar">
          <div className="stress-label">Stress</div>
          <div className="stress-value">
            {character.stress_current}/{character.stress_max}
          </div>
          <div className="stress-percentage">
            {getStressPercentage()}%
          </div>
        </div>

        <div className="tokens">
          <div className="hope-tokens">
            <span className="token-label">Hope:</span>
            <span className="token-value">{character.hope_tokens || 0}</span>
          </div>
          <div className="fear-tokens">
            <span className="token-label">Fear:</span>
            <span className="token-value">{character.fear_tokens || 0}</span>
          </div>
        </div>
      </div>

      <div className="traits-section">
        <h4>Traits</h4>
        <div className="traits-grid">
          <div className="trait-item">
            <span className="trait-name">Agility</span>
            <span className="trait-value">{getTraitModifier(character.agility || 0)}</span>
          </div>
          <div className="trait-item">
            <span className="trait-name">Strength</span>
            <span className="trait-value">{getTraitModifier(character.strength || 0)}</span>
          </div>
          <div className="trait-item">
            <span className="trait-name">Finesse</span>
            <span className="trait-value">{getTraitModifier(character.finesse || 0)}</span>
          </div>
          <div className="trait-item">
            <span className="trait-name">Instinct</span>
            <span className="trait-value">{getTraitModifier(character.instinct || 0)}</span>
          </div>
          <div className="trait-item">
            <span className="trait-name">Presence</span>
            <span className="trait-value">{getTraitModifier(character.presence || 0)}</span>
          </div>
          <div className="trait-item">
            <span className="trait-name">Knowledge</span>
            <span className="trait-value">{getTraitModifier(character.knowledge || 0)}</span>
          </div>
        </div>
      </div>

      <div className="equipment-section">
        <h4>Equipment</h4>
        <div className="equipment-list">
          <div className="equipment-item">
            <span className="equipment-label">Weapon:</span>
            <span className="equipment-value">{getEquippedWeapon()}</span>
          </div>
          <div className="equipment-item">
            <span className="equipment-label">Armor:</span>
            <span className="equipment-value">{getEquippedArmor()}</span>
          </div>
        </div>
      </div>

      {campaign && (
        <div className="campaign-section">
          <h4>Campaign</h4>
          <div className="campaign-info">
            <div className="campaign-title">{campaign.title}</div>
            <div className="campaign-progress">
              Chapter {campaign.current_chapter} of {campaign.total_chapters}
            </div>
            <div className="campaign-length">{campaign.story_length} story</div>
          </div>
        </div>
      )}

      {combat && (
        <div className="combat-section">
          <h4>Combat</h4>
          <div className="combat-info">
            <div className="combat-status">In Combat</div>
            <div className="combat-round">Round {combat.round_number}</div>
            <div className="combat-initiative">
              Turn: {combat.initiative_order?.[combat.current_turn_index]?.name || 'Unknown'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
