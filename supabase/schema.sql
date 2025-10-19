-- Daggerheart MUD Database Schema
-- Complete schema for single-player MUD with AI Dungeon Master

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table (core player data)
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
CREATE TABLE campaign_state (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Current State (for save/resume)
  current_chapter INTEGER DEFAULT 1,
  current_location_description TEXT, -- Last known location for resume
  
  -- AI Session Context
  ai_conversation_history JSONB, -- Last N messages for context continuity
  world_state JSONB, -- NPC relationships, completed quests, world changes
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Items table (equipment database)
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

-- Character inventory
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
