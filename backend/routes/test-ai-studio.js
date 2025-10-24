const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import new services
const SupabaseStorage = require('../services/supabaseStorage');
const Phase2CacheBuilder = require('../services/phase2CacheBuilder');
const ConversationHistoryManager = require('../utils/conversationHistoryManager');

// Initialize Gemini with the current package
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Store active chat sessions and cached content
const chatSessions = new Map();
const cachedContentSessions = new Map();

// Initialize new services
const supabaseStorage = new SupabaseStorage();
const phase2CacheBuilder = new Phase2CacheBuilder();
const conversationManager = new ConversationHistoryManager();

// Track session phases
const sessionPhases = new Map(); // sessionId -> 'phase1_setup' | 'phase2_adventure'

// Track seed data for Phase 2 caching
const sessionSeedData = new Map(); // sessionId -> seedData

// Function to create cached content for rulebook data
async function createCachedContent(rulebookData, sessionId) {
  try {
    console.log('🗄️ Creating cached content for rulebook data');
    console.log('📊 Rulebook data length:', rulebookData.length);
    
    // Use the actual rulebook data directly for caching
    const baseContent = rulebookData;

    console.log('📊 Total content length:', baseContent.length);
    
    // Create cached content using the correct API structure per official docs
    console.log('🗄️ Creating cached content with correct API structure...');
    const cachedContent = await ai.caches.create({
      model: 'gemini-2.0-flash-001',
      config: {
        display_name: 'Daggerheart Rulebook Cache',
        // No system_instruction here - let the chat session handle it
        contents: [{ role: 'user', parts: [{ text: baseContent }] }],
        ttl: '3600s' // 1 hour cache
      }
    });
    
    console.log('✅ Cached content created:', cachedContent.name);
    return cachedContent;
  } catch (error) {
    console.error('❌ Error creating cached content:', error);
    console.error('📊 Rulebook data length was:', rulebookData.length);
    throw error;
  }
}

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'AI Studio test route is working' });
});

