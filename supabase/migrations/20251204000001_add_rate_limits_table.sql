-- Create rate_limits table for server-side rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  limit_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Create login_attempts table for tracking failed logins
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until);

-- Create function to cleanup old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete rate limit entries older than 24 hours
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  -- Delete login attempts older than 24 hours (unless currently locked)
  DELETE FROM login_attempts
  WHERE last_attempt < NOW() - INTERVAL '24 hours'
    AND (locked_until IS NULL OR locked_until < NOW());
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired entries (runs every hour)
-- Note: This requires pg_cron extension. If not available, handle cleanup in application code.
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_expired_rate_limits()');

-- Add RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to rate_limits
CREATE POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role full access to login_attempts
CREATE POLICY "Service role can manage login attempts" ON login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on tables
COMMENT ON TABLE rate_limits IS 'Stores rate limiting counters for API endpoints';
COMMENT ON TABLE login_attempts IS 'Tracks failed login attempts for security';
