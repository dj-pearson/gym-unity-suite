-- Create user_mfa table for storing MFA secrets and backup codes
CREATE TABLE IF NOT EXISTS user_mfa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  setup_at TIMESTAMPTZ,
  last_used TIMESTAMPTZ,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  recovery_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_enabled ON user_mfa(enabled);

-- Enable RLS
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own MFA settings
CREATE POLICY "Users can view own MFA settings" ON user_mfa
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own MFA settings
CREATE POLICY "Users can update own MFA settings" ON user_mfa
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own MFA settings
CREATE POLICY "Users can insert own MFA settings" ON user_mfa
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role can manage all MFA settings" ON user_mfa
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create mfa_audit_log table for security auditing
CREATE TABLE IF NOT EXISTS mfa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  method TEXT,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_mfa_audit_user_id ON mfa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_audit_created_at ON mfa_audit_log(created_at);

-- Enable RLS on audit log
ALTER TABLE mfa_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY "Users can view own MFA audit log" ON mfa_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit entries
CREATE POLICY "Service role can manage MFA audit log" ON mfa_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to add MFA requirement check to profile
-- Adds a field to indicate if MFA is required based on role
CREATE OR REPLACE FUNCTION check_mfa_requirement(user_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- MFA is required for owner and manager roles
  RETURN user_role IN ('owner', 'manager');
END;
$$ LANGUAGE plpgsql;

-- Comment on tables
COMMENT ON TABLE user_mfa IS 'Stores MFA secrets and backup codes for users';
COMMENT ON TABLE mfa_audit_log IS 'Audit log for MFA-related actions';
COMMENT ON FUNCTION check_mfa_requirement IS 'Check if MFA is required for a given user role';
