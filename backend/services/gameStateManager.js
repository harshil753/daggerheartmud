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
   * Load guest session from database
   */
  async loadGuestSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('guest_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Session not found
        }
        throw new Error(`Failed to load guest session: ${error.message}`);
      }

      // Convert database data back to game state format
      const gameState = {
        sessionId: data.session_id,
        userId: null,
        isGuest: true,
        character: data.character_data,
        campaign: null,
        currentLocation: data.game_state?.currentLocation || null,
        inventory: data.inventory_data || [],
        combat: data.game_state?.combat || null,
        level: data.game_state?.level || null,
        experience: data.game_state?.experience || null,
        aiContext: data.ai_context || {
          conversationHistory: [],
          worldState: {},
          lastSavePoint: null
        },
        createdAt: new Date(data.created_at),
        lastActivity: new Date(data.last_activity)
      };

      // Store in active sessions
      this.activeSessions.set(sessionId, gameState);
      return gameState;

    } catch (error) {
      console.error('Load guest session error:', error);
      return null;
    }
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

  /**
   * Sync character changes to database
   */
  async syncCharacterChanges(sessionId, characterChanges) {
    const gameState = this.getGameState(sessionId);
    if (!gameState || !gameState.character) {
      return { success: false, error: 'No character found' };
    }

    try {
      // Update in-memory state
      Object.assign(gameState.character, characterChanges);
      gameState.lastActivity = new Date();

      // Update database
      const { data, error } = await supabase
        .from('characters')
        .update({
          ...characterChanges,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameState.character.id);

      if (error) {
        throw new Error(`Character sync failed: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Character sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync inventory changes to database
   */
  async syncInventoryChanges(sessionId, inventoryChanges) {
    const gameState = this.getGameState(sessionId);
    if (!gameState || !gameState.character) {
      return { success: false, error: 'No character found' };
    }

    try {
      // Update in-memory inventory
      for (const change of inventoryChanges) {
        this.applyInventoryChange(gameState.inventory, change);
      }

      // Update database
      const characterId = gameState.character.id;
      
      for (const change of inventoryChanges) {
        await this.syncInventoryChangeToDatabase(characterId, change);
      }

      return { success: true };
    } catch (error) {
      console.error('Inventory sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply inventory change to in-memory state
   */
  applyInventoryChange(inventory, change) {
    const { action, item, quantity } = change;
    const existingItem = inventory.find(i => i.name === item);

    switch (action) {
      case 'add':
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          inventory.push({ name: item, quantity });
        }
        break;
      case 'remove':
      case 'use':
        if (existingItem) {
          existingItem.quantity = Math.max(0, existingItem.quantity - quantity);
          if (existingItem.quantity === 0) {
            const index = inventory.indexOf(existingItem);
            inventory.splice(index, 1);
          }
        }
        break;
    }
  }

  /**
   * Sync inventory change to database
   */
  async syncInventoryChangeToDatabase(characterId, change) {
    const { action, item, quantity } = change;

    switch (action) {
      case 'add':
        // Check if item exists
        const { data: existingItem } = await supabase
          .from('character_inventory')
          .select('*')
          .eq('character_id', characterId)
          .eq('item_name', item)
          .single();

        if (existingItem) {
          // Update quantity
          await supabase
            .from('character_inventory')
            .update({ 
              quantity: existingItem.quantity + quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);
        } else {
          // Add new item
          await supabase
            .from('character_inventory')
            .insert({
              character_id: characterId,
              item_name: item,
              quantity: quantity,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        break;

      case 'remove':
      case 'use':
        const { data: itemToUpdate } = await supabase
          .from('character_inventory')
          .select('*')
          .eq('character_id', characterId)
          .eq('item_name', item)
          .single();

        if (itemToUpdate) {
          const newQuantity = Math.max(0, itemToUpdate.quantity - quantity);
          
          if (newQuantity === 0) {
            // Remove item
            await supabase
              .from('character_inventory')
              .delete()
              .eq('id', itemToUpdate.id);
          } else {
            // Update quantity
            await supabase
              .from('character_inventory')
              .update({ 
                quantity: newQuantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', itemToUpdate.id);
          }
        }
        break;
    }
  }

  /**
   * Get delta changes since last sync
   */
  getDeltaChanges(sessionId, lastSyncTime) {
    const gameState = this.getGameState(sessionId);
    if (!gameState) {
      return null;
    }

    const changes = {};

    // Only include changes since last sync
    if (gameState.lastActivity > lastSyncTime) {
      if (gameState.character) {
        changes.character = gameState.character;
      }
      if (gameState.inventory && gameState.inventory.length > 0) {
        changes.inventory = gameState.inventory;
      }
      if (gameState.currentLocation) {
        changes.location = gameState.currentLocation;
      }
      if (gameState.combat) {
        changes.combat = gameState.combat;
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }
}

module.exports = GameStateManager;
