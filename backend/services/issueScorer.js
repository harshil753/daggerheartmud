/**
 * Issue Scorer Service
 * Detects and scores issues in AI responses based on difficulty to detect/fix
 */

class IssueScorer {
  constructor() {
    // Issue type definitions with base scores
    this.issueTypes = {
      // Format violations (1-2 pts each)
      'missing_structured_tag': 1,
      'malformed_structured_tag': 2,
      'missing_ascii_map': 1,
      'malformed_ascii_map': 2,
      
      // Simple rule violations (3 pts each)
      'invalid_community': 3,
      'invalid_class': 3,
      'invalid_ancestry': 3,
      'invalid_equipment': 3,
      
      // Complex rule violations (5 pts each)
      'stat_calculation_error': 5,
      'equipment_mismatch': 5,
      'invalid_stat_range': 5,
      'rule_contradiction': 5
    };
    
    // Scoring thresholds
    this.thresholds = {
      low: 3,    // Backend fixes
      high: 4    // LLM fixes
    };
  }

  /**
   * Main method to detect and score issues in AI response
   * @param {string} aiResponse - The AI-generated response
   * @param {Object} gameContext - Current game state and rules
   * @returns {Object} Issue report with issues, totalScore, and severity
   */
  detectIssues(aiResponse, gameContext) {
    const issues = [];
    let totalScore = 0;

    // Check for format violations
    const formatIssues = this.detectFormatIssues(aiResponse);
    issues.push(...formatIssues);

    // Check for simple rule violations
    const ruleIssues = this.detectRuleViolations(aiResponse, gameContext);
    issues.push(...ruleIssues);

    // Check for complex rule violations
    const complexIssues = this.detectComplexViolations(aiResponse, gameContext);
    issues.push(...complexIssues);

    // Calculate total score
    totalScore = issues.reduce((sum, issue) => sum + issue.score, 0);

    // Determine severity
    const severity = totalScore <= this.thresholds.low ? 'low' : 'high';

    return {
      issues,
      totalScore,
      severity,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect format-related issues
   */
  detectFormatIssues(response) {
    const issues = [];

    // Check for missing structured tags when content suggests they should be present
    if (this.shouldHaveStructuredTags(response)) {
      const hasStatChange = /\[STAT_CHANGE:[^\]]+\]/.test(response);
      const hasItemAdd = /\[ITEM_ADD:[^\]]+\]/.test(response);
      const hasLocationChange = /\[LOCATION_CHANGE:[^\]]+\]/.test(response);

      if (!hasStatChange && this.mentionsStatChange(response)) {
        issues.push({
          type: 'missing_structured_tag',
          subtype: 'stat_change',
          score: this.issueTypes.missing_structured_tag,
          details: 'Response mentions stat changes but missing [STAT_CHANGE:stat:value] tags',
          severity: 'medium'
        });
      }

      if (!hasItemAdd && this.mentionsItemAcquisition(response)) {
        issues.push({
          type: 'missing_structured_tag',
          subtype: 'item_add',
          score: this.issueTypes.missing_structured_tag,
          details: 'Response mentions item acquisition but missing [ITEM_ADD:name:qty] tags',
          severity: 'medium'
        });
      }

      if (!hasLocationChange && this.mentionsLocationChange(response)) {
        issues.push({
          type: 'missing_structured_tag',
          subtype: 'location_change',
          score: this.issueTypes.missing_structured_tag,
          details: 'Response mentions location change but missing [LOCATION_CHANGE:location] tags',
          severity: 'medium'
        });
      }
    }

    // Check for malformed structured tags
    const malformedTags = this.findMalformedTags(response);
    malformedTags.forEach(tag => {
      issues.push({
        type: 'malformed_structured_tag',
        score: this.issueTypes.malformed_structured_tag,
        details: `Malformed tag: ${tag}`,
        severity: 'high'
      });
    });

    // Check for ASCII map issues
    if (this.shouldHaveMap(response) && !this.hasValidMap(response)) {
      issues.push({
        type: 'missing_ascii_map',
        score: this.issueTypes.missing_ascii_map,
        details: 'Response should include ASCII map but none found',
        severity: 'medium'
      });
    }

