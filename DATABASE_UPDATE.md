# Database Update: Game Cleanup System

## 🎯 What This Does
- Automatically marks games as "abandoned" if they've been waiting for more than 15 minutes
- Prevents players from joining expired game sessions
- Keeps your database clean by removing very old games

## 📋 Steps to Update Your Database

### 1. Add "abandoned" Status to Games Table

Go to your **Supabase SQL Editor** and run this command:

```sql
-- Update the games table to allow "abandoned" status
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check 
CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned'));
```

### 2. Add Cleanup Functions

Run this in your **Supabase SQL Editor**:

```sql
-- Function to clean up abandoned games (games waiting for more than 15 minutes)
CREATE OR REPLACE FUNCTION cleanup_abandoned_games()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update games that are still 'waiting' but created more than 15 minutes ago
    UPDATE games 
    SET status = 'abandoned'
    WHERE status = 'waiting' 
    AND created_at < NOW() - INTERVAL '15 minutes';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO game_events (event_type, event_data)
    SELECT 'cleanup_abandoned', jsonb_build_object(
        'games_abandoned', updated_count,
        'cleanup_time', NOW()
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up abandoned games and their associated players (for complete cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_games()
RETURNS TEXT AS $$
DECLARE
    games_cleaned INTEGER;
    players_cleaned INTEGER;
BEGIN
    -- First, clean up abandoned games
    games_cleaned := cleanup_abandoned_games();
    
    -- Optionally, delete very old abandoned games (older than 24 hours) to keep DB clean
    DELETE FROM games 
    WHERE status = 'abandoned' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS players_cleaned = ROW_COUNT;
    
    RETURN format('Abandoned %s games, deleted %s old games', games_cleaned, players_cleaned);
END;
$$ LANGUAGE plpgsql;
```

### 3. Clean Up Your Existing Old Games (Optional)

If you want to clean up all those old "waiting" games you saw in your table:

```sql
-- Run this once to clean up all existing old games
SELECT cleanup_old_games();
```

## 🧪 Testing the System

1. **Deploy your updated code** to Vercel (the TypeScript changes are already made)

2. **Test the cleanup manually**:
   - Go to your app's homepage
   - Click "Cleanup Old Games (15+ min)" button
   - Check your Supabase table - you should see old games marked as "abandoned"

3. **Test automatic cleanup**:
   - Create a new game (this triggers automatic cleanup)
   - Old games should be cleaned up automatically

## 🔄 How It Works

- **When creating a game**: Automatically cleans up old abandoned games
- **When joining a game**: Players can't join abandoned/expired games
- **Manual cleanup**: Use the button on homepage for testing
- **Game lifecycle**: `waiting` → `in_progress` → `completed` (or `abandoned` if timeout)

## ⏰ Timing

- **15 minutes**: Games marked as "abandoned" if still waiting
- **24 hours**: Very old abandoned games are completely deleted
- **Automatic**: Cleanup runs every time a new game is created

Your database will now stay clean and players won't get confused by expired game sessions! 