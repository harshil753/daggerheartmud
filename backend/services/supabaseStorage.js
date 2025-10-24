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
    
    // Extract campaign title from tags
    const titleMatch = message.match(/\*\*\[CAMPAIGN_TITLE\]\*?\*?:\s*([^\n]+)/i) || 
                      message.match(/Campaign Title[:\s]*([^\n]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Campaign';

    // Extract description from tags
    const descMatch = message.match(/\*\*\[CAMPAIGN_DESCRIPTION\]\*?\*?:\s*([^\n]+)/i) || 
                     message.match(/Campaign Overview[:\s]*([^\n]+)/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract story length from tags
    const lengthMatch = message.match(/\*\*\[CAMPAIGN_LENGTH\]\*?\*?:\s*([^\n]+)/i) || 
                       message.match(/(Short|Medium|Long)\s+campaign/i);
    const storyLength = lengthMatch ? lengthMatch[1].toLowerCase() : 'short';

    // Calculate total chapters based on length
    const totalChapters = storyLength === 'short' ? 5 : 
                         storyLength === 'medium' ? 10 : 15;

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
}

module.exports = SupabaseStorage;
