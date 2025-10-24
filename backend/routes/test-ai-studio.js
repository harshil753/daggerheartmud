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
const ImageGenerator = require('../services/imageGenerator');

// Initialize Gemini with the current package
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Extract save point data from AI response
 */
function extractSavePointData(responseText) {
  const savePointData = {
    type: 'manual',
    description: 'Adventure save point',
    worldState: {},
    characterState: {},
    storyProgress: {}
  };

  // Extract campaign data
  const campaignMatch = responseText.match(/Campaign:\s*([^,]+),\s*Chapter:\s*(\d+)\/(\d+)/);
  if (campaignMatch) {
    savePointData.campaignTitle = campaignMatch[1].trim();
    savePointData.currentChapter = parseInt(campaignMatch[2]);
    savePointData.totalChapters = parseInt(campaignMatch[3]);
  }

  // Extract character data
  const characterMatch = responseText.match(/Character:\s*([^,]+),\s*Level:\s*(\d+),\s*HP:\s*(\d+)\/(\d+),\s*Stress:\s*(\d+)\/(\d+),\s*Hope:\s*(\d+)/);
  if (characterMatch) {
    savePointData.characterName = characterMatch[1].trim();
    savePointData.characterLevel = parseInt(characterMatch[2]);
    savePointData.characterState.hp = parseInt(characterMatch[3]);
    savePointData.characterState.maxHp = parseInt(characterMatch[4]);
    savePointData.characterState.stress = parseInt(characterMatch[5]);
    savePointData.characterState.maxStress = parseInt(characterMatch[6]);
    savePointData.characterState.hope = parseInt(characterMatch[7]);
  }

  // Extract location
  const locationMatch = responseText.match(/Location:\s*([^\n]+)/);
  if (locationMatch) {
    savePointData.currentLocation = locationMatch[1].trim();
  }

  // Extract inventory
  const inventoryMatch = responseText.match(/Inventory:\s*([^\n]+)/);
  if (inventoryMatch) {
    savePointData.inventory = inventoryMatch[1].trim();
  }

  // Extract world state
  const worldStateMatch = responseText.match(/World State:\s*([^\n]+)/);
  if (worldStateMatch) {
    savePointData.worldState = worldStateMatch[1].trim();
  }

  // Extract story progress
  const storyProgressMatch = responseText.match(/Story Progress:\s*([^\n]+)/);
  if (storyProgressMatch) {
    savePointData.storyProgress = storyProgressMatch[1].trim();
  }

  return savePointData;
}

/**
 * Extract stat changes from AI response
 */
