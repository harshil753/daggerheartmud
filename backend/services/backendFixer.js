/**
 * Backend Auto-Fixer Service
 * Automatically fixes low-score issues without requiring LLM intervention
 */

class BackendFixer {
  constructor() {
    this.fixLog = [];
    this.autoCorrections = new Map();
    
    // Valid game options for auto-correction
    this.validOptions = {
      communities: [
        'Highborne', 'Loreborne', 'Orderborne', 'Ridgeborne', 
        'Seaborne', 'Slyborne', 'Underborne', 'Wanderborne', 'Wildborne'
      ],
      classes: ['Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Sorcerer', 'Warrior', 'Wizard'],
      ancestries: ['Clank', 'Drakona', 'Dwarf', 'Elf', 'Firbolg', 'Fungril', 'Galapa', 'Giant', 'Human', 'Infernis', 'Katari', 'Orc']
    };
  }

  /**
   * Main method to auto-fix low-score issues
   * @param {string} originalResponse - Original AI response
   * @param {Array} issues - Array of detected issues
   * @param {Object} gameContext - Current game state
   * @returns {Object} Fixed response with metadata
   */
  async fix(originalResponse, issues, gameContext) {
    console.log('🔧 Backend Auto-Fixer: Starting correction process');
    
    let fixedResponse = originalResponse;
    const appliedFixes = [];
    const skippedFixes = [];

    // Process issues by priority (low score first)
    const sortedIssues = issues.sort((a, b) => a.score - b.score);

    for (const issue of sortedIssues) {
      try {
        const fixResult = await this.applyFix(fixedResponse, issue, gameContext);
        
        if (fixResult.success) {
          fixedResponse = fixResult.response;
          appliedFixes.push({
            issue: issue,
            fix: fixResult.fix,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Auto-fixed: ${issue.type} - ${issue.details}`);
        } else {
          skippedFixes.push({
            issue: issue,
            reason: fixResult.reason,
            timestamp: new Date().toISOString()
          });
          
          console.log(`⚠️ Skipped: ${issue.type} - ${fixResult.reason}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${issue.type}:`, error.message);
        skippedFixes.push({
          issue: issue,
          reason: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Log the correction session
    this.logCorrectionSession(originalResponse, fixedResponse, appliedFixes, skippedFixes);

    return {
      originalResponse,
      fixedResponse,
      appliedFixes,
      skippedFixes,
      success: appliedFixes.length > 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Apply a specific fix to the response
   */
  async applyFix(response, issue, gameContext) {
    switch (issue.type) {
      case 'missing_structured_tag':
        return this.fixMissingStructuredTag(response, issue, gameContext);
      
      case 'malformed_structured_tag':
        return this.fixMalformedTag(response, issue, gameContext);
      
      case 'invalid_community':
        return this.fixInvalidCommunity(response, issue, gameContext);
      
      case 'invalid_class':
        return this.fixInvalidClass(response, issue, gameContext);
      
      case 'invalid_ancestry':
        return this.fixInvalidAncestry(response, issue, gameContext);
      
      case 'missing_ascii_map':
        return this.fixMissingMap(response, issue, gameContext);
      
      default:
        return {
          success: false,
          reason: `Unknown issue type: ${issue.type}`,
          response: response
        };
    }
  }

  /**
   * Fix missing structured tags
   */
  fixMissingStructuredTag(response, issue, gameContext) {
    const tagType = issue.subtype;
    let fixedResponse = response;
    let fix = null;

    switch (tagType) {
      case 'stat_change':
        fix = this.addStatChangeTag(fixedResponse, gameContext);
        break;
      case 'item_add':
        fix = this.addItemAddTag(fixedResponse, gameContext);
        break;
      case 'location_change':
        fix = this.addLocationChangeTag(fixedResponse, gameContext);
        break;
      default:
        return {
          success: false,
          reason: `Unknown tag type: ${tagType}`,
          response: response
        };
    }

    if (fix) {
      fixedResponse = fix.response;
      return {
        success: true,
        response: fixedResponse,
        fix: fix
      };
    }

    return {
      success: false,
      reason: 'Could not determine appropriate tag content',
      response: response
    };
  }

  /**
   * Fix malformed structured tags
   */
  fixMalformedTag(response, issue, gameContext) {
    const malformedTag = issue.details.split(': ')[1];
    const fixedTag = this.correctMalformedTag(malformedTag);
    
    if (fixedTag) {
      const fixedResponse = response.replace(malformedTag, fixedTag);
      return {
        success: true,
        response: fixedResponse,
        fix: {
          original: malformedTag,
          corrected: fixedTag
        }
      };
    }

    return {
      success: false,
      reason: 'Could not correct malformed tag',
      response: response
    };
  }

  /**
   * Fix invalid community names
   */
  fixInvalidCommunity(response, issue, gameContext) {
    const invalidCommunity = this.extractInvalidCommunity(issue.details);
    const closestValid = this.findClosestValidOption(invalidCommunity, this.validOptions.communities);
    
    if (closestValid) {
      const fixedResponse = response.replace(
        new RegExp(invalidCommunity, 'gi'),
        closestValid
      );
      
      return {
        success: true,
        response: fixedResponse,
        fix: {
          original: invalidCommunity,
          corrected: closestValid
        }
      };
    }

    return {
      success: false,
      reason: 'Could not find valid community replacement',
      response: response
    };
  }

  /**
   * Fix invalid class names
   */
  fixInvalidClass(response, issue, gameContext) {
    const invalidClass = this.extractInvalidClass(issue.details);
    const closestValid = this.findClosestValidOption(invalidClass, this.validOptions.classes);
    
    if (closestValid) {
      const fixedResponse = response.replace(
        new RegExp(invalidClass, 'gi'),
        closestValid
      );
      
      return {
        success: true,
        response: fixedResponse,
        fix: {
          original: invalidClass,
          corrected: closestValid
        }
      };
    }

    return {
      success: false,
      reason: 'Could not find valid class replacement',
      response: response
    };
  }

  /**
   * Fix invalid ancestry names
   */
  fixInvalidAncestry(response, issue, gameContext) {
    const invalidAncestry = this.extractInvalidAncestry(issue.details);
    const closestValid = this.findClosestValidOption(invalidAncestry, this.validOptions.ancestries);
    
    if (closestValid) {
      const fixedResponse = response.replace(
        new RegExp(invalidAncestry, 'gi'),
        closestValid
      );
      
      return {
        success: true,
        response: fixedResponse,
        fix: {
          original: invalidAncestry,
          corrected: closestValid
        }
      };
    }

    return {
      success: false,
      reason: 'Could not find valid ancestry replacement',
      response: response
    };
  }

  /**
   * Fix missing ASCII map
   */
  fixMissingMap(response, issue, gameContext) {
    // Generate a simple map based on context
    const simpleMap = this.generateSimpleMap(gameContext);
    
    if (simpleMap) {
      const fixedResponse = response + '\n\n' + simpleMap;
      return {
        success: true,
        response: fixedResponse,
        fix: {
          added: 'ASCII map',
          content: simpleMap
        }
      };
    }

    return {
      success: false,
      reason: 'Could not generate appropriate map',
      response: response
    };
  }

  /**
   * Helper methods for auto-correction
   */
  addStatChangeTag(response, gameContext) {
    // Look for stat change mentions in the narrative
    const statMentions = this.extractStatMentions(response);
    
    if (statMentions.length > 0) {
      const statChange = statMentions[0]; // Take the first one
      const tag = `[STAT_CHANGE:${statChange.stat}:${statChange.value}]`;
      
      return {
        response: response + '\n' + tag,
        fix: {
          added: tag,
          basedOn: statChange.mention
        }
      };
    }
    
    return null;
  }

  addItemAddTag(response, gameContext) {
    const itemMentions = this.extractItemMentions(response);
    
    if (itemMentions.length > 0) {
      const item = itemMentions[0];
      const tag = `[ITEM_ADD:${item.name}:${item.quantity || 1}]`;
      
      return {
        response: response + '\n' + tag,
        fix: {
          added: tag,
          basedOn: item.mention
        }
      };
    }
    
    return null;
  }

  addLocationChangeTag(response, gameContext) {
    const locationMentions = this.extractLocationMentions(response);
    
    if (locationMentions.length > 0) {
      const location = locationMentions[0];
      const tag = `[LOCATION_CHANGE:${location.name}]`;
      
      return {
        response: response + '\n' + tag,
        fix: {
          added: tag,
          basedOn: location.mention
        }
      };
    }
    
    return null;
  }

  correctMalformedTag(tag) {
    // Fix common malformation patterns
    let corrected = tag;
    
    // Fix double colons
    corrected = corrected.replace(/::/g, ':');
    
    // Fix extra spaces
    corrected = corrected.replace(/\s+/g, ' ');
    
    // Fix trailing colons
    if (corrected.endsWith(':')) {
      corrected = corrected.slice(0, -1);
    }
    
    // Ensure proper format
    if (!corrected.includes(':') || corrected.split(':').length < 3) {
      return null; // Cannot fix
    }
    
    return corrected;
  }

  extractStatMentions(response) {
    const mentions = [];
    const patterns = [
      /(?:health|hp).*(?:increased|gained|restored).*?(\d+)/i,
      /(?:strength|agility|intelligence|spirit).*(?:increased|gained).*?(\d+)/i
    ];
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        mentions.push({
          stat: 'HP',
          value: parseInt(matches[1]),
          mention: matches[0]
        });
      }
    });
    
    return mentions;
  }

  extractItemMentions(response) {
    const mentions = [];
    const patterns = [
      /(?:found|picked up|acquired|obtained).*?([a-z\s]+(?:potion|scroll|weapon|armor|tool))/i
    ];
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        mentions.push({
          name: matches[1].trim(),
          quantity: 1,
          mention: matches[0]
        });
      }
    });
    
    return mentions;
  }

  extractLocationMentions(response) {
    const mentions = [];
    const patterns = [
      /(?:entered|moved to|arrived at|walked to).*?([A-Z][a-z\s]+)/i
    ];
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        mentions.push({
          name: matches[1].trim(),
          mention: matches[0]
        });
      }
    });
    
    return mentions;
  }

  extractInvalidCommunity(details) {
    const match = details.match(/Invalid community: (.+)/);
    return match ? match[1] : null;
  }

  extractInvalidClass(details) {
    const match = details.match(/Invalid class: (.+)/);
    return match ? match[1] : null;
  }

  extractInvalidAncestry(details) {
    const match = details.match(/Invalid ancestry: (.+)/);
    return match ? match[1] : null;
  }

  findClosestValidOption(invalid, validOptions) {
    let closest = null;
    let minDistance = Infinity;
    
    for (const option of validOptions) {
      const distance = this.levenshteinDistance(invalid.toLowerCase(), option.toLowerCase());
      if (distance < minDistance && distance <= 3) { // Max edit distance of 3
        minDistance = distance;
        closest = option;
      }
    }
    
    return closest;
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

  generateSimpleMap(gameContext) {
    // Generate a basic ASCII map based on context
    const location = gameContext.currentLocation || 'Unknown Location';
    
    return `[ASCII_MAP]
┌─────────────────┐
│                 │
│   ${location.padEnd(15)} │
│                 │
└─────────────────┘
[LEGEND]
@ = You are here
# = Wall
. = Floor`;
  }

  logCorrectionSession(original, fixed, appliedFixes, skippedFixes) {
    const session = {
      timestamp: new Date().toISOString(),
      originalLength: original.length,
      fixedLength: fixed.length,
      appliedFixes: appliedFixes.length,
      skippedFixes: skippedFixes.length,
      fixes: appliedFixes,
      skipped: skippedFixes
    };
    
    this.fixLog.push(session);
    
    // Keep only last 100 sessions
    if (this.fixLog.length > 100) {
      this.fixLog = this.fixLog.slice(-100);
    }
    
    console.log('📊 Backend Fixer Session:', {
      applied: appliedFixes.length,
      skipped: skippedFixes.length,
      success: appliedFixes.length > 0
    });
  }

  /**
   * Get correction statistics
   */
  getStats() {
    const totalSessions = this.fixLog.length;
    const totalApplied = this.fixLog.reduce((sum, session) => sum + session.appliedFixes, 0);
    const totalSkipped = this.fixLog.reduce((sum, session) => sum + session.skippedFixes, 0);
    
    return {
      totalSessions,
      totalApplied,
      totalSkipped,
      successRate: totalSessions > 0 ? (totalApplied / (totalApplied + totalSkipped)) : 0,
      recentSessions: this.fixLog.slice(-10)
    };
  }
}

module.exports = BackendFixer;
