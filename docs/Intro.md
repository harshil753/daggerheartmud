# Introduction

## Idea

This will be a multi user dungeon game hosted on an ascii terminal. 1-4 players can play concurrently through a persistent world campaign with the rules based on the Table Top Roleplaying Game (TTRPG) Daggerheart. The MVP will include a multi-room world with basic features to showcase full MUD capabilities. The prompt should take the place of the dungeon master and guide players through the game. The screen should issue helpful text occasionally to guide players and help them explore the game identifying things like using which command to look, check their stats, level up, etc.

## Rules

<https://www.daggerheart.com/wp-content/uploads/2025/05/DH-SRD-May202025.pdf>
The Dagger Heart Rulebook will serve as a guide on how to run the game, player stats, combat and more.

## Technology stack

### Vercel

We will be using vercel to deploy the front end next.js

### Supabase

We will use supabase for storing user data, AI-generated images, and player authentication with JWT tokens. We'll implement Row-Level Security (RLS) with JWT validation for database-level security.

### Render

We will use render for hosting our game backend, WebSocket server for real-time communication, and all game logic processing. We'll use a hybrid state authority approach with optimistic updates for UI responsiveness and server-side validation for critical game state. We'll implement a keep-alive ping service to prevent cold starts during active gameplay. Testing will use a hybrid approach with automated testing for core systems and manual testing with real players for user experience validation. We'll implement an automated CI/CD pipeline to coordinate deployments across Vercel, Render, and Supabase. We'll use built-in platform monitoring (Vercel Analytics, Supabase Dashboard, Render Logs) for zero-cost resource monitoring. We'll implement graceful degradation for critical systems (AI DM, real-time communication) while maintaining fail-fast for non-critical features. We'll use event-driven synchronization with WebSocket events for real-time updates and periodic polling as a fallback. We'll use a hybrid performance optimization approach with client-side caching for static data and server-side optimization for dynamic data. We'll use feature branch development for isolated development and better collaboration. We'll use a hybrid documentation approach with inline documentation for code-specific details and separate documentation files for architecture and user guides. We'll use a monolithic architecture for the MVP to simplify development and deployment.

### Gemini AI 

We will be using googles gemini-2.5-flash llm model for interactions with players. The gemini LLM model will serve the role of the Dungeon Master for the game and guide players through the world, create encounters, and fulfill the role of storyteller. We will be using gemini-2.5-flash-image model to generate images to present to players when introducing items, characters, or landscapes. All AI interactions will be processed through the Render backend server for secure API key management and centralized game state integration. The AI DM will maintain session memory to provide continuous storytelling and character development. 


### Potential Pitfalls

Building an ASCII terminal-based MUD game with this stack is feasible on free tiers given the low concurrency (1-4 players), but there are several limitations and challenges inherent to the platforms' free plans. These could impact performance, reliability, and development experience:

- **Render Spin-Down and Wake-Up Delays**: Free web services on Render automatically spin down after 15 minutes of inactivity, and waking them up can take up to a minute. For a MUD game, this means the first player joining after downtime might experience significant lag, disrupting the real-time feel. If your backend handles game logic or WebSockets, this could lead to poor UX, especially if games are sporadic.
- **Resource Limits on Render**: You're capped at 750 instance hours per month (only while spun up), plus limits on outbound bandwidth and build minutes. With 1-4 players, this should be fine for light usage, but if your backend makes frequent external API calls (e.g., for procedural generation) or generates high outbound traffic, Render may suspend the service. Free tiers also lack private networking for receiving traffic, so you can't securely connect it to Supabase without exposing endpoints publicly.
- **Supabase Inactivity Pauses**: Projects pause after 1 week of no activity, requiring manual reactivation. This isn't ideal for a learning project that might sit idle during development. Database size is limited to 500 MB, bandwidth to 5 GB, and real-time messages to 2 million per month with 200 concurrent connections—plenty for 1-4 players, but exceeding these (e.g., via chatty updates) could hit caps quickly.
- **Vercel Function and Bandwidth Limits**: Next.js API routes (serverless functions) on the Hobby tier are restricted to 4 CPU hours, 360 GB-hours of memory, and 1 million invocations per month. If you're using them for game-related endpoints, heavy testing or unexpected spikes could exhaust these. Bandwidth is capped at 100 GB/month, which should suffice for text-based data but could be an issue if including images or frequent state syncs. Vercel doesn't natively support WebSockets, so real-time relies entirely on Supabase or Render.
- **Real-Time Synchronization Challenges**: MUD games require shared state (e.g., player positions, world updates). Supabase Realtime is great for this via channels, but naive implementations can lead to n+1 query issues or performance hits if not optimized. With low players, latency from global distribution might not be noticeable, but inconsistent state (e.g., due to network hiccups) could cause desyncs.
- **Deployment and Integration Issues**: Deploying Next.js with Supabase on Vercel can hit snags like dependency conflicts or build failures, especially if mixing Python (e.g., for backend scripts on Render). Environment variables and auth setup between services might require careful management to avoid security leaks.
- **Security and Cheating Risks**: Storing user info in Supabase is fine, but without proper Row Level Security (RLS), players could tamper with game state via client-side tools. Running game logic client-side (in Next.js) invites cheating; server-side on Render helps, but free tier restarts/maintenance could interrupt sessions.
- **Scalability and Cost Creep**: While zero-cost now, exceeding any limit (e.g., messages on Supabase) suspends services until reset. For a learning project, this is low-risk, but monitor usage closely. Also, free tiers aren't for production, so expect occasional downtime from maintenance.

