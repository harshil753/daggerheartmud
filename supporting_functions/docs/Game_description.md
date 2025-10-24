# **Daggerheart MUD System Architecture & Goals**

## **Core System Goals**

### **Primary Objectives**
1. **Persistent Fantasy World**: Create a Multi-User Dungeon (MUD) that maintains state across sessions using the Daggerheart tabletop RPG system
2. **AI-Driven Dungeon Master**: Use Gemini LLM to provide dynamic, intelligent game management with consistent rule enforcement
3. **Real-time Multiplayer**: Support 1-4 players through WebSocket connections with synchronized game state
4. **Data Integrity**: Ensure all game actions are properly parsed, validated, and persisted to maintain world consistency
5. **Scalable Architecture**: Support both authenticated users and anonymous guest sessions
6. **Cost-Effective AI Processing**: Minimize LLM costs through intelligent issue detection and backend auto-correction

### **Critical Tasks & Rules**

#### **System Instructions (dungeon_master.txt)**
- **ASCII Map Generation**: MANDATORY for complex locations with multiple objects, NPCs, or interactive elements
- **Structured Data Output**: Required tags for database sync (`[STAT_CHANGE:HP:-5]`, `[ITEM_ADD:Health Potion:1]`, etc.)
- **Turn-Based Combat**: Only ONE unit acts at a time with clear turn management
- **Rule Enforcement**: Apply Daggerheart mechanics consistently (6 traits, Hope/Fear dice, Stress system)
- **Character Creation**: Guide players through ancestry, class, and community selection
- **Campaign Generation**: Create 3-15 chapter campaigns with proper level progression
- **Data Retention**: NEVER ask for the same data twice - use stored rules throughout entire session
- **Context Awareness**: Maintain conversation history, world state, and player relationships

## **Current Architecture**

### **Multi-Layer AI Processing Pipeline**
```
Player Command → WebSocket → CommandParser → DungeonMaster → ResponseOrchestrator → DatabaseSync → WebSocket Response
```

#### **Stage 1: Creative Response Generation**
- **DungeonMaster Service**: Hybrid context loading with base rules + event-specific injection
- **Base Context Loading**: Loads full Daggerheart SRD and equipment database once per server instance
- **Event-Specific Injection**: Injects targeted rule subsets for character creation, combat, and other specific events
- **Prompt Engineering**: Modular prompt SDK system
- **Model Configuration**: Gemini 2.5-flash
- **Image Generation**: Automatic visual representation for items, characters, locations, creatures

#### **Stage 2: Quality Assurance & Correction**
- **IssueScorer**: Multi-tier scoring system (1-5 points) based on complexity and impact
- **ResponseValidator**: Rule-based validation against Daggerheart mechanics and format requirements
- **BackendFixer**: Pattern-based auto-correction for low-score issues
- **LLMFixer**: Specialized rule enforcer LLM for high-score issues requiring AI intervention
- **ResponseOrchestrator**: Intelligent routing between correction methods
- **MetricsService**: Comprehensive tracking of correction rates, costs, and performance

### **Pipeline Flow Between Tools**

#### **Request Processing Flow**
1. **WebSocket Handler** → Receives player commands with session context
2. **CommandParser** → Validates and routes commands to appropriate handlers
3. **DungeonMaster.processCommand()** → Generates AI response with hybrid context loading
4. **ResponseOrchestrator.processAIResponse()** → Multi-stage quality assurance
5. **AIResponseParser.parseResponse()** → Extracts structured data using regex patterns
6. **DatabaseSync.syncChanges()** → Persists changes with transaction safety
7. **WebSocket Response** → Real-time updates to all connected clients

#### **Intelligent Issue Detection & Scoring**
- **Format Violations** (1-2 pts): Missing structured tags, malformed ASCII maps
- **Simple Rule Violations** (3 pts): Invalid classes, ancestries, communities, equipment
- **Complex Rule Violations** (5 pts): Stat calculation errors, equipment mismatches, rule contradictions
- **Severity Thresholds**: 
  - Low (0-5 pts) → Backend auto-fix with pattern replacement
  - High (6+ pts) → LLM correction with specialized rule enforcer prompt
- **Context-Aware Scoring**: Issues scored based on current game state and player level

### **Storage Method**

#### **Dual Database Architecture (Supabase)**
- **Characters Table**: Player stats, traits, inventory, location, experience, level
- **Items Table**: Equipment database with JSONB properties for flexible item stats
- **Game Sessions Table**: Campaign state, AI context, conversation history, world state
- **Guest Sessions Table**: Temporary JSONB storage for anonymous players with auto-cleanup
- **Inventory Table**: Player item ownership with quantities and equipment status
- **Combat Sessions Table**: Active combat encounters with turn order and status

#### **Read/Write Operations**
- **Write Operations**: 
  - `DatabaseSync.syncChanges()` processes parsed AI responses with transaction safety
  - `GameStateManager.syncCharacterChanges()` handles stat updates
  - `CombatManager.updateCombatState()` manages turn-based combat
