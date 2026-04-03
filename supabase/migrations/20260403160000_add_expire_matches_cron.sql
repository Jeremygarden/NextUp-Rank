-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule expire-matches: pure SQL UPDATE every 5 minutes (no pg_net required)
SELECT cron.schedule(
  'expire-pending-matches',
  '*/5 * * * *',
  $$
  UPDATE matches
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < now() - interval '30 minutes'
  $$
);
