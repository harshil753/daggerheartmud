const supabase = require('../config/supabase');

/**
 * Supabase Storage Service
 * Handles all data storage operations for campaigns, characters, and conversation history
 */
class SupabaseStorage {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Store campaign data from AI response
   */
  async storeCampaign(sessionId, campaignData) {
    try {
      console.log('🗄️ Storing campaign data:', campaignData);
      
      const { data, error } = await this.supabase
        .from('campaigns')
        .insert({
          title: campaignData.title,
          description: campaignData.description,
          story_length: campaignData.storyLength,
          total_chapters: campaignData.totalChapters,
          current_chapter: 1,
          campaign_data: campaignData.campaignData,
          world_state: campaignData.worldState || {},
          is_active: true,
          max_players: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error storing campaign:', error);
        throw error;
      }

      console.log('✅ Campaign stored with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ SupabaseStorage.storeCampaign error:', error);
      throw error;
    }
  }

  /**
   * Store character data from AI response
   */
  async storeCharacter(sessionId, characterData, campaignId = null) {
    try {
      console.log('🗄️ Storing character data:', characterData);
      
      const { data, error } = await this.supabase
        .from('characters')
        .insert({
          name: characterData.name,
          ancestry: characterData.ancestry,
          class: characterData.class,
          community: characterData.community,
          level: characterData.level || 1,
          experience: characterData.experience || 0,
          agility: characterData.agility || 0,
          strength: characterData.strength || 0,
          finesse: characterData.finesse || 0,
          instinct: characterData.instinct || 0,
          presence: characterData.presence || 0,
          knowledge: characterData.knowledge || 0,
          hit_points_current: characterData.hitPoints || 6,
          hit_points_max: characterData.hitPoints || 6,
          stress_current: characterData.stress || 0,
          stress_max: 6,
          hope_tokens: characterData.hopeTokens || 2,
          fear_tokens: characterData.fearTokens || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error storing character:', error);
        throw error;
      }

      // Store equipment if provided
      if (characterData.equipment) {
        await this.storeCharacterEquipment(data.id, characterData.equipment);
      }

      // Store inventory if provided
      if (characterData.inventory) {
        await this.storeCharacterInventory(data.id, characterData.inventory);
      }

      console.log('✅ Character stored with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ SupabaseStorage.storeCharacter error:', error);
      throw error;
    }
  }

  /**
   * Store character equipment
   */
  async storeCharacterEquipment(characterId, equipment) {
    try {
      if (equipment.primary_weapon) {
        await this.supabase
          .from('character_inventory')
          .insert({
            character_id: characterId,
            item_id: equipment.primary_weapon.id,
            is_equipped: true,
            acquired_location: 'starting_equipment'
          });
      }

      if (equipment.secondary_weapon) {
        await this.supabase
          .from('character_inventory')
          .insert({
            character_id: characterId,
            item_id: equipment.secondary_weapon.id,
            is_equipped: true,
            acquired_location: 'starting_equipment'
          });
      }

      if (equipment.armor) {
        await this.supabase
          .from('character_inventory')
          .insert({
            character_id: characterId,
            item_id: equipment.armor.id,
            is_equipped: true,
            acquired_location: 'starting_equipment'
          });
      }

      console.log('✅ Character equipment stored');
    } catch (error) {
      console.error('❌ Error storing character equipment:', error);
      throw error;
    }
  }

  /**
   * Store character inventory
   */
  async storeCharacterInventory(characterId, inventory) {
    try {
      for (const item of inventory) {
        await this.supabase
          .from('character_inventory')
          .insert({
            character_id: characterId,
            item_id: item.id,
            quantity: item.quantity || 1,
            is_equipped: item.is_equipped || false,
            acquired_location: 'starting_inventory'
          });
      }

      console.log('✅ Character inventory stored');
    } catch (error) {
      console.error('❌ Error storing character inventory:', error);
      throw error;
    }
  }

  /**
   * Store conversation history
   */
  async storeConversationHistory(sessionId, history, campaignId = null) {
    try {
      console.log('🗄️ Storing conversation history, messages:', history.length);
      
      const { data, error } = await this.supabase
        .from('campaign_state')
        .upsert({
          campaign_id: campaignId,
          ai_conversation_history: history,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing conversation history:', error);
        throw error;
      }

      console.log('✅ Conversation history stored');
      return data;
    } catch (error) {
      console.error('❌ SupabaseStorage.storeConversationHistory error:', error);
      throw error;
    }
  }

  /**
   * Store campaign state with phase tracking
   */
  async storeCampaignState(sessionId, campaignId, phase, phase1SessionId = null, phase2SessionId = null, cachedContentName = null) {
    try {
      console.log('🗄️ Storing campaign state for phase:', phase);
      
      const { data, error } = await this.supabase
        .from('campaign_state')
        .upsert({
          campaign_id: campaignId,
          session_phase: phase,
          phase1_session_id: phase1SessionId,
          phase2_session_id: phase2SessionId,
          cached_content_name: cachedContentName,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing campaign state:', error);
        throw error;
      }

      console.log('✅ Campaign state stored');
      return data;
    } catch (error) {
      console.error('❌ SupabaseStorage.storeCampaignState error:', error);
      throw error;
    }
  }

  /**
   * Retrieve campaign data
   */
  async getCampaign(campaignId) {
    try {
      const { data, error } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('❌ Error retrieving campaign:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ SupabaseStorage.getCampaign error:', error);
      throw error;
    }
  }

  /**
   * Retrieve character data
   */
  async getCharacter(characterId) {
    try {
      const { data, error } = await this.supabase
        .from('characters')
        .select(`
          *,
          character_inventory (
            *,
            items (*)
          )
        `)
        .eq('id', characterId)
        .single();

      if (error) {
        console.error('❌ Error retrieving character:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ SupabaseStorage.getCharacter error:', error);
      throw error;
    }
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(campaignId) {
    try {
      const { data, error } = await this.supabase
        .from('campaign_state')
        .select('ai_conversation_history')
        .eq('campaign_id', campaignId)
        .single();

      if (error) {
        console.error('❌ Error retrieving conversation history:', error);
        return [];
      }

      return data?.ai_conversation_history || [];
    } catch (error) {
      console.error('❌ SupabaseStorage.getConversationHistory error:', error);
      return [];
    }
  }

  /**
   * Parse campaign data from AI response
   */
  parseCampaignData(aiResponse) {
    const message = aiResponse.message || '';
    
    // Extract campaign title from tags (handle both formats)
    const titleMatch = message.match(/\*\*\[CAMPAIGN_TITLE\]\*?\*?:\s*([^\n]+)/i) || 
                      message.match(/\*\*\[CAMPAIGN TITLE\]\*?\*?:\s*([^\n]+)/i) ||
                      message.match(/\*\*Campaign Title\*\*[:\s]*([^\n]+)/i) ||
                      message.match(/Campaign Title[:\s]*([^\n]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Campaign';

    // Extract description from tags (handle both formats)
    const descMatch = message.match(/\*\*\[CAMPAIGN_DESCRIPTION\]\*?\*?:\s*([^\n]+)/i) || 
                     message.match(/\*\*\[CAMPAIGN DESCRIPTION\]\*?\*?:\s*([^\n]+)/i) ||
                     message.match(/\*\*Campaign Description\*\*[:\s]*([^\n]+)/i) ||
                     message.match(/Campaign Description[:\s]*([^\n]+)/i) ||
                     message.match(/Campaign Overview[:\s]*([^\n]+)/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract story length from tags (handle both formats)
    const lengthMatch = message.match(/\*\*\[CAMPAIGN_LENGTH\]\*?\*?:\s*([^\n]+)/i) || 
                       message.match(/\*\*Campaign Length\*\*[:\s]*([^\n]+)/i) ||
                       message.match(/Campaign Length[:\s]*([^\n]+)/i) ||
                       message.match(/(Short|Medium|Long)\s+campaign/i);
    
    // Extract only the length value (short, medium, long) from strings like 'short (4 chapters)'
    let storyLength = 'short'; // default
    if (lengthMatch) {
      const rawLength = lengthMatch[1].toLowerCase();
      if (rawLength.includes('short')) {
        storyLength = 'short';
      } else if (rawLength.includes('medium')) {
        storyLength = 'medium';
      } else if (rawLength.includes('long')) {
        storyLength = 'long';
      }
    }

    // Calculate total chapters based on length (4 for short, 8 for medium, 12 for long)
    const totalChapters = storyLength === 'short' ? 4 : 
                         storyLength === 'medium' ? 8 : 12;
    
    

    return {
      title,
      description,
      storyLength,
      totalChapters,
      campaignData: {
        setting: this.extractSetting(message),
        conflict: this.extractConflict(message),
        goals: this.extractGoals(message)
      },
      worldState: {}
    };
  }

  /**
   * Parse character data from AI response
   */
  parseCharacterData(aiResponse) {
    const message = aiResponse.message || '';
    
    // Extract character name from tags
    const nameMatch = message.match(/\*\*\[CHARACTER_NAME\]\*?\*?:\s*([^\n]+)/i) || 
                     message.match(/NAME[:\s]*([^\n]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

    // Extract class from tags
    const classMatch = message.match(/\*\*\[CHARACTER_CLASS\]\*?\*?:\s*([^\n]+)/i) || 
                      message.match(/CLASS[:\s]*([^\n]+)/i);
    const characterClass = classMatch ? classMatch[1].trim() : '';

    // Extract ancestry from tags
    const ancestryMatch = message.match(/\*\*\[CHARACTER_ANCESTRY\]\*?\*?:\s*([^\n]+)/i) || 
                         message.match(/ANCESTRY[:\s]*([^\n]+)/i);
    const ancestry = ancestryMatch ? ancestryMatch[1].trim() : '';

    // Extract community from tags
    const communityMatch = message.match(/\*\*\[CHARACTER_COMMUNITY\]\*?\*?:\s*([^\n]+)/i) || 
                          message.match(/COMMUNITY[:\s]*([^\n]+)/i);
    const community = communityMatch ? communityMatch[1].trim() : '';

    // Extract traits
    const traits = this.extractTraits(message);

    // Extract HP from tags
    const hpMatch = message.match(/\*\*\[CHARACTER_HP\]\*?\*?:\s*(\d+)/i) || 
                   message.match(/HP[:\s]*(\d+)/i);
    const hitPoints = hpMatch ? parseInt(hpMatch[1]) : 6;

    // Extract Hope tokens from tags
    const hopeMatch = message.match(/\*\*\[CHARACTER_HOPE\]\*?\*?:\s*(\d+)/i) || 
                     message.match(/HOPE[:\s]*\[X\]\s*\[X\]/i);
    const hopeTokens = hopeMatch ? parseInt(hopeMatch[1]) : 2;

    return {
      name,
      class: characterClass,
      ancestry,
      community,
      level: 1,
      ...traits,
      hitPoints,
      hopeTokens,
      equipment: this.extractEquipment(message),
      inventory: this.extractInventory(message)
    };
  }

  /**
   * Extract traits from character sheet
   */
  extractTraits(message) {
    const traits = {};
    const traitPatterns = {
      agility: /AGILITY[:\s]*([+-]?\d+)/i,
      strength: /STRENGTH[:\s]*([+-]?\d+)/i,
      finesse: /FINESSE[:\s]*([+-]?\d+)/i,
      instinct: /INSTINCT[:\s]*([+-]?\d+)/i,
      presence: /PRESENCE[:\s]*([+-]?\d+)/i,
      knowledge: /KNOWLEDGE[:\s]*([+-]?\d+)/i
    };

    for (const [trait, pattern] of Object.entries(traitPatterns)) {
      const match = message.match(pattern);
      traits[trait] = match ? parseInt(match[1]) : 0;
    }

    return traits;
  }

  /**
   * Extract equipment from character sheet
   */
  extractEquipment(message) {
    // This would need to be implemented based on your equipment parsing logic
    // For now, return empty object
    return {};
  }

  /**
   * Extract inventory from character sheet
   */
  extractInventory(message) {
    // This would need to be implemented based on your inventory parsing logic
    // For now, return empty array
    return [];
  }

  /**
   * Extract setting from campaign description
   */
  extractSetting(message) {
    const settingMatch = message.match(/Setting[:\s]*([^\n]+)/i);
    return settingMatch ? settingMatch[1].trim() : '';
  }

  /**
   * Extract conflict from campaign description
   */
  extractConflict(message) {
    const conflictMatch = message.match(/Conflict[:\s]*([^\n]+)/i);
    return conflictMatch ? conflictMatch[1].trim() : '';
  }

  /**
   * Extract goals from campaign description
   */
  extractGoals(message) {
    const goalsMatch = message.match(/Goals[:\s]*([^\n]+)/i);
    return goalsMatch ? goalsMatch[1].trim() : '';
  }

  /**
   * Extract equipment from character data using new tag format
   */
  extractEquipment(message) {
    const equipment = {};
    
    // Extract primary weapon
    const primaryWeapon = message.match(/\*\*\[PRIMARY_WEAPON\]\*?\*?:\s*([^\n]+)/i);
    if (primaryWeapon) {
      const weaponName = primaryWeapon[1].trim();
      equipment[weaponName] = { equipped: true, quantity: 1 };
    }
    
    // Extract secondary weapon
    const secondaryWeapon = message.match(/\*\*\[SECONDARY_WEAPON\]\*?\*?:\s*([^\n]+)/i);
    if (secondaryWeapon) {
      const weaponName = secondaryWeapon[1].trim();
      equipment[weaponName] = { equipped: true, quantity: 1 };
    }
    
    // Extract armor
    const armor = message.match(/\*\*\[ARMOR\]\*?\*?:\s*([^\n]+)/i);
    if (armor) {
      const armorName = armor[1].trim();
      equipment[armorName] = { equipped: true, quantity: 1 };
    }
    
    // Extract shield
    const shield = message.match(/\*\*\[SHIELD\]\*?\*?:\s*([^\n]+)/i);
    if (shield) {
      const shieldName = shield[1].trim();
      equipment[shieldName] = { equipped: true, quantity: 1 };
    }
    
    // ACCESSORIES are handled by extractInventory, not equipment
    
    // Extract special items (comma-separated list)
    const specialItems = message.match(/\*\*\[SPECIAL_ITEMS\]\*?\*?:\s*([^\n]+)/i);
    if (specialItems) {
      const specialItemsList = specialItems[1].split(',').map(item => item.trim());
      specialItemsList.forEach(item => {
        if (item) {
          equipment[item] = { equipped: true, quantity: 1 };
        }
      });
    }
    
    // Fallback: Look for legacy equipment tags
    const equipmentMatch = message.match(/\*\*\[CHARACTER_EQUIPMENT\]\*?\*?:\s*([^\n]+)/i) ||
                         message.match(/EQUIPMENT[:\s]*([^\n]+)/i);
    
    if (equipmentMatch && Object.keys(equipment).length === 0) {
      const equipmentText = equipmentMatch[1].trim();
      const equipmentList = equipmentText.split(',').map(item => item.trim());
      
      equipmentList.forEach(item => {
        if (item) {
          equipment[item] = { equipped: true, quantity: 1 };
        }
      });
    }
    
    // Fallback: Look for old format patterns
    if (Object.keys(equipment).length === 0) {
      const weaponMatch = message.match(/\*\s*Primary Weapon:\s*([^(]+)/i) ||
                           message.match(/\*([^(]+)\s*\([^)]+\)\*/i);
      const shieldMatch = message.match(/\*\s*Shield:\s*([^(]+)/i);
      const armorMatch = message.match(/\*\s*Armor:\s*([^(]+)/i);
      
      if (weaponMatch) {
        const weaponName = weaponMatch[1].trim().split(' ')[0];
        equipment[weaponName] = { equipped: true, quantity: 1 };
      }
      
      if (shieldMatch) {
        const shieldName = shieldMatch[1].trim().split(' ')[0];
        equipment[shieldName] = { equipped: true, quantity: 1 };
      }
      
      if (armorMatch) {
        const armorName = armorMatch[1].trim().split(' ')[0];
        equipment[armorName] = { equipped: true, quantity: 1 };
      }
      
      // Accessories like torch, rope, supplies are handled by extractInventory, not equipment
    }
    
    return equipment;
  }

  /**
   * Extract inventory from character data using new tag format
   */
  extractInventory(message) {
    const inventory = [];
    
    // Extract accessories (comma-separated list)
    const accessories = message.match(/\*\*\[ACCESSORIES\]\*?\*?:\s*([^\n]+)/i);
    if (accessories) {
      const accessoriesList = accessories[1].split(',').map(item => item.trim());
      accessoriesList.forEach(item => {
        if (item) {
          inventory.push({
            name: item,
            quantity: 1,
            equipped: false
          });
        }
      });
    }
    
    // Extract special items (comma-separated list)
    const specialItems = message.match(/\*\*\[SPECIAL_ITEMS\]\*?\*?:\s*([^\n]+)/i);
    if (specialItems) {
      const specialItemsList = specialItems[1].split(',').map(item => item.trim());
      specialItemsList.forEach(item => {
        if (item) {
          inventory.push({
            name: item,
            quantity: 1,
            equipped: false
          });
        }
      });
    }
    
    // Extract currency
    const currency = message.match(/\*\*\[CURRENCY\]\*?\*?:\s*([^\n]+)/i);
    if (currency) {
      const currencyText = currency[1].trim();
      inventory.push({
        name: currencyText,
        quantity: 1,
        equipped: false
      });
    }
    
    // Fallback: Look for legacy inventory tags
    const inventoryMatch = message.match(/\*\*\[CHARACTER_INVENTORY\]\*?\*?:\s*([^\n]+)/i) ||
                          message.match(/INVENTORY[:\s]*([^\n]+)/i);
    
    if (inventoryMatch && inventory.length === 0) {
      const inventoryText = inventoryMatch[1].trim();
      const inventoryList = inventoryText.split(',').map(item => item.trim());
      
      inventoryList.forEach(item => {
        if (item) {
          inventory.push({
            name: item,
            quantity: 1,
            equipped: false
          });
        }
      });
    }
    
    // If no specific inventory found, use equipment as inventory
    if (inventory.length === 0) {
      const equipment = this.extractEquipment(message);
      
      Object.keys(equipment).forEach(item => {
        inventory.push({
          name: item,
          quantity: equipment[item].quantity || 1,
          equipped: equipment[item].equipped || false
        });
      });
    }
    
    return inventory;
  }

  /**
   * Create a save point
   */
  async createSavePoint(savePointData) {
    try {
      const { data, error } = await this.supabase
        .from('save_points')
        .insert([{
          campaign_id: savePointData.campaign_id,
          character_id: savePointData.character_id,
          save_point_data: savePointData.save_point_data,
          cached_content_name: savePointData.cached_content_name,
          session_id: savePointData.session_id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating save point:', error);
        throw error;
      }

      console.log('✅ Save point created:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error creating save point:', error);
      throw error;
    }
  }

  /**
   * Get save point by ID
   */
  async getSavePoint(savePointId) {
    try {
      const { data, error } = await this.supabase
        .from('save_points')
        .select('*')
        .eq('id', savePointId)
        .single();

      if (error) {
        console.error('❌ Error getting save point:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting save point:', error);
      throw error;
    }
  }

  /**
   * Get all save points for a campaign
   */
  async getCampaignSavePoints(campaignId) {
    try {
      const { data, error } = await this.supabase
        .from('save_points')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting campaign save points:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting campaign save points:', error);
      throw error;
    }
  }

  /**
   * Get campaign state by session ID
   */
  async getCampaignState(sessionId) {
    try {
      const { data, error } = await this.supabase
        .from('campaign_state')
        .select('*')
        .or(`phase1_session_id.eq.${sessionId},phase2_session_id.eq.${sessionId}`)
        .single();

      if (error) {
        console.error('❌ Error getting campaign state:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting campaign state:', error);
      throw error;
    }
  }

  /**
   * Update character stats from combat stat changes
   */
  async updateCharacterStats(characterId, statChanges) {
    try {
      // Find the player character in the stat changes
      const playerChange = statChanges.find(change => 
        change.character && !change.character.toLowerCase().includes('enemy') && 
        !change.character.toLowerCase().includes('goblin') && 
        !change.character.toLowerCase().includes('orc') &&
        !change.character.toLowerCase().includes('dragon')
      );

      if (playerChange) {
        const updateData = {};
        
        // Map stat changes to database fields
        if (playerChange.stats.hp) {
          const [current, max] = playerChange.stats.hp.split('/').map(v => parseInt(v.trim()));
          if (!isNaN(current)) updateData.hit_points_current = current;
          if (!isNaN(max)) updateData.hit_points_max = max;
        }
        
        if (playerChange.stats.stress) {
          const [current, max] = playerChange.stats.stress.split('/').map(v => parseInt(v.trim()));
          if (!isNaN(current)) updateData.stress_current = current;
          if (!isNaN(max)) updateData.stress_max = max;
        }
        
        if (playerChange.stats.hope) {
          const hope = parseInt(playerChange.stats.hope);
          if (!isNaN(hope)) updateData.hope_tokens = hope;
        }
        
        if (playerChange.stats.fear) {
          const fear = parseInt(playerChange.stats.fear);
          if (!isNaN(fear)) updateData.fear_tokens = fear;
        }

        // Update character in database
        if (Object.keys(updateData).length > 0) {
          const { error } = await this.supabase
            .from('characters')
            .update(updateData)
            .eq('id', characterId);

          if (error) {
            console.error('❌ Error updating character stats:', error);
            throw error;
          }

          console.log('✅ Character stats updated:', updateData);
        }
      }

      // Store combat log for all stat changes
      const combatLog = {
        character_id: characterId,
        stat_changes: statChanges,
        timestamp: new Date().toISOString()
      };

      const { error: logError } = await this.supabase
        .from('combat_logs')
        .insert([combatLog]);

      if (logError) {
        console.warn('⚠️ Could not log combat stats:', logError);
      }

    } catch (error) {
      console.error('❌ Error updating character stats:', error);
      throw error;
    }
  }
}

module.exports = SupabaseStorage;
