-- Add game_type column to matches table for future multi-game-type support
-- No logic implemented yet; reserved for future use
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'eight_ball';

-- Add game_type column to rating_snapshots table
ALTER TABLE rating_snapshots
  ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'eight_ball';

-- Add index for future queries filtering by game_type
CREATE INDEX IF NOT EXISTS idx_matches_game_type ON matches(game_type);
CREATE INDEX IF NOT EXISTS idx_rating_snapshots_game_type ON rating_snapshots(game_type);
