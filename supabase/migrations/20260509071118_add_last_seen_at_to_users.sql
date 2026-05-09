-- Add last_seen_at to users table for online presence detection
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- Backfill existing users with current time
UPDATE public.users SET last_seen_at = now() WHERE last_seen_at IS NULL;

-- Index for efficient queries (雷达/在线人数查询)
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON public.users(last_seen_at DESC);
