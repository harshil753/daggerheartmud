const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key. Please check your environment variables.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

// Dungeon Master model for text generation
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.8,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});

// Image generation model for visual content
const imageModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-image",
  generationConfig: {
    temperature: 0.7,
    topK: 32,
    topP: 0.9,
    maxOutputTokens: 1024,
  }
});

module.exports = { genAI, model, imageModel };
