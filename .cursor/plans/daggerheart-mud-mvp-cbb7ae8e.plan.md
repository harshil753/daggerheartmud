<!-- cbb7ae8e-0766-42ca-9457-42cc5cb56314 b99b056b-caa2-49ca-b650-8cf8f3b65ed0 -->
# Daggerheart MUD - Fast MVP Implementation Plan

## Overview

Build a playable single-player MUD game with Gemini AI Dungeon Master, guest-mode authentication, and persistent state management. Development follows horizontal approach: infrastructure first, then feature integration.

---

## Phase 1: Infrastructure Setup (Foundation)

### 1.1 Supabase Database Setup

**Create Database Schema**

- Set up Supabase project (if not already done)
- Create all tables with proper relationships
- Configure Row-Level Security (RLS) policies for guest users
- Add indexes for performance

**Tables to Create:**

```sql
-- characters (core player data)
-- campaigns (campaign instances)
-- campaign_players (player-campaign relationships)
-- campaign_state (AI context & persistence)
-- items (equipment database)
-- character_inventory (player items)
-- game_sessions (session tracking)
-- combat_encounters (active combats)
```

**Seed Data:**

- Import equipment data from `supporting_functions/Results/equipment_data.json`
- Create sample items for testing

**Files to Create:**

- `supabase/schema.sql` - Complete database schema
- `supabase/seed.sql` - Initial data seeding
- `supabase/policies.sql` - RLS policies

---

### 1.2 Backend Server (Render)

**Create Node.js WebSocket Server**

- Initialize Node.js project in `backend/` directory
- Install dependencies: `express`, `socket.io`, `@supabase/supabase-js`, `@google/generative-ai`
- Set up WebSocket server with Socket.io
- Configure environment variables for API keys

**Core Backend Structure:**

```
backend/
├── server.js (main entry point)
├── config/
│   ├── supabase.js (database connection)
│   └── gemini.js (AI client setup)
├── services/
│   ├── gameStateManager.js (state management)
│   ├── commandParser.js (parse player commands)
│   ├── dungeonMaster.js (AI integration)
│   └── combatManager.js (combat logic)
├── routes/
│   └── websocket.js (WebSocket handlers)
└── utils/
    ├── geminiContext.js (load SRD & equipment data)
    └── keepAlive.js (prevent Render spin-down)
```

**Key Implementations:**

- WebSocket connection handling
- Command parser (look, move, attack, inventory, stats, help, etc.)
- Gemini AI client with context loading
- Session management for guest users
- Keep-alive ping system

**Files to Create:**

- `backend/package.json`
- `backend/server.js`
- `backend/.env.example`
- All service and utility files

---

### 1.3 Frontend Terminal Interface

**Install Dependencies**

- Add `xterm`, `xterm-addon-fit`, `socket.io-client`
- Add TypeScript types for terminal

**Create Terminal Component**

- Build React component with xterm.js
- Style for ASCII aesthetic
- Handle keyboard input
- Format output with ANSI colors
- Add auto-scrolling

**Create Game UI Layout**

```
app/
├── components/
│   ├── Terminal.tsx (xterm.js terminal)
│   ├── GameControls.tsx (dice roller, stats panel)
│   ├── InventoryPanel.tsx (equipment display)
│   ├── StatsPanel.tsx (character stats)
│   └── GuestSession.tsx (guest mode handler)
├── hooks/
│   ├── useWebSocket.ts (WebSocket connection)
│   ├── useGameState.ts (client-side state)
│   └── useTerminal.ts (terminal management)
└── utils/
    ├── terminalFormatter.ts (ANSI formatting)
    └── commandHistory.ts (command history)
```

**Replace Boilerplate:**

- Update `app/page.tsx` with guest mode entry
- Create main game interface layout
- Add CSS for terminal styling

**Files to Update/Create:**

- `app/page.tsx` (main entry point)
- `app/globals.css` (terminal styling)
- All component files listed above

---

## Phase 2: AI Integration & Core Game Loop

### 2.1 Gemini AI Dungeon Master Integration

**Load AI Context (First Load Only)**

- Read SRD text file from `supporting_functions/Results/DH_SRD_Part_01_Pages_1-135.txt`
- Load equipment database JSON
- Create initial Gemini prompt with full context
- Store conversation history in session

**Implement DM Service:**

```typescript
// backend/services/dungeonMaster.js
- initializeAI() - Load SRD & equipment on first call
- sendCommand(playerId, command) - Process player input
- generateResponse(context) - Get AI response
- maintainContext(sessionId) - Manage conversation history
- handleSavePoint(campaignId) - Create chapter saves
```

**AI Response Parsing:**

