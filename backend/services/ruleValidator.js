/**
 * Rule Validator - Validates game actions against Daggerheart rules
 */
class RuleValidator {
  constructor() {
    this.validationErrors = [];
  }

  /**
   * Validate character creation data
   */
  validateCharacterCreation(characterData) {
    const errors = [];
    
    // Check required fields
    if (!characterData.name) {
      errors.push('Character name is required');
    }
    
    if (!characterData.ancestry) {
      errors.push('Ancestry selection is required');
    }
    
    if (!characterData.class) {
      errors.push('Class selection is required');
    }
    
    if (!characterData.community) {
      errors.push('Community selection is required');
    }
    
    // Validate trait modifiers
    if (characterData.traits) {
      const traitValues = Object.values(characterData.traits);
      const expectedValues = [2, 1, 1, 0, 0, -1];
      const sortedTraits = traitValues.sort((a, b) => b - a);
      
      if (!this.arraysEqual(sortedTraits, expectedValues)) {
        errors.push('Trait modifiers must be +2, +1, +1, 0, 0, -1');
      }
    }
    
    // Validate starting equipment tier
    if (characterData.equipment) {
      characterData.equipment.forEach(item => {
        if (item.tier && item.tier > 1) {
          errors.push(`Starting equipment tier ${item.tier} is too high for level 1 character`);
        }
      });
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate combat action
   */
  validateCombatAction(action, character, gameState) {
    const errors = [];
    
    // Check if character can perform the action
    if (!character) {
      errors.push('Character data is required for combat actions');
      return { valid: false, errors };
    }
    
    // Validate weapon usage
    if (action.weapon) {
      const weaponTier = this.getItemTier(action.weapon);
      const characterTier = this.getCharacterTier(character);
      
      if (weaponTier > characterTier + 1) {
        errors.push(`Weapon tier ${weaponTier} is too high for character tier ${characterTier}`);
      }
    }
    
    // Validate spellcasting
    if (action.spell) {
      if (!character.class || !['wizard', 'sorcerer', 'druid', 'bard'].includes(character.class.toLowerCase())) {
        errors.push('Character class does not support spellcasting');
      }
    }
    
    // Validate resource usage
    if (action.hopeCost && action.hopeCost > (character.hope || 0)) {
      errors.push(`Insufficient Hope: need ${action.hopeCost}, have ${character.hope || 0}`);
    }
    
    if (action.stressCost && action.stressCost > (character.stress_max - character.stress_current)) {
      errors.push(`Insufficient Stress capacity: would exceed maximum`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate item distribution
   */
  validateItemDistribution(item, character) {
    const errors = [];
    
    if (!character) {
      errors.push('Character data is required for item validation');
      return { valid: false, errors };
    }
    
    const itemTier = this.getItemTier(item);
    const characterTier = this.getCharacterTier(character);
    
    // Check tier compatibility
    if (itemTier > characterTier + 1) {
      errors.push(`Item tier ${itemTier} is too high for character tier ${characterTier}`);
    }
    
    // Check burden requirements
    if (item.properties && item.properties.Burden) {
      if (item.properties.Burden === 'Two-Handed' && character.equipment && character.equipment.primary_weapon) {
        errors.push('Cannot equip two-handed weapon with primary weapon already equipped');
      }
    }
    
    // Check armor compatibility
    if (item.type === 'armor' && character.equipment && character.equipment.armor) {
      errors.push('Character already has armor equipped');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate level up
   */
  validateLevelUp(newLevel, character) {
    const errors = [];
    
    if (!character) {
      errors.push('Character data is required for level validation');
      return { valid: false, errors };
    }
    
    const currentLevel = character.level || 1;
    
    // Check level progression
    if (newLevel !== currentLevel + 1) {
      errors.push(`Invalid level progression: cannot jump from level ${currentLevel} to ${newLevel}`);
    }
    
    // Check maximum level
    if (newLevel > 6) {
      errors.push('Maximum character level is 6');
    }
    
    // Validate proficiency increase
    const expectedProficiency = Math.min(newLevel, 6);
    if (character.proficiency && character.proficiency !== expectedProficiency) {
      errors.push(`Proficiency should be ${expectedProficiency} for level ${newLevel}`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate spellcast
   */
  validateSpellcast(spell, character) {
    const errors = [];
    
    if (!character) {
      errors.push('Character data is required for spell validation');
      return { valid: false, errors };
    }
    
    // Check if character has spellcasting ability
    const spellcastingClasses = ['wizard', 'sorcerer', 'druid', 'bard'];
    if (!spellcastingClasses.includes(character.class.toLowerCase())) {
      errors.push('Character class does not support spellcasting');
    }
    
    // Check spell level requirements
    if (spell.level && spell.level > character.level) {
      errors.push(`Spell level ${spell.level} is too high for character level ${character.level}`);
    }
    
    // Check domain access
    if (spell.domain && character.domains && !character.domains.includes(spell.domain)) {
      errors.push(`Character does not have access to ${spell.domain} domain`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate stat change
   */
  validateStatChange(statChange, character) {
    const errors = [];
    
    if (!character) {
      errors.push('Character data is required for stat validation');
      return { valid: false, errors };
    }
    
    const { stat, change, type } = statChange;
    
    // Validate HP changes
    if (stat === 'HP') {
      const currentHP = character.hit_points_current || 0;
      const maxHP = character.hit_points_max || 0;
      const newHP = currentHP + change;
      
      if (newHP < 0) {
        errors.push('Hit Points cannot go below 0');
      }
      
      if (newHP > maxHP) {
        errors.push(`Hit Points cannot exceed maximum of ${maxHP}`);
      }
    }
    
    // Validate Stress changes
    if (stat === 'Stress') {
      const currentStress = character.stress_current || 0;
      const maxStress = character.stress_max || 6;
      const newStress = currentStress + change;
      
      if (newStress < 0) {
        errors.push('Stress cannot go below 0');
      }
      
      if (newStress > maxStress) {
        errors.push(`Stress cannot exceed maximum of ${maxStress}`);
      }
    }
    
    // Validate damage types
    if (type && !['phy', 'mag', 'men'].includes(type)) {
      errors.push(`Invalid damage type: ${type}. Must be 'phy', 'mag', or 'men'`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate equipment changes
   */
  validateEquipmentChange(equipmentChange, character) {
    const errors = [];
    
    if (!character) {
      errors.push('Character data is required for equipment validation');
      return { valid: false, errors };
    }
    
    const { action, item } = equipmentChange;
    
    if (action === 'equip') {
      // Check if item is compatible with character
      const itemTier = this.getItemTier(item);
      const characterTier = this.getCharacterTier(character);
      
      if (itemTier > characterTier + 1) {
        errors.push(`Item tier ${itemTier} is too high for character tier ${characterTier}`);
      }
    }
    
    if (action === 'unequip') {
      // Check if character has the item
      if (!character.equipment || !character.equipment[item.type]) {
        errors.push(`Character does not have ${item.name} equipped`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper methods
   */
  getItemTier(item) {
    if (item.properties && item.properties.Tier) {
      return item.properties.Tier;
    }
    return 1; // Default tier
  }

  getCharacterTier(character) {
    const level = character.level || 1;
    if (level <= 2) return 1;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    return 4;
  }

  arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    return {
      totalErrors: this.validationErrors.length,
      errors: this.validationErrors
    };
  }

  /**
   * Clear validation errors
   */
  clearErrors() {
    this.validationErrors = [];
  }
}

module.exports = RuleValidator;
