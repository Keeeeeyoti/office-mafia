-- Office Mafia Database Schema

-- Games table
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('waiting', 'in_progress', 'completed')) DEFAULT 'waiting',
    host_id UUID NOT NULL,
    current_phase TEXT CHECK (current_phase IN ('lobby', 'night', 'day', 'voting', 'end')) DEFAULT 'lobby',
    game_code TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8)
);

-- Players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('employee', 'rogue', 'audit', 'hr')),
    is_alive BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_host BOOLEAN DEFAULT FALSE
);

-- Game events table (for tracking game history)
CREATE TABLE game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;

-- Row Level Security (RLS) policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we'll restrict later in production)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_events" ON game_events FOR ALL USING (true);

-- Function to generate short game codes
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Update the games table to use the new function
ALTER TABLE games ALTER COLUMN game_code SET DEFAULT generate_game_code(); 