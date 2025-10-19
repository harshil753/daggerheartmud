# Database Setup Guide

## Quick Setup (Recommended)

Run these SQL scripts in Supabase SQL Editor **in this exact order**:

### 1. First: Create Tables
Copy and paste the contents of `supabase/01_setup.sql` into the Supabase SQL Editor and run it.

### 2. Second: Set Up Security
Copy and paste the contents of `supabase/02_policies.sql` into the Supabase SQL Editor and run it.

### 3. Third: Add Equipment Data
Copy and paste the contents of `supabase/03_seed.sql` into the Supabase SQL Editor and run it.

## What Each Script Does

### 01_setup.sql
- Creates all database tables
- Sets up foreign key relationships
- Creates indexes for performance
- Sets up update triggers

### 02_policies.sql
- Enables Row-Level Security (RLS) on all tables
- Creates security policies for user access
- Allows guest users to create temporary records
- Ensures users can only access their own data

### 03_seed.sql
- Inserts equipment data from scraped sources
- Adds basic starting equipment
- Creates performance indexes for items

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the scripts in order: 01 → 02 → 03
- Check that all tables were created successfully

### Error: "permission denied"
- Make sure you're using the service role key, not the anon key
- Check that RLS policies are set up correctly

### Error: "duplicate key value"
- The seed data might already exist
- You can safely ignore this error or clear the items table first

## Verification

After running all three scripts, you should have:

1. **8 tables created:**
   - characters
   - campaigns
   - campaign_players
   - campaign_state
   - items
   - character_inventory
   - game_sessions
   - combat_encounters

2. **Equipment data loaded:**
   - Check the items table has equipment entries
   - Should have both scraped and basic game items

3. **Security policies active:**
   - RLS enabled on all tables
   - Policies allow guest and authenticated access

## Next Steps

After database setup:
1. Configure your backend environment variables
2. Test the connection from your backend
3. Start the backend server
4. Test the frontend connection
