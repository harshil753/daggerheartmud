const { model, imageModel } = require('../config/gemini');
const { getFullContext } = require('../utils/geminiContext');

/**
 * AI Dungeon Master service using Gemini
 */
class DungeonMaster {
  constructor() {
    this.contextLoaded = false;
    this.fullContext = null;
  }

  /**
   * Initialize AI with SRD and equipment context
   */
  async initializeAI() {
    if (this.contextLoaded) return;

    try {
      console.log('Loading AI context...');
      this.fullContext = getFullContext();
      this.contextLoaded = true;
      console.log('AI context loaded successfully');
    } catch (error) {
      console.error('Failed to load AI context:', error);
      throw error;
    }
  }

  /**
   * Process a player command through the AI DM
   */
  async processCommand(command, args, gameState) {
    await this.initializeAI();

    const prompt = this.buildPrompt(command, args, gameState);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response for structured data
      const parsedResponse = this.parseAIResponse(text, command);
      
      // Update conversation history
      this.updateConversationHistory(gameState, command, args, parsedResponse);

      return parsedResponse;
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
   * Build prompt for AI based on command and game state
   */
  buildPrompt(command, args, gameState) {
    const { character, campaign, currentLocation, combat } = gameState;
    
    let prompt = `${this.fullContext.fullContext}\n\n`;
    
    prompt += `You are the Dungeon Master for a Daggerheart MUD game. `;
    prompt += `Respond in character as a helpful, engaging DM. `;
    prompt += `Use the Daggerheart rules and equipment data provided above.\n\n`;
    
    // Add current game state
    if (character) {
      prompt += `CURRENT CHARACTER:\n`;
      prompt += `Name: ${character.name}\n`;
      prompt += `Ancestry: ${character.ancestry}\n`;
      prompt += `Class: ${character.class}\n`;
      prompt += `Level: ${character.level}\n`;
      prompt += `HP: ${character.hit_points_current}/${character.hit_points_max}\n`;
      prompt += `Stress: ${character.stress_current}/${character.stress_max}\n\n`;
    }

    if (campaign) {
      prompt += `CURRENT CAMPAIGN:\n`;
      prompt += `Title: ${campaign.title}\n`;
      prompt += `Chapter: ${campaign.current_chapter}/${campaign.total_chapters}\n`;
      prompt += `Story Length: ${campaign.story_length}\n\n`;
    }

    if (currentLocation) {
      prompt += `CURRENT LOCATION: ${currentLocation}\n\n`;
    }

    if (combat) {
      prompt += `COMBAT ACTIVE:\n`;
      prompt += `Round: ${combat.round_number}\n`;
      prompt += `Initiative: ${JSON.stringify(combat.initiative_order)}\n\n`;
    }

    // Add conversation history for context
    const history = gameState.aiContext?.conversationHistory || [];
    if (history.length > 0) {
      prompt += `RECENT CONVERSATION:\n`;
      history.slice(-10).forEach(entry => {
        prompt += `${entry.role}: ${entry.content}\n`;
      });
      prompt += `\n`;
    }

    // Add command-specific instructions
    prompt += this.getCommandInstructions(command, args);

    return prompt;
  }

  /**
   * Get command-specific instructions for the AI
   */
  getCommandInstructions(command, args) {
    const instructions = {
      'look': `The player wants to examine their surroundings. Describe the current location, any visible exits, items, NPCs, or other features. Be descriptive and atmospheric.`,
      
      'move': `The player wants to move in direction: ${args[0]}. Determine if this is possible and describe the new location they arrive at. If blocked, explain why.`,
      
      'inventory': `The player wants to see their inventory. List all items they're carrying, including equipped weapons and armor. Show item details and quantities.`,
      
      'stats': `The player wants to see their character statistics. Display their traits, HP, stress, equipment bonuses, and any status effects.`,
      
      'equip': `The player wants to equip: ${Array.isArray(args) ? args.join(' ') : args || ''}. Check if they have this item and if it can be equipped. Update their stats accordingly.`,
      
      'unequip': `The player wants to unequip: ${Array.isArray(args) ? args[0] : args || ''}. Remove the item from the specified slot and update their stats.`,
      
      'use': `The player wants to use: ${Array.isArray(args) ? args.join(' ') : args || ''}. Check if they have this consumable item and apply its effects.`,
      
      'attack': `The player wants to attack: ${Array.isArray(args) ? args.join(' ') : args || ''}. If in combat, process the attack. If not in combat, start combat if appropriate.`,
      
      'cast': `The player wants to cast: ${Array.isArray(args) ? args.join(' ') : args || ''}. Check if they have this ability and if they can use it. Apply magical effects.`,
      
      'talk': `The player wants to talk to: ${Array.isArray(args) ? args.join(' ') : args || ''}. Roleplay the NPC conversation. Be engaging and in-character.`,
      
      'rest': `The player wants to rest. Allow them to recover HP and stress if it's safe to do so.`,
      
      'save': `The player wants to create a save point. Confirm the save and note the current progress.`
    };

    return instructions[command] || `The player executed command: ${command} with args: ${Array.isArray(args) ? args.join(' ') : args || ''}. Respond appropriately as the DM.`;
  }

  /**
   * Parse AI response for structured data
   */
  parseAIResponse(text, command) {
    // Extract structured data from AI response
    const response = {
      success: true,
      message: text,
      type: 'narrative',
      data: {}
    };

    // Check for combat triggers
    if (text.toLowerCase().includes('combat') || text.toLowerCase().includes('battle')) {
      response.type = 'combat_start';
    }

    // Check for location changes
    if (command === 'move' && !text.toLowerCase().includes('cannot') && !text.toLowerCase().includes('blocked')) {
      response.type = 'location_change';
    }

    // Check for item interactions
    if (command === 'equip' || command === 'use') {
      response.type = 'item_interaction';
    }

    return response;
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(gameState, command, args, response) {
    if (!gameState.aiContext) {
      gameState.aiContext = { conversationHistory: [] };
    }

    const history = gameState.aiContext.conversationHistory;
    
    // Add player command
    history.push({
      role: 'player',
      content: `${command} ${Array.isArray(args) ? args.join(' ') : args || ''}`,
      timestamp: new Date()
    });

    // Add AI response
    history.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date()
    });

    // Keep only last 50 messages to manage context size
    if (history.length > 50) {
      gameState.aiContext.conversationHistory = history.slice(-50);
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
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { error: 'Could not parse campaign structure' };
    } catch (error) {
      console.error('Campaign generation error:', error);
      return { error: 'Failed to generate campaign' };
    }
  }

  /**
   * Generate image based on description
   */
  async generateImage(imageDescription, imageType = 'ITEM') {
    try {
      const prompt = `Create a fantasy ${imageType.toLowerCase()} image: ${imageDescription}. ` +
        `Style: Detailed fantasy artwork, suitable for a tabletop RPG game. ` +
        `Quality: High resolution, professional illustration style.`;

      const result = await imageModel.generateContent(prompt);
      const response = await result.response;
      
      // Return the generated image data
      return {
        success: true,
        imageData: response.text(), // This will contain the image generation result
        type: imageType,
        description: imageDescription
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: 'Failed to generate image',
        type: imageType,
        description: imageDescription
      };
    }
  }
}

module.exports = DungeonMaster;
