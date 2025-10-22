const { model, imageModel } = require('../config/gemini');
const { getFullContext } = require('../utils/geminiContext');
const promptLoader = require('./promptLoader');
const AIResponseParser = require('./aiResponseParser');
const DatabaseSync = require('./databaseSync');
const ResponseOrchestrator = require('./responseOrchestrator');

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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsedResponse = this.parseAIResponse(text, 'general');
      const processedResponse = await this.processTriggers(parsedResponse, gameState, gameState.sessionId);
      this.updateConversationHistory(gameState, 'general', [input], processedResponse);

      // Return just the message text for processPlayerInput
      return processedResponse.message || processedResponse.text || text;
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
      // Stage 1: Generate creative response with Gemini
      console.log('🎭 DungeonMaster: Generating creative response');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const creativeResponse = response.text();

      // Stage 2: Process through two-stage pipeline (temporarily disabled for debugging)
      console.log('🔧 DungeonMaster: Processing through two-stage pipeline');
      // const orchestrationResult = await this.responseOrchestrator.processAIResponse(creativeResponse, gameState);

      // Use the processed response from the orchestrator
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
   * Build character creation prompt
   */
  buildCharacterCreationPrompt(gameState) {
    const context = this.fullContext ? this.fullContext.fullContext : '';
    
    return `${context}

You are the Dungeon Master for a Daggerheart tabletop RPG game. A player wants to create a new character.

Guide them through character creation naturally, helping them choose their ancestry, class, community, and traits. Be engaging and help them understand their options.

Start the character creation process now.`;
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