-- Drop orphaned lock_and_get_match_data function
-- This RPC was previously called by process-match Edge Function as part of a
-- double-lock pattern that caused "Match not found or not locked" errors.
-- The Edge Function was refactored to use a direct JOIN query instead (2026-04-03).
-- The function is no longer referenced anywhere in the codebase.
DROP FUNCTION IF EXISTS public.lock_and_get_match_data(uuid);