- **Read Operations**: 
  - `GameStateManager.loadGameState()` retrieves player data with caching
  - `DatabaseSync.loadGuestSession()` handles anonymous player persistence
  - `CombatManager.getCombatState()` provides real-time combat status
- **Guest Mode**: JSONB storage in `guest_sessions` table with automatic cleanup and expiration
- **Real-time Sync**: WebSocket events notify clients of database changes with conflict resolution

### **Implementation Details**

#### **Frontend Architecture (React/Next.js)**
- **Component Hierarchy**: 
  - `GameSession` → Main game container with state management
  - `Terminal` → WebSocket communication and command input
  - `GameControls` → Character stats, inventory, ASCII map display
- **State Management**: React hooks for game state, character data, inventory, combat status
- **WebSocket Integration**: Real-time bidirectional communication with automatic reconnection
- **ASCII Map Display**: Monospace formatting with legend and interactive elements
- **Responsive Design**: Mobile-friendly interface with terminal-style aesthetics

#### **Backend Services Architecture**
- **Hybrid Context Loading**: Base context + event-specific rule injection for optimal performance
- **Service Layer**: Modular services for parsing, validation, fixing, syncing, combat
- **Error Handling**: Comprehensive try-catch with graceful degradation and fallback responses
- **Logging**: Extensive console logging with structured data for debugging and monitoring
- **Performance Optimization**: Caching, connection pooling, and efficient database queries

### **Verification & Prompt Repair Methods**

#### **Multi-Layer Validation System**
1. **IssueScorer**: Pattern matching for common violations with context awareness
2. **ResponseValidator**: Rule-based validation against Daggerheart mechanics with stat ranges
3. **BackendFixer**: Automated corrections for simple issues using pattern replacement
4. **LLMFixer**: AI-powered corrections for complex problems with specialized prompts
5. **MetricsService**: Performance tracking and cost optimization

#### **Sophisticated Prompt Engineering Strategy**
- **Creative Freedom**: Original prompt allows natural AI responses without rigid constraints
- **Structured Output**: Required tags for database integration with flexible formatting
- **Rule Enforcement**: Comprehensive Daggerheart mechanics embedded in system instructions
- **Quality Control**: Two-stage pipeline ensures consistency without stifling creativity
- **Context Retention**: AI maintains conversation history and world state throughout session

#### **Advanced Correction Methods**
- **Backend Auto-Fix**: Pattern replacement for invalid options, missing tags, format violations
- **LLM Correction**: Specialized rule enforcer prompt for complex issues requiring AI reasoning
- **Metrics Tracking**: Monitor correction rates, processing time, costs, and success rates
- **Fallback Handling**: Graceful degradation when corrections fail with user-friendly messages
- **Cost Optimization**: Backend fixes for 80% of issues, LLM only for complex problems

## **Key Technical Innovations**

1. **Hybrid AI Architecture**: Combines creative AI with rule enforcement AI for optimal results
2. **Intelligent Issue Scoring**: Prioritizes fixes based on complexity, impact, and cost
3. **Dual Storage System**: Persistent database + temporary guest sessions with auto-cleanup
4. **Real-time Synchronization**: WebSocket-based state management with conflict resolution
5. **Comprehensive Validation**: Multi-layer verification system with context awareness
6. **Cost-Effective Processing**: Backend fixes for simple issues, LLM only for complex problems
7. **Scalable Architecture**: Support for both authenticated users and anonymous guests
8. **Performance Optimization**: Caching, connection pooling, and efficient database operations
9. **Advanced Combat System**: Turn-based combat with initiative order and action economy
10. **Flexible Model Support**: ModelAdapter allows easy switching between AI providers

### **Advanced Features**

#### **Combat System**
- **Turn-Based Mechanics**: Strict initiative order with single-unit actions
- **Action Economy**: Multiple actions per turn with proper resource management
- **Combat State**: Real-time tracking of HP, conditions, and status effects
- **AI Integration**: Dynamic combat encounters with intelligent NPC behavior

#### **Guest Session Management**
- **Temporary Storage**: JSONB-based guest sessions with automatic expiration
- **Session Cleanup**: Periodic cleanup of expired sessions to maintain performance
- **Data Migration**: Easy conversion from guest to authenticated user sessions
- **Privacy Protection**: Isolated data storage for anonymous players

#### **Performance Monitoring**
- **Metrics Collection**: Comprehensive tracking of AI processing, corrections, and costs
- **Performance Analytics**: Processing time, success rates, and optimization opportunities
- **Cost Management**: Token usage tracking and cost optimization strategies
- **Quality Assurance**: Issue detection rates and correction effectiveness

#### **Context Loading Strategy**
- **Base Context**: Full SRD and equipment data loaded once per server instance
- **Event-Specific Context**: Targeted rule injection for character creation, combat, inventory management
- **Prompt SDK Integration**: Modular prompt components that combine with context dynamically
- **Context Optimization**: Only relevant rules are injected for specific game events
- **Memory Efficiency**: Base context shared across all sessions, event-specific context added as needed

This enhanced architecture creates a robust, scalable, and cost-effective MUD system that maintains the creative freedom of AI-generated content while ensuring consistent rule adherence, data integrity, and optimal performance across all user types and scenarios.