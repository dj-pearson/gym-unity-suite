-- Add custom domain columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;