    return issues;
  }

  /**
   * Detect simple rule violations
   */
  detectRuleViolations(response, gameContext) {
    const issues = [];

    // Check for invalid communities
    const invalidCommunities = this.findInvalidCommunities(response, gameContext);
    invalidCommunities.forEach(community => {
      issues.push({
        type: 'invalid_community',
        score: this.issueTypes.invalid_community,
        details: `Invalid community: ${community}`,
        severity: 'high'
      });
    });

    // Check for invalid classes
    const invalidClasses = this.findInvalidClasses(response, gameContext);
    invalidClasses.forEach(className => {
      issues.push({
        type: 'invalid_class',
        score: this.issueTypes.invalid_class,
        details: `Invalid class: ${className}`,
        severity: 'high'
      });
    });

    // Check for invalid ancestries
    const invalidAncestries = this.findInvalidAncestries(response, gameContext);
    invalidAncestries.forEach(ancestry => {
      issues.push({
        type: 'invalid_ancestry',
        score: this.issueTypes.invalid_ancestry,
        details: `Invalid ancestry: ${ancestry}`,
        severity: 'high'
      });
    });

    return issues;
  }

  /**
   * Detect complex rule violations
   */
  detectComplexViolations(response, gameContext) {
    const issues = [];

    // Check for stat calculation errors
    const statErrors = this.findStatCalculationErrors(response, gameContext);
    statErrors.forEach(error => {
      issues.push({
        type: 'stat_calculation_error',
        score: this.issueTypes.stat_calculation_error,
        details: error,
        severity: 'critical'
      });
    });

    // Check for invalid stat ranges
    const statRangeErrors = this.findStatRangeErrors(response);
    statRangeErrors.forEach(error => {
      issues.push({
        type: 'invalid_stat_range',
        score: this.issueTypes.invalid_stat_range,
        details: error,
        severity: 'critical'
      });
    });

    return issues;
  }

  /**
   * Helper methods for issue detection
   */
  shouldHaveStructuredTags(response) {
    // Check if response contains narrative that suggests game state changes
    const changeIndicators = [
      /(?:gained|found|picked up|acquired|obtained).*(?:item|weapon|armor|tool)/i,
      /(?:health|hp|stress|agility|strength|finesse|instinct|presence|knowledge).*(?:increased|decreased|changed)/i,
      /(?:moved|traveled|entered|left|arrived).*(?:to|at|from)/i
    ];
    
    return changeIndicators.some(pattern => pattern.test(response));
  }

  mentionsStatChange(response) {
    return /(?:health|hp|stress|agility|strength|finesse|instinct|presence|knowledge).*(?:increased|decreased|changed|gained|lost)/i.test(response);
  }

  mentionsItemAcquisition(response) {
    return /(?:gained|found|picked up|acquired|obtained).*(?:item|weapon|armor|tool|potion|scroll)/i.test(response);
  }

  mentionsLocationChange(response) {
    return /(?:moved|traveled|entered|left|arrived|walked|ran).*(?:to|at|from|into|out of)/i.test(response);
  }

  shouldHaveMap(response) {
    return /(?:map|location|area|room|chamber|hall|passage|corridor)/i.test(response) && 
           !/(?:too dark|pitch black|cannot see|no light)/i.test(response);
  }

  hasValidMap(response) {
    const mapPattern = /\[ASCII_MAP\][\s\S]*?\[LEGEND\]/;
    return mapPattern.test(response);
  }

  findMalformedTags(response) {
    const malformed = [];
    const tagPattern = /\[[A-Z_]+:[^\]]*\]/g;
    const matches = response.match(tagPattern) || [];
    
    matches.forEach(tag => {
      // Check for common malformation patterns
      if (tag.includes('::') || tag.includes('  ') || tag.endsWith(':') || tag.endsWith(':')) {
        malformed.push(tag);
      }
    });
    
    return malformed;
  }

  findInvalidCommunities(response, gameContext) {
    const validCommunities = gameContext.validCommunities || [
      'Highborne', 'Loreborne', 'Orderborne', 'Ridgeborne', 
      'Seaborne', 'Slyborne', 'Underborne', 'Wanderborne', 'Wildborne'
    ];
    
    const mentionedCommunities = this.extractMentionedCommunities(response);
    return mentionedCommunities.filter(community => 
      !validCommunities.some(valid => 
        valid.toLowerCase() === community.toLowerCase()
      )
    );
  }

  findInvalidClasses(response, gameContext) {
    const validClasses = gameContext.validClasses || [
      'Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Sorcerer', 'Warrior', 'Wizard'
    ];
    
    const mentionedClasses = this.extractMentionedClasses(response);
    return mentionedClasses.filter(className => 
      !validClasses.some(valid => 
        valid.toLowerCase() === className.toLowerCase()
      )
    );
  }

  findInvalidAncestries(response, gameContext) {
    const validAncestries = gameContext.validAncestries || [
      'Clank', 'Drakona', 'Dwarf', 'Elf', 'Firbolg', 'Fungril', 'Galapa', 'Giant', 'Human', 'Infernis', 'Katari', 'Orc'
    ];
    
    const mentionedAncestries = this.extractMentionedAncestries(response);
    return mentionedAncestries.filter(ancestry => 
      !validAncestries.some(valid => 
        valid.toLowerCase() === ancestry.toLowerCase()
      )
    );
  }

  findStatCalculationErrors(response, gameContext) {
    const errors = [];
    // Implementation would check for mathematical inconsistencies
    // in stat changes based on game rules
    return errors;
  }

  findStatRangeErrors(response) {
    const errors = [];
    const statChangePattern = /\[STAT_CHANGE:([^:]+):([+-]?\d+)\]/g;
    let match;
    
    while ((match = statChangePattern.exec(response)) !== null) {
      const stat = match[1].toLowerCase();
      const value = parseInt(match[2]);
      
      // Check trait ranges (-1 to +2)
      if (['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'].includes(stat)) {
        if (value < -1 || value > 2) {
          errors.push(`Trait ${stat} value ${value} outside valid range (-1 to +2)`);
        }
      }
    }
    
    return errors;
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

  /**
   * Score an individual issue based on type and context
   */
  scoreIssue(issueType, context = {}) {
    const baseScore = this.issueTypes[issueType] || 1;
    
    // Apply context-based multipliers
    let multiplier = 1;
    
    if (context.isCharacterCreation && ['invalid_community', 'invalid_class', 'invalid_ancestry'].includes(issueType)) {
      multiplier = 1.5; // Higher penalty during character creation
    }
    
    if (context.isCombat && issueType === 'stat_calculation_error') {
      multiplier = 2; // Critical during combat
    }
    
    return Math.round(baseScore * multiplier);
  }
}

module.exports = IssueScorer;
