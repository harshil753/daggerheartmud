/**
 * Metrics Service
 * Tracks correction rates, costs, and performance across the two-stage pipeline
 */

class MetricsService {
  constructor() {
    this.metrics = {
      // Overall pipeline metrics
      totalResponses: 0,
      totalIssuesDetected: 0,
      totalCorrections: 0,
      totalProcessingTime: 0,
      
      // Issue detection metrics
      issueDetectionRate: 0,
      avgIssuesPerResponse: 0,
      issueTypeDistribution: {},
      severityDistribution: {},
      
      // Correction metrics
      backendCorrections: 0,
      llmCorrections: 0,
      backendSuccessRate: 0,
      llmSuccessRate: 0,
      
      // Performance metrics
      avgBackendProcessingTime: 0,
      avgLLMProcessingTime: 0,
      avgTotalProcessingTime: 0,
      
      // Cost metrics
      totalTokensUsed: 0,
      totalCost: 0,
      avgCostPerCorrection: 0,
      
      // Quality metrics
      correctionAccuracy: 0,
      userSatisfactionScore: 0,
      
      // Historical data
      dailyMetrics: {},
      hourlyMetrics: {},
      
      // Component-specific metrics
      issueScorer: {
        totalDetections: 0,
        falsePositives: 0,
        falseNegatives: 0,
        accuracy: 0
      },
      
      backendFixer: {
        totalAttempts: 0,
        successfulFixes: 0,
        skippedFixes: 0,
        successRate: 0
      },
      
      llmFixer: {
        totalAttempts: 0,
        successfulFixes: 0,
        avgConfidence: 0,
        successRate: 0
      }
    };
    
    this.sessionHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Record a processing session
   */
  recordSession(sessionData) {
    const session = {
      timestamp: new Date().toISOString(),
      responseId: sessionData.responseId || this.generateResponseId(),
      originalLength: sessionData.originalLength || 0,
      processedLength: sessionData.processedLength || 0,
      issuesDetected: sessionData.issuesDetected || 0,
      totalScore: sessionData.totalScore || 0,
      severity: sessionData.severity || 'low',
      processingMethod: sessionData.processingMethod || 'none',
      processingTime: sessionData.processingTime || 0,
      success: sessionData.success || false,
      tokensUsed: sessionData.tokensUsed || 0,
      cost: sessionData.cost || 0,
      confidence: sessionData.confidence || 'medium'
    };
    
    this.sessionHistory.push(session);
    
    // Keep only recent history
    if (this.sessionHistory.length > this.maxHistorySize) {
      this.sessionHistory = this.sessionHistory.slice(-this.maxHistorySize);
    }
    
    this.updateMetrics(session);
    this.updateDailyMetrics(session);
    this.updateHourlyMetrics(session);
  }

  /**
   * Update overall metrics based on session
   */
  updateMetrics(session) {
    this.metrics.totalResponses++;
    this.metrics.totalIssuesDetected += session.issuesDetected;
    this.metrics.totalProcessingTime += session.processingTime;
    
    if (session.success) {
      this.metrics.totalCorrections++;
    }
    
    // Update issue detection rate
    this.metrics.issueDetectionRate = this.metrics.totalIssuesDetected / this.metrics.totalResponses;
    this.metrics.avgIssuesPerResponse = this.metrics.totalIssuesDetected / this.metrics.totalResponses;
    
    // Update processing method counts
    if (session.processingMethod === 'backend') {
      this.metrics.backendCorrections++;
    } else if (session.processingMethod === 'llm') {
      this.metrics.llmCorrections++;
    }
    
    // Update severity distribution
    this.metrics.severityDistribution[session.severity] = 
      (this.metrics.severityDistribution[session.severity] || 0) + 1;
    
    // Update processing times
    this.updateProcessingTimes(session);
    
    // Update cost metrics
    this.metrics.totalTokensUsed += session.tokensUsed;
    this.metrics.totalCost += session.cost;
    this.metrics.avgCostPerCorrection = this.metrics.totalCost / Math.max(1, this.metrics.totalCorrections);
  }

  /**
   * Update processing time metrics
   */
  updateProcessingTimes(session) {
    if (session.processingMethod === 'backend') {
      this.metrics.avgBackendProcessingTime = this.calculateRunningAverage(
        this.metrics.avgBackendProcessingTime,
        session.processingTime,
        this.metrics.backendCorrections
      );
    } else if (session.processingMethod === 'llm') {
      this.metrics.avgLLMProcessingTime = this.calculateRunningAverage(
        this.metrics.avgLLMProcessingTime,
        session.processingTime,
        this.metrics.llmCorrections
      );
    }
    
    this.metrics.avgTotalProcessingTime = this.calculateRunningAverage(
      this.metrics.avgTotalProcessingTime,
      session.processingTime,
      this.metrics.totalResponses
    );
  }

  /**
   * Update daily metrics
   */
  updateDailyMetrics(session) {
    const date = new Date(session.timestamp).toISOString().split('T')[0];
    
    if (!this.metrics.dailyMetrics[date]) {
      this.metrics.dailyMetrics[date] = {
        responses: 0,
        issues: 0,
        corrections: 0,
        backendCorrections: 0,
        llmCorrections: 0,
        totalTime: 0,
        totalCost: 0
      };
    }
    
    const daily = this.metrics.dailyMetrics[date];
    daily.responses++;
    daily.issues += session.issuesDetected;
    if (session.success) daily.corrections++;
    if (session.processingMethod === 'backend') daily.backendCorrections++;
    if (session.processingMethod === 'llm') daily.llmCorrections++;
    daily.totalTime += session.processingTime;
    daily.totalCost += session.cost;
  }

  /**
   * Update hourly metrics
   */
  updateHourlyMetrics(session) {
    const hour = new Date(session.timestamp).toISOString().substring(0, 13);
    
    if (!this.metrics.hourlyMetrics[hour]) {
      this.metrics.hourlyMetrics[hour] = {
        responses: 0,
        issues: 0,
        corrections: 0,
        avgProcessingTime: 0,
        totalCost: 0
      };
    }
    
    const hourly = this.metrics.hourlyMetrics[hour];
    hourly.responses++;
    hourly.issues += session.issuesDetected;
    if (session.success) hourly.corrections++;
    hourly.avgProcessingTime = (hourly.avgProcessingTime + session.processingTime) / 2;
    hourly.totalCost += session.cost;
  }

  /**
   * Record issue scorer performance
   */
  recordIssueScorerPerformance(detectionData) {
    this.metrics.issueScorer.totalDetections += detectionData.totalDetections || 0;
    this.metrics.issueScorer.falsePositives += detectionData.falsePositives || 0;
    this.metrics.issueScorer.falseNegatives += detectionData.falseNegatives || 0;
    
    const total = this.metrics.issueScorer.totalDetections;
    const correct = total - this.metrics.issueScorer.falsePositives - this.metrics.issueScorer.falseNegatives;
    this.metrics.issueScorer.accuracy = total > 0 ? correct / total : 0;
  }

  /**
   * Record backend fixer performance
   */
  recordBackendFixerPerformance(fixerData) {
    this.metrics.backendFixer.totalAttempts += fixerData.totalAttempts || 0;
    this.metrics.backendFixer.successfulFixes += fixerData.successfulFixes || 0;
    this.metrics.backendFixer.skippedFixes += fixerData.skippedFixes || 0;
    
    this.metrics.backendFixer.successRate = this.metrics.backendFixer.totalAttempts > 0 ? 
      this.metrics.backendFixer.successfulFixes / this.metrics.backendFixer.totalAttempts : 0;
  }

  /**
   * Record LLM fixer performance
   */
  recordLLMFixerPerformance(fixerData) {
    this.metrics.llmFixer.totalAttempts += fixerData.totalAttempts || 0;
    this.metrics.llmFixer.successfulFixes += fixerData.successfulFixes || 0;
    
    this.metrics.llmFixer.successRate = this.metrics.llmFixer.totalAttempts > 0 ? 
      this.metrics.llmFixer.successfulFixes / this.metrics.llmFixer.totalAttempts : 0;
    
    if (fixerData.avgConfidence) {
      this.metrics.llmFixer.avgConfidence = this.calculateRunningAverage(
        this.metrics.llmFixer.avgConfidence,
        fixerData.avgConfidence,
        this.metrics.llmFixer.totalAttempts
      );
    }
  }

  /**
   * Get comprehensive metrics report
   */
  getMetricsReport() {
    return {
      overview: {
        totalResponses: this.metrics.totalResponses,
        totalIssuesDetected: this.metrics.totalIssuesDetected,
        totalCorrections: this.metrics.totalCorrections,
        issueDetectionRate: Math.round(this.metrics.issueDetectionRate * 100) / 100,
        avgIssuesPerResponse: Math.round(this.metrics.avgIssuesPerResponse * 100) / 100
      },
      
      processing: {
        backendCorrections: this.metrics.backendCorrections,
        llmCorrections: this.metrics.llmCorrections,
        backendSuccessRate: this.metrics.backendFixer.successRate,
        llmSuccessRate: this.metrics.llmFixer.successRate,
        avgBackendTime: Math.round(this.metrics.avgBackendProcessingTime),
        avgLLMTime: Math.round(this.metrics.avgLLMProcessingTime),
        avgTotalTime: Math.round(this.metrics.avgTotalProcessingTime)
      },
      
      costs: {
        totalTokens: this.metrics.totalTokensUsed,
        totalCost: Math.round(this.metrics.totalCost * 100) / 100,
        avgCostPerCorrection: Math.round(this.metrics.avgCostPerCorrection * 100) / 100
      },
      
      quality: {
        issueScorerAccuracy: Math.round(this.metrics.issueScorer.accuracy * 100) / 100,
        backendFixerSuccess: Math.round(this.metrics.backendFixer.successRate * 100) / 100,
        llmFixerSuccess: Math.round(this.metrics.llmFixer.successRate * 100) / 100,
        avgLLMConfidence: this.metrics.llmFixer.avgConfidence
      },
      
      distribution: {
        severity: this.metrics.severityDistribution,
        issueTypes: this.metrics.issueTypeDistribution
      },
      
      trends: {
        daily: this.getDailyTrends(),
        hourly: this.getHourlyTrends()
      }
    };
  }

  /**
   * Get daily trends
   */
  getDailyTrends(days = 7) {
    const dates = Object.keys(this.metrics.dailyMetrics)
      .sort()
      .slice(-days);
    
    return dates.map(date => ({
      date,
      ...this.metrics.dailyMetrics[date]
    }));
  }

  /**
   * Get hourly trends
   */
  getHourlyTrends(hours = 24) {
    const hours_list = Object.keys(this.metrics.hourlyMetrics)
      .sort()
      .slice(-hours);
    
    return hours_list.map(hour => ({
      hour,
      ...this.metrics.hourlyMetrics[hour]
    }));
  }

  /**
   * Get performance comparison between methods
   */
  getPerformanceComparison() {
    const backendSessions = this.sessionHistory.filter(s => s.processingMethod === 'backend');
    const llmSessions = this.sessionHistory.filter(s => s.processingMethod === 'llm');
    
    return {
      backend: {
        count: backendSessions.length,
        avgTime: backendSessions.length > 0 ? 
          Math.round(backendSessions.reduce((sum, s) => sum + s.processingTime, 0) / backendSessions.length) : 0,
        successRate: backendSessions.length > 0 ? 
          backendSessions.filter(s => s.success).length / backendSessions.length : 0,
        avgIssues: backendSessions.length > 0 ? 
          Math.round(backendSessions.reduce((sum, s) => sum + s.issuesDetected, 0) / backendSessions.length * 100) / 100 : 0
      },
      
      llm: {
        count: llmSessions.length,
        avgTime: llmSessions.length > 0 ? 
          Math.round(llmSessions.reduce((sum, s) => sum + s.processingTime, 0) / llmSessions.length) : 0,
        successRate: llmSessions.length > 0 ? 
          llmSessions.filter(s => s.success).length / llmSessions.length : 0,
        avgIssues: llmSessions.length > 0 ? 
          Math.round(llmSessions.reduce((sum, s) => sum + s.issuesDetected, 0) / llmSessions.length * 100) / 100 : 0
      }
    };
  }

  /**
   * Generate response ID
   */
  generateResponseId() {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate running average
   */
  calculateRunningAverage(currentAvg, newValue, count) {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      totalResponses: 0,
      totalIssuesDetected: 0,
      totalCorrections: 0,
      totalProcessingTime: 0,
      issueDetectionRate: 0,
      avgIssuesPerResponse: 0,
      issueTypeDistribution: {},
      severityDistribution: {},
      backendCorrections: 0,
      llmCorrections: 0,
      backendSuccessRate: 0,
      llmSuccessRate: 0,
      avgBackendProcessingTime: 0,
      avgLLMProcessingTime: 0,
      avgTotalProcessingTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      avgCostPerCorrection: 0,
      correctionAccuracy: 0,
      userSatisfactionScore: 0,
      dailyMetrics: {},
      hourlyMetrics: {},
      issueScorer: {
        totalDetections: 0,
        falsePositives: 0,
        falseNegatives: 0,
        accuracy: 0
      },
      backendFixer: {
        totalAttempts: 0,
        successfulFixes: 0,
        skippedFixes: 0,
        successRate: 0
      },
      llmFixer: {
        totalAttempts: 0,
        successfulFixes: 0,
        avgConfidence: 0,
        successRate: 0
      }
    };
    
    this.sessionHistory = [];
    console.log('🗑️ Metrics cleared');
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      sessionHistory: this.sessionHistory,
      exportTimestamp: new Date().toISOString()
    };
  }
}

module.exports = MetricsService;
