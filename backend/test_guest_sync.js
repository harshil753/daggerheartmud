require('dotenv').config(); // Load environment variables
console.log('🔍 Debug: Starting test...');
console.log('🔍 Debug: SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'Missing');
console.log('🔍 Debug: SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing');

const DatabaseSync = require('./services/databaseSync');
console.log('🔍 Debug: DatabaseSync imported');

async function testGuestSync() {
  console.log('🧪 Testing Guest Session JSON Storage...');
  
  try {
    const db = new DatabaseSync();
    console.log('✅ Database connection established');
    
    const mockGameState = {
      isGuest: true,
      character: { name: 'Test Hero', level: 1, hp: 20 },
      inventory: [{ name: 'Health Potion', quantity: 2 }],
      currentLocation: 'Village'
    };
    
    const changes = {
      character: { hp: 25 },
      inventory: [{ action: 'add', item: 'Magic Sword', quantity: 1 }]
    };
    
    console.log('📝 Testing guest session sync...');
    const result = await db.syncGuestChanges(changes, mockGameState, 'test-session-123');
    console.log('✅ Guest sync result:', result);
    
    console.log('🎉 Guest session test completed successfully!');
    
  } catch (error) {
    console.error('❌ Guest sync test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGuestSync();