/**
 * Conversation History Manager
 * Manages conversation tracking with message types and timestamps
 */
class ConversationHistoryManager {
  constructor() {
    this.histories = new Map(); // sessionId -> conversation history
  }

  /**
   * Add a message to conversation history
   */
  addMessage(sessionId, role, content, type = 'general', metadata = {}) {
    if (!this.histories.has(sessionId)) {
      this.histories.set(sessionId, []);
    }

    const message = {
      role,
      content,
      type,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.histories.get(sessionId).push(message);
    
    console.log(`📝 Added ${type} message to session ${sessionId}:`, {
      role,
      contentLength: content.length,
      timestamp: message.timestamp
    });

    return message;
  }

  /**
   * Get conversation history for a session
   */
  getHistory(sessionId) {
    return this.histories.get(sessionId) || [];
  }

  /**
   * Get filtered conversation history (excluding seed data)
   */
  getFilteredHistory(sessionId, excludeTypes = ['seed_data']) {
    const history = this.getHistory(sessionId);
    return history.filter(message => !excludeTypes.includes(message.type));
  }

  /**
   * Get conversation history by type
   */
  getHistoryByType(sessionId, type) {
    const history = this.getHistory(sessionId);
    return history.filter(message => message.type === type);
  }

  /**
   * Clear conversation history for a session
   */
  clearHistory(sessionId) {
    this.histories.delete(sessionId);
    console.log(`🗑️ Cleared conversation history for session ${sessionId}`);
  }

  /**
   * Transfer conversation history between sessions
   */
  transferHistory(fromSessionId, toSessionId, excludeTypes = ['seed_data']) {
    const fromHistory = this.getFilteredHistory(fromSessionId, excludeTypes);
    this.histories.set(toSessionId, fromHistory);
    
    console.log(`📤 Transferred ${fromHistory.length} messages from session ${fromSessionId} to ${toSessionId}`);
    return fromHistory;
  }

  /**
   * Detect message type based on content and context
   */
  detectMessageType(content, isUser = true, previousMessage = null) {
    if (isUser) {
      return this.detectUserMessageType(content, previousMessage);
    } else {
      return this.detectAIMessageType(content, previousMessage);
    }
  }

  /**
   * Detect user message type
   */
  detectUserMessageType(content, previousMessage) {
    const lowerContent = content.toLowerCase();

    // Seed data detection
    if (content.length > 100000) {
      return 'seed_data';
    }

    // Campaign length choice
    if (lowerContent.match(/^(short|medium|long)$/)) {
      return 'campaign_choice';
    }

    // Character creation responses
    if (lowerContent.match(/^(human|elf|dwarf|goblin|clank|drakona|faerie|faun|firbolg|fungril|galapa|giant|halfling|infernis|katari|orc|ribbet|simiah)$/)) {
      return 'ancestry_choice';
    }

    if (lowerContent.match(/^(academy|city|court|frontier|guild|military|nomad|outlaw|temple|underworld|wilderness)$/)) {
      return 'community_choice';
    }

    if (lowerContent.match(/^(bard|druid|guardian|ranger|rogue|seraph|sorcerer|warrior|wizard)$/)) {
      return 'class_choice';
    }

    // Character name
    if (previousMessage && previousMessage.type === 'name_prompt') {
      return 'character_name';
    }

    // Character description
    if (previousMessage && previousMessage.type === 'description_prompt') {
      return 'character_description';
    }

    // Background questions
    if (previousMessage && previousMessage.type === 'background_question') {
      return 'background_response';
    }

    // General gameplay commands
    if (lowerContent.match(/^(look|move|attack|defend|flee|inventory|stats|help|save|rest)$/)) {
      return 'gameplay_command';
    }

    return 'general';
  }

  /**
   * Detect AI message type
   */
  detectAIMessageType(content, previousMessage) {
    const lowerContent = content.toLowerCase();

    // Campaign setup
    if (lowerContent.includes('campaign length') || lowerContent.includes('choose a campaign')) {
      return 'campaign_setup';
    }

    // Character creation completion (check this FIRST)
    // Look for various completion indicators
    if (lowerContent.includes('[character_creation_complete]') ||
        lowerContent.includes('character_creation_complete') ||
        (lowerContent.includes('character complete')) ||
        (lowerContent.includes('character finished'))) {
      return 'character_creation_complete';
    }

    // Character creation prompts
    if (lowerContent.includes('ancestry') && lowerContent.includes('choose')) {
      return 'ancestry_prompt';
    }

    if (lowerContent.includes('community') && lowerContent.includes('choose')) {
      return 'community_prompt';
    }

    if (lowerContent.includes('class') && lowerContent.includes('choose')) {
      return 'class_prompt';
    }

    if (lowerContent.includes('name') && lowerContent.includes('character')) {
      return 'name_prompt';
    }

    if (lowerContent.includes('describe') && lowerContent.includes('character')) {
      return 'description_prompt';
    }

    if (lowerContent.includes('background') && lowerContent.includes('question')) {
      return 'background_question';
    }

    // Campaign creation completion
    if (lowerContent.includes('[campaign_setup_complete]') ||
        lowerContent.includes('[campaign_setup]') || 
        lowerContent.includes('campaign overview')) {
      return 'campaign_setup_complete';
    }

    // Gameplay responses (check this AFTER character creation)
    if (lowerContent.includes('[location]') || lowerContent.includes('[description]')) {
      return 'gameplay_response';
    }

    if (lowerContent.includes('what would you like to do') || lowerContent.includes('[prompt]')) {
      return 'action_prompt';
    }

    return 'general';
  }

  /**
   * Check if character creation is complete
   */
  isCharacterCreationComplete(sessionId) {
    const history = this.getHistory(sessionId);
    const lastMessage = history[history.length - 1];
    
    return lastMessage && lastMessage.type === 'character_creation_complete';
  }

  /**
   * Check if campaign setup is complete
   */
  isCampaignSetupComplete(sessionId) {
    const history = this.getHistory(sessionId);
    const lastMessage = history[history.length - 1];
    
    return lastMessage && lastMessage.type === 'campaign_setup_complete';
  }

  /**
   * Get conversation summary for caching
   */
  getConversationSummary(sessionId) {
    const history = this.getFilteredHistory(sessionId, ['seed_data']);
    
    return {
      totalMessages: history.length,
      messageTypes: this.getMessageTypeCounts(history),
      lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
      keyMoments: this.extractKeyMoments(history)
    };
  }

  /**
   * Get message type counts
   */
  getMessageTypeCounts(history) {
    const counts = {};
    for (const message of history) {
      counts[message.type] = (counts[message.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Extract key moments from conversation
   */
  extractKeyMoments(history) {
    const keyMoments = [];
    
    for (const message of history) {
      if (['campaign_choice', 'ancestry_choice', 'community_choice', 'class_choice', 'character_creation_complete'].includes(message.type)) {
        keyMoments.push({
          type: message.type,
          content: message.content,
          timestamp: message.timestamp
        });
      }
    }
    
    return keyMoments;
  }

  /**
   * Format conversation for AI context
   */
  formatForAI(history) {
    return history.map(message => ({
      role: message.role,
      parts: [{ text: message.content }]
    }));
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const history = this.getHistory(sessionId);
    const summary = this.getConversationSummary(sessionId);
    
    return {
      sessionId,
      totalMessages: history.length,
      userMessages: history.filter(m => m.role === 'user').length,
      aiMessages: history.filter(m => m.role === 'ai').length,
      messageTypes: summary.messageTypes,
      keyMoments: summary.keyMoments,
      lastActivity: summary.lastActivity,
      isCharacterComplete: this.isCharacterCreationComplete(sessionId),
      isCampaignComplete: this.isCampaignSetupComplete(sessionId)
    };
  }
}

module.exports = ConversationHistoryManager;