- Parse structured AI responses (location, exits, items, NPCs)
- Extract combat triggers
- Detect chapter completion
- Format for terminal display

**Files to Create:**

- `backend/services/dungeonMaster.js`
- `backend/utils/geminiContext.js`
- `backend/utils/responseParser.js`

---

### 2.2 Character Creation System

**Implement Character Creation Flow**

- Guided character creation via AI DM
- Store character data in Supabase
- Validate Daggerheart rules (traits, classes, ancestries)
- Generate starting equipment

**Backend Implementation:**

```javascript
// backend/services/characterService.js
- createCharacter(userId, characterData)
- saveCharacter(characterId, updates)
- loadCharacter(userId)
- validateCharacterRules(character)
```

**Frontend Flow:**

- Step-by-step character creation in terminal
- AI guides through ancestry, class, community selection
- Display character sheet after creation
- Save to database

**Files to Create:**

- `backend/services/characterService.js`
- Character validation utilities

---

### 2.3 Campaign Generation & Management

**Campaign System:**

- Player selects story length (short/medium/long)
- AI generates campaign structure with chapters
- Store campaign metadata in database
- Track chapter progression

**Backend Implementation:**

```javascript
// backend/services/campaignService.js
- generateCampaign(storyLength)
- saveChapterProgress(campaignId, chapterNum)
- loadCampaignState(campaignId)
- createSavePoint(campaignId, chapterData)
```

**AI Integration:**

- Send story length to AI
- Receive campaign structure
- Store in `campaign_state.world_state` JSONB
- Track current chapter

**Files to Create:**

- `backend/services/campaignService.js`
- Campaign generation prompts

---

### 2.4 Core Game Commands

**Implement Command System:**

- `look` - Examine current location
- `move [direction]` - Travel between areas
- `inventory` - View items
- `stats` - Character sheet
- `equip [item]` - Equip weapon/armor
- `unequip [slot]` - Remove equipment
- `use [item]` - Use consumables
- `attack [target]` - Combat action
- `cast [spell]` - Magic abilities
- `talk to [npc]` - NPC interaction
- `rest` - Recover HP/stress
- `help` - Command list
- `save` - Manual save (creates chapter save point)

**Backend Command Handler:**

```javascript
// backend/services/commandParser.js
- parseCommand(input) - Extract command & args
- validateCommand(command, gameState) - Check if allowed
- executeCommand(command, args, context) - Run command
- formatResponse(result) - Prepare for terminal
```

**Files to Create:**

- `backend/services/commandParser.js`
- Command handlers for each command type

---

## Phase 3: Game Mechanics

### 3.1 Combat System

**Turn-Based Combat:**

- Initiative tracking (Hope/Fear dice)
- Turn order management
- Combat actions (attack, cast, move)
- Damage calculation
- Status effects tracking
- Victory/defeat conditions

**Backend Implementation:**

```javascript
// backend/services/combatManager.js
- startCombat(participants)
- rollInitiative()
- processTurn(characterId, action)
- calculateDamage(attacker, defender, weapon)
- applyStatusEffects()
- checkCombatEnd()
```

**Database Integration:**

- Store active combat in `combat_encounters`
- Track participant HP, stress, positions
- Save turn state

**Files to Create:**

- `backend/services/combatManager.js`
- Daggerheart dice rolling utilities

---

### 3.2 Inventory & Equipment System

**Inventory Management:**

- Add/remove items
- Equip weapons and armor
- Use consumables
- Item effects on character stats
- Weight/capacity limits (if applicable)

**Backend Implementation:**

```javascript
// backend/services/inventoryService.js
- addItem(characterId, itemId, quantity)
- removeItem(characterId, itemId, quantity)
- equipItem(characterId, itemId, slot)
- unequipItem(characterId, slot)
- getInventory(characterId)
- calculateStats(character) // With equipped items
```

**Frontend Display:**

- Inventory panel component
- Equipment slots visualization
- Item tooltips with properties
- Drag-and-drop equipping (optional)

**Files to Create:**

- `backend/services/inventoryService.js`
- `app/components/InventoryPanel.tsx`

---

### 3.3 Persistence & Save System

**Chapter-Based Saves:**

- Auto-save on chapter completion
- Manual save command
- Load game on session start
- Resume from last save point

**Backend Implementation:**

```javascript
// backend/services/saveService.js
- createSavePoint(campaignId, saveData)
- loadSavePoint(campaignId)
- getLatestSave(campaignId)
- restoreGameState(saveData)
```

**Save Data Includes:**

- Character stats & inventory
- Campaign progress & chapter number
- Current location description
- AI conversation history (last 50 messages)
- World state (NPC relationships, completed quests)

