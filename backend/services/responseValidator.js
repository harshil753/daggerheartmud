const RuleValidator = require('./ruleValidator');

/**
 * Response Validator - Validates AI responses against game rules
 */
class ResponseValidator {
  constructor() {
    this.ruleValidator = new RuleValidator();
  }

  /**
   * Validate AI response for rule compliance
   */
  async validateAIResponse(response, gameState) {
    const errors = [];
    
    try {
      // Extract structured data from response
      const statChanges = this.extractStatChanges(response);
      const itemChanges = this.extractItemChanges(response);
      const combatActions = this.extractCombatActions(response);
      const levelChanges = this.extractLevelChanges(response);
      const equipmentChanges = this.extractEquipmentChanges(response);
      
      // Validate each type of change
      for (const change of statChanges) {
        const result = this.ruleValidator.validateStatChange(change, gameState.character);
        if (!result.valid) {
          errors.push(...result.errors.map(err => `Stat Change: ${err}`));
        }
      }
      
      for (const item of itemChanges) {
        const result = this.ruleValidator.validateItemDistribution(item, gameState.character);
        if (!result.valid) {
          errors.push(...result.errors.map(err => `Item Distribution: ${err}`));
        }
      }
      
      for (const action of combatActions) {
        const result = this.ruleValidator.validateCombatAction(action, gameState.character, gameState);
        if (!result.valid) {
          errors.push(...result.errors.map(err => `Combat Action: ${err}`));
        }
      }
      
      for (const levelChange of levelChanges) {
        const result = this.ruleValidator.validateLevelUp(levelChange.newLevel, gameState.character);
        if (!result.valid) {
          errors.push(...result.errors.map(err => `Level Up: ${err}`));
        }
      }
      
      for (const equipmentChange of equipmentChanges) {
        const result = this.ruleValidator.validateEquipmentChange(equipmentChange, gameState.character);
        if (!result.valid) {
          errors.push(...result.errors.map(err => `Equipment Change: ${err}`));
        }
      }
      
      return { valid: errors.length === 0, errors };
      
    } catch (error) {
      console.error('Error validating AI response:', error);
      return { valid: false, errors: ['Validation error: ' + error.message] };
    }
  }

  /**
   * Extract stat changes from response
   */
  extractStatChanges(response) {
    const statChanges = [];
    const statChangeRegex = /\[STAT_CHANGE:(\w+):([+-]?\d+)(?::(\w+))?\]/g;
    let match;
    
    while ((match = statChangeRegex.exec(response)) !== null) {
      statChanges.push({
        stat: match[1],
        change: parseInt(match[2]),
        type: match[3] || null
      });
    }
    
    return statChanges;
  }

  /**
   * Extract item changes from response
   */
  extractItemChanges(response) {
    const itemChanges = [];
    const itemAddRegex = /\[ITEM_ADD:([^:]+):(\d+)(?::([^:]+))?\]/g;
    const itemRemoveRegex = /\[ITEM_REMOVE:([^:]+):(\d+)\]?/g;
    let match;
    
    // Extract item additions
    while ((match = itemAddRegex.exec(response)) !== null) {
      itemChanges.push({
        action: 'add',
        name: match[1],
        quantity: parseInt(match[2]),
        tier: match[3] ? parseInt(match[3]) : 1
      });
    }
    
    // Extract item removals
    while ((match = itemRemoveRegex.exec(response)) !== null) {
      itemChanges.push({
        action: 'remove',
        name: match[1],
        quantity: parseInt(match[2])
      });
    }
    
    return itemChanges;
  }

  /**
   * Extract combat actions from response
   */
  extractCombatActions(response) {
    const combatActions = [];
    
    // Look for attack patterns
    const attackRegex = /(?:attacks?|strikes?|hits?|damages?)\s+(\w+)/gi;
    let match;
    
    while ((match = attackRegex.exec(response)) !== null) {
      combatActions.push({
        type: 'attack',
        target: match[1],
        weapon: this.extractWeaponFromResponse(response)
      });
    }
    
    // Look for spell casting
    const spellRegex = /(?:casts?|uses?)\s+(\w+)\s+(?:spell|magic)/gi;
    while ((match = spellRegex.exec(response)) !== null) {
      combatActions.push({
        type: 'spell',
        spell: match[1],
        target: this.extractTargetFromResponse(response)
      });
    }
    
    return combatActions;
  }

  /**
   * Extract level changes from response
   */
  extractLevelChanges(response) {
    const levelChanges = [];
    const levelUpRegex = /\[LEVEL_UP:(\d+)\]|(?:levels?\s+up\s+to\s+level\s+(\d+)|gains?\s+level\s+(\d+))/gi;
    let match;
    
    while ((match = levelUpRegex.exec(response)) !== null) {
      const newLevel = parseInt(match[1] || match[2] || match[3]);
      if (newLevel) {
        levelChanges.push({ newLevel });
      }
    }
    
    return levelChanges;
  }

  /**
   * Extract equipment changes from response
   */
  extractEquipmentChanges(response) {
    const equipmentChanges = [];
    const equipRegex = /(?:equips?|wields?|wears?)\s+(\w+)/gi;
    const unequipRegex = /(?:unequips?|removes?|takes?\s+off)\s+(\w+)/gi;
    let match;
    
    // Extract equipment
    while ((match = equipRegex.exec(response)) !== null) {
      equipmentChanges.push({
        action: 'equip',
        item: { name: match[1], type: 'equipment' }
      });
    }
    
    // Extract unequipment
    while ((match = unequipRegex.exec(response)) !== null) {
      equipmentChanges.push({
        action: 'unequip',
        item: { name: match[1], type: 'equipment' }
      });
    }
    
    return equipmentChanges;
  }

  /**
   * Extract weapon from response
   */
  extractWeaponFromResponse(response) {
    const weaponRegex = /(?:with|using)\s+(\w+(?:\s+\w+)*)\s+(?:weapon|sword|bow|staff)/gi;
    const match = weaponRegex.exec(response);
    return match ? match[1] : null;
  }

  /**
   * Extract target from response
   */
  extractTargetFromResponse(response) {
    const targetRegex = /(?:at|on|against)\s+(\w+)/gi;
    const match = targetRegex.exec(response);
    return match ? match[1] : null;
  }

  /**
   * Validate response format
   */
  validateResponseFormat(response) {
    const errors = [];
    
    // Check for required structured data tags
    if (response.includes('damage') && !response.includes('[STAT_CHANGE:HP:')) {
      errors.push('Damage mentioned but no HP change tag found');
    }
    
    if (response.includes('item') && !response.includes('[ITEM_')) {
      errors.push('Item mentioned but no item change tag found');
    }
    
    if (response.includes('level') && !response.includes('[LEVEL_UP:')) {
      errors.push('Level mentioned but no level up tag found');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    return this.ruleValidator.getValidationSummary();
  }

  /**
   * Clear validation errors
   */
  clearErrors() {
    this.ruleValidator.clearErrors();
  }
}

module.exports = ResponseValidator;
