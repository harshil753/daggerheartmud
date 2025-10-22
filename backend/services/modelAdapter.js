/**
 * Model Adapter Service
 * Abstract interface for easy model swapping and comparison
 */

class ModelAdapter {
  constructor(modelType = 'gemini') {
    this.modelType = modelType;
    this.model = null;
    this.config = {};
    this.initializeModel();
  }

  /**
   * Initialize the specified model
   */
  initializeModel() {
    switch (this.modelType.toLowerCase()) {
      case 'gemini':
        this.initializeGemini();
        break;
      case 'claude':
        this.initializeClaude();
        break;
      case 'openai':
        this.initializeOpenAI();
        break;
      case 'llama':
        this.initializeLlama();
        break;
      default:
        throw new Error(`Unsupported model type: ${this.modelType}`);
    }
  }

  /**
   * Initialize Gemini model
   */
  initializeGemini() {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    this.config = {
      name: 'Gemini 1.5 Flash',
      provider: 'Google',
      costPer1MInput: 0.075,
      costPer1MOutput: 0.30,
      maxTokens: 2048,
      temperature: 0.3
    };
  }

  /**
   * Initialize Claude model (placeholder - requires Anthropic SDK)
   */
  initializeClaude() {
    // Placeholder for Claude integration
    // Would require: npm install @anthropic-ai/sdk
    throw new Error('Claude integration not implemented. Install @anthropic-ai/sdk to enable.');
  }

  /**
   * Initialize OpenAI model (placeholder - requires OpenAI SDK)
   */
  initializeOpenAI() {
    // Placeholder for OpenAI integration
    // Would require: npm install openai
    throw new Error('OpenAI integration not implemented. Install openai package to enable.');
  }

  /**
   * Initialize Llama model (placeholder - requires Ollama or similar)
   */
  initializeLlama() {
    // Placeholder for Llama integration
    // Would require local Ollama installation or similar
    throw new Error('Llama integration not implemented. Requires local Ollama installation.');
  }

  /**
   * Generate correction using the configured model
   * @param {string} prompt - The correction prompt
   * @param {Object} options - Generation options
   * @returns {Object} Generated response with metadata
   */
  async generateCorrection(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      let response;
      let tokensUsed = 0;
      
      switch (this.modelType.toLowerCase()) {
        case 'gemini':
          response = await this.generateWithGemini(prompt, options);
          tokensUsed = this.estimateTokens(prompt, response);
          break;
        case 'claude':
          response = await this.generateWithClaude(prompt, options);
          tokensUsed = this.estimateTokens(prompt, response);
          break;
        case 'openai':
          response = await this.generateWithOpenAI(prompt, options);
          tokensUsed = this.estimateTokens(prompt, response);
          break;
        case 'llama':
          response = await this.generateWithLlama(prompt, options);
          tokensUsed = this.estimateTokens(prompt, response);
          break;
        default:
          throw new Error(`Unsupported model type: ${this.modelType}`);
      }
      
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(tokensUsed);
      
      return {
        response,
        tokensUsed,
        cost,
        processingTime,
        model: this.config.name,
        success: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Model ${this.modelType} error:`, error.message);
      return {
        response: null,
        tokensUsed: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        model: this.config.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate with Gemini
   */
  async generateWithGemini(prompt, options) {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Generate with Claude (placeholder)
   */
  async generateWithClaude(prompt, options) {
    throw new Error('Claude generation not implemented');
  }

  /**
   * Generate with OpenAI (placeholder)
   */
  async generateWithOpenAI(prompt, options) {
    throw new Error('OpenAI generation not implemented');
  }

  /**
   * Generate with Llama (placeholder)
   */
  async generateWithLlama(prompt, options) {
    throw new Error('Llama generation not implemented');
  }

  /**
   * Estimate token usage (rough approximation)
   */
  estimateTokens(input, output) {
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    };
  }

  /**
   * Calculate cost based on token usage
   */
  calculateCost(tokenUsage) {
    const inputCost = (tokenUsage.input / 1000000) * this.config.costPer1MInput;
    const outputCost = (tokenUsage.output / 1000000) * this.config.costPer1MOutput;
    return Math.round((inputCost + outputCost) * 100) / 100;
  }

  /**
   * Get model configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Switch to a different model
   */
  switchModel(newModelType) {
    if (newModelType !== this.modelType) {
      this.modelType = newModelType;
      this.initializeModel();
      console.log(`🔄 Switched to ${this.config.name}`);
    }
  }

  /**
   * Get available model types
   */
  static getAvailableModels() {
    return [
      {
        type: 'gemini',
        name: 'Gemini 1.5 Flash',
        provider: 'Google',
        costPer1MInput: 0.075,
        costPer1MOutput: 0.30,
        speed: 'Fast',
        accuracy: 'High'
      },
      {
        type: 'claude',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        costPer1MInput: 0.25,
        costPer1MOutput: 1.25,
        speed: 'Fast',
        accuracy: 'Very High'
      },
      {
        type: 'openai',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        costPer1MInput: 0.15,
        costPer1MOutput: 0.60,
        speed: 'Medium',
        accuracy: 'High'
      },
      {
        type: 'llama',
        name: 'Llama 3.1 8B',
        provider: 'Meta',
        costPer1MInput: 0, // Self-hosted
        costPer1MOutput: 0,
        speed: 'Medium',
        accuracy: 'Medium-High'
      }
    ];
  }

  /**
   * Compare models for a specific use case
   */
  static compareModels(useCase = 'correction') {
    const models = this.getAvailableModels();
    
    return models.map(model => {
      let score = 0;
      
      // Speed score (0-3)
      const speedScores = { 'Fast': 3, 'Medium': 2, 'Slow': 1 };
      score += speedScores[model.speed] || 0;
      
      // Accuracy score (0-3)
      const accuracyScores = { 'Very High': 3, 'High': 2, 'Medium-High': 2, 'Medium': 1 };
      score += accuracyScores[model.accuracy] || 0;
      
      // Cost score (0-3, lower is better)
      const totalCost = model.costPer1MInput + model.costPer1MOutput;
      const costScore = totalCost === 0 ? 3 : Math.max(0, 3 - (totalCost * 2));
      score += costScore;
      
      return {
        ...model,
        totalScore: score,
        recommendation: score >= 6 ? 'Recommended' : score >= 4 ? 'Good' : 'Consider alternatives'
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Test the model with a sample prompt
   */
  async testModel(samplePrompt = 'Fix this response: "You find a health potion!"') {
    console.log(`🧪 Testing ${this.config.name}...`);
    
    try {
      const result = await this.generateCorrection(samplePrompt);
      
      console.log('Test Results:', {
        success: result.success,
        processingTime: `${result.processingTime}ms`,
        tokensUsed: result.tokensUsed.total,
        cost: `$${result.cost}`,
        model: result.model
      });
      
      return result;
    } catch (error) {
      console.error('Model test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ModelAdapter;