function extractStatChanges(responseText) {
  const statChanges = [];
  
  // Look for [STAT_CHANGE] tags
  const statChangeMatch = responseText.match(/\[\*\*STAT_CHANGE\*\*\]\s*:?\s*([\s\S]*?)(?=\[\*\*|$)/i);
  if (statChangeMatch) {
    const statChangeText = statChangeMatch[1].trim();
    const lines = statChangeText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('-')) {
        const characterMatch = trimmedLine.match(/-\s*([^:]+):\s*(.+)/);
        if (characterMatch) {
          const characterName = characterMatch[1].trim();
          const statsText = characterMatch[2].trim();
          
          // Parse individual stats
          const stats = {};
          const statMatches = statsText.match(/(\w+):\s*([^,]+)/g);
          if (statMatches) {
            for (const statMatch of statMatches) {
              const [statName, statValue] = statMatch.split(':').map(s => s.trim());
              stats[statName.toLowerCase()] = statValue;
            }
          }
          
          statChanges.push({
            character: characterName,
            stats: stats,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return statChanges;
}

/**
 * Create Phase 1 save point with all character and campaign data
 */
async function createPhase1SavePoint(sessionId) {
  try {
    console.log('💾 Creating Phase 1 save point for session:', sessionId);
    
    // Get campaign state to find campaign and character IDs
    const campaignState = await supabaseStorage.getCampaignState(sessionId);
    if (!campaignState || !campaignState.campaign_id || !campaignState.character_id) {
      throw new Error('Campaign state not found for session');
    }

    const campaignId = campaignState.campaign_id;
    const characterId = campaignState.character_id;

    // Get all data from database
    const campaignData = await supabaseStorage.getCampaign(campaignId);
    const characterData = await supabaseStorage.getCharacter(characterId);
    const conversationHistory = conversationManager.getConversationHistory(sessionId);
    const seedData = sessionSeedData.get(sessionId);

    // Create comprehensive save point data
    const savePointData = {
      type: 'phase1_completion',
      description: 'Character creation and campaign setup completed',
      campaignData: campaignData,
      characterData: characterData,
      conversationHistory: conversationHistory,
      seedData: seedData,
      phase: 'phase1_completion',
      timestamp: new Date().toISOString()
    };

    // Create cached content with all Phase 1 data
    const contextString = buildPhase1ContextString(campaignData, characterData, conversationHistory, seedData);
    const cachedContent = await phase2CacheBuilder.createCachedContent(contextString, `phase1_${sessionId}`);

    // Store save point in database
    const savePointId = await supabaseStorage.createSavePoint({
      campaign_id: campaignId,
      character_id: characterId,
      save_point_data: savePointData,
      cached_content_name: cachedContent.name,
      session_id: sessionId
    });

    console.log('✅ Phase 1 save point created with ID:', savePointId);
    console.log('📚 Cached content name:', cachedContent.name);
    console.log('📊 Context length:', contextString.length);

    return {
      success: true,
      savePointId,
      cachedContent,
      savePointData
    };
  } catch (error) {
    console.error('❌ Error creating Phase 1 save point:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build context string for Phase 1 save point
 */
function buildPhase1ContextString(campaignData, characterData, conversationHistory, seedData) {
  const context = [];

  // Phase 1 Completion Header
  context.push('# PHASE 1 COMPLETION SAVE POINT');
  context.push(`Save Point Type: Character Creation & Campaign Setup Complete`);
  context.push(`Timestamp: ${new Date().toISOString()}`);
  context.push('');

  // Campaign Overview
  context.push('# CAMPAIGN OVERVIEW');
  context.push(`Title: ${campaignData.title}`);
  context.push(`Description: ${campaignData.description}`);
  context.push(`Story Length: ${campaignData.story_length}`);
  context.push(`Total Chapters: ${campaignData.total_chapters}`);
  context.push(`Current Chapter: ${campaignData.current_chapter}`);
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
  const keyTypes = ['campaign_choice', 'ancestry_choice', 'community_choice', 'class_choice', 'character_creation_complete'];
  const keyMoments = conversationHistory.filter(message => keyTypes.includes(message.type));
  for (const moment of keyMoments) {
    context.push(`- ${moment.type}: ${moment.content.substring(0, 100)}...`);
  }
  context.push('');

  // Add seed data
  if (seedData) {
    context.push('# DAGGERHEART RULEBOOK DATA');
    context.push(seedData);
  }

  return context.join('\n');
}

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
  console.log('🚀 ROUTE HIT: /api/test-ai-studio/send-message');
  console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
  
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
      
      // Only force new Phase 1 session if this is a large message (seed data) being sent to a Phase 2 session
      if ((sessionId.includes('phase2') || sessionPhase === 'phase2_adventure') && message.length > 100000) {
        console.log('🔄 Phase 2 session detected with large message - creating new Phase 1 session for seed data');
        // Store seed data from old session if available
        const oldSeedData = sessionSeedData.get(sessionId);
        if (oldSeedData && message.length > 100000) {
          console.log('📊 Transferring seed data to new session');
        }
        // Force creation of new Phase 1 session for seed data upload
        sessionId = null;
        chat = null; // Clear the chat session
      } else if (sessionId.includes('phase2') || sessionPhase === 'phase2_adventure') {
        console.log('🔄 Using existing Phase 2 session for regular message');
        // Use the existing Phase 2 session for regular messages
      }
    }
    
    if (!sessionId || !chatSessions.has(sessionId) || !chat) {
      console.log('🆕 Creating new chat session');
      
      // Check if this is seed data (large message)
      const isSeedData = message.length > 100000;
      
      if (isSeedData) {
        
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
    console.log('🔍 Checking character creation completion:', {
      currentPhase,
      sessionId,
      isComplete: conversationManager.isCharacterCreationComplete(sessionId)
    });
    
    if (currentPhase === 'phase1_setup' && conversationManager.isCharacterCreationComplete(sessionId)) {
      console.log('🎯 Character creation complete - initiating Phase 2 transition');
      
      // Debug logging for character completion response (only if not seed data)
      if (!isSeedData) {
        console.log('🔍 CHARACTER COMPLETION DEBUG:');
        console.log('--- START CHARACTER RESPONSE ---');
        console.log(responseText);
        console.log('--- END CHARACTER RESPONSE ---');
      }
      
    // Additional debug for message type detection
    const messageType = conversationManager.detectAIMessageType(responseText);
    console.log('🔍 DETECTED MESSAGE TYPE:', messageType);
    
    // Debug character creation completion detection
    const isCharacterComplete = conversationManager.isCharacterCreationComplete(sessionId);
    console.log('🔍 CHARACTER CREATION COMPLETE:', isCharacterComplete);
    console.log('🔍 CURRENT PHASE:', currentPhase);
    
    // Debug conversation history
    const history = conversationManager.getHistory(sessionId);
    console.log('🔍 CONVERSATION HISTORY LENGTH:', history.length);
    console.log('🔍 LAST MESSAGE TYPE:', history[history.length - 1]?.type);
      
      try {
        // Create Phase 1 save point before transitioning
        console.log('💾 Creating Phase 1 save point...');
        try {
          const phase1SavePoint = await createPhase1SavePoint(sessionId);
          if (phase1SavePoint.success) {
            console.log('✅ Phase 1 save point created:', phase1SavePoint.savePointId);
          }
        } catch (savePointError) {
          console.error('❌ Phase 1 save point creation error:', savePointError);
          console.warn('⚠️ Continuing with Phase 2 transition despite save point error');
        }

        // Auto-trigger Phase 2 transition
        const transitionResult = await transitionToPhase2(sessionId);
        
        if (transitionResult.success) {
          console.log('✅ Successfully transitioned to Phase 2');
          
          // If adventure was started, return the adventure response
          if (transitionResult.adventureStarted) {
            console.log('🎬 Returning automated adventure response to user');
            return res.json({
              success: true,
              response: transitionResult.adventureResponse,
              messageLength: message.length,
              sessionId: transitionResult.newSessionId,
              conversationSession: true,
              phaseTransition: true,
              newPhase: 'phase2_adventure',
              adventureStarted: true
            });
          } else {
            return res.json({
              success: true,
              response: responseText,
              messageLength: message.length,
              sessionId: transitionResult.newSessionId,
              conversationSession: true,
              phaseTransition: true,
              newPhase: 'phase2_adventure'
            });
          }
        } else {
          console.warn('⚠️ Phase 2 transition failed, continuing with Phase 1');
        }
      } catch (transitionError) {
        console.error('❌ Phase 2 transition error:', transitionError);
        console.warn('⚠️ Continuing with Phase 1 despite transition error');
      }
    }

    // Check for stat changes during combat
    if (responseText.includes('[STAT_CHANGE]')) {
      console.log('📊 Stat changes detected - processing combat stat updates');
      
      try {
        // Extract stat changes from response
        const statChanges = extractStatChanges(responseText);
        
        if (statChanges.length > 0) {
          console.log('📈 Stat Changes Found:', statChanges.length);
          for (const change of statChanges) {
            console.log(`  - ${change.character}:`, change.stats);
          }
          
          // Store stat changes in database
          const campaignState = await supabaseStorage.getCampaignState(sessionId);
          if (campaignState && campaignState.character_id) {
            // Update character stats in database
            await supabaseStorage.updateCharacterStats(campaignState.character_id, statChanges);
            console.log('✅ Character stats updated in database');
          }
        }
      } catch (statError) {
        console.error('❌ Stat change processing error:', statError);
        console.warn('⚠️ Continuing with normal response despite stat error');
      }
    }

    // Check for save point creation
    if (responseText.includes('[SAVE_POINT_CREATED]')) {
      console.log('💾 Save point detected - processing save point creation');
      
      try {
        // Extract save point data from response
        const savePointData = extractSavePointData(responseText);
        
        // Get current campaign and character IDs from session
        const campaignState = await supabaseStorage.getCampaignState(sessionId);
        if (campaignState && campaignState.campaign_id && campaignState.character_id) {
          // Create save point and new session
          const savePointResult = await phase2CacheBuilder.createSavePointAndNewSession(
            sessionId,
            campaignState.campaign_id,
            campaignState.character_id,
            savePointData,
            conversationManager.getConversationHistory(sessionId),
            sessionSeedData.get(sessionId)
          );
          
          if (savePointResult.success) {
            console.log('✅ Save point created and new session started');
            return res.json({
              success: true,
              response: responseText,
              messageLength: message.length,
              sessionId: savePointResult.newSession.id,
              conversationSession: true,
              savePointCreated: true,
              savePointId: savePointResult.savePointId
            });
          }
        }
      } catch (savePointError) {
        console.error('❌ Save point creation error:', savePointError);
        console.warn('⚠️ Continuing with normal response despite save point error');
      }
    }

    // Only show AI response if it's not seed data
    if (!isSeedData) {
      console.log('🤖 AI STUDIO RESPONSE:');
      console.log('--- START RESPONSE ---');
      console.log(responseText);
      console.log('--- END RESPONSE ---');
    } else {
      console.log('📚 Seed data processed - response hidden from terminal');
    }

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
        <directive id="no_thought_process_output">CRITICAL: NEVER include your internal thought process, reasoning, or analysis in your response to the user. The thought process section is for your internal use only and must be completely stripped from all user-facing output. Do not include HTML comments, thought process blocks, or any internal reasoning in your responses.</directive>
        <directive id="unclear_input_handling">If you cannot understand or interpret the user's input clearly, respond with: "I couldn't understand that. Could you please try again or be more specific?"</directive>
        <directive id="character_generation_flow">When a user requests character generation (e.g., "generate entire character", "create character", "yes generate character"), IMMEDIATELY proceed to generate a complete character with all required tags, stats, equipment, and inventory. Do not ask for confirmation or additional input.</directive>

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
            1.  **Campaign Length**: Ask the user to choose a campaign length: Short (4 chapters), Medium (8 chapters), or Long (12 chapters).
            2.  **Generate Campaign**: Create a campaign overview based on their choice.
            3.  **Campaign Setup Completion**: Present Complete Campaign Sheet with proper tags including campaign name, length, and description to the user and ask if they are ready to start the game or if they want to make any changes.
            4.  **Set Starting Level**: Use this table. Short Campaign: Start Level 1. Medium Campaign: Start Level 2. Long Campaign: Start Level 4.
            5.  **Create Characters**: IMMEDIATELY proceed to character creation after campaign setup. Guide users through the character creation process, if the user requests character generation, generate a complete character with all stats, equipment, and tags.
            6.  **Character Creation Completion**: CRITICAL: Include [CHARACTER_CREATION_COMPLETE] tag in your response. You MUST show the Character Sheet with proper tags including all items and stats to the user in your response.
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
        
        <equipment_reporting_tags>
            When presenting character equipment and inventory, use these tags:
            **[CHARACTER_EQUIPMENT]**
            **[PRIMARY_WEAPON]**: Weapon Name
            **[WEAPON_STATS]**: Stat, Range, Damage, Properties
            **[SECONDARY_WEAPON]**: Weapon Name (if applicable)
            **[SECONDARY_WEAPON_STATS]**: Stat, Range, Damage, Properties
            **[ARMOR]**: Armor Name
            **[ARMOR_STATS]**: Thresholds, Score
            **[SHIELD]**: Shield Name (if applicable)
            **[SHIELD_STATS]**: Defense bonus
            **[ACCESSORIES]**: Torch, rope, supplies, potions, etc.
            **[SPECIAL_ITEMS]**: Unique items, trophies, totems
            **[CURRENCY]**: Gold pieces, gems, etc.
        </equipment_reporting_tags>
        
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
    
    // 1. Get the most recent Phase 1 save point
    const campaignState = await supabaseStorage.getCampaignState(phase1SessionId);
    if (!campaignState || !campaignState.campaign_id || !campaignState.character_id) {
      throw new Error('Campaign state not found for Phase 2 transition');
    }

    const campaignId = campaignState.campaign_id;
    const characterId = campaignState.character_id;
    console.log('📊 Using campaign ID:', campaignId, 'character ID:', characterId);

    // 2. Get Phase 1 save point data
    const savePoints = await supabaseStorage.getCampaignSavePoints(campaignId);
    const phase1SavePoint = savePoints.find(sp => sp.save_point_data?.phase === 'phase1_completion');
    
    if (!phase1SavePoint) {
      throw new Error('Phase 1 save point not found');
    }

    console.log('💾 Found Phase 1 save point:', phase1SavePoint.id);
    console.log('📚 Using cached content:', phase1SavePoint.cached_content_name);

    // 3. Get data from save point instead of individual database queries
    const savePointData = phase1SavePoint.save_point_data;
    const campaignData = savePointData.campaignData;
    const characterData = savePointData.characterData;
    const fullConversationHistory = savePointData.conversationHistory;
    const seedData = savePointData.seedData;

    console.log('📝 Retrieved data from Phase 1 save point');
    console.log('📊 Campaign:', campaignData.title);
    console.log('👤 Character:', characterData.name);
    console.log('💬 Conversation history messages:', fullConversationHistory.length);
    
    // 4. Use the cached content from Phase 1 save point
    const cachedContent = {
      name: phase1SavePoint.cached_content_name
    };
    console.log('✅ Using Phase 1 cached content:', cachedContent.name);
    
    // 5. Create Phase 2 chat session with conversation history from after seeding
    console.log('🆕 Creating Phase 2 chat session');
    const phase2SessionId = `phase2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const phase2Chat = await phase2CacheBuilder.createPhase2Session(cachedContent, fullConversationHistory);
    console.log('✅ Phase 2 chat session created');
    
    // 6. Store Phase 2 session
    chatSessions.set(phase2SessionId, phase2Chat);
    sessionPhases.set(phase2SessionId, 'phase2_adventure');
    console.log('📤 Transferred conversation history from Phase 1 save point');
    
    // 7. Transfer conversation history (from after seeding to character creation)
    conversationManager.transferHistory(phase1SessionId, phase2SessionId, ['seed_data']);
    
    // 8. Store campaign state with phase tracking
    await supabaseStorage.storeCampaignState(phase1SessionId, campaignId, 'phase2_adventure', phase1SessionId, phase2SessionId, cachedContent.name);
    console.log('🗄️ Storing campaign state for phase: phase2_adventure');
    console.log('✅ Campaign state stored');
    
    console.log('✅ Phase 2 transition completed successfully');
    console.log('🆕 New Phase 2 session ID:', phase2SessionId);
    
    // 10. Send automated adventure start prompt
    console.log('🎬 Sending automated adventure start prompt...');
    try {
      const adventurePrompt = `I've provided you with concise guides on adventuring for reference. Use the campaign data, character information, and conversation history to continue where this adventure left off. Begin the adventure with an engaging opening scene that draws the player into the story.

**Adventure Rules Reference:**
- @inventory_rules.md - For inventory management and equipment handling
- @equipment_rules.md - For weapon and armor mechanics  
- @combat_rules.md - For combat mechanics and action resolution

Use these rules to ensure consistent gameplay mechanics throughout the adventure.`;
      
      console.log('📤 Sending adventure prompt to Phase 2 session:', phase2SessionId);
      console.log('📝 Adventure prompt length:', adventurePrompt.length);
      
      const adventureResponse = await phase2Chat.sendMessage({
        message: adventurePrompt
      });
      console.log('✅ Adventure response received, length:', adventureResponse.text.length);
      console.log('🎭 Adventure response preview:', adventureResponse.text.substring(0, 200) + '...');
      
      // Store the adventure response for the frontend
      conversationManager.addMessage(phase2SessionId, 'user', adventurePrompt, 'adventure_start');
      conversationManager.addMessage(phase2SessionId, 'ai', adventureResponse.text, 'adventure_response');
      
      return {
        success: true,
        newSessionId: phase2SessionId,
        campaignId,
        characterId,
        cachedContentName: cachedContent.name,
        adventureStarted: true,
        adventureResponse: adventureResponse.text
      };
    } catch (adventureError) {
      console.error('❌ Automated adventure start failed:', adventureError);
      return {
        success: true,
        newSessionId: phase2SessionId,
        campaignId,
        characterId,
        cachedContentName: cachedContent.name,
        adventureStarted: false,
        adventureError: adventureError.message
      };
    }
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

/**
 * Generate images for IMAGE_GENERATION_TRIGGER tags
 */
router.post('/generate-images', async (req, res) => {
  try {
    const { triggers, sessionId } = req.body;
    
    if (!triggers || !Array.isArray(triggers) || triggers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image triggers provided'
      });
    }

    console.log(`🎨 Generating images for ${triggers.length} triggers`);
    
    const imageGenerator = new ImageGenerator();
    const imageResults = [];

    // Generate images for each trigger
    for (const trigger of triggers) {
      try {
        console.log(`🎨 Processing trigger: ${trigger.type} - ${trigger.description}`);
        const imageResult = await imageGenerator.generateImage(trigger);
        imageResults.push(imageResult);
      } catch (error) {
        console.error('❌ Error processing image trigger:', error);
        imageResults.push({
          success: false,
          error: error.message,
          trigger: trigger
        });
      }
    }

    console.log(`🎨 Generated ${imageResults.filter(r => r.success).length}/${imageResults.length} images successfully`);

    res.json({
      success: true,
      images: imageResults,
      generated: imageResults.filter(r => r.success).length,
      total: imageResults.length
    });

  } catch (error) {
    console.error('❌ Image generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating images',
      error: error.message
    });
  }
});

module.exports = router;
