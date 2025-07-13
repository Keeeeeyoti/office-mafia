# Office Mafia Setup Guide

## Prerequisites
- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- Supabase account

## Supabase Setup

1. Create a new Supabase project at https://supabase.com/
2. In your project dashboard, go to Settings → API
3. Copy your Project URL and anon/public key
4. Create a `.env` file in the root directory with:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Games table
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('waiting', 'in_progress', 'completed')) DEFAULT 'waiting',
    host_id UUID NOT NULL,
    current_phase TEXT CHECK (current_phase IN ('lobby', 'night', 'day', 'voting', 'end')) DEFAULT 'lobby'
);

-- Players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('employee', 'rogue', 'audit', 'hr')),
    is_alive BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Row Level Security (RLS) policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we'll restrict later)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
```

## Running the App

1. Install dependencies: `npm install`
2. Start the development server: `npm run web`
3. Open http://localhost:19006 in your browser

## Deployment

### Vercel Setup
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy
4. Add your environment variables in the Vercel dashboard

The app will be available at your Vercel URL. 