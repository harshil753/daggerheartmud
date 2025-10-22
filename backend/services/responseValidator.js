/**
 * Response Validator Service
 * Validates AI responses for format compliance and rule adherence
 */

class ResponseValidator {
  constructor() {
    // Valid game options loaded from rules
    this.validCommunities = [
      'Highborne', 'Loreborne', 'Orderborne', 'Ridgeborne', 
      'Seaborne', 'Slyborne', 'Underborne', 'Wanderborne', 'Wildborne'
    ];
    
    this.validClasses = [
      'Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Sorcerer', 'Warrior', 'Wizard'
    ];
    
    this.validAncestries = [
      'Clank', 'Drakona', 'Dwarf', 'Elf', 'Firbolg', 'Fungril', 'Galapa', 'Giant', 'Human', 'Infernis', 'Katari', 'Orc'
    ];
    
    // Stat ranges (for character creation validation)
    this.statRanges = {
      traits: { min: -1, max: 2 }, // Agility, Strength, Finesse, Instinct, Presence, Knowledge
      hp: { min: 5, max: 6 }, // Starting Hit Points (characters start with 5-6 HP)
      stress: { min: 6, max: 6 } // Starting Stress (all characters start with 6 Stress)
    };
    
    // Structured tag patterns
    this.tagPatterns = {
      statChange: /\[STAT_CHANGE:([^:]+):([+-]?\d+)\]/,
      itemAdd: /\[ITEM_ADD:([^:]+):(\d+)\]/,
      locationChange: /\[LOCATION_CHANGE:([^\]]+)\]/,
      asciiMap: /\[ASCII_MAP\][\s\S]*?\[LEGEND\]/
    };
  }

  /**
   * Main validation method
   * @param {string} response - AI response to validate
   * @param {Object} gameContext - Current game state and rules
   * @returns {Object} Validation result with issues and suggestions
   */
  validate(response, gameContext) {
    const validation = {
      isValid: true,
      issues: [],
      suggestions: [],
      score: 0
    };

    // Format validation
    const formatIssues = this.validateFormat(response);
    validation.issues.push(...formatIssues);

    // Rule validation
    const ruleIssues = this.validateRules(response, gameContext);
    validation.issues.push(...ruleIssues);

    // Cross-reference validation
    const crossRefIssues = this.validateCrossReferences(response, gameContext);
    validation.issues.push(...crossRefIssues);

    // Calculate validation score
    validation.score = this.calculateValidationScore(validation.issues);
    validation.isValid = validation.issues.length === 0;

    return validation;
  }

  /**
   * Validate response format
   */
  validateFormat(response) {
    const issues = [];

    // Check for required structured tags when content suggests they should be present
    if (this.shouldHaveStructuredTags(response)) {
      const missingTags = this.findMissingTags(response);
      missingTags.forEach(tag => {
        issues.push({
          type: 'format',
          severity: 'medium',
          message: `Missing required structured tag: ${tag}`,
          suggestion: this.getTagSuggestion(tag, response)
        });
      });
    }

    // Check for malformed tags
    const malformedTags = this.findMalformedTags(response);
    malformedTags.forEach(tag => {
      issues.push({
        type: 'format',
        severity: 'high',
        message: `Malformed structured tag: ${tag}`,
        suggestion: this.getCorrectionSuggestion(tag)
      });
    });

    // Check for ASCII map format
    if (this.shouldHaveMap(response)) {
      const mapIssues = this.validateMapFormat(response);
      issues.push(...mapIssues);
    }

    return issues;
  }

  /**
   * Validate game rules
   */
  validateRules(response, gameContext) {
    const issues = [];

    // Check community names
    const invalidCommunities = this.findInvalidCommunities(response);
    invalidCommunities.forEach(community => {
      issues.push({
        type: 'rule',
        severity: 'high',
        message: `Invalid community: ${community}`,
        suggestion: this.getClosestValidOption(community, this.validCommunities)
      });
    });

    // Check class names
    const invalidClasses = this.findInvalidClasses(response);
    invalidClasses.forEach(className => {
      issues.push({
        type: 'rule',
        severity: 'high',
        message: `Invalid class: ${className}`,
        suggestion: this.getClosestValidOption(className, this.validClasses)
      });
    });

    // Check ancestry names
    const invalidAncestries = this.findInvalidAncestries(response);
    invalidAncestries.forEach(ancestry => {
      issues.push({
        type: 'rule',
        severity: 'high',
        message: `Invalid ancestry: ${ancestry}`,
        suggestion: this.getClosestValidOption(ancestry, this.validAncestries)
      });
    });

    // Check stat ranges
    const statRangeIssues = this.validateStatRanges(response);
    issues.push(...statRangeIssues);

    return issues;
  }

  /**
   * Validate cross-references between different parts of the response
   */
  validateCrossReferences(response, gameContext) {
    const issues = [];

    // Check if character traits match ancestry/class rules
    if (gameContext.characterData) {
      const traitIssues = this.validateCharacterTraits(response, gameContext.characterData);
      issues.push(...traitIssues);
    }

    // Check if equipment matches character class
    const equipmentIssues = this.validateEquipmentCompatibility(response, gameContext);
    issues.push(...equipmentIssues);

    return issues;
  }

  /**
   * Helper methods for validation
   */
  shouldHaveStructuredTags(response) {
    const changeIndicators = [
      /(?:gained|found|picked up|acquired|obtained).*(?:item|weapon|armor|tool)/i,
      /(?:health|hp|mana|mp|strength|agility|intelligence|spirit).*(?:increased|decreased|changed)/i,
      /(?:moved|traveled|entered|left|arrived).*(?:to|at|from)/i
    ];
    
    return changeIndicators.some(pattern => pattern.test(response));
  }

  shouldHaveMap(response) {
    return /(?:map|location|area|room|chamber|hall|passage|corridor)/i.test(response) && 
           !/(?:too dark|pitch black|cannot see|no light)/i.test(response);
  }

  findMissingTags(response) {
    const missing = [];
    
    if (this.mentionsStatChange(response) && !this.hasStatChangeTag(response)) {
      missing.push('STAT_CHANGE');
    }
    
    if (this.mentionsItemAcquisition(response) && !this.hasItemAddTag(response)) {
      missing.push('ITEM_ADD');
    }
    
    if (this.mentionsLocationChange(response) && !this.hasLocationChangeTag(response)) {
      missing.push('LOCATION_CHANGE');
    }
    
    return missing;
  }

  mentionsStatChange(response) {
    return /(?:health|hp|mana|mp|strength|agility|intelligence|spirit).*(?:increased|decreased|changed|gained|lost)/i.test(response);
  }

  mentionsItemAcquisition(response) {
    return /(?:gained|found|picked up|acquired|obtained).*(?:item|weapon|armor|tool|potion|scroll)/i.test(response);
  }

  mentionsLocationChange(response) {
    return /(?:moved|traveled|entered|left|arrived|walked|ran).*(?:to|at|from|into|out of)/i.test(response);
  }

  hasStatChangeTag(response) {
    return this.tagPatterns.statChange.test(response);
  }

  hasItemAddTag(response) {
    return this.tagPatterns.itemAdd.test(response);
  }

  hasLocationChangeTag(response) {
    return this.tagPatterns.locationChange.test(response);
  }

  findMalformedTags(response) {
    const malformed = [];
    const tagPattern = /\[[A-Z_]+:[^\]]*\]/g;
    const matches = response.match(tagPattern) || [];
    
    matches.forEach(tag => {
      if (this.isMalformedTag(tag)) {
        malformed.push(tag);
      }
    });
    
    return malformed;
  }

  isMalformedTag(tag) {
    // Check for common malformation patterns
    return tag.includes('::') || 
           tag.includes('  ') || 
           tag.endsWith(':') || 
           tag.endsWith('  ') ||
           !tag.includes(':') ||
           tag.split(':').length < 3;
  }

  validateMapFormat(response) {
    const issues = [];
    
    if (!this.tagPatterns.asciiMap.test(response)) {
      issues.push({
        type: 'format',
        severity: 'medium',
        message: 'ASCII map missing or malformed',
        suggestion: 'Include [ASCII_MAP]...[/ASCII_MAP] with [LEGEND] section'
      });
    }
    
    return issues;
  }

  findInvalidCommunities(response) {
    const mentioned = this.extractMentionedCommunities(response);
    return mentioned.filter(community => 
      !this.validCommunities.some(valid => 
        valid.toLowerCase() === community.toLowerCase()
      )
    );
  }

  findInvalidClasses(response) {
    const mentioned = this.extractMentionedClasses(response);
    return mentioned.filter(className => 
      !this.validClasses.some(valid => 
        valid.toLowerCase() === className.toLowerCase()
      )
    );
  }

  findInvalidAncestries(response) {
    const mentioned = this.extractMentionedAncestries(response);
    return mentioned.filter(ancestry => 
      !this.validAncestries.some(valid => 
        valid.toLowerCase() === ancestry.toLowerCase()
      )
    );
  }

  validateStatRanges(response) {
    const issues = [];
    const statChangePattern = /\[STAT_CHANGE:([^:]+):([+-]?\d+)\]/g;
    let match;
    
    while ((match = statChangePattern.exec(response)) !== null) {
      const stat = match[1].toLowerCase();
      const value = parseInt(match[2]);
      
      // Check trait ranges (Daggerheart uses 6 traits: Agility, Strength, Finesse, Instinct, Presence, Knowledge)
      if (['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'].includes(stat)) {
        if (value < this.statRanges.traits.min || value > this.statRanges.traits.max) {
          issues.push({
            type: 'rule',
            severity: 'high',
            message: `Trait ${stat} value ${value} outside valid range (${this.statRanges.traits.min} to ${this.statRanges.traits.max})`,
            suggestion: `Use trait value between ${this.statRanges.traits.min} and ${this.statRanges.traits.max}`
          });
        }
      }
      
      // Check starting HP ranges (for character creation)
      if (stat === 'hp') {
        if (value < this.statRanges.hp.min || value > this.statRanges.hp.max) {
          issues.push({
            type: 'rule',
            severity: 'high',
            message: `Starting HP value ${value} outside valid range (${this.statRanges.hp.min} to ${this.statRanges.hp.max})`,
            suggestion: `Use starting HP value between ${this.statRanges.hp.min} and ${this.statRanges.hp.max}`
          });
        }
      }
      
      // Check starting Stress ranges (for character creation)
      if (stat === 'stress') {
        if (value < this.statRanges.stress.min || value > this.statRanges.stress.max) {
          issues.push({
            type: 'rule',
            severity: 'high',
            message: `Starting Stress value ${value} outside valid range (${this.statRanges.stress.min} to ${this.statRanges.stress.max})`,
            suggestion: `Use starting Stress value between ${this.statRanges.stress.min} and ${this.statRanges.stress.max}`
          });
        }
      }
    }
    
    return issues;
  }

  validateCharacterTraits(response, characterData) {
    const issues = [];
    // Implementation would check if traits match ancestry/class rules
    return issues;
  }

  validateEquipmentCompatibility(response, gameContext) {
    const issues = [];
    // Implementation would check if equipment matches character class
    return issues;
  }

  extractMentionedCommunities(response) {
    const communityPattern = /(?:community|from|of)\s+([A-Z][a-z]+borne)/gi;
    const matches = [];
    let match;
    
    while ((match = communityPattern.exec(response)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)];
  }

  extractMentionedClasses(response) {
    const classPattern = /(?:class|as a|become a)\s+([A-Z][a-z]+)/gi;
    const matches = [];
    let match;
    
    while ((match = classPattern.exec(response)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)];
  }

  extractMentionedAncestries(response) {
    const ancestryPattern = /(?:ancestry|race|as a|born as)\s+([A-Z][a-z]+)/gi;
    const matches = [];
    let match;
    
    while ((match = ancestryPattern.exec(response)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)];
  }

  getTagSuggestion(tagType, response) {
    const suggestions = {
      'STAT_CHANGE': '[STAT_CHANGE:stat:value] - e.g., [STAT_CHANGE:HP:5]',
      'ITEM_ADD': '[ITEM_ADD:name:qty] - e.g., [ITEM_ADD:Health Potion:2]',
      'LOCATION_CHANGE': '[LOCATION_CHANGE:location] - e.g., [LOCATION_CHANGE:Forest Clearing]'
    };
    
    return suggestions[tagType] || `Add ${tagType} tag`;
  }

  getCorrectionSuggestion(malformedTag) {
    // Try to fix common malformation patterns
    if (malformedTag.includes('::')) {
      return malformedTag.replace(/::/g, ':');
    }
    if (malformedTag.includes('  ')) {
      return malformedTag.replace(/\s+/g, ' ');
    }
    if (malformedTag.endsWith(':')) {
      return malformedTag.slice(0, -1);
    }
    
    return 'Fix tag format: [TYPE:value1:value2]';
  }

  getClosestValidOption(invalid, validOptions) {
    // Simple Levenshtein distance-based suggestion
    let closest = validOptions[0];
    let minDistance = this.levenshteinDistance(invalid.toLowerCase(), closest.toLowerCase());
    
    for (const option of validOptions) {
      const distance = this.levenshteinDistance(invalid.toLowerCase(), option.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        closest = option;
      }
    }
    
    return `Did you mean "${closest}"?`;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateValidationScore(issues) {
    const severityWeights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 5
    };
    
    return issues.reduce((score, issue) => {
      return score + (severityWeights[issue.severity] || 1);
    }, 0);
  }
}

module.exports = ResponseValidator;
