const { io } = require('socket.io-client');

console.log('🔌 Testing WebSocket connection to Render backend...');
console.log('URL: https://daggerheartmud.onrender.com');

const socket = io('https://daggerheartmud.onrender.com', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

// Connection events
socket.on('connect', () => {
  console.log('✅ SUCCESS: Connected to WebSocket server!');
  console.log('📡 Socket ID:', socket.id);
  console.log('🌐 Transport:', socket.io.engine.transport.name);
  
  // Test joining game
  console.log('🎮 Testing game join...');
  socket.emit('join_game', { userId: null, isGuest: true });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection Error:', error.message);
  console.log('💡 Check if backend is running and accessible');
});

// Game events
socket.on('game_joined', (data) => {
  console.log('🎮 Game joined successfully!');
  console.log('📊 Game state:', JSON.stringify(data, null, 2));
});

socket.on('game_message', (data) => {
  console.log('💬 Game message:', data.message);
});

socket.on('command_response', (data) => {
  console.log('📝 Command response:', data.message);
});


// Test commands
setTimeout(() => {
  console.log('🧪 Testing commands...');
  socket.emit('player_command', { command: 'help' });
}, 2000);

setTimeout(() => {
    console.log('🧪 Testing commands...');
    socket.emit('player_command', { command: 'stats' });
  }, 2000);

setTimeout(() => {
console.log('🧪 Testing commands...');
socket.emit('player_command', { command: 'inventory' });
}, 2000);

setTimeout(() => {
    console.log('🧪 Testing commands...');
    socket.emit('player_command', { command: 'create character' });
  }, 2000);

setTimeout(() => {
  console.log('🧪 Testing look command...');
  socket.emit('player_command', { command: 'look' });
}, 4000);

// Keep connection alive for testing
setTimeout(() => {
  console.log('🔚 Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 10000);

