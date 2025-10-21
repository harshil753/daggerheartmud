#!/usr/bin/env node

/**
 * Setup script for deployment
 * Helps configure environment variables and deployment settings
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Daggerheart MUD Deployment Setup');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  'backend/server.js',
  'backend/package.json',
  'app/page.tsx',
  'next.config.ts'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing. Please check your project structure.');
  process.exit(1);
}

console.log('\n📝 Environment Variables Setup');
console.log('===============================');

// Check for environment files
const envFiles = [
  'env.local',
  'backend/.env'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`⚠️  ${file} not found - you may need to create it`);
  }
});

console.log('\n🔧 Deployment Steps');
console.log('===================');

console.log('\n1. Backend Deployment:');
console.log('   Option A - Vercel:');
console.log('   - cd backend');
console.log('   - vercel --prod');
console.log('   - Set environment variables in Vercel dashboard');
console.log('');
console.log('   Option B - Render (Recommended for WebSockets):');
console.log('   - Connect GitHub repo to Render');
console.log('   - Set build command: npm install');
console.log('   - Set start command: npm start');
console.log('   - Set environment variables');

console.log('\n2. Frontend Deployment:');
console.log('   - Set NEXT_PUBLIC_BACKEND_URL in Vercel dashboard');
console.log('   - Set other environment variables');
console.log('   - Deploy with: vercel --prod');

console.log('\n3. Required Environment Variables:');
console.log('   Frontend (Vercel):');
console.log('   - NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app');
console.log('   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
console.log('');
console.log('   Backend (Vercel/Render):');
console.log('   - GEMINI_API_KEY=your_gemini_api_key');
console.log('   - SUPABASE_URL=your_supabase_url');
console.log('   - SUPABASE_ANON_KEY=your_supabase_anon_key');
console.log('   - NODE_ENV=production');

console.log('\n4. Testing:');
console.log('   - Check backend health: https://your-backend-url/health');
console.log('   - Test WebSocket connection in browser console');
console.log('   - Verify environment variables are set correctly');

console.log('\n✅ Setup complete! Follow the steps above to deploy.');
console.log('\n📚 For detailed instructions, see docs/DEPLOYMENT.md');
