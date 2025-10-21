const fs = require('fs');
const path = require('path');

/**
 * Logging Service - Comprehensive logging for validation failures and performance monitoring
 */
class LoggingService {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log validation failures
   */
  logValidationFailure(command, gameState, errors, response) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'validation_failure',
      command,
      gameState: this.sanitizeGameState(gameState),
      errors,
      response: response.substring(0, 500), // Truncate long responses
      sessionId: gameState.sessionId
    };

    this.writeLog('validation_failures.jsonl', logEntry);
    console.warn('Validation failure logged:', errors);
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(command, gameState, metrics) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      command,
      sessionId: gameState.sessionId,
      metrics: {
        promptSize: metrics.promptSize,
        responseTime: metrics.responseTime,
        validationTime: metrics.validationTime,
        totalTime: metrics.totalTime,
        rulesLoaded: metrics.rulesLoaded,
        equipmentLoaded: metrics.equipmentLoaded
      }
    };

    this.writeLog('performance.jsonl', logEntry);
  }

  /**
   * Log rule usage statistics
   */
  logRuleUsage(ruleName, context, gameState) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'rule_usage',
      ruleName,
      context,
      sessionId: gameState.sessionId,
      characterLevel: gameState.character?.level || 1,
      characterClass: gameState.character?.class || 'unknown'
    };

    this.writeLog('rule_usage.jsonl', logEntry);
  }

  /**
   * Log equipment usage
   */
  logEquipmentUsage(equipmentType, context, gameState) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'equipment_usage',
      equipmentType,
      context,
      sessionId: gameState.sessionId,
      characterTier: this.getCharacterTier(gameState.character)
    };

    this.writeLog('equipment_usage.jsonl', logEntry);
  }

  /**
   * Log AI errors
   */
  logAIError(error, command, gameState) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ai_error',
      error: error.message,
      stack: error.stack,
      command,
      sessionId: gameState.sessionId
    };

    this.writeLog('ai_errors.jsonl', logEntry);
    console.error('AI error logged:', error.message);
  }

  /**
   * Log system events
   */
  logSystemEvent(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'system_event',
      event,
      details
    };

    this.writeLog('system_events.jsonl', logEntry);
  }

  /**
   * Write log entry to file
   */
  writeLog(filename, logEntry) {
    try {
      const logPath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logPath, logLine);
    } catch (error) {
      console.error('Error writing log:', error);
    }
  }

  /**
   * Sanitize game state for logging
   */
  sanitizeGameState(gameState) {
    return {
      hasCharacter: !!gameState.character,
      characterLevel: gameState.character?.level,
      characterClass: gameState.character?.class,
      hasCampaign: !!gameState.campaign,
      campaignTitle: gameState.campaign?.title,
      currentLocation: gameState.currentLocation,
      inCombat: !!gameState.combat,
      sessionId: gameState.sessionId
    };
  }

  /**
   * Get character tier
   */
  getCharacterTier(character) {
    if (!character || !character.level) return 1;
    const level = character.level;
    if (level <= 2) return 1;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    return 4;
  }

  /**
   * Get log statistics
   */
  getLogStatistics() {
    const stats = {
      validationFailures: this.countLogEntries('validation_failures.jsonl'),
      performanceMetrics: this.countLogEntries('performance.jsonl'),
      ruleUsage: this.countLogEntries('rule_usage.jsonl'),
      equipmentUsage: this.countLogEntries('equipment_usage.jsonl'),
      aiErrors: this.countLogEntries('ai_errors.jsonl'),
      systemEvents: this.countLogEntries('system_events.jsonl')
    };

    return stats;
  }

  /**
   * Count log entries in a file
   */
  countLogEntries(filename) {
    try {
      const logPath = path.join(this.logDir, filename);
      if (!fs.existsSync(logPath)) return 0;
      
      const content = fs.readFileSync(logPath, 'utf8');
      return content.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get recent validation failures
   */
  getRecentValidationFailures(limit = 10) {
    return this.getRecentLogEntries('validation_failures.jsonl', limit);
  }

  /**
   * Get recent performance metrics
   */
  getRecentPerformanceMetrics(limit = 10) {
    return this.getRecentLogEntries('performance.jsonl', limit);
  }

  /**
   * Get recent log entries
   */
  getRecentLogEntries(filename, limit) {
    try {
      const logPath = path.join(this.logDir, filename);
      if (!fs.existsSync(logPath)) return [];

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const entries = lines.slice(-limit).map(line => JSON.parse(line));
      
      return entries;
    } catch (error) {
      console.error('Error reading log entries:', error);
      return [];
    }
  }

  /**
   * Clear old logs
   */
  clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logFiles = [
      'validation_failures.jsonl',
      'performance.jsonl',
      'rule_usage.jsonl',
      'equipment_usage.jsonl',
      'ai_errors.jsonl',
      'system_events.jsonl'
    ];

    logFiles.forEach(filename => {
      try {
        const logPath = path.join(this.logDir, filename);
        if (!fs.existsSync(logPath)) return;

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const recentLines = lines.filter(line => {
          try {
            const entry = JSON.parse(line);
            const entryDate = new Date(entry.timestamp);
            return entryDate > cutoffDate;
          } catch (error) {
            return false;
          }
        });

        fs.writeFileSync(logPath, recentLines.join('\n') + '\n');
      } catch (error) {
        console.error(`Error clearing old logs for ${filename}:`, error);
      }
    });
  }
}

module.exports = LoggingService;
