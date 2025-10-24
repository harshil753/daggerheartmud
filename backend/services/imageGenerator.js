const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

/**
 * Service for generating images using Gemini Flash model
 */
class ImageGenerator {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * Parse IMAGE_GENERATION_TRIGGER tags from AI response
   * @param {string} content - The AI response content
   * @returns {Array} Array of parsed image generation triggers
   */
  parseImageTriggers(content) {
    const imageTriggerRegex = /\[IMAGE_GENERATION_TRIGGER\s*\|\s*Type:\s*([^|]+)\s*\|\s*Description:\s*([^\]]+)\]/g;
    const triggers = [];
    let match;

    while ((match = imageTriggerRegex.exec(content)) !== null) {
      triggers.push({
        type: match[1].trim(),
        description: match[2].trim(),
        fullMatch: match[0]
      });
    }

    return triggers;
  }

  /**
   * Generate image using Gemini Flash model
   * @param {Object} trigger - The parsed image trigger
   * @returns {Promise<Object>} Generated image data
   */
  async generateImage(trigger) {
    try {
      console.log('🎨 Generating image for trigger:', trigger);

      // Create a detailed prompt for image generation
      const imagePrompt = this.buildImagePrompt(trigger);

      // Generate image using Gemini Flash
      const model = this.ai.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      });

      const result = await model.generateContent([
        {
          text: imagePrompt
        }
      ]);

      const response = await result.response;
      const imageData = response.candidates[0].content.parts[0];

      if (imageData && imageData.inlineData) {
        return {
          success: true,
          imageData: imageData.inlineData.data,
          mimeType: imageData.inlineData.mimeType,
          trigger: trigger
        };
      } else {
        throw new Error('No image data returned from Gemini');
      }
    } catch (error) {
      console.error('❌ Error generating image:', error);
      return {
        success: false,
        error: error.message,
        trigger: trigger
      };
    }
  }

  /**
   * Build detailed prompt for image generation
   * @param {Object} trigger - The parsed image trigger
   * @returns {string} Detailed image generation prompt
   */
  buildImagePrompt(trigger) {
    const basePrompt = `Generate a high-quality, detailed image for a Daggerheart tabletop RPG game. `;
    
    let typeSpecificPrompt = '';
    switch (trigger.type.toLowerCase()) {
      case 'character':
        typeSpecificPrompt = `Create a detailed character portrait showing their appearance, equipment, and personality. `;
        break;
      case 'creature':
        typeSpecificPrompt = `Create a detailed creature or monster illustration showing its appearance, size, and threatening nature. `;
        break;
      case 'location':
        typeSpecificPrompt = `Create a detailed environmental illustration showing the location, atmosphere, and key features. `;
        break;
      case 'item':
        typeSpecificPrompt = `Create a detailed item illustration showing the object, its details, and any magical properties. `;
        break;
      case 'scene':
        typeSpecificPrompt = `Create a detailed scene illustration showing the action, characters, and environment. `;
        break;
      default:
        typeSpecificPrompt = `Create a detailed illustration showing the subject matter. `;
    }

    const stylePrompt = `Style: Fantasy art, detailed, atmospheric, suitable for a tabletop RPG. `;
    const qualityPrompt = `Quality: High resolution, clear details, good lighting, professional artwork. `;

    return `${basePrompt}${typeSpecificPrompt}${stylePrompt}${qualityPrompt}Description: ${trigger.description}`;
  }

  /**
   * Process AI response and generate images for any IMAGE_GENERATION_TRIGGER tags
   * @param {string} content - The AI response content
   * @returns {Promise<Object>} Processed content with image data
   */
  async processImageTriggers(content) {
    const triggers = this.parseImageTriggers(content);
    
    if (triggers.length === 0) {
      return {
        content: content,
        images: []
      };
    }

    console.log(`🎨 Found ${triggers.length} image generation triggers`);

    const imageResults = [];
    const processedContent = content;

    // Generate images for each trigger
    for (const trigger of triggers) {
      try {
        const imageResult = await this.generateImage(trigger);
        imageResults.push(imageResult);
      } catch (error) {
        console.error('❌ Error processing image trigger:', error);
        imageResults.push({
          success: false,
          error: error.message,
          trigger: trigger
        });
      }
    }

    return {
      content: processedContent,
      images: imageResults,
      hasImages: imageResults.some(result => result.success)
    };
  }

  /**
   * Scale image data for terminal display
   * @param {string} imageData - Base64 image data
   * @param {string} mimeType - Image MIME type
   * @param {Object} options - Scaling options
   * @returns {Promise<Object>} Scaled image data
   */
  async scaleImageForTerminal(imageData, mimeType, options = {}) {
    const {
      maxWidth = 400,
      maxHeight = 300,
      quality = 0.8
    } = options;

    try {
      // For now, return the original image data
      // In a full implementation, you would use a library like sharp to resize
      return {
        success: true,
        imageData: imageData,
        mimeType: mimeType,
        scaled: false,
        originalSize: 'unknown'
      };
    } catch (error) {
      console.error('❌ Error scaling image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageGenerator;
