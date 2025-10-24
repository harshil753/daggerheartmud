const { GoogleGenAI } = require('@google/genai');
const SupabaseStorage = require('./supabaseStorage');
const fs = require('fs');
const path = require('path');

/**
 * Phase 2 Cache Builder
 * Builds cached content from stored data for adventure continuation
 */
class Phase2CacheBuilder {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.supabaseStorage = new SupabaseStorage();
  }

  /**
   * Build Phase 2 cached content
   */
  async buildPhase2Cache(sessionId, campaignId, characterId, fullConversationHistory, seedData) {
    try {
      console.log('🏗️ Building Phase 2 cache for session:', sessionId);
      
      // 1. Retrieve data from Supabase
      const campaignData = await this.supabaseStorage.getCampaign(campaignId);
      const characterData = await this.supabaseStorage.getCharacter(characterId);
      
      // 2. Load adventure rules for gameplay guidance
      const adventureRules = await this.loadAdventureRules();
      
      // 3. Build consolidated context (INCLUDING seed data)
      const contextString = this.buildContextString(
        campaignData,
        characterData,
        fullConversationHistory,
        adventureRules,
        seedData
      );
      
      // 4. Create cached content
      const cachedContent = await this.createCachedContent(contextString, sessionId);
      
      console.log('✅ Phase 2 cache built successfully:', cachedContent.name);
      return cachedContent;
    } catch (error) {
      console.error('❌ Error building Phase 2 cache:', error);
      throw error;
    }
  }

  /**
   * Build context string for caching
   */
  buildContextString(campaignData, characterData, conversationHistory, adventureRules, seedData) {
    const context = [];

    // Campaign Overview
    context.push('# CAMPAIGN OVERVIEW');
    context.push(`Title: ${campaignData.title}`);
    context.push(`Description: ${campaignData.description}`);
    context.push(`Story Length: ${campaignData.story_length}`);
    context.push(`Current Chapter: ${campaignData.current_chapter}/${campaignData.total_chapters}`);
    context.push('');

    // Character Information
    context.push('# CHARACTER INFORMATION');
    context.push(`Name: ${characterData.name}`);
    context.push(`Class: ${characterData.class}`);
    context.push(`Ancestry: ${characterData.ancestry}`);
    context.push(`Community: ${characterData.community}`);
    context.push(`Level: ${characterData.level}`);
    context.push('');

    // Character Stats
    context.push('## Character Stats');
    context.push(`Agility: ${characterData.agility}`);
    context.push(`Strength: ${characterData.strength}`);
    context.push(`Finesse: ${characterData.finesse}`);
    context.push(`Instinct: ${characterData.instinct}`);
    context.push(`Presence: ${characterData.presence}`);
    context.push(`Knowledge: ${characterData.knowledge}`);
    context.push('');

    // Character Resources
    context.push('## Character Resources');
    context.push(`Hit Points: ${characterData.hit_points_current}/${characterData.hit_points_max}`);
    context.push(`Stress: ${characterData.stress_current}/${characterData.stress_max}`);
    context.push(`Hope Tokens: ${characterData.hope_tokens}`);
    context.push(`Fear Tokens: ${characterData.fear_tokens}`);
    context.push('');

    // Equipment and Inventory
    if (characterData.character_inventory && characterData.character_inventory.length > 0) {
      context.push('## Equipment and Inventory');
      for (const item of characterData.character_inventory) {
        if (item.is_equipped) {
          context.push(`Equipped: ${item.items.name} (${item.items.type})`);
        } else {
          context.push(`Inventory: ${item.items.name} x${item.quantity}`);
        }
      }
      context.push('');
    }

    // Campaign State
    if (campaignData.campaign_data) {
      context.push('# CAMPAIGN STATE');
      context.push(`Setting: ${campaignData.campaign_data.setting || 'Unknown'}`);
      context.push(`Conflict: ${campaignData.campaign_data.conflict || 'Unknown'}`);
      context.push(`Goals: ${campaignData.campaign_data.goals || 'Unknown'}`);
      context.push('');
    }

    // World State
    if (campaignData.world_state && Object.keys(campaignData.world_state).length > 0) {
      context.push('# WORLD STATE');
      for (const [key, value] of Object.entries(campaignData.world_state)) {
        context.push(`${key}: ${JSON.stringify(value)}`);
      }
      context.push('');
    }

    // Key Conversation Moments
    context.push('# KEY CONVERSATION MOMENTS');
    const keyMoments = this.extractKeyMoments(conversationHistory);
    for (const moment of keyMoments) {
      context.push(`- ${moment.type}: ${moment.content.substring(0, 100)}...`);
    }
    context.push('');

    // Adventure Rules
    context.push('# ADVENTURE RULES');
    context.push(adventureRules);
    context.push('');

    // Recent Conversation Context
    context.push('# RECENT CONVERSATION CONTEXT');
    const recentHistory = conversationHistory.slice(-10); // Last 10 messages
    for (const message of recentHistory) {
      context.push(`${message.role.toUpperCase()}: ${message.content.substring(0, 200)}...`);
    }

    // Add seed data to cached content
    if (seedData) {
      context.push('');
      context.push('# DAGGERHEART RULEBOOK DATA');
      context.push(seedData);
    }

    return context.join('\n');
  }

  /**
   * Create cached content with AI
   */
  async createCachedContent(contextString, sessionId) {
    try {
      console.log('🗄️ Creating cached content for Phase 2');
      console.log('📊 Context length:', contextString.length);
      
      const cachedContent = await this.ai.caches.create({
        model: 'gemini-2.0-flash-001',
        config: {
          display_name: `Phase 2 Cache - Session ${sessionId}`,
          contents: [{ role: 'user', parts: [{ text: contextString }] }],
          ttl: '7200s' // 2 hours cache
        }
      });
      
      console.log('✅ Cached content created:', cachedContent.name);
      return cachedContent;
    } catch (error) {
      console.error('❌ Error creating cached content:', error);
      throw error;
    }
  }

  /**
   * Load adventure rules from file
   */
  async loadAdventureRules() {
    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/rules/adventure_rules.md');
      const rules = fs.readFileSync(rulesPath, 'utf8');
      console.log('📚 Loaded adventure rules, length:', rules.length);
      return rules;
    } catch (error) {
      console.warn('⚠️ Could not load adventure rules:', error.message);
      return '# Adventure Rules\n\nBasic adventure guidance will be provided by the AI.';
    }
  }

  /**
   * Extract key moments from conversation history
   */
  extractKeyMoments(conversationHistory) {
    const keyTypes = [
      'campaign_choice',
      'ancestry_choice',
      'community_choice',
      'class_choice',
      'character_creation_complete',
      'campaign_setup_complete'
    ];

    return conversationHistory
      .filter(message => keyTypes.includes(message.type))
      .map(message => ({
        type: message.type,
        content: message.content,
        timestamp: message.timestamp
      }));
  }

  /**
   * Build conversation history for new session (from after seeding to character creation)
   */
  buildConversationHistory(originalHistory) {
    // Find the seed data message index
    const seedDataIndex = originalHistory.findIndex(message => message.type === 'seed_data');
    
    // Get conversation from after seeding until character creation completion
    const relevantHistory = originalHistory.slice(seedDataIndex + 1);
    
    return relevantHistory.map(message => ({
      role: message.role === 'ai' ? 'model' : 'user', // Convert 'ai' to 'model' for Gemini
      parts: [{ text: message.content }]
    }));
  }

  /**
   * Create Phase 2 chat session with cached content
   */
  async createPhase2Session(cachedContent, conversationHistory) {
    try {
      console.log('🆕 Creating Phase 2 chat session');
      
      const chatConfig = {
        model: "gemini-2.0-flash-001",
        config: {
          temperature: 0.6,
          maxOutputTokens: 4096,
          systemInstruction: this.getPhase2SystemInstructions()
        },
        history: this.buildConversationHistory(conversationHistory)
      };

      // Add cached content if available
      if (cachedContent) {
        chatConfig.cached_content = cachedContent.name;
      }

      const chat = this.ai.chats.create(chatConfig);
      
      console.log('✅ Phase 2 chat session created');
      return chat;
    } catch (error) {
      console.error('❌ Error creating Phase 2 session:', error);
      throw error;
    }
  }

  /**
   * Get system instructions for Phase 2
   */
  getPhase2SystemInstructions() {
    return `<system>
    <persona>
        You are an expert Daggerheart Game Master (GM) operating a persistent Multi-User Dungeon (MUD). Function as a dual-core processor: one core is a creative storyteller, the other is a strict rules engine. Your narration is global, describing events from a third-person perspective for all players.
    </persona>

    <critical_directives>
        <directive id="source_of_truth">Your sole source of truth is the provided Daggerheart context, including the full rulebook and item database. All mechanics, character options, items, and rulings MUST derive directly from it. Do not deviate.</directive>
        <directive id="output_protocol">Your output must be a precise blend of narrative and structured data. Tag all game state changes. An ASCII map is MANDATORY for any complex location or combat scene.</directive>
        <directive id="game_flow">Combat is strictly turn-based; only one actor acts at a time. You are now in the adventure phase - continue the story where it left off.</directive>
        <directive id="ascii_map_limit">The ASCII Map will have a maximum of 600 characters If the location requires and ascii map of more than 600 characters either scale map down to fit within the limit or notify that the current location is too large for a map.</directive>

    </critical_directives>

    <tools_available>
        <tool id="database"> The database provides important game related data related that will be stored and can be retrieved</tool>
        <tool id="image_generator"> We will use the gemini flash image model to generate an image for the player based on the description you provided with the description from your [IMAGE_GENERATION_TRIGGER] </tool>
        <tool id="dice_roller"> The built in dice roller that the user will use when rolling their dice and you will take as an input</tool>
    </tools_available>

    <thought_process>
        <!-- Before generating a response, formulate a plan within these comment tags. This is your internal monologue and will be stripped by the backend.
        1. [Player Intent]: What is the player trying to achieve with their command?
        2. [Action Analysis]: Does this action require a Daggerheart roll? Which trait applies? What is the Difficulty?
        3. [Outcome Determination]: Based on the roll (or if no roll is needed), what is the narrative and mechanical outcome according to the rules?
        4. [Response Plan]:
            - Narrative: How will I describe this?
            - Tags: What state changes need to be tagged? ([STAT_CHANGE], [ITEM_ADD], etc.)
            - Map: Is an ASCII map required for this location/situation? Yes/No.
            - Image: Is a new, significant visual element being introduced? Yes/No.
        -->
    </thought_process>

    <session_flow>
        <phase name="adventure">
            Continue the adventure where it left off. Use the campaign context, character information, and conversation history to maintain continuity. Describe the current situation and prompt for the next action.
        </phase>
    </session_flow>

    <daggerheart_core_rules_summary>
        - **Action Rolls**: 2d12 (Hope/Fear) + Modifier vs. Difficulty.
        - **Experiences**: Player may spend 1 Hope *for each* relevant Experience they wish to apply to a roll.
        - **Level Up**: Players get two selections from their class guide at the end of each chapter (max level 10).
    </daggerheart_core_rules_summary>

    <output_specification>
        <format>
            **[LOCATION]**: Location Name
            **[DESCRIPTION]**: Narrative description.

            **[ASCII_MAP]**
            *If location is complex (e.g., multiple exits, items, NPCs) or combat occurs, this section is MANDATORY.*
            \`\`\`
            (ASCII Map here)
            \`\`\`
            **[LEGEND]**: \`.=Floor\`, \`#=Wall\`, \`+=Door\`, \`C=Chest\`, \`N=NPC\`, \`@=Player\`

            **[IMAGE_GENERATION_TRIGGER | Type: TYPE | Description: Detailed description.]**
            *Include for new, significant visual elements (items, characters, creatures, locations).*

            **[DATA_TAGS]**:
            e.g., \`[STAT_CHANGE:HP:-5] [ITEM_ADD:Gold:10]\`

            **[PROMPT]**: What would you like to do?
        </format>
    </output_specification>

    <adventure_continuation>
        You are now continuing an existing adventure. Use the provided campaign context, character information, and conversation history to maintain story continuity. The character has been created and the campaign has been established. Continue the narrative from where the previous session left off.
    </adventure_continuation>
</system>`;
  }
}

module.exports = Phase2CacheBuilder;
