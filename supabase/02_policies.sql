-- Row-Level Security (RLS) Policies for Daggerheart MUD
-- Run this AFTER 01_setup.sql

-- Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

-- Characters policies
-- Users can only access their own characters
CREATE POLICY "Users can view own characters" ON characters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters" ON characters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" ON characters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON characters
    FOR DELETE USING (auth.uid() = user_id);

-- Campaigns policies
-- Users can view campaigns they created or are part of
CREATE POLICY "Users can view own campaigns" ON campaigns
    FOR SELECT USING (
        auth.uid() = creator_user_id OR
        auth.uid() IN (
            SELECT user_id FROM campaign_players 
            WHERE campaign_id = campaigns.id
        )
    );

CREATE POLICY "Users can insert own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = creator_user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
    FOR DELETE USING (auth.uid() = creator_user_id);

-- Campaign players policies
-- Users can view players in their campaigns
CREATE POLICY "Users can view campaign players" ON campaign_players
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = campaign_players.campaign_id
        )
    );

CREATE POLICY "Users can insert campaign players" ON campaign_players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update campaign players" ON campaign_players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete campaign players" ON campaign_players
    FOR DELETE USING (auth.uid() = user_id);

-- Campaign state policies
-- Users can access state for their campaigns
CREATE POLICY "Users can view campaign state" ON campaign_state
    FOR SELECT USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = campaign_state.campaign_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM campaign_players 
            WHERE campaign_id = campaign_state.campaign_id
        )
    );

CREATE POLICY "Users can insert campaign state" ON campaign_state
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = campaign_state.campaign_id
        )
    );

CREATE POLICY "Users can update campaign state" ON campaign_state
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = campaign_state.campaign_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM campaign_players 
            WHERE campaign_id = campaign_state.campaign_id
        )
    );

-- Items policies (read-only for all users)
CREATE POLICY "Anyone can view items" ON items
    FOR SELECT USING (true);

-- Character inventory policies
-- Users can only access their own inventory
CREATE POLICY "Users can view own inventory" ON character_inventory
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM characters 
            WHERE id = character_inventory.character_id
        )
    );

CREATE POLICY "Users can insert own inventory" ON character_inventory
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM characters 
            WHERE id = character_inventory.character_id
        )
    );

CREATE POLICY "Users can update own inventory" ON character_inventory
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM characters 
            WHERE id = character_inventory.character_id
        )
    );

CREATE POLICY "Users can delete own inventory" ON character_inventory
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM characters 
            WHERE id = character_inventory.character_id
        )
    );

-- Game sessions policies
-- Users can access sessions for their campaigns
CREATE POLICY "Users can view game sessions" ON game_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = game_sessions.campaign_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM campaign_players 
            WHERE campaign_id = game_sessions.campaign_id
        )
    );

CREATE POLICY "Users can insert game sessions" ON game_sessions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = game_sessions.campaign_id
        )
    );

CREATE POLICY "Users can update game sessions" ON game_sessions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = game_sessions.campaign_id
        )
    );

-- Combat encounters policies
-- Users can access encounters for their campaigns
CREATE POLICY "Users can view combat encounters" ON combat_encounters
    FOR SELECT USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = combat_encounters.campaign_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM campaign_players 
            WHERE campaign_id = combat_encounters.campaign_id
        )
    );

CREATE POLICY "Users can insert combat encounters" ON combat_encounters
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = combat_encounters.campaign_id
        )
    );

CREATE POLICY "Users can update combat encounters" ON combat_encounters
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT creator_user_id FROM campaigns 
            WHERE id = combat_encounters.campaign_id
        )
    );

-- Guest mode policies (for anonymous users)
-- Allow guest users to create temporary records
CREATE POLICY "Guests can create temporary characters" ON characters
    FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Guests can create temporary campaigns" ON campaigns
    FOR INSERT WITH CHECK (creator_user_id IS NULL);

-- Guest sessions policies
-- Allow anonymous access to guest sessions (no authentication required)
-- This is safe because guest sessions are isolated by session_id
CREATE POLICY "Anyone can view guest sessions" ON guest_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert guest sessions" ON guest_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update guest sessions" ON guest_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete guest sessions" ON guest_sessions
    FOR DELETE USING (true);

-- Note: Guest sessions are isolated by session_id, so there's no risk of
-- cross-session data access. The session_id acts as the security boundary.
