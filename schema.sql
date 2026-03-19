-- Billiard-Rank Core Database Schema (PostgreSQL/Supabase)

-- 1. Enable PostGIS for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    -- Glicko-2 State
    rating FLOAT DEFAULT 1500.0,
    rd FLOAT DEFAULT 350.0,
    vol FLOAT DEFAULT 0.06,
    -- Performance Cache (JSONB for "Recent 25" display)
    recent_25_snapshots JSONB DEFAULT '[]',
    last_location GEOGRAPHY(POINT),
    karma_score INTEGER DEFAULT 100, -- Trust level for dispute resolution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Venues (Locations/Pool Halls)
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    geo_location GEOGRAPHY(POINT) NOT NULL,
    metadata JSONB, -- { "tables": 12, "type": "snooker/pool" }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Matches (Event Source)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_a_id UUID REFERENCES users(id),
    player_b_id UUID REFERENCES users(id),
    racks_won INTEGER NOT NULL, -- A's score
    racks_lost INTEGER NOT NULL, -- B's score
    venue_id UUID REFERENCES venues(id),
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'disputed'
    is_lbs_verified BOOLEAN DEFAULT FALSE,
    match_metadata JSONB, -- { "handshake_time": "...", "distance": 15.2 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Rating Snapshots (Historical Trace)
CREATE TABLE IF NOT EXISTS rating_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    match_id UUID REFERENCES matches(id),
    rating_before FLOAT,
    rating_after FLOAT,
    rd_after FLOAT,
    vol_after FLOAT,
    rating_delta FLOAT,
    opponent_id UUID REFERENCES users(id),
    opponent_rating_at_match FLOAT, -- Crucial for fair backtesting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_venues_geo ON venues USING GIST(geo_location);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_recent ON rating_snapshots (user_id, created_at DESC);