**Database Storage:**

- Store in `campaign_state` table
- Use JSONB for flexible data structure
- Update timestamp on each save

**Files to Create:**

- `backend/services/saveService.js`
- Save/load utilities

---

## Phase 4: Polish & Testing

### 4.1 Guest Mode Implementation

**Session Management:**

- Generate unique guest session ID
- Store session data in browser sessionStorage
- Link to temporary Supabase records
- Clear on logout

**Backend Guest Handling:**

- Create temporary user records
- Associate campaigns with guest sessions
- Auto-cleanup old guest data (optional cron job)

**Files to Create:**

- `app/components/GuestSession.tsx`
- `backend/services/guestService.js`

---

### 4.2 UI/UX Enhancements

**Terminal Styling:**

- Retro ASCII aesthetic
- ANSI color support
- Proper line wrapping
- Command history (up/down arrows)
- Auto-complete suggestions

**Game Controls:**

- Dice roller button (rolls 2d12)
- Quick stats panel
- Inventory quick view
- Help modal with commands

**Responsive Design:**

- Mobile-friendly terminal
- Adjustable terminal size
- Touch-friendly controls

**Files to Update:**

- `app/globals.css`
- `app/components/GameControls.tsx`
- Terminal component styling

---

### 4.3 Deployment & Configuration

**Render Deployment:**

- Create `render.yaml` for deployment config
- Set up environment variables
- Configure keep-alive ping (cron-job.org)
- Test WebSocket connections

**Vercel Deployment:**

- Already deployed, update with new code
- Configure environment variables
- Test production build

**Environment Variables:**

```
# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
PORT=3001
NODE_ENV=production

# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Files to Create:**

- `backend/render.yaml`
- `backend/.env.example`
- `.env.local.example`

---

### 4.4 Testing & Documentation

**Testing Checklist:**

- [ ] Character creation flow
- [ ] Campaign generation (all story lengths)
- [ ] AI DM responses are contextual
- [ ] All commands work correctly
- [ ] Combat system functions properly
- [ ] Inventory management works
- [ ] Save/load persistence works
- [ ] WebSocket reconnection handles disconnects
- [ ] Guest session data persists during session
- [ ] Terminal formatting displays correctly

**Documentation:**

- Update README with setup instructions
- Document environment variables
- Create player command guide
- Add developer setup guide

**Files to Update:**

- `README.md`
- Create `docs/SETUP.md`
- Create `docs/COMMANDS.md`

---

## Key Files Summary

### New Directories

- `backend/` - Complete Node.js WebSocket server
- `supabase/` - Database schema and seed data

### Frontend Updates

- `app/page.tsx` - Guest mode entry
- `app/components/` - All game UI components
- `app/hooks/` - Custom React hooks
- `app/utils/` - Helper functions

### Backend Structure

- Server entry point
- Service layer (DM, combat, inventory, etc.)
- Database integration
- WebSocket handlers

### Configuration

- Environment variables for all services
- Deployment configs (Render, Vercel)
- Database schema and RLS policies

---

## Success Criteria

**MVP is Complete When:**

1. Player can create character via AI DM
2. AI DM generates and runs campaign
3. Player can execute all core commands
4. Combat system works with turn-based mechanics
5. Inventory and equipment system functional
6. Game state persists between sessions
7. Guest mode allows play without account
8. Terminal interface displays properly
9. WebSocket connection stable with reconnection
10. Deployed and accessible online

---

## Development Priority Order

1. Database schema + seed data
2. Backend WebSocket server skeleton
3. Frontend terminal component
4. AI DM integration with context loading
5. Command parser and basic commands
6. Character creation flow
7. Campaign generation
8. Combat system
9. Inventory system
10. Save/load persistence
11. Polish and testing
12. Deployment

### To-dos

- [ ] Set up Supabase database with complete schema, RLS policies, and seed equipment data
- [ ] Create Node.js WebSocket server with Socket.io, Express, and keep-alive system
- [ ] Build xterm.js terminal component with WebSocket connection and command input
- [ ] Integrate Gemini AI with SRD context loading and conversation management
- [ ] Implement command parser and handlers for all core game commands
- [ ] Build character creation flow and database integration
- [ ] Implement campaign generation and chapter progression tracking
- [ ] Create turn-based combat system with Daggerheart dice mechanics
- [ ] Build inventory management and equipment system with stat calculations
- [ ] Implement chapter-based saves and game state persistence
- [ ] Set up guest session management and temporary user handling
- [ ] Add game controls, styling, and UX enhancements to terminal interface
- [ ] Deploy backend to Render and frontend to Vercel with proper configuration
- [ ] Complete end-to-end testing of all game systems and features