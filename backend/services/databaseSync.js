const { createClient } = require('@supabase/supabase-js');

/**
 * Database Sync Service
 * Syncs parsed AI response data to Supabase database
 */
class DatabaseSync {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.syncQueue = [];
    this.isProcessing = false;
  }

  /**
   * Sync parsed changes to database
   */
  async syncChanges(changes, gameState, sessionId) {
    try {
      console.log('Syncing changes to database:', changes);
      
      // Check if this is a guest session
      if (gameState.isGuest) {
        return await this.syncGuestChanges(changes, gameState, sessionId);
      }
      
      const syncPromises = [];

      // Sync character changes
      if (changes.character && Object.keys(changes.character).length > 0) {
        syncPromises.push(this.syncCharacterChanges(changes.character, gameState, sessionId));
      }

      // Sync inventory changes
      if (changes.inventory && changes.inventory.length > 0) {
        syncPromises.push(this.syncInventoryChanges(changes.inventory, gameState, sessionId));
      }

      // Sync location changes
      if (changes.location) {
        syncPromises.push(this.syncLocationChange(changes.location, gameState, sessionId));
      }

      // Sync combat changes
      if (changes.combat) {
        syncPromises.push(this.syncCombatChange(changes.combat, gameState, sessionId));
      }

      // Sync level progression
      if (changes.level) {
        syncPromises.push(this.syncLevelProgression(changes.level, gameState, sessionId));
      }

      // Sync experience changes
      if (changes.experience) {
        syncPromises.push(this.syncExperienceChange(changes.experience, gameState, sessionId));
      }

      // Execute all sync operations
      const results = await Promise.allSettled(syncPromises);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Sync operation ${index} failed:`, result.reason);
        }
      });

      return {
        success: true,
        synced: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      };

    } catch (error) {
      console.error('Database sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync character stat changes
   */
  async syncCharacterChanges(characterChanges, gameState, sessionId) {
    if (!gameState.character || !gameState.character.id) {
      console.log('No character ID found, skipping character sync');
      return;
    }

    const characterId = gameState.character.id;
    const updateData = {};

    // Map stat changes to database fields
    Object.entries(characterChanges).forEach(([stat, value]) => {
      switch (stat) {
        case 'hp':
        case 'hit_points_current':
          updateData.hit_points_current = Math.max(0, value);
          break;
        case 'stress':
        case 'stress_current':
          updateData.stress_current = Math.max(0, value);
          break;
        case 'hope':
        case 'hope_tokens':
          updateData.hope_tokens = Math.max(0, value);
          break;
        case 'fear':
        case 'fear_tokens':
          updateData.fear_tokens = Math.max(0, value);
          break;
        case 'level':
          updateData.level = Math.max(1, value);
          break;
        case 'experience':
        case 'experience_points':
          updateData.experience_points = Math.max(0, value);
          break;
        default:
          // Handle trait changes
          if (['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'].includes(stat)) {
            updateData[`trait_${stat}`] = Math.max(-1, Math.min(5, value));
          }
          break;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return;
    }

    // Add timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('characters')
      .update(updateData)
      .eq('id', characterId);

    if (error) {
      throw new Error(`Character update failed: ${error.message}`);
    }

    console.log('Character stats synced successfully');
    return data;
  }

  /**
   * Sync inventory changes
   */
  async syncInventoryChanges(inventoryChanges, gameState, sessionId) {
    if (!gameState.character || !gameState.character.id) {
      console.log('No character ID found, skipping inventory sync');
      return;
    }

    const characterId = gameState.character.id;

    for (const change of inventoryChanges) {
      const { action, item, quantity } = change;

      switch (action) {
        case 'add':
          await this.addInventoryItem(characterId, item, quantity);
          break;
        case 'remove':
          await this.removeInventoryItem(characterId, item, quantity);
          break;
        case 'use':
          await this.useInventoryItem(characterId, item, quantity);
          break;
      }
    }

    console.log('Inventory changes synced successfully');
  }

  /**
   * Add item to inventory
   */
  async addInventoryItem(characterId, itemName, quantity) {
    // Check if item already exists
    const { data: existingItem } = await this.supabase
      .from('character_inventory')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_name', itemName)
      .single();

    if (existingItem) {
      // Update quantity
      const { error } = await this.supabase
        .from('character_inventory')
        .update({ 
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Add new item
      const { error } = await this.supabase
        .from('character_inventory')
        .insert({
          character_id: characterId,
          item_name: itemName,
          quantity: quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }
  }

  /**
   * Remove item from inventory
   */
  async removeInventoryItem(characterId, itemName, quantity) {
    const { data: existingItem } = await this.supabase
      .from('character_inventory')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_name', itemName)
      .single();

    if (existingItem) {
      const newQuantity = Math.max(0, existingItem.quantity - quantity);
      
      if (newQuantity === 0) {
        // Remove item completely
        const { error } = await this.supabase
          .from('character_inventory')
          .delete()
          .eq('id', existingItem.id);
        
        if (error) throw error;
      } else {
        // Update quantity
        const { error } = await this.supabase
          .from('character_inventory')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);
        
        if (error) throw error;
      }
    }
  }

  /**
   * Use item from inventory
   */
  async useInventoryItem(characterId, itemName, quantity) {
    // This is the same as remove, but we might want to track usage separately
    await this.removeInventoryItem(characterId, itemName, quantity);
  }

  /**
   * Sync location change
   */
  async syncLocationChange(locationChange, gameState, sessionId) {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .update({
        current_location: locationChange.name,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Location update failed: ${error.message}`);
    }

    console.log('Location change synced successfully');
    return data;
  }

  /**
   * Sync combat change
   */
  async syncCombatChange(combatChange, gameState, sessionId) {
    const combatData = {
      status: combatChange.status,
      updated_at: new Date().toISOString()
    };

    if (combatChange.status === 'start') {
      combatData.enemy_name = combatChange.enemy;
      combatData.started_at = new Date().toISOString();
    } else if (combatChange.status === 'end') {
      combatData.result = combatChange.result;
      combatData.ended_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('game_sessions')
      .update(combatData)
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Combat update failed: ${error.message}`);
    }

    console.log('Combat change synced successfully');
    return data;
  }

  /**
   * Sync level progression
   */
  async syncLevelProgression(levelData, gameState, sessionId) {
    if (!gameState.character || !gameState.character.id) {
      console.log('No character ID found, skipping level sync');
      return;
    }

    const characterId = gameState.character.id;

    // Update character level
    const { error: charError } = await this.supabase
      .from('characters')
      .update({
        level: levelData.newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (charError) {
      throw new Error(`Character level update failed: ${charError.message}`);
    }

    // Log level up event
    const { error: logError } = await this.supabase
      .from('character_events')
      .insert({
        character_id: characterId,
        event_type: 'level_up',
        event_data: { new_level: levelData.newLevel },
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.warn('Failed to log level up event:', logError.message);
    }

    console.log('Level progression synced successfully');
  }

  /**
   * Sync experience change
   */
  async syncExperienceChange(experienceData, gameState, sessionId) {
    if (!gameState.character || !gameState.character.id) {
      console.log('No character ID found, skipping experience sync');
      return;
    }

    const characterId = gameState.character.id;

    // Get current experience
    const { data: character } = await this.supabase
      .from('characters')
      .select('experience_points')
      .eq('id', characterId)
      .single();

    if (character) {
      const newExperience = (character.experience_points || 0) + experienceData.gained;

      const { error } = await this.supabase
        .from('characters')
        .update({
          experience_points: newExperience,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);

      if (error) {
        throw new Error(`Experience update failed: ${error.message}`);
      }

      // Log experience gain event
      const { error: logError } = await this.supabase
        .from('character_events')
        .insert({
          character_id: characterId,
          event_type: 'experience_gain',
          event_data: { gained: experienceData.gained, total: newExperience },
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('Failed to log experience gain event:', logError.message);
      }

      console.log('Experience change synced successfully');
    }
  }

  /**
   * Get character data for delta tracking
   */
  async getCharacterData(characterId) {
    const { data, error } = await this.supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (error) {
      throw new Error(`Failed to get character data: ${error.message}`);
    }

    return data;
  }

  /**
   * Get inventory data for delta tracking
   */
  async getInventoryData(characterId) {
    const { data, error } = await this.supabase
      .from('character_inventory')
      .select('*')
      .eq('character_id', characterId);

    if (error) {
      throw new Error(`Failed to get inventory data: ${error.message}`);
    }

    return data;
  }

  /**
   * Sync changes for guest sessions (JSON storage)
   */
  async syncGuestChanges(changes, gameState, sessionId) {
    try {
      console.log('Syncing guest session changes:', changes);
      
      // Get current guest session data
      const { data: existingSession, error: fetchError } = await this.supabase
        .from('guest_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch guest session: ${fetchError.message}`);
      }

      // Prepare updated data
      const updatedData = {
        session_id: sessionId,
        character_data: gameState.character || null,
        inventory_data: gameState.inventory || [],
        game_state: {
          currentLocation: gameState.currentLocation,
          combat: gameState.combat,
          level: gameState.level,
          experience: gameState.experience
        },
        ai_context: gameState.aiContext || {},
        last_activity: new Date().toISOString(),
        is_active: true
      };

      // Apply changes to the data
      if (changes.character) {
        updatedData.character_data = {
          ...updatedData.character_data,
          ...changes.character
        };
      }

      if (changes.inventory && changes.inventory.length > 0) {
        updatedData.inventory_data = this.applyInventoryChanges(
          updatedData.inventory_data, 
          changes.inventory
        );
      }

      if (changes.location) {
        updatedData.game_state.currentLocation = changes.location;
      }

      if (changes.combat) {
        updatedData.game_state.combat = changes.combat;
      }

      if (changes.level) {
        updatedData.game_state.level = changes.level;
      }

      if (changes.experience) {
        updatedData.game_state.experience = changes.experience;
      }

      // Upsert the guest session
      const { data, error } = await this.supabase
        .from('guest_sessions')
        .upsert(updatedData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        throw new Error(`Failed to sync guest session: ${error.message}`);
      }

      console.log('Guest session synced successfully');
      return {
        success: true,
        synced: ['guest_session'],
        failed: [],
        guestMode: true
      };

    } catch (error) {
      console.error('Guest session sync error:', error);
      return {
        success: false,
        error: error.message,
        synced: [],
        failed: [{ type: 'guest_session', error: error.message }],
        guestMode: true
      };
    }
  }

  /**
   * Apply inventory changes to guest session inventory
   */
  applyInventoryChanges(currentInventory, changes) {
    const inventory = [...(currentInventory || [])];

    changes.forEach(change => {
      const { action, item, quantity = 1 } = change;
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
    });

    return inventory;
  }

  /**
   * Load guest session data
   */
  async loadGuestSession(sessionId) {
    try {
      const { data, error } = await this.supabase
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

      return data;
    } catch (error) {
      console.error('Load guest session error:', error);
      return null;
    }
  }

  /**
   * Cleanup expired guest sessions
   */
  async cleanupExpiredGuestSessions() {
    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_expired_guest_sessions');

      if (error) {
        throw new Error(`Failed to cleanup guest sessions: ${error.message}`);
      }

      console.log(`Cleaned up ${data} expired guest sessions`);
      return data;
    } catch (error) {
      console.error('Guest session cleanup error:', error);
      return 0;
    }
  }
}

module.exports = DatabaseSync;
