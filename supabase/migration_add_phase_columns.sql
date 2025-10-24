-- Migration: Add phase management columns to campaign_state table
-- Run this after the main setup to add the missing columns

-- Add phase management columns to campaign_state table
ALTER TABLE campaign_state 
ADD COLUMN IF NOT EXISTS session_phase TEXT DEFAULT 'phase1_setup',
ADD COLUMN IF NOT EXISTS phase1_session_id TEXT,
ADD COLUMN IF NOT EXISTS phase2_session_id TEXT,
ADD COLUMN IF NOT EXISTS cached_content_name TEXT;

-- Update existing records to have default phase
UPDATE campaign_state 
SET session_phase = 'phase1_setup' 
WHERE session_phase IS NULL;
