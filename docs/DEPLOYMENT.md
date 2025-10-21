# Deployment Guide - Daggerheart MUD

## Overview
This guide covers deploying both the frontend and backend components of the Daggerheart MUD to Vercel.

## Backend Deployment (WebSocket Server)

### Option 1: Deploy Backend to Vercel

1. **Create a new Vercel project for the backend:**
   ```bash
   cd backend
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard:**
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `NODE_ENV`: production

3. **Note the deployed URL** (e.g., `https://daggerheartmud-backend.vercel.app`)

### Option 2: Use Render (Recommended for WebSockets)

Since Vercel has limitations with WebSocket connections, consider using Render for the backend:

1. **Deploy to Render:**
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Set environment variables as above

2. **Note the Render URL** (e.g., `https://daggerheartmud-backend.onrender.com`)

## Frontend Deployment

### 1. Set Environment Variables

In your Vercel dashboard, set these environment variables:

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app
# OR if using Render:
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.onrender.com

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Deploy Frontend

```bash
# In the root directory
vercel --prod
```

## Troubleshooting

### WebSocket Connection Issues

If you're getting WebSocket connection errors:

1. **Check the backend URL** in your environment variables
2. **Ensure the backend is running** and accessible
3. **Check CORS settings** in the backend server
4. **Verify WebSocket support** on your hosting platform

### Font Preload Warnings

These are minor optimization warnings and don't affect functionality. To fix:

1. **Update Next.js configuration** in `next.config.ts`
2. **Optimize font loading** in your CSS

### Environment Variable Issues

Make sure all required environment variables are set:

- `NEXT_PUBLIC_BACKEND_URL`: Backend server URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `GEMINI_API_KEY`: Gemini API key (backend only)

## Development vs Production

### Local Development
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
npm run dev
```

### Production
- Backend: Deployed to Vercel or Render
- Frontend: Deployed to Vercel
- Environment variables: Set in hosting platform dashboard

## Monitoring

Check the logs in your hosting platform dashboard for:
- WebSocket connection errors
- API rate limiting
- Database connection issues
- Environment variable problems
