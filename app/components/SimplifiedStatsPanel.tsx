'use client';

interface SimplifiedStatsPanelProps {
  character?: any;
  campaign?: any;
  combat?: any;
}

export default function SimplifiedStatsPanel({
  character,
  campaign,
  combat
}: SimplifiedStatsPanelProps) {
  // Placeholder data for demonstration
  const placeholderCharacter = {
    name: 'Adventurer',
    level: 1,
    hp: 20,
    maxHp: 20,
    hope: 3,
    fear: 0,
    experience: 0,
    class: 'Fighter',
    ancestry: 'Human'
  };

  const placeholderCampaign = {
    name: 'The Lost Crown',
    current_chapter: 1,
    total_chapters: 10,
    difficulty: 'Medium'
  };

  const displayCharacter = character || placeholderCharacter;
  const displayCampaign = campaign || placeholderCampaign;

  return (
    <div className="stats-panel">
      <div className="panel-header">
        <h3>Character Stats</h3>
      </div>
      
      <div className="panel-content">
        {/* Character Info */}
        <div className="character-section">
          <h4 className="section-title">Character</h4>
          <div className="character-info">
            <div className="stat-row">
              <span className="stat-label">Name:</span>
              <span className="stat-value">{displayCharacter.name}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{displayCharacter.level}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Class:</span>
              <span className="stat-value">{displayCharacter.class}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Ancestry:</span>
              <span className="stat-value">{displayCharacter.ancestry}</span>
            </div>
          </div>
        </div>

        {/* Health & Resources */}
        <div className="health-section">
          <h4 className="section-title">Health & Resources</h4>
          <div className="health-info">
            <div className="stat-row">
              <span className="stat-label">HP:</span>
              <span className="stat-value">{displayCharacter.hp}/{displayCharacter.maxHp}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Hope:</span>
              <span className="stat-value">{displayCharacter.hope}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Fear:</span>
              <span className="stat-value">{displayCharacter.fear}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Experience:</span>
              <span className="stat-value">{displayCharacter.experience}</span>
            </div>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="campaign-section">
          <h4 className="section-title">Campaign</h4>
          <div className="campaign-info">
            <div className="stat-row">
              <span className="stat-label">Campaign:</span>
              <span className="stat-value">{displayCampaign.name}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Chapter:</span>
              <span className="stat-value">{displayCampaign.current_chapter}/{displayCampaign.total_chapters}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Difficulty:</span>
              <span className="stat-value">{displayCampaign.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Placeholder for future functionality */}
        <div className="stats-actions">
          <p className="text-xs text-gray-400 mt-4">
            💡 Character progression will be managed through AI interactions
          </p>
        </div>
      </div>
    </div>
  );
}