### Recommended Strategies

To mitigate these, focus on efficient architecture, optimization, and monitoring. Leverage Supabase heavily for real-time to reduce Render dependency, as it's well-suited for small multiplayer games like this.

- **Leverage Supabase for Real-Time and State Management**: Use Supabase Realtime channels (Broadcast for events, Presence for player status, Postgres Changes for DB sync) to handle multiplayer updates without a full backend. Store game world/state in the DB and subscribe clients to changes—this avoids Render spin-down for core gameplay. For 1-4 players, create per-session channels to broadcast commands/actions. This keeps things serverless and low-latency.
- **Optimize Render Usage**: Reserve Render for non-real-time tasks like procedural world generation or cron jobs (e.g., daily resets). Implement WebSockets (e.g., via Socket.io) if needed for persistent connections, but add loading screens or retry logic in the frontend to handle spin-down delays. To prevent frequent spin-downs, consider a simple keep-alive script (e.g., periodic pings from a free cron service), but note this consumes instance hours. Render is stronger for backends than Vercel, so it's a good choice if you need stateful services.
- **Frontend Rendering for ASCII Terminal**: In Next.js, use a library like xterm.js to emulate a terminal in the browser for input/output. Render game output in a monospace font with <pre> tags. Handle input via forms or key listeners, sending commands to Supabase/Render. Use Client Components for real-time updates, and Server Components for initial loads to minimize function usage on Vercel.
- **Security Best Practices**: Enable Supabase RLS for reads to prevent unauthorized access—optimize with JWT claims and batched checks to avoid performance hits. Route mutations through server actions or API routes with validation (use Zod for schemas). Run critical game logic (e.g., validation, RNG) on Render or Supabase Edge Functions to prevent client-side cheating. Use Supabase Auth for user sessions.
- **Handle Inactivity and Limits**: Set up monitoring (e.g., via Supabase dashboard or free tools like UptimeRobot) to alert on approaching caps. For Supabase pauses, log in weekly or automate activity (e.g., a cron job). Batch updates to minimize real-time messages—e.g., send delta changes instead of full state.
- **Development and Testing Workflow**: Use local Supabase (via Docker) for testing to mimic production without mocks. Implement e2e tests (e.g., with Playwright) on a built Next.js app in CI to catch deployment issues early. For data, use client-side pagination/filtering on small datasets to reduce DB calls.
- **Fallbacks and Reconnections**: Add client-side logic for reconnecting to Supabase channels on disconnects (built-in in their JS client). Include game lobbies or queues to manage player joins gracefully during any delays.
- **Monitoring and Iteration**: Start with a minimal prototype (e.g., single-room MUD) to test limits. If real-time proves tricky, consider alternatives like Pusher (free tier available) for messaging, but stick to your stack for zero cost.

This setup should work well for a learning project—many similar real-time games (e.g., guessing or math challenges) have been built successfully with Next.js and Supabase alone, so leaning on that could simplify things.