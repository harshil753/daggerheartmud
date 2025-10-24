const { model, imageModel } = require('../config/gemini');
const { getFullContext } = require('../utils/geminiContext');
const promptLoader = require('./promptLoader');
const AIResponseParser = require('./aiResponseParser');
const DatabaseSync = require('./databaseSync');
const ResponseOrchestrator = require('./responseOrchestrator');
const PythonGeminiWrapper = require('./pythonGeminiWrapper');

/**
 * AI Dungeon Master service using Gemini
 * Singleton pattern to ensure context is loaded only once per server instance
 */
class DungeonMaster {
  constructor() {
    this.contextLoaded = false;
    this.fullContext = null;
    this.initializationPromise = null; // Prevent multiple simultaneous initializations
    this.responseParser = new AIResponseParser();
    this.databaseSync = new DatabaseSync();
    this.responseOrchestrator = new ResponseOrchestrator();
    this.pythonGemini = new PythonGeminiWrapper();
  }

  static getInstance() {
    if (!DungeonMaster.instance) {
      DungeonMaster.instance = new DungeonMaster();
    }
    return DungeonMaster.instance;
  }

  /**
   * Initialize AI with SRD and equipment context (ONCE per server instance)
   */
  async initializeAI() {
    // If already loaded, return immediately
    if (this.contextLoaded) return;
    
    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return await this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._doInitialize();
    return await this.initializationPromise;
  }

  /**
   * Internal initialization method
   */
  async _doInitialize() {
    try {
      console.log('Loading AI context...');
      this.fullContext = getFullContext();
      this.contextLoaded = true;
      console.log('AI context loaded successfully');
    } catch (error) {
      console.error('Failed to load AI context:', error);
      this.initializationPromise = null; // Reset on error
      throw error;
    }
  }

  /**
   * Process any player input with AI (for unrecognized commands)
   */
  async processPlayerInput(input, gameState) {
    await this.initializeAI();

    const prompt = this.buildGeneralPrompt(input, gameState);
    
    try {
      // Use Python Gemini service instead of Node.js API (no seeding for regular interactions)
      const text = await this.pythonGemini.generateResponse(input, this.buildGameStateContext(gameState), false);

      // DEBUG: Show raw output from Python call
      console.log('🐍 RAW PYTHON OUTPUT:');
      console.log('--- START RAW OUTPUT ---');
      console.log(text);
      console.log('--- END RAW OUTPUT ---');
      console.log('🐍 Raw output length:', text.length);

      // Return raw response without any processing
      return text;
    } catch (error) {
      console.error('AI processing error:', error);
      return 'The Dungeon Master seems distracted. Please try again.';
    }
  }