// Main endpoint that uses conversation sessions like Google AI Studio
router.post('/send-message', async (req, res) => {
  try {
    const { message, sessionId: requestSessionId } = req.body;
    let sessionId = requestSessionId;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    console.log('🧪 AI STUDIO TEST: Processing message:', message);
    console.log('🆔 Session ID received:', sessionId);
    console.log('🆔 Available sessions:', Array.from(chatSessions.keys()));

    let chat;
    let currentPhase = sessionPhases.get(sessionId) || 'phase1_setup';

    // Check if we have an existing session
    if (sessionId && chatSessions.has(sessionId)) {
      console.log('🔄 Using existing chat session');
      chat = chatSessions.get(sessionId);
      
      // Check if this is a Phase 2 session but we need Phase 1 (for new conversations)
      const sessionPhase = sessionPhases.get(sessionId);
      console.log('🔍 Session phase check:', { sessionId, sessionPhase, currentPhase });
      
      // Force new Phase 1 session if session ID contains 'phase2' or is in Phase 2
      if (sessionId.includes('phase2') || sessionPhase === 'phase2_adventure') {
        console.log('🔄 Phase 2 session detected - creating new Phase 1 session');
        // Force creation of new Phase 1 session for any Phase 1 operation
        sessionId = null;
        chat = null; // Clear the chat session
      }
    }
    
    if (!sessionId || !chatSessions.has(sessionId) || !chat) {
      console.log('🆕 Creating new chat session');
      
      // Check if this is seed data (large message)
      const isSeedData = message.length > 100000;
      
      if (isSeedData) {
        console.log('📊 Large message detected - treating as seed data');
        console.log('🌱 Seeding AI with rulebook and equipment data');
        
          // Create chat with system instructions (no caching in Phase 1)
        const chatConfig = {
          model: "gemini-2.0-flash-001",
          config: {
              temperature: 0.6,
              maxOutputTokens: 4096,  
              systemInstruction: getPhase1SystemInstructions()
          },
          history: []
        };
        
        chat = ai.chats.create(chatConfig);
        
        console.log('🌱 AI seeded with rulebook data and system instructions');
          currentPhase = 'phase1_setup';
      } else {
        // Regular message - create normal session
        chat = ai.chats.create({
          model: "gemini-2.0-flash-001",
          config: {
              temperature: 0.6,
              maxOutputTokens: 4096,
              systemInstruction: getPhase1SystemInstructions()
            },
            history: []
          });
          currentPhase = 'phase1_setup';
        }
      
      // Store the session
      const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      chatSessions.set(newSessionId, chat);
      sessionPhases.set(newSessionId, currentPhase);
      
      console.log('🆕 Created new session:', newSessionId);
      console.log('📋 Session phase:', currentPhase);
      
      // Update sessionId for response
      sessionId = newSessionId;
    }
    
    // Store seed data for Phase 2 caching (after session is created)
    if (message.length > 100000) {
      sessionSeedData.set(sessionId, message);
    }

    // Track conversation history
    const messageType = conversationManager.detectMessageType(message, true);
    conversationManager.addMessage(sessionId, 'user', message, messageType);

    console.log('🧪 AI STUDIO TEST: Sending to Gemini with conversation session');
    console.log('📊 Message length:', message.length);
    console.log('🔧 Using same system instructions and model as ai_studio_code.ts');
    console.log('💬 Using conversation session like Google AI Studio');
    console.log('📋 Current phase:', currentPhase);

    let responseText;
    
    // Check if this is a new session with seed data
    const isSeedData = message.length > 100000;
    
    // Retry logic for API calls
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        if (isSeedData) {
          console.log('🌱 Processing seed data - AI should respond with acknowledgment');
          console.log('✅ Using chat session with rulebook context');
          const response = await chat.sendMessage({
            message: message // Send the actual seed data, not a generic message
          });
          responseText = response.text;
        } else {
          console.log('💬 Sending regular message to chat session');
          // Regular message to existing session
          const response = await chat.sendMessage({
            message: message
          });
          responseText = response.text;
        }
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (error.status === 503 || error.status === 429) {
          console.log(`⚠️ API overloaded (attempt ${retryCount}/${maxRetries}), retrying in ${retryCount * 2} seconds...`);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000)); // Exponential backoff
            continue;
          }
        }
        throw error; // Re-throw if not a retryable error or max retries reached
      }
    }

    // Track AI response
    const aiMessageType = conversationManager.detectMessageType(responseText, false);
    conversationManager.addMessage(sessionId, 'ai', responseText, aiMessageType);

    // Check for campaign setup completion (but don't transition yet)
    if (currentPhase === 'phase1_setup' && conversationManager.isCampaignSetupComplete(sessionId)) {
      console.log('📋 Campaign setup complete - continuing with character creation');
    }
    
    // Check for character creation completion
    if (currentPhase === 'phase1_setup' && conversationManager.isCharacterCreationComplete(sessionId)) {
      console.log('🎯 Character creation complete - initiating Phase 2 transition');
      
      try {
        // Auto-trigger Phase 2 transition
        const transitionResult = await transitionToPhase2(sessionId);
        
        if (transitionResult.success) {
          console.log('✅ Successfully transitioned to Phase 2');
          return res.json({
            success: true,
            response: responseText,
            messageLength: message.length,
            sessionId: transitionResult.newSessionId,
            conversationSession: true,
            phaseTransition: true,
            newPhase: 'phase2_adventure'
          });
        } else {
          console.warn('⚠️ Phase 2 transition failed, continuing with Phase 1');
        }
      } catch (transitionError) {
        console.error('❌ Phase 2 transition error:', transitionError);
        console.warn('⚠️ Continuing with Phase 1 despite transition error');
      }
    }

    console.log('🤖 AI STUDIO RESPONSE:');
    console.log('--- START RESPONSE ---');
    console.log(responseText);
    console.log('--- END RESPONSE ---');

    res.json({
      success: true,
      response: responseText,
      messageLength: message.length,
      sessionId: sessionId,
      conversationSession: true,
      currentPhase: currentPhase
    });

  } catch (error) {
    console.error('❌ AI Studio Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calling Gemini API',
      error: error.message
    });
  }
});

