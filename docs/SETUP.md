# Daggerheart MUD - Setup Guide

## Overview

This guide will help you set up the complete Daggerheart MUD game system, including the Next.js frontend, Node.js backend, and Supabase database.

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Gemini API key
- Git

## Quick Start

### 1. Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Schema**
   ```bash
   # In Supabase SQL Editor, run:
   # Copy and paste the contents of supabase/schema.sql
   # Then run supabase/policies.sql
   # Finally run supabase/seed.sql
   ```

3. **Configure RLS Policies**
   - Enable Row Level Security on all tables
   - Policies are already defined in `supabase/policies.sql`

### 2. Backend Setup (Render)

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values:
   # - SUPABASE_URL
   # - SUPABASE_SERVICE_KEY
   # - GEMINI_API_KEY
   # - PORT=3001
   ```

3. **Test Locally**
   ```bash
   npm run dev
   # Backend should start on http://localhost:3001
   ```

4. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Set environment variables in Render dashboard
   - Deploy using the `render.yaml` configuration

### 3. Frontend Setup (Vercel)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp env.local.example .env.local
   # Edit .env.local with your actual values:
   # - NEXT_PUBLIC_BACKEND_URL (your Render backend URL)
   # - NEXT_PUBLIC_SUPABASE_URL
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Test Locally**
   ```bash
   npm run dev
   # Frontend should start on http://localhost:3000
   ```

4. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically

## Detailed Setup

### Database Schema

The database includes these main tables:

- **characters**: Player character data
- **campaigns**: Campaign instances
- **campaign_players**: Player-campaign relationships
- **campaign_state**: AI context & persistence
- **items**: Equipment database
- **character_inventory**: Player items
- **game_sessions**: Session tracking
- **combat_encounters**: Active combats

### Backend Architecture

```
backend/
├── server.js              # Main entry point
├── config/
│   ├── supabase.js        # Database connection
│   └── gemini.js          # AI client setup
├── services/
│   ├── gameStateManager.js    # State management
│   ├── commandParser.js       # Parse player commands
│   ├── dungeonMaster.js       # AI integration
│   └── combatManager.js       # Combat logic
├── routes/
│   └── websocket.js       # WebSocket handlers
└── utils/
    ├── geminiContext.js   # Load SRD & equipment data
    └── keepAlive.js       # Prevent Render spin-down
```

### Frontend Architecture

```
app/
├── page.tsx               # Main entry point
├── components/
│   ├── Terminal.tsx       # xterm.js terminal
│   ├── GameControls.tsx   # Dice roller, stats panel
│   ├── InventoryPanel.tsx # Equipment display
│   ├── StatsPanel.tsx    # Character stats
│   ├── GuestSession.tsx   # Guest mode handler
│   └── GameSession.tsx    # Main game interface
└── globals.css            # Terminal styling
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
NODE_ENV=production
KEEP_ALIVE_URL=https://your-app.onrender.com
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Testing

### Local Development

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Test Connection**
   - Open http://localhost:3000
   - Click "Play as Guest"
   - Check terminal connection status

### Production Testing

1. **Backend Health Check**
   - Visit `https://your-backend.onrender.com/health`
   - Should return JSON with status

2. **Frontend Connection**
   - Visit your Vercel deployment
   - Test guest mode
   - Verify WebSocket connection

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS settings in backend
   - Verify backend URL in frontend
   - Check firewall/proxy settings

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure service key has proper permissions

3. **AI Context Loading Failed**
   - Verify Gemini API key
   - Check file paths for SRD/equipment data
   - Ensure files exist in `supporting_functions/Results/`

4. **Render Deployment Issues**
   - Check environment variables
   - Verify `render.yaml` configuration
   - Check build logs for errors

### Debug Mode

Enable debug logging by setting:
```
NODE_ENV=development
DEBUG=true
```

## Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Database Security**
   - Use RLS policies
   - Limit service key permissions
   - Monitor database access

3. **CORS Configuration**
   - Restrict origins to your domains
   - Use HTTPS in production
   - Validate WebSocket origins

## Performance Optimization

1. **Backend**
   - Use connection pooling
   - Implement caching for AI responses
   - Monitor memory usage

2. **Frontend**
   - Optimize terminal rendering
   - Implement virtual scrolling
   - Cache game state

3. **Database**
   - Add proper indexes
   - Monitor query performance
   - Use connection limits

## Monitoring

1. **Backend Health**
   - Monitor `/health` endpoint
   - Set up uptime monitoring
   - Track error rates

2. **Database Performance**
   - Monitor query times
   - Track connection usage
   - Set up alerts

3. **AI Usage**
   - Monitor API calls
   - Track token usage
   - Set up rate limiting

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review error logs
3. Check environment configuration
4. Verify all services are running

## Next Steps

After setup:

1. Test all game features
2. Create sample characters
3. Test AI DM responses
4. Verify save/load functionality
5. Test combat system
6. Deploy to production
