-- Daggerheart MUD Database Setup
-- Run this script first to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Items table (equipment database) - CREATE FIRST to avoid circular references
DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Item Details
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'armor', 'primary_weapon', 'secondary_weapon', 'consumable', 'item'
  description TEXT,
  
  -- Properties (stored as JSONB for flexibility)
  properties JSONB, -- Contains stats like damage, range, tier, etc.
  
  -- Source
  source TEXT DEFAULT 'game', -- 'game', 'scraped', 'custom'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Characters table (core player data)
DROP TABLE IF EXISTS characters CASCADE;
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  -- Core Stats
  ancestry TEXT NOT NULL, -- Elf, Dwarf, Human, etc.
  class TEXT NOT NULL, -- Warrior, Wizard, Rogue, etc.
  community TEXT NOT NULL, -- Highborne, Loreborne, etc.
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  
  -- Traits (modifiers)
  agility INTEGER DEFAULT 0,
  strength INTEGER DEFAULT 0,
  finesse INTEGER DEFAULT 0,
  instinct INTEGER DEFAULT 0,
  presence INTEGER DEFAULT 0,
  knowledge INTEGER DEFAULT 0,
  
  -- Resources
  hit_points_current INTEGER NOT NULL,
  hit_points_max INTEGER NOT NULL,
  stress_current INTEGER DEFAULT 0,
  stress_max INTEGER DEFAULT 6,
  hope_tokens INTEGER DEFAULT 0,
  fear_tokens INTEGER DEFAULT 0,
  
  -- Equipment Slots
  primary_weapon_id UUID REFERENCES items(id),
  secondary_weapon_id UUID REFERENCES items(id),
  armor_id UUID REFERENCES items(id),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
DROP TABLE IF EXISTS campaigns CASCADE;
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_user_id UUID REFERENCES auth.users(id),
  
  -- Campaign Details
  title TEXT NOT NULL,
  description TEXT,
  story_length TEXT NOT NULL, -- 'short', 'medium', 'long'
  total_chapters INTEGER NOT NULL,
  current_chapter INTEGER DEFAULT 1,
  
  -- Campaign State
  campaign_data JSONB, -- Stores DM-generated campaign structure
  world_state JSONB, -- Stores persistent world changes
  
  -- Session Management
  is_active BOOLEAN DEFAULT true,
  max_players INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign players (for future multiplayer)
DROP TABLE IF EXISTS campaign_players CASCADE;
CREATE TABLE campaign_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Player State in Campaign
  current_location TEXT, -- Room/area identifier
  chapter_progress INTEGER DEFAULT 1,
  completed_chapters JSONB, -- Array of completed chapter save points
  
  -- Session Info
  is_online BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(campaign_id, character_id)
);

-- Campaign state (AI context & persistence)
DROP TABLE IF EXISTS campaign_state CASCADE;
CREATE TABLE campaign_state (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Current State (for save/resume)
  current_chapter INTEGER DEFAULT 1,
  current_location_description TEXT, -- Last known location for resume
  
  -- AI Session Context
  ai_conversation_history JSONB, -- Last N messages for context continuity
  world_state JSONB, -- NPC relationships, completed quests, world changes
  
  -- Phase Management
  session_phase TEXT DEFAULT 'phase1_setup', -- 'phase1_setup' or 'phase2_adventure'
  phase1_session_id TEXT, -- Original session ID
  phase2_session_id TEXT, -- Phase 2 session ID
  cached_content_name TEXT, -- Name of cached content for Phase 2
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Character inventory
DROP TABLE IF EXISTS character_inventory CASCADE;
CREATE TABLE character_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  
  -- Inventory Details
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  
  -- Acquisition Info
  acquired_at TIMESTAMP DEFAULT NOW(),
  acquired_location TEXT, -- Where/how item was obtained
  
  UNIQUE(character_id, item_id)
);

-- Game sessions
DROP TABLE IF EXISTS game_sessions CASCADE;
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Session Details
  session_number INTEGER,
  chapter_number INTEGER,
  
  -- AI Context (for session continuity)
  ai_context JSONB, -- Stores conversation history, NPC states, etc.
  
  -- Session State
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Combat encounters
DROP TABLE IF EXISTS combat_encounters CASCADE;
CREATE TABLE combat_encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id),
  
  -- Combat Details
  encounter_name TEXT,
  initiative_order JSONB, -- Array of character/enemy IDs in turn order
  current_turn_index INTEGER DEFAULT 0,
  
  -- Participants
  participants JSONB, -- Array of combatants with HP, status effects, etc.
  
  -- State
  is_active BOOLEAN DEFAULT true,
  round_number INTEGER DEFAULT 1,
  
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Guest sessions (temporary sessions for non-registered users)
DROP TABLE IF EXISTS guest_sessions CASCADE;
CREATE TABLE guest_sessions (
  session_id TEXT PRIMARY KEY,
  
  -- Guest Character Data (stored as JSONB for flexibility)
  character_data JSONB, -- Complete character object
  inventory_data JSONB, -- Array of inventory items
  game_state JSONB, -- Current location, combat state, etc.
  
  -- Session Management
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  last_activity TIMESTAMP DEFAULT NOW(),
  
  -- AI Context
  ai_context JSONB, -- Conversation history, world state, etc.
  
  -- Session Status
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_active ON characters(is_active);
CREATE INDEX idx_campaigns_creator ON campaigns(creator_user_id);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_campaign_players_campaign ON campaign_players(campaign_id);
CREATE INDEX idx_campaign_players_character ON campaign_players(character_id);
CREATE INDEX idx_character_inventory_character ON character_inventory(character_id);
CREATE INDEX idx_character_inventory_equipped ON character_inventory(is_equipped);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_game_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX idx_combat_encounters_campaign ON combat_encounters(campaign_id);
CREATE INDEX idx_combat_encounters_active ON combat_encounters(is_active);
CREATE INDEX idx_guest_sessions_active ON guest_sessions(is_active);
CREATE INDEX idx_guest_sessions_expires ON guest_sessions(expires_at);
CREATE INDEX idx_guest_sessions_activity ON guest_sessions(last_activity);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_state_updated_at BEFORE UPDATE ON campaign_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Guest session cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM guest_sessions 
    WHERE expires_at < NOW() OR last_activity < (NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update guest session activity
CREATE OR REPLACE FUNCTION update_guest_session_activity(session_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE guest_sessions 
    SET last_activity = NOW() 
    WHERE session_id = session_id_param;
END;
$$ LANGUAGE plpgsql;

-- Save points table
CREATE TABLE IF NOT EXISTS save_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    save_point_data JSONB NOT NULL,
    cached_content_name TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for save points
CREATE INDEX IF NOT EXISTS idx_save_points_campaign_id ON save_points(campaign_id);
CREATE INDEX IF NOT EXISTS idx_save_points_character_id ON save_points(character_id);
CREATE INDEX IF NOT EXISTS idx_save_points_created_at ON save_points(created_at);

-- Combat logs table
CREATE TABLE IF NOT EXISTS combat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    stat_changes JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for combat logs
CREATE INDEX IF NOT EXISTS idx_combat_logs_character_id ON combat_logs(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_logs_timestamp ON combat_logs(timestamp);
