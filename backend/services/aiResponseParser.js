/**
 * AI Response Parser Service
 * Extracts structured data from AI responses for database sync
 */
class AIResponseParser {
  constructor() {
    this.parsers = {
      statChange: this.parseStatChange.bind(this),
      itemAdd: this.parseItemAdd.bind(this),
      itemRemove: this.parseItemRemove.bind(this),
      itemUse: this.parseItemUse.bind(this),
      levelUp: this.parseLevelUp.bind(this),
      experienceGain: this.parseExperienceGain.bind(this),
      locationChange: this.parseLocationChange.bind(this),
      combatStart: this.parseCombatStart.bind(this),
      combatEnd: this.parseCombatEnd.bind(this)
    };
  }

  /**
   * Parse AI response for structured data changes
   */
  parseResponse(aiResponse, gameState) {
    const changes = {
      character: {},
      inventory: [],
      location: null,
      combat: null,
      experience: null,
      level: null
    };

    if (!aiResponse || !aiResponse.message) {
      return changes;
    }

    const message = aiResponse.message;

    // Parse stat changes
    const statChanges = this.parseStatChanges(message);
    if (statChanges.length > 0) {
      changes.character = { ...changes.character, ...this.mergeStatChanges(statChanges) };
    }

    // Parse inventory changes
    const inventoryChanges = this.parseInventoryChanges(message);
    if (inventoryChanges.length > 0) {
      changes.inventory = inventoryChanges;
    }

    // Parse level progression
    const levelData = this.parseLevelProgression(message);
    if (levelData) {
      changes.level = levelData;
    }

    // Parse experience changes
    const experienceData = this.parseExperienceChanges(message);
    if (experienceData) {
      changes.experience = experienceData;
    }

    // Parse location changes
    const locationData = this.parseLocationChanges(message);
    if (locationData) {
      changes.location = locationData;
    }

    // Parse combat changes
    const combatData = this.parseCombatChanges(message);
    if (combatData) {
      changes.combat = combatData;
    }

    return changes;
  }

  /**
   * Parse stat changes from AI response
   */
  parseStatChanges(message) {
    const statChanges = [];
    
    // Pattern: [STAT_CHANGE:HP:25] or [STAT_CHANGE:STRENGTH:+2]
    const statPattern = /\[STAT_CHANGE:([^:]+):([+-]?\d+)\]/g;
    let match;
    
    while ((match = statPattern.exec(message)) !== null) {
      const [, stat, value] = match;
      statChanges.push({
        stat: stat.toLowerCase(),
        value: parseInt(value),
        type: 'change'
      });
    }

    // Pattern: [STAT_SET:HP:50] for absolute values
    const statSetPattern = /\[STAT_SET:([^:]+):(\d+)\]/g;
    while ((match = statSetPattern.exec(message)) !== null) {
      const [, stat, value] = match;
      statChanges.push({
        stat: stat.toLowerCase(),
        value: parseInt(value),
        type: 'set'
      });
    }

    return statChanges;
  }

  /**
   * Parse inventory changes from AI response
   */
  parseInventoryChanges(message) {
    const inventoryChanges = [];

    // Pattern: [ITEM_ADD:Health Potion:3] or [ITEM_ADD:Magic Sword:1]
    const itemAddPattern = /\[ITEM_ADD:([^:]+):(\d+)\]/g;
    let match;
    
    while ((match = itemAddPattern.exec(message)) !== null) {
      const [, itemName, quantity] = match;
      inventoryChanges.push({
        action: 'add',
        item: itemName,
        quantity: parseInt(quantity)
      });
    }

    // Pattern: [ITEM_REMOVE:Health Potion:1]
    const itemRemovePattern = /\[ITEM_REMOVE:([^:]+):(\d+)\]/g;
    while ((match = itemRemovePattern.exec(message)) !== null) {
      const [, itemName, quantity] = match;
      inventoryChanges.push({
        action: 'remove',
        item: itemName,
        quantity: parseInt(quantity)
      });
    }

    // Pattern: [ITEM_USE:Health Potion:1]
    const itemUsePattern = /\[ITEM_USE:([^:]+):(\d+)\]/g;
    while ((match = itemUsePattern.exec(message)) !== null) {
      const [, itemName, quantity] = match;
      inventoryChanges.push({
        action: 'use',
        item: itemName,
        quantity: parseInt(quantity)
      });
    }

    return inventoryChanges;
  }

