/**
 * Test script for image generation functionality
 */

const ImageGenerator = require('./backend/services/imageGenerator');

async function testImageGeneration() {
  console.log('🧪 Testing image generation functionality...');
  
  const imageGenerator = new ImageGenerator();
  
  // Test parsing image triggers
  const testContent = `
**[LOCATION]**: Oakhaven - Village Square
**[DESCRIPTION]**: The crisp morning air bites at your exposed skin as you stand in the center of Oakhaven's village square.

**[IMAGE_GENERATION_TRIGGER | Type: SCENE | Description: A bustling village square in the early morning. Villagers are milling about, their faces showing concern. In the center stands a dwarf guardian in chainmail armor, holding a battleaxe. On the steps of the town hall, an elven elder addresses the crowd with a worried expression.]**

**[PROMPT]**: What would you like to do?
  `;
  
  console.log('📝 Testing trigger parsing...');
  const triggers = imageGenerator.parseImageTriggers(testContent);
  console.log('Found triggers:', triggers);
  
  if (triggers.length > 0) {
    console.log('🎨 Testing image generation...');
    try {
      const result = await imageGenerator.generateImage(triggers[0]);
      console.log('Image generation result:', {
        success: result.success,
        hasImageData: !!result.imageData,
        mimeType: result.mimeType,
        error: result.error
      });
    } catch (error) {
      console.error('❌ Image generation failed:', error.message);
    }
  }
  
  console.log('✅ Test completed');
}

// Run the test
testImageGeneration().catch(console.error);
