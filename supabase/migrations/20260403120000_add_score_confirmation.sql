-- Add score submission fields for two-step confirmation flow
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS player_a_racks_won  integer,
  ADD COLUMN IF NOT EXISTS player_a_racks_lost integer,
  ADD COLUMN IF NOT EXISTS score_submitted_at  timestamp with time zone,
  ADD COLUMN IF NOT EXISTS confirmed_at        timestamp with time zone;

-- Update status check: add 'awaiting_confirmation' as valid status
-- (no constraint change needed, status is free-form text)
