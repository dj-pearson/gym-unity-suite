-- Add custom domain support for enterprise organizations

-- Add subscription tier and custom domain fields to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'studio' CHECK (subscription_tier IN ('studio', 'boutique', 'enterprise')),
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_verification_token TEXT,
ADD COLUMN IF NOT EXISTS domain_ssl_enabled BOOLEAN DEFAULT false;

-- Create unique index on custom_domain for fast lookup and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_custom_domain
ON public.organizations(custom_domain)
WHERE custom_domain IS NOT NULL;

-- Create index on domain_verification_token for verification lookups
CREATE INDEX IF NOT EXISTS idx_organizations_domain_verification
ON public.organizations(domain_verification_token)
WHERE domain_verification_token IS NOT NULL;

-- Add comment to document the custom domain feature
COMMENT ON COLUMN public.organizations.custom_domain IS 'Custom domain for enterprise organizations (e.g., portal.gymname.com)';
COMMENT ON COLUMN public.organizations.custom_domain_verified IS 'Whether the custom domain DNS has been verified';
COMMENT ON COLUMN public.organizations.domain_verification_token IS 'Token used for DNS TXT record verification';
COMMENT ON COLUMN public.organizations.domain_ssl_enabled IS 'Whether SSL/TLS is enabled for the custom domain';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier: studio, boutique, or enterprise';

-- Update RLS policy to allow organization owners/managers to update custom domain settings
CREATE POLICY "Organization owners can update custom domain settings"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Function to generate domain verification token
CREATE OR REPLACE FUNCTION public.generate_domain_verification_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random verification token (32 characters)
  token := encode(gen_random_bytes(24), 'base64');
  -- Remove special characters that might cause issues in DNS
  token := replace(replace(replace(token, '/', ''), '+', ''), '=', '');
  RETURN 'gym-unity-verify-' || token;
END;
$$;

-- Function to validate enterprise tier before setting custom domain
CREATE OR REPLACE FUNCTION public.validate_custom_domain_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow custom domains for enterprise tier
  IF NEW.custom_domain IS NOT NULL AND NEW.custom_domain != '' THEN
    IF NEW.subscription_tier != 'enterprise' THEN
      RAISE EXCEPTION 'Custom domains are only available for enterprise tier organizations';
    END IF;

    -- Generate verification token if domain is being set for the first time
    IF OLD.custom_domain IS NULL OR OLD.custom_domain = '' OR OLD.custom_domain != NEW.custom_domain THEN
      NEW.custom_domain_verified := false;
      NEW.domain_verification_token := public.generate_domain_verification_token();
      NEW.domain_ssl_enabled := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate custom domain tier
DROP TRIGGER IF EXISTS validate_custom_domain_tier_trigger ON public.organizations;
CREATE TRIGGER validate_custom_domain_tier_trigger
  BEFORE INSERT OR UPDATE OF custom_domain, subscription_tier
  ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_custom_domain_tier();

-- Add helpful comment
COMMENT ON FUNCTION public.generate_domain_verification_token() IS 'Generates a unique token for DNS verification';
COMMENT ON FUNCTION public.validate_custom_domain_tier() IS 'Ensures only enterprise organizations can set custom domains';
