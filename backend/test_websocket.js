const io = require('socket.io-client');

console.log('🔌 Testing WebSocket connection...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ WebSocket connected');
  
  // Test guest session creation
  console.log('📝 Testing guest session creation...');
  socket.emit('join_game', { 
    isGuest: true, 
    sessionId: 'test-websocket-session' 
  });
});

socket.on('game_joined', (data) => {
  console.log('✅ Guest session created:', data);
});

socket.on('game_message', (data) => {
  console.log('📨 Game message:', data);
});

socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket disconnected');
});

// Close connection after 5 seconds
setTimeout(() => {
  socket.disconnect();
  console.log('🎉 WebSocket test completed');
  process.exit(0);
}, 5000);