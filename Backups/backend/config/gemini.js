const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key. Please check your environment variables.');
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey });

// Dungeon Master model for text generation
const model = ai.models.generateContent;

// Image generation model for visual content  
const imageModel = ai.models.generateContent;

module.exports = { ai, model, imageModel };
