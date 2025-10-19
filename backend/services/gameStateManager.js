const supabase = require('../config/supabase');

/**
 * Manages game state for active sessions
 */
class GameStateManager {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> gameState
  }

  /**
   * Initialize game state for a new session
   */
  async initializeSession(sessionId, userId = null, isGuest = false) {
    const gameState = {
      sessionId,
      userId,
      isGuest,
      character: null,
      campaign: null,
      currentLocation: null,
      inventory: [],
      combat: null,
      aiContext: {
        conversationHistory: [],
        worldState: {},
        lastSavePoint: null
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.activeSessions.set(sessionId, gameState);
    return gameState;
  }

  /**
   * Get game state for a session
   */
  getGameState(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Update game state
   */
  updateGameState(sessionId, updates) {
    const gameState = this.activeSessions.get(sessionId);
    if (gameState) {
      Object.assign(gameState, updates);
      gameState.lastActivity = new Date();
    }
    return gameState;
  }

  /**
   * Load character data from database
   */
  async loadCharacter(characterId) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading character:', error);
      return null;
    }
  }

  /**
   * Load campaign data from database
   */
  async loadCampaign(campaignId) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading campaign:', error);
      return null;
    }
  }

  /**
   * Save game state to database
   */
  async saveGameState(sessionId, gameState) {
    try {
      const { campaign } = gameState;
      if (!campaign) return false;

      // Update campaign state
      const { error } = await supabase
        .from('campaign_state')
        .upsert({
          campaign_id: campaign.id,
          current_chapter: campaign.current_chapter,
          current_location_description: gameState.currentLocation,
          ai_conversation_history: gameState.aiContext.conversationHistory,
          world_state: gameState.aiContext.worldState
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  }

  /**
   * End session and cleanup
   */
  endSession(sessionId) {
    const gameState = this.activeSessions.get(sessionId);
    if (gameState) {
      // Save final state before cleanup
      this.saveGameState(sessionId, gameState);
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.entries()).map(([sessionId, state]) => ({
      sessionId,
      userId: state.userId,
      isGuest: state.isGuest,
      character: state.character?.name,
      campaign: state.campaign?.title,
      lastActivity: state.lastActivity
    }));
  }
}

module.exports = GameStateManager;
