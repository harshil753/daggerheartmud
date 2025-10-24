const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const RULEBOOK_PATH = './supporting_functions/Results/daggerheart rulebook.md';

// Helper function to make API calls
async function makeRequest(endpoint, data) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to wait for a specified time
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
    const step1Response = await makeRequest('/api/test-ai-studio', {
      message: rulebookContent,
      sessionId: null
    });
    
    if (!step1Response.success) {
      console.error('❌ Step 1 failed:', step1Response.error || step1Response.data);
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
    
    const step2Response = await makeRequest('/api/test-ai-studio', {
      message: 'short',
      sessionId: sessionId
    });
    
    if (!step2Response.success) {
      console.error('❌ Step 2 failed:', step2Response.error || step2Response.data);
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
    
    const step3Response = await makeRequest('/api/test-ai-studio', {
      message: 'yes generate entire character for me don\'t ask for my confirmation or input',
      sessionId: sessionId
    });
    
    if (!step3Response.success) {
      console.error('❌ Step 3 failed:', step3Response.error || step3Response.data);
      return;
    }
    
    sessionId = step3Response.data.sessionId || sessionId;
    console.log(`✅ Step 3 completed - Session ID: ${sessionId}`);
    console.log(`🤖 AI Response: ${step3Response.data.response.substring(0, 200)}...`);
    console.log(`📊 Message Length: ${step3Response.data.messageLength}`);
    console.log(`🔄 Phase Transition: ${step3Response.data.phaseTransition || false}`);
    console.log(`🆕 New Phase: ${step3Response.data.newPhase || 'N/A'}\n`);
    
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

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('📦 Installing node-fetch for API calls...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install node-fetch', { stdio: 'inherit' });
    global.fetch = require('node-fetch');
  } catch (error) {
    console.error('❌ Failed to install node-fetch. Please run: npm install node-fetch');
    process.exit(1);
  }
}

// Run the test
runTest();
