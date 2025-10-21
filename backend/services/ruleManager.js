const fs = require('fs');
const path = require('path');

/**
 * Rule Manager - Context-aware rule loading system
 * Loads only relevant rules based on game context and command type
 */
class RuleManager {
  constructor() {
    this.ruleCache = new Map();
    this.coreRules = null;
    this.usageStats = new Map();
  }

  /**
   * Load core rules that are always needed
   */
  async loadCoreRules() {
    if (this.coreRules) return this.coreRules;

    try {
      const coreMechanics = await this.loadRule('core_mechanics');
      const quickReference = await this.loadRule('quick_reference');
      
      this.coreRules = `${coreMechanics}\n\n---\n\n${quickReference}`;
      console.log('Core rules loaded successfully');
      return this.coreRules;
    } catch (error) {
      console.error('Error loading core rules:', error);
      throw error;
    }
  }

  /**
   * Load rules based on command and game state context
   */
  async loadRulesForContext(command, gameState) {
    const rules = [];
    
    // Always load core rules
    rules.push(await this.loadCoreRules());
    
    // Load context-specific rules
    if (this.isCharacterCreation(command, gameState)) {
      rules.push(await this.loadRule('character_creation'));
      rules.push(await this.loadRule('equipment_rules'));
      this.trackRuleUsage('character_creation', command);
      this.trackRuleUsage('equipment_rules', command);
    }
    
    if (this.isCombat(command, gameState)) {
      rules.push(await this.loadRule('combat_system'));
      rules.push(await this.loadRule('equipment_rules'));
      this.trackRuleUsage('combat_system', command);
      this.trackRuleUsage('equipment_rules', command);
    }
    
    if (this.isSpellcasting(command, gameState)) {
      rules.push(await this.loadRule('spells_and_magic'));
      this.trackRuleUsage('spells_and_magic', command);
    }
    
    if (this.isLevelUp(command, gameState)) {
      rules.push(await this.loadRule('character_advancement'));
      this.trackRuleUsage('character_advancement', command);
    }
    
    if (this.isInventoryManagement(command, gameState)) {
      rules.push(await this.loadRule('inventory_management'));
      this.trackRuleUsage('inventory_management', command);
    }
    
    if (this.isDowntime(command, gameState)) {
      rules.push(await this.loadRule('downtime_activities'));
      this.trackRuleUsage('downtime_activities', command);
    }
    
    if (this.isSocialInteraction(command, gameState)) {
      rules.push(await this.loadRule('social_interaction'));
      this.trackRuleUsage('social_interaction', command);
    }
    
    if (this.isExploration(command, gameState)) {
      rules.push(await this.loadRule('exploration_rules'));
      this.trackRuleUsage('exploration_rules', command);
    }

    return rules.join('\n\n---\n\n');
  }

  /**
   * Load a specific rule file
   */
  async loadRule(ruleName) {
    if (this.ruleCache.has(ruleName)) {
      return this.ruleCache.get(ruleName);
    }

    try {
      const rulePath = path.join(__dirname, '../../docs/rules', `${ruleName}.md`);
      const ruleContent = fs.readFileSync(rulePath, 'utf8');
      this.ruleCache.set(ruleName, ruleContent);
      return ruleContent;
    } catch (error) {
      console.error(`Error loading rule ${ruleName}:`, error);
      return `# ${ruleName}\n\nRule file not found or could not be loaded.`;
    }
  }

  /**
   * Context detection methods
   */
  isCharacterCreation(command, gameState) {
    const characterKeywords = ['create', 'character', 'ancestry', 'class', 'community', 'background'];
    const commandLower = command.toLowerCase();
    return characterKeywords.some(keyword => commandLower.includes(keyword)) || 
           !gameState.character;
  }

  isCombat(command, gameState) {
    const combatKeywords = ['attack', 'fight', 'combat', 'battle', 'damage', 'weapon', 'spell', 'cast'];
    const commandLower = command.toLowerCase();
    return combatKeywords.some(keyword => commandLower.includes(keyword)) || 
           gameState.combat;
  }

  isSpellcasting(command, gameState) {
    const spellKeywords = ['spell', 'magic', 'cast', 'domain', 'enchant', 'curse', 'bless'];
    const commandLower = command.toLowerCase();
    return spellKeywords.some(keyword => commandLower.includes(keyword)) ||
           (gameState.character && gameState.character.class && 
            ['wizard', 'sorcerer', 'druid', 'bard'].includes(gameState.character.class.toLowerCase()));
  }

  isLevelUp(command, gameState) {
    const levelKeywords = ['level', 'advance', 'experience', 'xp', 'proficiency', 'ability'];
    const commandLower = command.toLowerCase();
    return levelKeywords.some(keyword => commandLower.includes(keyword));
  }

  isInventoryManagement(command, gameState) {
    const inventoryKeywords = ['inventory', 'item', 'equipment', 'loot', 'treasure', 'bag', 'pouch'];
    const commandLower = command.toLowerCase();
    return inventoryKeywords.some(keyword => commandLower.includes(keyword));
  }

  isDowntime(command, gameState) {
    const downtimeKeywords = ['rest', 'sleep', 'camp', 'downtime', 'craft', 'research', 'train'];
    const commandLower = command.toLowerCase();
    return downtimeKeywords.some(keyword => commandLower.includes(keyword));
  }

  isSocialInteraction(command, gameState) {
    const socialKeywords = ['talk', 'speak', 'persuade', 'intimidate', 'charm', 'deceive', 'negotiate'];
    const commandLower = command.toLowerCase();
    return socialKeywords.some(keyword => commandLower.includes(keyword));
  }

  isExploration(command, gameState) {
    const explorationKeywords = ['explore', 'search', 'investigate', 'travel', 'navigate', 'track'];
    const commandLower = command.toLowerCase();
    return explorationKeywords.some(keyword => commandLower.includes(keyword));
  }

  /**
   * Track rule usage for optimization
   */
  trackRuleUsage(ruleName, context) {
    if (!this.usageStats.has(ruleName)) {
      this.usageStats.set(ruleName, { count: 0, contexts: [] });
    }
    
    const stats = this.usageStats.get(ruleName);
    stats.count++;
    if (!stats.contexts.includes(context)) {
      stats.contexts.push(context);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return Object.fromEntries(this.usageStats);
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache() {
    this.ruleCache.clear();
    this.coreRules = null;
  }

  /**
   * Get available rule files
   */
  getAvailableRules() {
    try {
      const rulesDir = path.join(__dirname, '../../docs/rules');
      return fs.readdirSync(rulesDir)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
    } catch (error) {
      console.error('Error reading rules directory:', error);
      return [];
    }
  }
}

module.exports = RuleManager;