  /**
   * Parse level progression from AI response
   */
  parseLevelProgression(message) {
    // Pattern: [LEVEL_UP:2] or [LEVEL_UP:3]
    const levelUpPattern = /\[LEVEL_UP:(\d+)\]/;
    const match = message.match(levelUpPattern);
    
    if (match) {
      return {
        newLevel: parseInt(match[1]),
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Parse experience changes from AI response
   */
  parseExperienceChanges(message) {
    // Pattern: [EXPERIENCE_GAIN:150] or [EXPERIENCE_GAIN:200]
    const expPattern = /\[EXPERIENCE_GAIN:(\d+)\]/;
    const match = message.match(expPattern);
    
    if (match) {
      return {
        gained: parseInt(match[1]),
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Parse location changes from AI response
   */
  parseLocationChanges(message) {
    // Pattern: [LOCATION_CHANGE:Ancient Dungeon] or [LOCATION_CHANGE:Village Square]
    const locationPattern = /\[LOCATION_CHANGE:([^\]]+)\]/;
    const match = message.match(locationPattern);
    
    if (match) {
      return {
        name: match[1].trim(),
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Parse combat changes from AI response
   */
  parseCombatChanges(message) {
    // Pattern: [COMBAT_START:Enemy Name] or [COMBAT_END:Victory]
    const combatStartPattern = /\[COMBAT_START:([^\]]+)\]/;
    const combatEndPattern = /\[COMBAT_END:([^\]]+)\]/;
    
    const startMatch = message.match(combatStartPattern);
    const endMatch = message.match(combatEndPattern);
    
    if (startMatch) {
      return {
        status: 'start',
        enemy: startMatch[1].trim(),
        timestamp: new Date().toISOString()
      };
    }
    
    if (endMatch) {
      return {
        status: 'end',
        result: endMatch[1].trim(),
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Merge multiple stat changes into a single object
   */
  mergeStatChanges(statChanges) {
    const merged = {};
    
    statChanges.forEach(change => {
      const { stat, value, type } = change;
      
      if (type === 'set') {
        merged[stat] = value;
      } else if (type === 'change') {
        merged[stat] = (merged[stat] || 0) + value;
      }
    });
    
    return merged;
  }

  /**
   * Parse individual stat change
   */
  parseStatChange(match) {
    const [, stat, value] = match;
    return {
      stat: stat.toLowerCase(),
      value: parseInt(value)
    };
  }

  /**
   * Parse item addition
   */
  parseItemAdd(match) {
    const [, itemName, quantity] = match;
    return {
      action: 'add',
      item: itemName,
      quantity: parseInt(quantity)
    };
  }

  /**
   * Parse item removal
   */
  parseItemRemove(match) {
    const [, itemName, quantity] = match;
    return {
      action: 'remove',
      item: itemName,
      quantity: parseInt(quantity)
    };
  }

  /**
   * Parse item usage
   */
  parseItemUse(match) {
    const [, itemName, quantity] = match;
    return {
      action: 'use',
      item: itemName,
      quantity: parseInt(quantity)
    };
  }

  /**
   * Parse level up
   */
  parseLevelUp(match) {
    const [, level] = match;
    return {
      newLevel: parseInt(level),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse experience gain
   */
  parseExperienceGain(match) {
    const [, experience] = match;
    return {
      gained: parseInt(experience),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse location change
   */
  parseLocationChange(match) {
    const [, location] = match;
    return {
      name: location.trim(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse combat start
   */
  parseCombatStart(match) {
    const [, enemy] = match;
    return {
      status: 'start',
      enemy: enemy.trim(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse combat end
   */
  parseCombatEnd(match) {
    const [, result] = match;
    return {
      status: 'end',
      result: result.trim(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AIResponseParser;
