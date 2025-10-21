require('dotenv').config();
const AIResponseParser = require('./services/aiResponseParser');

const parser = new AIResponseParser();

// Test with tags that should be parsed
const testResponse = {
  message: "You enter the cave. [LOCATION_CHANGE:Cave] You find a health potion! [ITEM_ADD:Health Potion:1]"
};

const parsed = parser.parseResponse(testResponse, {});
console.log('Parser result:', parsed);