-- Fix schema: add abandoned_by and abandoned_at columns to matches
-- These are needed for the abandon-match Edge Function to record who abandoned and when.
-- abandon-match currently broadcasts abandoned_by but doesn't persist it to DB.
-- After this migration, update abandon-match to also write these columns.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS abandoned_by  uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS abandoned_at  timestamp with time zone;
