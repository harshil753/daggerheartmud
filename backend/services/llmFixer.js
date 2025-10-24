/**
 * LLM Fixer Service
 * Uses specialized LLM to fix high-score issues that require AI intervention
 */

const { GoogleGenAI } = require('@google/genai');
const promptLoader = require('./promptLoader');

class LLMFixer {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.model = this.ai.models.generateContent;
    
    this.promptLoader = promptLoader;
    this.correctionLog = [];
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      corrections: 0
    };
  }

  /**
   * Main method to fix high-score issues using LLM
   * @param {string} originalResponse - Original AI response
   * @param {Array} issues - Array of detected issues
   * @param {Object} gameContext - Current game state and rules
   * @returns {Object} Fixed response with metadata
   */
  async fixResponse(originalResponse, issues, gameContext) {
    console.log('🤖 LLM Fixer: Starting correction process');
    
    try {
      // Load the rule enforcer prompt
      const systemPrompt = this.promptLoader.loadRuleEnforcerPrompt();
      
      // Build the correction prompt
      const correctionPrompt = this.buildCorrectionPrompt(
        originalResponse, 
        issues, 
        gameContext, 
        systemPrompt
      );
      
      // Generate correction
      const startTime = Date.now();
      const result = await this.model({
        model: "gemini-2.5-flash",
        contents: correctionPrompt
      });
      const processingTime = Date.now() - startTime;
      
      const correctedResponse = result.text;
      
      // Parse the corrected response
      const parsedResponse = this.parseCorrectedResponse(correctedResponse);
      
      // Track costs and metrics
      this.trackCorrection(originalResponse, parsedResponse, issues, processingTime);
      
      console.log(`✅ LLM Correction completed in ${processingTime}ms`);
      
      return {
        originalResponse,
        correctedResponse: parsedResponse.response,
        issuesFixed: parsedResponse.issuesFixed,
        confidence: parsedResponse.confidence,
        processingTime,
        success: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ LLM Fixer Error:', error.message);
      
      return {
        originalResponse,
        correctedResponse: originalResponse, // Fallback to original
        issuesFixed: [],
        confidence: 'Low',
        processingTime: 0,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build the correction prompt for the LLM
   */
  buildCorrectionPrompt(originalResponse, issues, gameContext, systemPrompt) {
    const issuesList = issues.map(issue => 
      `- ${issue.type}: ${issue.details} (Score: ${issue.score})`
    ).join('\n');
    
    const gameRules = this.buildGameRulesContext(gameContext);
    
    return `${systemPrompt}

## CORRECTION REQUEST

**Original AI Response:**
${originalResponse}

**Detected Issues:**
${issuesList}

**Game Context:**
${gameRules}

**Your Task:**
Fix the above response by addressing all detected issues while preserving the narrative quality. Provide the corrected response with proper structured tags, valid game options, and correct formatting.

**Response Format:**
1. **Corrected Response:** [The full corrected response]
2. **Issues Fixed:** [List of specific issues corrected]
3. **Confidence:** [High/Medium/Low]`;
  }

  /**
   * Build game rules context for the LLM
   */
  buildGameRulesContext(gameContext) {
    const context = [];
    
    if (gameContext.validCommunities) {
      context.push(`Valid Communities: ${gameContext.validCommunities.join(', ')}`);
    }
    
    if (gameContext.validClasses) {
      context.push(`Valid Classes: ${gameContext.validClasses.join(', ')}`);
    }
    
    if (gameContext.validAncestries) {
      context.push(`Valid Ancestries: ${gameContext.validAncestries.join(', ')}`);
    }
    
    if (gameContext.characterData) {
      context.push(`Current Character: ${JSON.stringify(gameContext.characterData, null, 2)}`);
    }
    
    if (gameContext.currentLocation) {
      context.push(`Current Location: ${gameContext.currentLocation}`);
    }
    
    return context.join('\n');
  }

  /**
   * Parse the corrected response from the LLM
   */
  parseCorrectedResponse(correctedResponse) {
    try {
      // Extract the corrected response (everything before "Issues Fixed:")
      const responseMatch = correctedResponse.match(/1\.\s*\*\*Corrected Response:\*\*\s*([\s\S]*?)(?=2\.\s*\*\*Issues Fixed:\*\*|$)/);
      const response = responseMatch ? responseMatch[1].trim() : correctedResponse;
      
      // Extract issues fixed
      const issuesMatch = correctedResponse.match(/2\.\s*\*\*Issues Fixed:\*\*\s*([\s\S]*?)(?=3\.\s*\*\*Confidence:\*\*|$)/);
      const issuesFixed = issuesMatch ? 
        issuesMatch[1].trim().split('\n').filter(line => line.trim()) : 
        [];
      
      // Extract confidence
      const confidenceMatch = correctedResponse.match(/3\.\s*\*\*Confidence:\*\*\s*(High|Medium|Low)/);
      const confidence = confidenceMatch ? confidenceMatch[1] : 'Medium';
      
      return {
        response,
        issuesFixed,
        confidence
      };
      
    } catch (error) {
      console.error('Error parsing corrected response:', error.message);
      return {
        response: correctedResponse,
        issuesFixed: ['Response parsing failed'],
        confidence: 'Low'
      };
    }
  }

  /**
   * Track correction metrics and costs
   */
  trackCorrection(originalResponse, parsedResponse, issues, processingTime) {
    const session = {
      timestamp: new Date().toISOString(),
      originalLength: originalResponse.length,
      correctedLength: parsedResponse.response.length,
      issuesCount: issues.length,
      issuesFixed: parsedResponse.issuesFixed.length,
      confidence: parsedResponse.confidence,
      processingTime,
      success: parsedResponse.issuesFixed.length > 0
    };
    
    this.correctionLog.push(session);
    
    // Estimate token usage (rough approximation)
    const estimatedTokens = Math.ceil((originalResponse.length + parsedResponse.response.length) / 4);
    this.costTracker.totalTokens += estimatedTokens;
    this.costTracker.corrections++;
    
    // Keep only last 100 corrections
    if (this.correctionLog.length > 100) {
      this.correctionLog = this.correctionLog.slice(-100);
    }
    
    console.log('📊 LLM Fixer Session:', {
      issuesFixed: parsedResponse.issuesFixed.length,
      confidence: parsedResponse.confidence,
      processingTime: `${processingTime}ms`,
      success: session.success
    });
  }

  /**
   * Get correction statistics
   */
  getStats() {
    const totalCorrections = this.correctionLog.length;
    const successfulCorrections = this.correctionLog.filter(session => session.success).length;
    const avgProcessingTime = totalCorrections > 0 ? 
      this.correctionLog.reduce((sum, session) => sum + session.processingTime, 0) / totalCorrections : 0;
    
    const confidenceDistribution = this.correctionLog.reduce((dist, session) => {
      dist[session.confidence] = (dist[session.confidence] || 0) + 1;
      return dist;
    }, {});
    
    return {
      totalCorrections,
      successfulCorrections,
      successRate: totalCorrections > 0 ? successfulCorrections / totalCorrections : 0,
      avgProcessingTime: Math.round(avgProcessingTime),
      confidenceDistribution,
      totalTokens: this.costTracker.totalTokens,
      estimatedCost: this.estimateCost(),
      recentCorrections: this.correctionLog.slice(-10)
    };
  }

  /**
   * Estimate cost based on token usage
   */
  estimateCost() {
    // Gemini 1.5 Flash pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const inputTokens = this.costTracker.totalTokens * 0.6; // Rough estimate
    const outputTokens = this.costTracker.totalTokens * 0.4;
    
    const inputCost = (inputTokens / 1000000) * 0.075;
    const outputCost = (outputTokens / 1000000) * 0.30;
    
    return Math.round((inputCost + outputCost) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Test the LLM fixer with a sample response
   */
  async testFixer(sampleResponse, sampleIssues, gameContext) {
    console.log('🧪 Testing LLM Fixer...');
    
    try {
      const result = await this.fixResponse(sampleResponse, sampleIssues, gameContext);
      
      console.log('Test Results:', {
        success: result.success,
        issuesFixed: result.issuesFixed.length,
        confidence: result.confidence,
        processingTime: `${result.processingTime}ms`
      });
      
      return result;
    } catch (error) {
      console.error('Test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent correction history
   */
  getRecentCorrections(limit = 10) {
    return this.correctionLog.slice(-limit);
  }

  /**
   * Clear correction history
   */
  clearHistory() {
    this.correctionLog = [];
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      corrections: 0
    };
    console.log('🗑️ LLM Fixer history cleared');
  }
}

module.exports = LLMFixer;
