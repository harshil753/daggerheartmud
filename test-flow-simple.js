const fs = require('fs');
const http = require('http');

// Configuration
const BACKEND_URL = 'localhost';
const BACKEND_PORT = 3001;
const RULEBOOK_PATH = './supporting_functions/Results/daggerheart rulebook.md';

// Helper function to make HTTP requests
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ success: res.statusCode === 200, data: result, status: res.statusCode });
        } catch (error) {
          console.log('Raw response:', responseData.substring(0, 500));
          resolve({ success: false, error: 'Invalid JSON response', raw: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.write(postData);
    req.end();
  });
}

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runTest() {
  console.log('🧪 Starting Daggerheart MUD Test Flow');
  console.log('=====================================\n');
  
  let sessionId = null;
  
  try {
    // Step 1: Upload Daggerheart rulebook
    console.log('📚 Step 1: Uploading Daggerheart rulebook...');
    
    // Check if rulebook file exists
    if (!fs.existsSync(RULEBOOK_PATH)) {
      console.error(`❌ Rulebook file not found at: ${RULEBOOK_PATH}`);
      return;
    }
    
    // Read the rulebook content
    const rulebookContent = fs.readFileSync(RULEBOOK_PATH, 'utf8');
    console.log(`📊 Rulebook size: ${rulebookContent.length} characters`);
    
    // Send rulebook to backend
    const step1Response = await makeRequest('/api/test-ai-studio/send-message', {
      message: rulebookContent,
      sessionId: null
    });
    
    if (!step1Response.success) {
      console.error('❌ Step 1 failed:', step1Response.error || step1Response.data);
      console.log('🔍 Debug - Raw response:', JSON.stringify(step1Response, null, 2));
      return;
    }
    
    sessionId = step1Response.data.sessionId;
    console.log(`✅ Step 1 completed - Session ID: ${sessionId}`);
    console.log(`🤖 AI Response: ${step1Response.data.response.substring(0, 200)}...`);
    console.log(`📊 Message Length: ${step1Response.data.messageLength}`);
    console.log(`🔄 Phase Transition: ${step1Response.data.phaseTransition || false}`);
    console.log(`🆕 New Phase: ${step1Response.data.newPhase || 'N/A'}\n`);
    
    // Wait a moment before next step
    await wait(2000);
    
    // Step 2: Send campaign length choice
    console.log('🎯 Step 2: Sending campaign length choice...');
    
    const step2Response = await makeRequest('/api/test-ai-studio/send-message', {
      message: 'short',
      sessionId: sessionId
    });
    
    if (!step2Response.success) {
      console.error('❌ Step 2 failed:', step2Response.error || step2Response.data);
      console.log('🔍 Debug - Raw response:', JSON.stringify(step2Response, null, 2));
      return;
    }
    
    sessionId = step2Response.data.sessionId || sessionId;
    console.log(`✅ Step 2 completed - Session ID: ${sessionId}`);
    console.log(`🤖 AI Response: ${step2Response.data.response.substring(0, 200)}...`);
    console.log(`📊 Message Length: ${step2Response.data.messageLength}`);
    console.log(`🔄 Phase Transition: ${step2Response.data.phaseTransition || false}`);
    console.log(`🆕 New Phase: ${step2Response.data.newPhase || 'N/A'}\n`);
    
    // Wait a moment before next step
    await wait(2000);
    
    // Step 3: Request character generation
    console.log('👤 Step 3: Requesting character generation...');
    
    const step3Response = await makeRequest('/api/test-ai-studio/send-message', {
      message: 'yes generate entire character for me don\'t ask for my confirmation or input',
      sessionId: sessionId
    });
    
    if (!step3Response.success) {
      console.error('❌ Step 3 failed:', step3Response.error || step3Response.data);
      console.log('🔍 Debug - Raw response:', JSON.stringify(step3Response, null, 2));
      return;
    }
    
    sessionId = step3Response.data.sessionId || sessionId;
    console.log(`✅ Step 3 completed - Session ID: ${sessionId}`);
    console.log(`🤖 AI Response: ${step3Response.data.response.substring(0, 200)}...`);
    console.log(`📊 Message Length: ${step3Response.data.messageLength}`);
    console.log(`🔄 Phase Transition: ${step3Response.data.phaseTransition || false}`);
    console.log(`🆕 New Phase: ${step3Response.data.newPhase || 'N/A'}`);
    
    // Show automated adventure response if available
    if (step3Response.data.adventureStarted) {
      console.log('🎬 Automated Adventure Started!');
      console.log('🎭 Full Adventure Response:');
      console.log('--- START ADVENTURE RESPONSE ---');
      console.log(step3Response.data.response);
      console.log('--- END ADVENTURE RESPONSE ---\n');
    } else {
      console.log('');
    }
    
    // Step 4: Test Phase 2 session if transition occurred
    if (step3Response.data.phaseTransition && step3Response.data.newPhase === 'phase2_adventure') {
      console.log('🎮 Step 4: Testing Phase 2 session...');
      console.log('=====================================');
      
      // Wait a moment for Phase 2 to be fully set up
      await wait(3000);
      
      // Test sending a message to the Phase 2 session
      const step4Response = await makeRequest('/api/test-ai-studio/send-message', {
        message: 'continue the adventure',
        sessionId: sessionId
      });
      
      if (!step4Response.success) {
        console.error('❌ Step 4 failed:', step4Response.error || step4Response.data);
        console.log('🔍 Debug - Raw response:', JSON.stringify(step4Response, null, 2));
      } else {
        console.log(`✅ Step 4 completed - Session ID: ${step4Response.data.sessionId}`);
        console.log(`🤖 AI Response: ${step4Response.data.response.substring(0, 300)}...`);
        console.log(`📊 Message Length: ${step4Response.data.messageLength}`);
        console.log(`🔄 Phase Transition: ${step4Response.data.phaseTransition || false}`);
        console.log(`🆕 New Phase: ${step4Response.data.newPhase || 'N/A'}`);
        
        // Check if we got an adventure response
        if (step4Response.data.response.includes('LOCATION') || 
            step4Response.data.response.includes('DESCRIPTION') ||
            step4Response.data.response.includes('ASCII_MAP')) {
          console.log('🎉 SUCCESS: Phase 2 adventure response detected!');
        } else {
          console.log('⚠️ WARNING: Phase 2 adventure response not detected');
        }
      }
      
      console.log('');
    }
    
    // Final analysis
    console.log('📊 Test Flow Analysis');
    console.log('====================');
    console.log(`✅ All steps completed successfully`);
    console.log(`🆔 Final Session ID: ${sessionId}`);
    console.log(`🔄 Phase 2 Transition: ${step3Response.data.phaseTransition || false}`);
    console.log(`🆕 Final Phase: ${step3Response.data.newPhase || 'N/A'}`);
    
    if (step3Response.data.phaseTransition) {
      console.log('🎉 SUCCESS: Character creation completed and Phase 2 transition triggered!');
    } else {
      console.log('⚠️  WARNING: Phase 2 transition was not triggered');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
runTest();