  /**
   * Start character creation process
   */
  async startCharacterCreation(gameState) {
    await this.initializeAI();

    const prompt = this.buildCharacterCreationPrompt(gameState);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Create a proper response object for parsing
      const responseObj = { message: text };
      const parsedResponse = this.parseAIResponse(responseObj, 'create_character');
      const processedResponse = await this.processTriggers(parsedResponse, gameState, gameState.sessionId);
      
      this.updateConversationHistory(gameState, 'create_character', [], processedResponse);

      // Return the AI's actual response text
      return {
        success: true,
        message: text,
        type: 'character_creation',
        data: processedResponse
      };
    } catch (error) {
      console.error('Character creation error:', error);
      return {
        success: false,
        message: 'The Dungeon Master seems distracted. Please try again.',
        type: 'error'
      };
    }
  }

  /**
   * Process a player command through the AI DM
   */
  async processCommand(command, args, gameState) {
    await this.initializeAI();

    const prompt = this.buildPrompt(command, args, gameState);
    
    try {
      // Stage 1: Generate creative response with Python Gemini service
      console.log('🎭 DungeonMaster: Generating creative response');
      const creativeResponse = await this.pythonGemini.generateResponse(
        this.buildUserInputForCommand(command, args), 
        this.buildGameStateContext(gameState),
        false // No seeding for regular commands
      );

      // DEBUG: Show raw output from Python call
      console.log('🐍 RAW PYTHON OUTPUT (processCommand):');
      console.log('--- START RAW OUTPUT ---');
      console.log(creativeResponse);
      console.log('--- END RAW OUTPUT ---');
      console.log('🐍 Raw output length:', creativeResponse.length);

      // Use the raw response directly
      const processedText = creativeResponse;
      
      // For now, just return the AI's response directly (two-stage pipeline disabled)
      const finalResponse = {
        success: true,
        message: processedText,
        type: command,
        data: {}
      };
      
      this.updateConversationHistory(gameState, command, args, finalResponse);

      return finalResponse;
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        success: false,
        message: 'The Dungeon Master seems distracted. Please try again.',
        type: 'error'
      };
    }
  }

  /**
   * Build user input string for commands
   */
  buildUserInputForCommand(command, args) {
    if (args && args.length > 0) {
      return `${command} ${args.join(' ')}`;
    }
    return command;
  }

  /**
   * Seed the AI with rulebook and equipment data (only called once per session)
   */
  async seedAIWithRulebook() {
    try {
      console.log('🌱 Seeding AI with rulebook and equipment data...');
      const seedResponse = await this.pythonGemini.generateResponse(
        'Initialize the game with the provided rulebook and equipment data.',
        '',
        true // isSeeding = true
      );
      console.log('🌱 AI seeded successfully');
      return seedResponse;
    } catch (error) {
      console.error('❌ Failed to seed AI:', error);
      return null;
    }
  }

  /**
   * Build prompt for AI based on command and game state using prompt SDK
   */
  buildPrompt(command, args, gameState) {
    const { character, campaign, currentLocation, combat } = gameState;
    const history = gameState.aiContext?.conversationHistory || [];
    
    let prompt = '';
    
    // Use the prompt SDK for the base system instruction
    if (history.length === 0) {
      // First interaction - use full prompt SDK with context
      const sdkPrompt = promptLoader.getDungeonMasterPromptWithContext(this.fullContext.fullContext);
      if (sdkPrompt) {
        prompt += sdkPrompt;
      } else {
        // Fallback to original prompt if SDK fails to load
        prompt += `${this.fullContext.fullContext}\n\n`;
        prompt += `You are the Dungeon Master for a Daggerheart MUD game. `;
        prompt += `Respond in character as a helpful, engaging DM. `;
        prompt += `Use the Daggerheart rules and equipment data provided above.\n\n`;
      }
    } else {
      // Subsequent interactions - use simplified SDK prompt
      const sdkPrompt = promptLoader.loadDungeonMasterPrompt();
      if (sdkPrompt) {
        prompt += sdkPrompt;
        prompt += `\n\nContinue the conversation using the Daggerheart rules and context from our previous interactions.\n\n`;
      } else {
        // Fallback prompt
        prompt += `You are the Dungeon Master for a Daggerheart MUD game. `;
        prompt += `Continue the conversation using the Daggerheart rules and context from our previous interactions.\n\n`;
      }
    }

    // Add game state context
    prompt += this.buildGameStateContext(gameState);
    
    // Add command-specific instructions
    prompt += this.getCommandInstructions(command, args);
    
    return prompt;
  }

  /**
   * Build character creation prompt with targeted rules
   */
  buildCharacterCreationPrompt(gameState) {
    const baseContext = this.fullContext ? this.fullContext.fullContext : '';
    const characterCreationRules = this.promptLoader.getEventSpecificRules('character_creation');
    
    return `${baseContext}

${characterCreationRules}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A player wants to create a new character.

Use the character creation rules above to guide them through the process naturally. Help them choose their ancestry, class, community, and traits. Be engaging and help them understand their options.

Start the character creation process now.`;
  }

  /**
   * Build combat prompt with targeted rules
   */
  buildCombatPrompt(gameState) {
    const baseContext = this.fullContext ? this.fullContext.fullContext : '';
    const combatRules = this.promptLoader.getEventSpecificRules('combat');
    
    return `${baseContext}

${combatRules}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A combat encounter is beginning.

Use the combat rules above to manage the encounter. Remember this is turn-based combat where only ONE unit acts at a time. Be engaging and help players understand their options.

Begin the combat encounter.`;
  }

  /**
   * Build inventory prompt with targeted rules
   */
  buildInventoryPrompt(gameState) {
    const baseContext = this.fullContext ? this.fullContext.fullContext : '';
    const inventoryRules = this.promptLoader.getEventSpecificRules('inventory');
    
    return `${baseContext}

${inventoryRules}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A player is managing their inventory.

Use the inventory rules above to help them with equipment, items, and storage. Be helpful and guide them through inventory management.

Assist with inventory management.`;
  }

  /**
   * Build level up prompt with targeted rules
   */
  buildLevelUpPrompt(gameState) {
    const baseContext = this.fullContext ? this.fullContext.fullContext : '';
    const levelUpRules = this.promptLoader.getEventSpecificRules('level_up');
    
    return `${baseContext}

${levelUpRules}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A player is leveling up.

Use the level up rules above to guide them through character advancement. Help them choose appropriate advancements and understand their options.

Guide the level up process.`;
  }

  /**
   * Build equipment prompt with targeted rules
   */
  buildEquipmentPrompt(gameState) {
    const baseContext = this.fullContext ? this.fullContext.fullContext : '';
    const equipmentRules = this.promptLoader.getEventSpecificRules('equipment');
    
    return `${baseContext}

${equipmentRules}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A player is dealing with equipment.

Use the equipment rules above to help them with weapons, armor, and items. Be helpful and guide them through equipment management.

Assist with equipment management.`;
  }

  /**
   * Build prompt for general player input (unrecognized commands)
   */
  buildGeneralPrompt(input, gameState) {
    const { character, campaign, currentLocation, combat } = gameState;
    const history = gameState.aiContext?.conversationHistory || [];
    
    let prompt = '';
    
    // Use the prompt SDK for the base system instruction
    if (history.length === 0) {
      // First interaction - use full prompt SDK with context
      const sdkPrompt = promptLoader.getDungeonMasterPromptWithContext(this.fullContext.fullContext);
      if (sdkPrompt) {
        prompt += sdkPrompt;
      } else {
        // Fallback to original prompt if SDK fails to load
        prompt += `${this.fullContext.fullContext}\n\n`;
        prompt += `You are the Dungeon Master for a Daggerheart MUD game. `;
        prompt += `Respond in character as a helpful, engaging DM. `;
        prompt += `Use the Daggerheart rules and equipment data provided above.\n\n`;
      }
    } else {
      // Subsequent interactions - use simplified SDK prompt
      const sdkPrompt = promptLoader.loadDungeonMasterPrompt();
      if (sdkPrompt) {
        prompt += sdkPrompt;
        prompt += `\n\nContinue the conversation using the Daggerheart rules and context from our previous interactions.\n\n`;
      } else {
        // Fallback prompt
        prompt += `You are the Dungeon Master for a Daggerheart MUD game. `;
        prompt += `Continue the conversation using the Daggerheart rules and context from our previous interactions.\n\n`;
      }
    }

    // Add game state context
    prompt += this.buildGameStateContext(gameState);
    
    // Add general input handling
    prompt += `\n\nPlayer input: "${input}"\n\n`;
    prompt += `Respond to the player's input naturally and helpfully. `;
    prompt += `If they're asking about game mechanics, provide accurate information from the rules. `;
    prompt += `If they're roleplaying, respond in character as the DM.\n\n`;
    
    return prompt;
  }

  /**
   * Build game state context for the prompt
   */
  buildGameStateContext(gameState) {
    let context = '\n\n## CURRENT GAME STATE\n\n';
    
    if (gameState.character) {
      context += `Character: ${gameState.character.name || 'Unnamed'} (Level ${gameState.character.level || 1})\n`;
      context += `HP: ${gameState.character.hit_points_current || 0}/${gameState.character.hit_points_max || 0}\n`;
      context += `Stress: ${gameState.character.stress_current || 0}/${gameState.character.stress_max || 0}\n`;
      if (gameState.character.ancestry) context += `Ancestry: ${gameState.character.ancestry}\n`;
      if (gameState.character.class) context += `Class: ${gameState.character.class}\n`;
      if (gameState.character.community) context += `Community: ${gameState.character.community}\n`;
    }
    
    if (gameState.campaign) {
      context += `Campaign: ${gameState.campaign.name || 'Unnamed Campaign'}\n`;
      context += `Chapter: ${gameState.campaign.current_chapter || 1}\n`;
    }
    
    if (gameState.currentLocation) {
      context += `Location: ${gameState.currentLocation.name || 'Unknown Location'}\n`;
      if (gameState.currentLocation.description) {
        context += `Description: ${gameState.currentLocation.description}\n`;
      }
    }
    
    if (gameState.combat && gameState.combat.active) {
      context += `Combat: Active\n`;
      if (gameState.combat.initiative) {
        context += `Initiative Order: ${gameState.combat.initiative.join(', ')}\n`;
      }
    }
    
    // Add recent conversation history
    const history = gameState.aiContext?.conversationHistory || [];
    if (history.length > 0) {
      context += `\nRecent conversation:\n`;
      history.slice(-5).forEach(entry => {
        context += `${entry.timestamp}: ${entry.type} - ${entry.content}\n`;
      });
    }
    
    return context;
  }

  /**
   * Get command-specific instructions
   */
  getCommandInstructions(command, args) {
    let instructions = '\n\n## COMMAND INSTRUCTIONS\n\n';
    
    switch (command.toLowerCase()) {
      case 'create character':
        instructions += `Help the player create a new Daggerheart character. `;
        instructions += `Guide them through selecting ancestry, class, community, and starting equipment. `;
        instructions += `Use the character creation rules from the SRD. `;
        instructions += `Include structured data tags for all character creation steps.\n`;
        break;
        
      case 'attack':
        instructions += `Process the attack action. `;
        instructions += `Use the combat rules from the SRD. `;
        instructions += `Calculate damage using duality dice (d12 Hope + d12 Fear). `;
        instructions += `Include structured data tags for damage and status changes.\n`;
        break;
        
      case 'cast':
        instructions += `Process the spellcasting action. `;
        instructions += `Use the magic rules from the SRD. `;
        instructions += `Check if the character has access to the spell domain. `;
        instructions += `Include structured data tags for spell effects.\n`;
        break;
        
      case 'equip':
        instructions += `Process equipment changes. `;
        instructions += `Use the equipment rules from the SRD. `;
        instructions += `Check tier requirements and burden limits. `;
        instructions += `Include structured data tags for equipment changes.\n`;
        break;
        
      case 'rest':
        instructions += `Process rest actions. `;
        instructions += `Use the rest rules from the SRD. `;
        instructions += `Calculate HP and stress recovery. `;
        instructions += `Include structured data tags for stat changes.\n`;
        break;
        
      default:
        instructions += `Process the "${command}" command appropriately. `;
        instructions += `Use the relevant rules from the SRD. `;
        instructions += `Include structured data tags for any game state changes.\n`;
    }
    
    if (args && args.length > 0) {
      instructions += `\nCommand arguments: ${args.join(' ')}\n`;
    }
    
    return instructions;
  }

  /**
   * Parse AI response for structured data
   */
  parseAIResponse(response, command) {
    return this.responseParser.parseResponse(response, command);
  }

  /**
   * Process triggers in the response
   */
  async processTriggers(response, gameState, sessionId) {
    if (!response.triggers || response.triggers.length === 0) {
      return response;
    }

    const processedResponse = { ...response };
    processedResponse.triggers = [];

    for (const trigger of response.triggers) {
      switch (trigger.type) {
        case 'IMAGE_GENERATION_TRIGGER':
          try {
            const imagePrompt = trigger.data.prompt;
            const imageResult = await imageModel.generateContent(imagePrompt);
            const imageResponse = await imageResult.response;
            const imageData = await imageResponse.text();
            
            processedResponse.image = {
              prompt: imagePrompt,
              data: imageData
            };
          } catch (error) {
            console.error('Image generation error:', error);
          }
          break;
          
        case 'ASCII_MAP':
          processedResponse.asciiMap = trigger.data;
          break;
          
        case 'DATABASE_SYNC':
          try {
            await this.databaseSync.syncGameState(gameState, sessionId);
          } catch (error) {
            console.error('Database sync error:', error);
          }
          break;
      }
    }

    return processedResponse;
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(gameState, command, args, response) {
    if (!gameState.aiContext) {
      gameState.aiContext = { conversationHistory: [] };
    }
    
    const history = gameState.aiContext.conversationHistory;
    const timestamp = new Date().toISOString();
    
    // Add command to history
    history.push({
      timestamp,
      type: 'command',
      content: `${command} ${args ? args.join(' ') : ''}`.trim()
    });
    
    // Add response to history
    history.push({
      timestamp,
      type: 'response',
      content: response.message || response.text || 'No response content'
    });
    
    // Keep only last 20 entries
    if (history.length > 20) {
      gameState.aiContext.conversationHistory = history.slice(-20);
    }
  }

  /**
   * Generate campaign structure
   */
  async generateCampaign(storyLength) {
    await this.initializeAI();

    const prompt = `${this.fullContext.fullContext}\n\n` +
      `Generate a ${storyLength} campaign structure for Daggerheart. ` +
      `Create ${storyLength === 'short' ? '3-5' : storyLength === 'medium' ? '6-10' : '11-15'} chapters ` +
      `with engaging storylines, locations, and encounters. ` +
      `Return the structure as JSON with chapters, locations, and key NPCs.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse campaign JSON:', parseError);
        return { error: 'Failed to generate valid campaign structure' };
      }
    } catch (error) {
      console.error('Campaign generation error:', error);
      return { error: 'Failed to generate campaign' };
    }
  }
}

module.exports = DungeonMaster;