<!-- d287dac7-688a-4b1b-88f9-6fb485c683a9 417b19b0-821e-4955-966f-ca3a65865480 -->
# Daggerheart MUD Enhancement Plan - Master Overview

This master plan outlines four independent phases for enhancing the Daggerheart MUD game. Each phase will be executed as a separate plan document with its own implementation and testing.

## Phase Overview (Ordered by Difficulty)

### Phase 1: ASCII Map Display System (EASIEST)

**Complexity**: Low | **Estimated Time**: 2-3 hours

Add ASCII map generation and display capabilities to show the game world visually in the terminal.

**Key Deliverables**:

- AI prompt enhancement to generate simple ASCII maps (using +, -, |, # characters)
- New map panel in the right sidebar below dice roller
- WebSocket event handling for map updates
- CSS styling for monospace map display

**Files to Modify**:

- `supporting_functions/prompt_sdks/dungeon_master.txt` - Add ASCII map generation instructions
- `backend/services/dungeonMaster.js` - Add map parsing and extraction logic
- `app/components/GameSession.tsx` - Add map panel state
- `app/components/GameControls.tsx` - Add map display section
- `app/globals.css` - Add map styling
- `backend/routes/websocket.js` - Add map event emission

**Technical Approach**:

- AI generates maps in format: `[ASCII_MAP]...[/ASCII_MAP]`
- Backend extracts map from AI response
- Frontend displays in fixed-width container
- Maps update on location changes

---

### Phase 2: AI Response Parser & Database Sync (MODERATE)

**Complexity**: Moderate | **Estimated Time**: 4-6 hours

Build intelligent parser to extract character sheet changes, inventory updates, and level progression from AI responses and sync to Supabase database.

**Key Deliverables**:

- AI response parser to extract structured data from narrative text
- Database sync service for character stats, inventory, level
- Trigger-based updates (real-time + periodic saves)
- Delta tracking (only send changes to AI, not full sheet)

**Files to Create**:

- `backend/services/aiResponseParser.js` - Parse AI responses for data changes
- `backend/services/databaseSync.js` - Sync parsed data to Supabase

**Files to Modify**:

- `backend/services/dungeonMaster.js` - Integrate parser, track deltas
- `backend/services/gameStateManager.js` - Add sync methods
- `backend/routes/websocket.js` - Add sync triggers
- `supporting_functions/prompt_sdks/dungeon_master.txt` - Add structured output tags

**Technical Approach**:

- AI outputs structured tags: `[STAT_CHANGE:HP:25]`, `[ITEM_ADD:Health Potion]`, `[LEVEL_UP:2]`
- Parser extracts tags and updates in-memory gameState
- Database sync service persists to Supabase tables
- Delta system tracks what changed since last AI call

---

### Phase 3: AI Image Generation Integration (MODERATE-HARD)

**Complexity**: Moderate-Hard | **Estimated Time**: 5-7 hours

Implement AI-generated image display for locations, characters, items, and creatures using Gemini's image generation API.

**Key Deliverables**:

- Image generation service using Gemini Imagen API
- Image display panel in right sidebar below map
- Image caching and storage system
- Trigger detection from AI responses

**Files to Create**:

- `backend/services/imageGenerator.js` - Gemini image generation API integration
- `app/components/ImageDisplay.tsx` - Image viewer component

**Files to Modify**:

- `backend/config/gemini.js` - Add image model configuration
- `backend/services/dungeonMaster.js` - Enhance trigger detection
- `app/components/GameControls.tsx` - Add image panel
- `app/components/GameSession.tsx` - Add image state management
- `backend/routes/websocket.js` - Add image_generated event
- `app/globals.css` - Add image panel styling
- `public/` - Add generated-images directory

**Technical Approach**:

- AI includes trigger: `[IMAGE_GENERATION_TRIGGER] Type: LOCATION Description: ...`
- Backend calls Gemini Imagen API with image_creator.txt prompt
- Images saved to public/generated-images/ with unique IDs
- Frontend displays image with description
- Image URLs sent via WebSocket

---

### Phase 4: Enhanced Context Retention System (HARDEST)

**Complexity**: High | **Estimated Time**: 6-8 hours

Comprehensive AI context management with intelligent character sheet tracking, conversation history pruning, and optimized token usage.

**Key Deliverables**:

- Smart context builder (only send deltas + critical info)
- Character sheet version tracking
- Conversation history compression
- Context window optimization
- State reconciliation system

**Files to Create**:

- `backend/services/contextManager.js` - Intelligent context building
- `backend/services/characterSheetTracker.js` - Track changes to character data
- `backend/services/conversationPruner.js` - Compress history intelligently

**Files to Modify**:

- `backend/services/dungeonMaster.js` - Use contextManager for prompts
- `backend/services/gameStateManager.js` - Add version tracking
- `backend/utils/geminiContext.js` - Modular context loading
- `supabase/01_setup.sql` - Add character_sheet_versions table

**Technical Approach**:

- Track character sheet versions with timestamps
- Only send "what changed" to AI instead of full sheet
- Compress conversation history (summarize old turns)
- Use database as source of truth
- Periodic full reconciliation to prevent drift

---

## Phase Execution Strategy

1. Each phase will be created as a separate plan document
2. Each phase should be completed and tested before moving to next
3. Phases can be executed in order or based on priority
4. Each phase is independently useful and doesn't break existing functionality

## Dependencies

- Phase 1: None (standalone)
- Phase 2: None (standalone, but recommended before Phase 4)
- Phase 3: None (standalone)
- Phase 4: Recommended to complete Phase 2 first for better integration

## Testing Strategy

Each phase will include:

- Unit tests for new services
- Integration tests for database operations
- Manual testing checklist
- Rollback procedure if issues arise

## Next Steps

Please confirm this master plan structure. Once approved, I will create detailed implementation plans for each phase starting with Phase 1 (ASCII Map Display System).

### To-dos

- [ ] Create detailed implementation plan for Phase 1: ASCII Map Display System
- [ ] Create detailed implementation plan for Phase 2: AI Response Parser & Database Sync
- [ ] Create detailed implementation plan for Phase 3: AI Image Generation Integration
- [ ] Create detailed implementation plan for Phase 4: Enhanced Context Retention System