// Helper function to get Phase 1 system instructions
function getPhase1SystemInstructions() {
  return `<system>
    <persona>
        You are an expert Daggerheart Game Master (GM) operating a persistent Multi-User Dungeon (MUD). Function as a dual-core processor: one core is a creative storyteller, the other is a strict rules engine. Your narration is global, describing events from a third-person perspective for all players.
    </persona>

    <critical_directives>
        <directive id="source_of_truth">Your sole source of truth is the provided Daggerheart context, including the full rulebook and item database. All mechanics, character options, items, and rulings MUST derive directly from it. Do not deviate.</directive>
        <directive id="output_protocol">Your output must be a precise blend of narrative and structured data. Tag all game state changes. An ASCII map is MANDATORY for any complex location or combat scene.</directive>
        <directive id="game_flow">Combat is strictly turn-based; only one actor acts at a time. New game sessions must begin with campaign setup, then character creation.</directive>
        <directive id="ascii_map_limit">The ASCII Map will have a maximum of 600 characters If the location requires and ascii map of more than 600 characters either scale map down to fit within the limit or notify that the current location is too large for a map.</directive>

    </critical_directives>

    <tools_available>
        <tool id="database"> The database provides important game related data related that will be stored and can be retrieved</tool>
        <tool id="image_generator"> We will use the gemini flash image model to generate an image for the player based on the description you provided with the description from your [IMAGE_GENERATION_TRIGGER] </tool>
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
        <phase name="start_game">
            1.  **Prompt Length**: Ask the user to choose a campaign length: Short (3-5 chapters), Medium (6-10), or Long (11-15).
            2.  **Generate Campaign**: Create a campaign overview based on their choice.
            3.  **Campaign Setup Completion**: Present Complete Campaign Sheet with proper tags including campaign name, length, and description to the user and ask if they are ready to start the game or if they want to make any changes.
            4.  **Set Starting Level**: Use this table. Short Campaign: Start Level 1. Medium Campaign: Start Level 2. Long Campaign: Start Level 4.
            5.  **Create Characters**: Guide players through Daggerheart character creation.
            6.  **Character Creation Completion**: Present Complete Character Sheet with proper tags including inventory and stats to the user and ask if they are ready to start the game or if they want to make any changes.
        </phase>
        <phase name="gameplay">
            Describe the situation, prompt for action, adjudicate according to Daggerheart rules, and resolve the outcome with narrative and structured data.
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

    <character_creation_tags>
        <character_creation_completion_tag>
            When character creation is complete, you MUST include this tag at the beginning of your response:
            **[CHARACTER_CREATION_COMPLETE]**
            
            This tag is REQUIRED and must be the first thing in your response when character creation is finished.
        </character_creation_completion_tag>
        
        <character_sheet_tags>
            When presenting a complete character sheet, use these tags:
            **[CHARACTER_SHEET]**
            **[CHARACTER_NAME]**: Character Name
            **[CHARACTER_CLASS]**: Class and Subclass
            **[CHARACTER_ANCESTRY]**: Ancestry
            **[CHARACTER_COMMUNITY]**: Community
            **[CHARACTER_LEVEL]**: Level
            **[CHARACTER_TRAITS]**: Agility: X, Strength: Y, etc.
            **[CHARACTER_HP]**: Hit Points
            **[CHARACTER_STRESS]**: Stress
            **[CHARACTER_HOPE]**: Hope
            **[CHARACTER_EQUIPMENT]**: Primary weapon, armor, inventory
            **[CHARACTER_EXPERIENCES]**: Starting experiences
            **[CHARACTER_DOMAIN_CARDS]**: Starting domain cards
        </character_sheet_tags>
        
        <campaign_setup_tags>
            When campaign setup is complete, use:
            **[CAMPAIGN_SETUP_COMPLETE]**
            **[CAMPAIGN_TITLE]**: Campaign Name
            **[CAMPAIGN_LENGTH]**: Short/Medium/Long
            **[CAMPAIGN_DESCRIPTION]**: Campaign overview
        </campaign_setup_tags>
    </character_creation_tags>

    <comprehensive_example>
        <user_input>look around</user_input>
        <ai_response>
            <!--
            1. [Player Intent]: The player wants to examine their current surroundings.
            2. [Action Analysis]: This is a \`look\` command. No roll required.
            3. [Outcome Determination]: I will describe the tavern common room. It's a complex location with an NPC, an exit, and multiple objects.
            4. [Response Plan]:
                - Narrative: Describe the "Sleeping Bear Inn" common room, mentioning the hearth, tables, and the innkeeper, Maeve.
                - Tags: No state changes, so no data tags.
                - Map: Yes, this is a complex location. I will generate a map.
                - Image: Maeve is a new, named NPC. I will generate an image trigger for her.
            -->
            **[LOCATION]**: The Sleeping Bear Inn
            **[DESCRIPTION]**: The common room of the Sleeping Bear Inn is filled with the warm glow of a central hearth. The air smells of roasted meat and spilled ale. Sturdy wooden tables are scattered across the floorboards. Behind a long wooden counter, the innkeeper Maeve polishes a mug. A staircase to the north leads up to the rooms.

            **[ASCII_MAP]**
            \`\`\`
              01234567890123456789
             0####################
             1#..T...............#
             2#.@...T.....N(Maeve)#
             3#..........CCCCCC..#
             4#..T....F..........#
             5#S.................#
             6#######+############
            \`\`\`
            **[LEGEND]**: \`.=Floor\`, \`#=Wall\`, \`+=Door\`, \`F=Hearth\`, \`C=Counter\`, \`T=Table\`, \`N=NPC\`, \`@=Player\`, \`S=Stairs\`

            **[IMAGE_GENERATION_TRIGGER | Type: CHARACTER | Description: A middle-aged female innkeeper with a warm but weary smile, red hair tied in a bun. She wears a simple apron over a linen dress and stands behind a rustic wooden tavern bar.]**

            **[DATA_TAGS]**: None
            **[PROMPT]**: You stand just inside the doorway, the sounds of the street behind you. What would you like to do?
        </ai_response>
    </comprehensive_example>
</system>`;
}

