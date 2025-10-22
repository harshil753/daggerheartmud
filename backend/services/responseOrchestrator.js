/**
 * Response Orchestrator Service
 * Coordinates the two-stage AI processing pipeline
 */

const IssueScorer = require('./issueScorer');
const ResponseValidator = require('./responseValidator');
const BackendFixer = require('./backendFixer');
const LLMFixer = require('./llmFixer');
const MetricsService = require('./metricsService');

class ResponseOrchestrator {
  constructor() {
    this.issueScorer = new IssueScorer();
    this.validator = new ResponseValidator();
    this.backendFixer = new BackendFixer();
    this.llmFixer = new LLMFixer();
    this.metricsService = new MetricsService();
    
    this.processingLog = [];
    this.metrics = {
      totalProcessed: 0,
      backendFixed: 0,
      llmFixed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Main orchestration method
   * @param {string} creativeResponse - Original AI response
   * @param {Object} gameState - Current game state
   * @returns {Object} Processed response with metadata
   */
  async processAIResponse(creativeResponse, gameState) {
    const startTime = Date.now();
    console.log('🎭 Response Orchestrator: Starting two-stage processing');
    
    try {
      // Stage 1: Issue Detection and Scoring
      console.log('🔍 Stage 1: Issue Detection');
      const issueReport = await this.detectIssues(creativeResponse, gameState);
      
      // Stage 2: Determine Processing Path
      let processedResponse;
      let processingMethod;
      
      if (issueReport.severity === 'low') {
        console.log('🔧 Stage 2: Backend Auto-Fix');
        processedResponse = await this.processWithBackend(creativeResponse, issueReport, gameState);
        processingMethod = 'backend';
      } else {
        console.log('🤖 Stage 2: LLM Correction');
        processedResponse = await this.processWithLLM(creativeResponse, issueReport, gameState);
        processingMethod = 'llm';
      }
      
      const processingTime = Date.now() - startTime;
      
      // Log the processing session
      this.logProcessingSession(creativeResponse, processedResponse, issueReport, processingMethod, processingTime);
      
      // Update metrics
      this.updateMetrics(processingMethod, processingTime);
      
      // Record session in metrics service
      this.metricsService.recordSession({
        responseId: this.generateResponseId(),
        originalLength: creativeResponse.length,
        processedLength: processedResponse.response?.length || processedResponse.correctedResponse?.length || creativeResponse.length,
        issuesDetected: issueReport.issues.length,
        totalScore: issueReport.totalScore,
        severity: issueReport.severity,
        processingMethod,
        processingTime,
        success: processedResponse.success !== false,
        tokensUsed: processedResponse.tokensUsed || 0,
        cost: processedResponse.cost || 0,
        confidence: processedResponse.confidence || 'medium'
      });
      
      console.log(`✅ Orchestration completed in ${processingTime}ms using ${processingMethod} method`);
      
      return {
        originalResponse: creativeResponse,
        processedResponse: processedResponse.response || processedResponse.correctedResponse,
        issuesDetected: issueReport.issues.length,
        totalScore: issueReport.totalScore,
        severity: issueReport.severity,
        processingMethod,
        processingTime,
        success: true,
        timestamp: new Date().toISOString(),
        metadata: {
          issueReport,
          processingDetails: processedResponse
        }
      };
      
    } catch (error) {
      console.error('❌ Orchestrator Error:', error.message);
      
      return {
        originalResponse: creativeResponse,
        processedResponse: creativeResponse, // Fallback to original
        issuesDetected: 0,
        totalScore: 0,
        severity: 'low',
        processingMethod: 'none',
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stage 1: Detect and score issues
   */
  async detectIssues(creativeResponse, gameState) {
    try {
      const issueReport = this.issueScorer.detectIssues(creativeResponse, gameState);
      
      console.log('🔍 Issue Detection Results:', {
        totalIssues: issueReport.issues.length,
        totalScore: issueReport.totalScore,
        severity: issueReport.severity,
        issueTypes: issueReport.issues.map(issue => issue.type)
      });
      
      return issueReport;
    } catch (error) {
      console.error('Error in issue detection:', error.message);
      return {
        issues: [],
        totalScore: 0,
        severity: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stage 2a: Process with backend auto-fixer
   */
  async processWithBackend(creativeResponse, issueReport, gameState) {
    try {
      console.log('🔧 Backend Auto-Fix: Processing low-score issues');
      
      const fixResult = await this.backendFixer.fix(
        creativeResponse, 
        issueReport.issues, 
        gameState
      );
      
      console.log('🔧 Backend Fix Results:', {
        appliedFixes: fixResult.appliedFixes.length,
        skippedFixes: fixResult.skippedFixes.length,
        success: fixResult.success
      });
      
      return fixResult;
    } catch (error) {
      console.error('Error in backend fixing:', error.message);
      return {
        success: false,
        response: creativeResponse,
        error: error.message
      };
    }
  }

  /**
   * Stage 2b: Process with LLM fixer
   */
  async processWithLLM(creativeResponse, issueReport, gameState) {
    try {
      console.log('🤖 LLM Correction: Processing high-score issues');
      
      const fixResult = await this.llmFixer.fixResponse(
        creativeResponse, 
        issueReport.issues, 
        gameState
      );
      
      console.log('🤖 LLM Fix Results:', {
        issuesFixed: fixResult.issuesFixed?.length || 0,
        confidence: fixResult.confidence,
        success: fixResult.success
      });
      
      return fixResult;
    } catch (error) {
      console.error('Error in LLM fixing:', error.message);
      return {
        success: false,
        correctedResponse: creativeResponse,
        error: error.message
      };
    }
  }

  /**
   * Log processing session for analytics
   */
  logProcessingSession(originalResponse, processedResponse, issueReport, processingMethod, processingTime) {
    const session = {
      timestamp: new Date().toISOString(),
      originalLength: originalResponse.length,
      processedLength: processedResponse.response?.length || processedResponse.correctedResponse?.length || originalResponse.length,
      issuesDetected: issueReport.issues.length,
      totalScore: issueReport.totalScore,
      severity: issueReport.severity,
      processingMethod,
      processingTime,
      success: processedResponse.success !== false
    };
    
    this.processingLog.push(session);
    
    // Keep only last 100 sessions
    if (this.processingLog.length > 100) {
      this.processingLog = this.processingLog.slice(-100);
    }
    
    console.log('📊 Processing Session:', {
      method: processingMethod,
      issues: issueReport.issues.length,
      score: issueReport.totalScore,
      severity: issueReport.severity,
      time: `${processingTime}ms`,
      success: session.success
    });
  }

  /**
   * Update processing metrics
   */
  updateMetrics(processingMethod, processingTime) {
    this.metrics.totalProcessed++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.totalProcessed;
    
    if (processingMethod === 'backend') {
      this.metrics.backendFixed++;
    } else if (processingMethod === 'llm') {
      this.metrics.llmFixed++;
    }
  }

  /**
   * Get comprehensive processing statistics
   */
  getStats() {
    const recentSessions = this.processingLog.slice(-20);
    const severityDistribution = this.processingLog.reduce((dist, session) => {
      dist[session.severity] = (dist[session.severity] || 0) + 1;
      return dist;
    }, {});
    
    const methodDistribution = this.processingLog.reduce((dist, session) => {
      dist[session.processingMethod] = (dist[session.processingMethod] || 0) + 1;
      return dist;
    }, {});
    
    const avgIssuesPerResponse = this.processingLog.length > 0 ? 
      this.processingLog.reduce((sum, session) => sum + session.issuesDetected, 0) / this.processingLog.length : 0;
    
    return {
      ...this.metrics,
      severityDistribution,
      methodDistribution,
      avgIssuesPerResponse: Math.round(avgIssuesPerResponse * 100) / 100,
      backendFixerStats: this.backendFixer.getStats(),
      llmFixerStats: this.llmFixer.getStats(),
      metricsService: this.metricsService.getMetricsReport(),
      recentSessions: recentSessions.slice(-10)
    };
  }

  /**
   * Test the orchestrator with sample data
   */
  async testOrchestrator(sampleResponse, sampleGameState) {
    console.log('🧪 Testing Response Orchestrator...');
    
    try {
      const result = await this.processAIResponse(sampleResponse, sampleGameState);
      
      console.log('Test Results:', {
        success: result.success,
        processingMethod: result.processingMethod,
        issuesDetected: result.issuesDetected,
        processingTime: `${result.processingTime}ms`
      });
      
      return result;
    } catch (error) {
      console.error('Orchestrator test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get processing history
   */
  getProcessingHistory(limit = 20) {
    return this.processingLog.slice(-limit);
  }

  /**
   * Generate response ID
   */
  generateResponseId() {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear processing history
   */
  clearHistory() {
    this.processingLog = [];
    this.metrics = {
      totalProcessed: 0,
      backendFixed: 0,
      llmFixed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0
    };
    this.metricsService.clearMetrics();
    console.log('🗑️ Orchestrator history cleared');
  }

  /**
   * Health check for all components
   */
  async healthCheck() {
    const health = {
      orchestrator: true,
      issueScorer: true,
      validator: true,
      backendFixer: true,
      llmFixer: false // Will be tested
    };
    
    try {
      // Test LLM fixer with a simple request
      await this.llmFixer.testFixer(
        "Test response", 
        [{ type: 'test', score: 1, details: 'Test issue' }], 
        {}
      );
      health.llmFixer = true;
    } catch (error) {
      console.warn('LLM Fixer health check failed:', error.message);
    }
    
    return health;
  }
}

module.exports = ResponseOrchestrator;
