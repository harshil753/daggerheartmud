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
      
      // Debug: Show what's included in the cached content
      console.log('🔍 DEBUG: Phase 2 Cached Content Breakdown');
      console.log('=========================================');
      console.log('📊 Total Context Length:', contextString.length);
      console.log('📚 Campaign Title:', campaignData.title);
      console.log('👤 Character Name:', characterData.name);
      console.log('🎲 Character Class:', characterData.class);
      console.log('📖 Adventure Rules Length:', adventureRules.length);
      console.log('💬 Conversation History Messages:', fullConversationHistory.length);
      console.log('=========================================');
      
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
        if (item.items && item.items.name) {
          if (item.is_equipped) {
            context.push(`Equipped: ${item.items.name} (${item.items.type || 'Unknown'})`);
          } else {
            context.push(`Inventory: ${item.items.name} x${item.quantity || 1}`);
          }
        } else {
          // Fallback for items without proper structure
          context.push(`Item: ${item.name || 'Unknown Item'} x${item.quantity || 1}`);
        }
      }
      context.push('');
    }

    // Campaign State
    if (campaignData && campaignData.campaign_data) {
      context.push('# CAMPAIGN STATE');
      context.push(`Setting: ${campaignData.campaign_data.setting || 'Unknown'}`);
      context.push(`Conflict: ${campaignData.campaign_data.conflict || 'Unknown'}`);
      context.push(`Goals: ${campaignData.campaign_data.goals || 'Unknown'}`);
      context.push('');
    }

    // World State
    if (campaignData && campaignData.world_state && Object.keys(campaignData.world_state).length > 0) {
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
      const rulesDir = path.join(__dirname, '../../supporting_functions/prompt_sdks');
      
      // Load all adventure rules files
      const adventureRulesPath = path.join(__dirname, '../../supporting_functions/rules/adventure_rules.md');
      const inventoryRulesPath = path.join(rulesDir, 'inventory_rules.md');
      const equipmentRulesPath = path.join(rulesDir, 'equipment_rules.md');
      const combatRulesPath = path.join(rulesDir, 'combat_rules.md');
      
      let allRules = '';
      
      // Load adventure rules
      try {
        const adventureRules = fs.readFileSync(adventureRulesPath, 'utf8');
        allRules += '# ADVENTURE RULES\n\n' + adventureRules + '\n\n';
        console.log('📚 Loaded adventure rules, length:', adventureRules.length);
      } catch (error) {
        console.warn('⚠️ Could not load adventure rules:', error.message);
      }
      
      // Load inventory rules
      try {
        const inventoryRules = fs.readFileSync(inventoryRulesPath, 'utf8');
        allRules += '# INVENTORY RULES\n\n' + inventoryRules + '\n\n';
        console.log('📚 Loaded inventory rules, length:', inventoryRules.length);
      } catch (error) {
        console.warn('⚠️ Could not load inventory rules:', error.message);
      }
      
      // Load equipment rules
      try {
        const equipmentRules = fs.readFileSync(equipmentRulesPath, 'utf8');
        allRules += '# EQUIPMENT RULES\n\n' + equipmentRules + '\n\n';
        console.log('📚 Loaded equipment rules, length:', equipmentRules.length);
      } catch (error) {
        console.warn('⚠️ Could not load equipment rules:', error.message);
      }
      
      // Load combat rules
      try {
        const combatRules = fs.readFileSync(combatRulesPath, 'utf8');
        allRules += '# COMBAT RULES\n\n' + combatRules + '\n\n';
        console.log('📚 Loaded combat rules, length:', combatRules.length);
      } catch (error) {
        console.warn('⚠️ Could not load combat rules:', error.message);
      }
      
      console.log('📚 Total adventure rules loaded, length:', allRules.length);
      return allRules;
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
      
      // Debug: Show system instructions being loaded
      const systemInstructions = this.getPhase2SystemInstructions();
      console.log('🔧 Phase 2 System Instructions Length:', systemInstructions.length);
      console.log('📋 System Instructions Preview:', systemInstructions.substring(0, 200) + '...');
      
      // Debug: Show conversation history being loaded
      const filteredHistory = this.buildConversationHistory(conversationHistory);
      console.log('💬 Conversation History Messages:', filteredHistory.length);
      console.log('📝 History Preview:', JSON.stringify(filteredHistory.slice(0, 2), null, 2));
      
      const chatConfig = {
        model: "gemini-2.0-flash-001",
        config: {
          temperature: 0.6,
          maxOutputTokens: 4096,
          systemInstruction: systemInstructions
        },
        history: filteredHistory
      };

      // Add cached content if available
      if (cachedContent) {
        chatConfig.cached_content = cachedContent.name;
        console.log('📚 Cached Content Name:', cachedContent.name);
      }

      console.log('🔧 Chat Config Summary:');
      console.log('  - Model: gemini-2.0-flash-001');
      console.log('  - Temperature: 0.6');
      console.log('  - Max Output Tokens: 4096');
      console.log('  - System Instructions: Loaded');
      console.log('  - Conversation History: ' + filteredHistory.length + ' messages');
      console.log('  - Cached Content: ' + (cachedContent ? 'Yes' : 'No'));

      const chat = this.ai.chats.create(chatConfig);
      
      console.log('✅ Phase 2 chat session created');
      return chat;
    } catch (error) {
      console.error('❌ Error creating Phase 2 session:', error);
      throw error;
    }
  }

  /**
   * Create save point and new session
   */
  async createSavePointAndNewSession(sessionId, campaignId, characterId, savePointData, conversationHistory, seedData) {
    try {
      console.log('💾 Creating save point and new session for:', sessionId);
      
      // 1. Cache all current data
      const campaignData = await this.supabaseStorage.getCampaign(campaignId);
      const characterData = await this.supabaseStorage.getCharacter(characterId);
      const adventureRules = await this.loadAdventureRules();
      
      // 2. Build context string with save point data
      const contextString = this.buildContextStringWithSavePoint(
        campaignData,
        characterData,
        conversationHistory,
        adventureRules,
        seedData,
        savePointData
      );
      
      // 3. Create cached content for save point
      const cachedContent = await this.createCachedContent(contextString, `savepoint_${sessionId}`);
      
      // 4. Store save point in database
      const savePointId = await this.supabaseStorage.createSavePoint({
        campaign_id: campaignId,
        character_id: characterId,
        save_point_data: savePointData,
        cached_content_name: cachedContent.name,
        session_id: sessionId
      });
      
      console.log('✅ Save point created with ID:', savePointId);
      
      // 5. Create new adventure session
      const newSession = await this.createPhase2Session(cachedContent, conversationHistory);
      
      return {
        success: true,
        savePointId,
        cachedContent,
        newSession
      };
    } catch (error) {
      console.error('❌ Error creating save point and new session:', error);
      throw error;
    }
  }

  /**
   * Build context string with save point data
   */
  buildContextStringWithSavePoint(campaignData, characterData, conversationHistory, adventureRules, seedData, savePointData) {
    const context = [];
    
    // Add save point information
    context.push('# SAVE POINT DATA');
    context.push(`Save Point ID: ${savePointData.id || 'new'}`);
    context.push(`Save Point Type: ${savePointData.type || 'manual'}`);
    context.push(`Save Point Description: ${savePointData.description || 'Adventure save point'}`);
    context.push(`Timestamp: ${new Date().toISOString()}`);
    context.push('');
    
    // Add save point specific data
    if (savePointData.worldState) {
      context.push('## World State at Save Point');
      for (const [key, value] of Object.entries(savePointData.worldState)) {
        context.push(`${key}: ${JSON.stringify(value)}`);
      }
      context.push('');
    }
    
    if (savePointData.characterState) {
      context.push('## Character State at Save Point');
      context.push(`HP: ${savePointData.characterState.hp || characterData.hit_points_current}`);
      context.push(`Stress: ${savePointData.characterState.stress || characterData.stress_current}`);
      context.push(`Hope: ${savePointData.characterState.hope || characterData.hope_tokens}`);
      context.push('');
    }
    
    // Continue with regular context building
    const regularContext = this.buildContextString(campaignData, characterData, conversationHistory, adventureRules, seedData);
    
    return context.join('\n') + '\n\n' + regularContext;
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
        <directive id="no_thought_process_output">CRITICAL: Never include your internal thought process, reasoning, or analysis in your response to the user. The thought process section is for your internal use only and must be stripped from all user-facing output.</directive>
        <directive id="unclear_input_handling">If you cannot understand or interpret the user's input clearly, respond with: "I couldn't understand that. Could you please try again or be more specific?"</directive>
        <directive id="chapter_completion">If the user has completed the chapter, prompt user with [CHAPTER_COMPLETED] tag and immeditely move to next chapter phase.</directive
    </critical_directives>

    <tools_available>
        <tool id="database">
            <description>Access to persistent game data stored in Supabase database</description>
            <data_types>
                - Campaign data (title, description, story length, current chapter)
                - Character data (name, class, ancestry, stats, equipment, inventory)
                - equipment data (name, type, stats, properties, limitations)
                - inventory data (name, type, stats, properties, limitations)
            </data_types>
            <tool_usage>
                <tool_id="database">Will be provided by the backend in json format. May also be parsed out from responses if proper tags used</tool_id>
            </tool_usage>
        </tool>
        
        <tool id="adventure_rules">
            <description>Comprehensive adventure and storytelling guidelines</description>
            <coverage>
                - Adventure pacing and structure
                - Storytelling techniques and narrative flow
                - Scene setting and atmosphere creation
                - NPC interaction and dialogue
                - World building and lore consistency
            </coverage>
            <tool_usage>
                <tool_id="adventure_rules">Reference for creating engaging narratives, setting appropriate scenes, managing story pacing, and maintaining consistent world-building throughout the adventure.</tool_id>
            </tool_usage>
        </tool>
        
        <tool id="inventory_rules">
            <description>Equipment and inventory management mechanics</description>
            <coverage>
                - Carrying capacity and encumbrance
                - Equipment categories (active vs inventory)
                - Weapon and armor swapping mechanics
                - Consumable usage and tracking
                - Treasure and wealth management
            </coverage>
            <tool_usage>
                <tool_id="inventory_rules">Use when players interact with items, equipment, or inventory. Reference for determining what items can be carried, how equipment swapping works, and managing consumables.</tool_id>
            </tool_usage>
        </tool>
        
        <tool id="equipment_rules">
            <description>Weapon and armor mechanics and properties</description>
            <coverage>
                - Weapon categories (Primary/Secondary)
                - Weapon properties (trait, range, damage, burden)
                - Armor types and protection values
                - Equipment features and special abilities
                - Equipment progression and upgrades
            </coverage>
            <tool_usage>
                <tool_id="equipment_rules">Reference when players use weapons, armor, or equipment. Use for determining attack mechanics, damage calculations, armor protection, and equipment features.</tool_id>
            </tool_usage>
        </tool>
        
        <tool id="combat_rules">
            <description>Combat mechanics and action resolution</description>
            <coverage>
                - Attack rolls and damage calculations
                - Evasion and difficulty determination
                - Hit Points and damage thresholds
                - Stress system and conditions
                - Special combat features and abilities
            </coverage>
            <tool_usage>
                <tool_id="combat_rules">Use during combat encounters, action resolution, and when determining the mechanical outcomes of player actions. Reference for setting difficulties, calculating damage, and applying combat effects.</tool_id>
            </tool_usage>
        </tool>
        
        <tool id="image_generator">
            <description>AI-powered image generation for visual storytelling</description>
            <capabilities>
                - Generate images based on scene descriptions
                - Create character portraits and NPCs
                - Visualize locations and environments
                - Illustrate key story moments
            </capabilities>
            <tool_usage>
                <tool_id="image_generator">Use when you include [IMAGE_GENERATION_TRIGGER] tags in your responses. Provide detailed, vivid descriptions to generate appropriate images that enhance the player's visual experience of the adventure.</tool_id>
            </tool_usage>
        </tool>
    </tools_available>

    <save_point_system>
        When a save point is triggered (via [SAVE_POINT_CREATED] tag):
        1. Cache all current data (campaign, character, conversation history, world state)
        2. Store save point data in database with save point tags
        3. Create new adventure session using cached data and save point data
        4. Feed in same rulebooks with initializing prompt
        5. Continue adventure from save point with full context
        
        Save point triggers:
        - Chapter completion
        - Combat end
        - Major story milestones
        - Player-requested saves
    </save_point_system>

    <chapter_completion>
        Check if the user has completed the chapter. If so, prompt user with [CHAPTER_COMPLETED] tag 
        create a save point with the [SAVE_POINT_CREATED] tag sent to the user. 
        Under tag list save point data and tags 
        Then prompt user with [CHAPTER_COMPLETED] tag and immeditely move to next chapter phase.
    </chapter_completion>

    <thought_process>
        <!-- Before generating a response, formulate a plan within these comment tags. This is your internal monologue and will be stripped by the backend.
        1. [Chapter Completion]: Check if the user has completed the chapter. If so, prompt user with [CHAPTER_COMPLETED] tag and immeditely move to next chapter phase.
        2. [Player Intent]: What is the player trying to achieve with their command?
        3. [Tool Selection]: Which tools do I need to reference?
            - adventure_rules: For narrative structure and storytelling
            - inventory_rules: For equipment and item interactions
            - equipment_rules: For weapon/armor mechanics
            - combat_rules: For action resolution and combat
            - image_generator: For visual scene enhancement
        4. [Action Analysis]: Does this action require a Daggerheart roll? Which trait applies? What is the Difficulty?
        5. [Rule Reference]: What specific rules or mechanics apply to this situation?
        6. [Situation Analysis]: Analyze the current situation using available data and rules
        7. [Outcome Determination]: Based on the roll (or if no roll is needed), what is the narrative and mechanical outcome according to the rules?
        8. [Stat Tracking]: If this is combat, what stat changes occurred? Track HP, Stress, Hope, Fear for all characters.
        9. [Response Plan]:
            - Narrative: How will I describe this?
            - Tags: What state changes need to be tagged? ([STAT_CHANGE], [ITEM_ADD], etc.)
            - Map: Is an ASCII map required for this location/situation? Yes/No. If yes, use the [ASCII_MAP] tag.
            - Image: Is a new, significant visual element being introduced? Yes/No. If yes, use the [IMAGE_GENERATION_TRIGGER] tag.
            - Stat Changes: MANDATORY for combat - include [STAT_CHANGE] tags for all affected characters.
        -->
    </thought_process>

    <session_flow>
        <phase name="adventure_start">
            Start a new adventure. Use the campaign context, character information, and conversation history to maintain continuity. Describe the current situation and prompt for the next action.
        </phase>
        <phase name="adventure_gameplay">
            Continue the adventure the user is currently in.
            Describe the current situation and provide questions, small suggestions, or prompts for the user to respond to.
            Carry out thought process and then respond to the user. 
            Consider whether there is cause for enemies to engage users in combat. 
            If so, start a combat and prompt user with [COMBAT_STARTED] tag. If not, continue the adventure and see if situation changes as a result of the users future actions.
        </phase>
        <phase name="possible_combat_encounter">
            Determine if there is cause for a possible combat encounter. Ask the user if they want to engage in combat. 
            If they do, start a combat. 
            If they do not, continue the adventure consider whether there is cause for enemies to engage users in combat. 
            If so, start a combat and prompt user with [COMBAT_STARTED] tag. If not, continue the adventure and see if situation changes as a result of the users future actions.
        </phase>
        <phase name="combat_encounter">
            Continue the combat the user is currently in. 
            Ask the user for their next action.
            Carry out thought process and then respond to the user with the next action whether its an attack, defense, spell, or other action. 
            Do not ask for confirmation or additional input.
            MANDATORY: After ANY character's turn (player or NPC), you MUST include [STAT_CHANGE] tags showing all changes to HP, Stress, Hope, Fear, and any other affected stats.
            Continue current phase until the combat is ended then prompt with [COMPLETED_COMBAT] tag to the user.
        </phase>
        <phase name="combat_end">
            End combat and prompt user with [COMPLETED_COMBAT] tag.
            Prompt user for next action. Suggest rest option or suggest they continue the adventure.
            Reggardless of choice create a save point with the [SAVE_POINT_CREATED] tag sent to the user. Under tag list save point data and tags.
        </phase>
    </session_flow>

    <daggerheart_core_rules_summary>
        - **Action Rolls**: 2d12 (Hope/Fear) + Modifier vs. Difficulty.
        - **Experiences**: Player may spend 1 Hope *for each* relevant Experience they wish to apply to a roll.
        - **Level Up**: Players get two selections from their class guide at the end of each chapter (max level 10).
    </daggerheart_core_rules_summary>

    <combat_stat_tracking>
        <mandatory_requirements>
            After ANY character's turn during combat, you MUST include [STAT_CHANGE] tags for ALL affected characters.
            This includes both player characters and NPCs/enemies.
        </mandatory_requirements>
        
        <stat_change_format>
            **[STAT_CHANGE]**:
            - [CHARACTER_NAME]: HP: [CURRENT_HP]/[MAX_HP], Stress: [CURRENT_STRESS]/[MAX_STRESS], Hope: [HOPE_TOKENS], Fear: [FEAR_TOKENS]
            - [ENEMY_NAME]: HP: [CURRENT_HP]/[MAX_HP], Stress: [CURRENT_STRESS]/[MAX_STRESS]
            - [OTHER_CHARACTER]: [STAT_NAME]: [CURRENT_VALUE]/[MAX_VALUE]
        </stat_change_format>
        
        <tracked_stats>
            - Hit Points (HP): Current/Max
            - Stress: Current/Max  
            - Hope Tokens: Current count
            - Fear Tokens: Current count
            - Temporary Conditions: Any status effects
            - Equipment Changes: Weapon/armor swaps
        </tracked_stats>
    </combat_stat_tracking>
  
    <save_point_output_specification>
        <format>
            **[SAVE_POINT_DATA]**:
            - Campaign: [CAMPAIGN_TITLE], Chapter: [CURRENT_CHAPTER]/[TOTAL_CHAPTERS]
            - Character: [CHARACTER_NAME], Level: [LEVEL], HP: [CURRENT_HP]/[MAX_HP], Stress: [CURRENT_STRESS]/[MAX_STRESS], Hope: [HOPE_TOKENS]
            - Location: [CURRENT_LOCATION]
            - Inventory: [EQUIPPED_ITEMS], [INVENTORY_ITEMS]
            - World State: [WORLD_STATE_DATA]
            - Story Progress: [STORY_MILESTONES]
        </format>
    </save_point_output_specification>

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