// Transition to Phase 2 function
async function transitionToPhase2(phase1SessionId) {
  try {
    console.log('🔄 Starting Phase 2 transition for session:', phase1SessionId);
    
    // 1. Get full conversation history and seed data
    const fullConversationHistory = conversationManager.getHistory(phase1SessionId);
    const seedData = sessionSeedData.get(phase1SessionId);
    console.log('📝 Retrieved conversation history, messages:', fullConversationHistory.length);
    console.log('📊 Seed data available:', !!seedData);
    
    // 2. Parse and store campaign data
    const campaignData = supabaseStorage.parseCampaignData({ message: fullConversationHistory.find(m => m.type === 'campaign_setup_complete')?.content || '' });
    const campaignId = await supabaseStorage.storeCampaign(phase1SessionId, campaignData);
    console.log('✅ Campaign stored with ID:', campaignId);
    
    // 3. Parse and store character data
    const characterData = supabaseStorage.parseCharacterData({ message: fullConversationHistory.find(m => m.type === 'character_creation_complete')?.content || '' });
    const characterId = await supabaseStorage.storeCharacter(phase1SessionId, characterData, campaignId);
    console.log('✅ Character stored with ID:', characterId);
    
    // 4. Store conversation history
    await supabaseStorage.storeConversationHistory(phase1SessionId, fullConversationHistory, campaignId);
    console.log('✅ Conversation history stored');
    
    // 5. Build Phase 2 cached content (INCLUDING seed data)
    const cachedContent = await phase2CacheBuilder.buildPhase2Cache(phase1SessionId, campaignId, characterId, fullConversationHistory, seedData);
    console.log('✅ Phase 2 cached content created:', cachedContent.name);
    
    // 6. Create Phase 2 chat session with conversation history from after seeding
    const phase2SessionId = `phase2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const phase2Chat = await phase2CacheBuilder.createPhase2Session(cachedContent, fullConversationHistory);
    
    // 7. Store Phase 2 session
    chatSessions.set(phase2SessionId, phase2Chat);
    sessionPhases.set(phase2SessionId, 'phase2_adventure');
    
    // 8. Transfer conversation history (from after seeding to character creation)
    conversationManager.transferHistory(phase1SessionId, phase2SessionId, ['seed_data']);
    
    // 9. Store campaign state with phase tracking
    await supabaseStorage.storeCampaignState(phase1SessionId, campaignId, 'phase2_adventure', phase1SessionId, phase2SessionId, cachedContent.name);
    
    console.log('✅ Phase 2 transition completed successfully');
    console.log('🆕 New Phase 2 session ID:', phase2SessionId);
    
    return {
      success: true,
      newSessionId: phase2SessionId,
      campaignId,
      characterId,
      cachedContentName: cachedContent.name
    };
  } catch (error) {
    console.error('❌ Phase 2 transition failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Manual transition endpoint
router.post('/transition-to-phase2', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    const transitionResult = await transitionToPhase2(sessionId);
    
    if (transitionResult.success) {
      res.json({
        success: true,
        message: 'Successfully transitioned to Phase 2',
        newSessionId: transitionResult.newSessionId,
        campaignId: transitionResult.campaignId,
        characterId: transitionResult.characterId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Phase 2 transition failed',
        error: transitionResult.error
      });
    }
  } catch (error) {
    console.error('❌ Manual transition error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during transition',
      error: error.message
    });
  }
});

module.exports = router;
