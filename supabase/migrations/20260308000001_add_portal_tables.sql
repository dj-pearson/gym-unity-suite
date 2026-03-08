-- White-Label Member Portal Tables
-- Adds portal_themes and portal_configurations for the self-service
-- white-label member portal onboarding system.

-- 1. Portal Themes - Full branding customization per organization
CREATE TABLE IF NOT EXISTS portal_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Core Colors (HSL format for Tailwind compatibility)
  color_primary TEXT NOT NULL DEFAULT '221 83% 53%',
  color_secondary TEXT NOT NULL DEFAULT '24 95% 53%',
  color_background TEXT NOT NULL DEFAULT '0 0% 100%',
  color_surface TEXT NOT NULL DEFAULT '0 0% 98%',
  color_text_primary TEXT NOT NULL DEFAULT '222 47% 11%',
  color_text_secondary TEXT NOT NULL DEFAULT '215 14% 34%',
  color_text_muted TEXT NOT NULL DEFAULT '220 9% 46%',
  color_border TEXT NOT NULL DEFAULT '220 13% 91%',
  color_success TEXT NOT NULL DEFAULT '142 70% 45%',
  color_warning TEXT NOT NULL DEFAULT '38 92% 50%',
  color_error TEXT NOT NULL DEFAULT '0 84% 60%',

  -- Dark Mode Colors (nullable - falls back to auto-generated if not set)
  dark_color_background TEXT,
  dark_color_surface TEXT,
  dark_color_text_primary TEXT,
  dark_color_text_secondary TEXT,
  dark_color_border TEXT,

  -- Typography
  font_family_heading TEXT DEFAULT 'Inter',
  font_family_body TEXT DEFAULT 'Inter',
  font_size_base TEXT DEFAULT '16px',

  -- Shape & Layout
  border_radius TEXT DEFAULT '0.5rem',
  border_radius_button TEXT DEFAULT '0.375rem',
  button_style TEXT DEFAULT 'default',
  card_style TEXT DEFAULT 'bordered',

  -- Logo & Images
  logo_url TEXT,
  logo_dark_url TEXT,
  logo_icon_url TEXT,
  login_background_url TEXT,
  welcome_hero_url TEXT,

  -- Custom CSS (Enterprise only)
  custom_css TEXT,

  -- "Powered By" Configuration
  show_powered_by BOOLEAN DEFAULT true,
  powered_by_style TEXT DEFAULT 'badge',

  -- PWA Configuration
  pwa_name TEXT,
  pwa_short_name TEXT,
  pwa_theme_color TEXT,
  pwa_background_color TEXT,

  -- Email Branding
  email_header_color TEXT,
  email_footer_text TEXT,

  -- Feature Toggles
  features_enabled JSONB DEFAULT '{
    "classes": true,
    "check_in": true,
    "loyalty": false,
    "referrals": false,
    "fitness_tracking": false,
    "billing_self_service": true,
    "push_notifications": false,
    "workout_history": false,
    "personal_training": false,
    "retail": false,
    "spa": false,
    "courts": false,
    "childcare": false,
    "community": false,
    "custom_pages": false,
    "api_access": false
  }'::jsonb,

  -- Navigation Customization
  nav_items JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One theme per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_themes_org ON portal_themes(organization_id);

-- 2. Portal Configuration - Portal status, subdomain, registration settings
CREATE TABLE IF NOT EXISTS portal_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Portal Status
  portal_enabled BOOLEAN DEFAULT false,
  portal_tier TEXT DEFAULT 'starter' CHECK (portal_tier IN ('starter', 'professional', 'enterprise')),

  -- Subdomain
  portal_subdomain TEXT UNIQUE,
  subdomain_verified BOOLEAN DEFAULT false,

  -- Custom Domain (enterprise)
  portal_custom_domain TEXT UNIQUE,
  portal_domain_verified BOOLEAN DEFAULT false,
  portal_domain_verification_token TEXT,

  -- Welcome/Onboarding
  welcome_message TEXT,
  welcome_enabled BOOLEAN DEFAULT true,

  -- Registration
  allow_self_registration BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  registration_fields JSONB DEFAULT '["name", "email", "phone"]'::jsonb,

  -- Setup Progress (tracks onboarding wizard completion)
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  setup_step INTEGER DEFAULT 0,

  -- Portal Analytics
  portal_visits_total INTEGER DEFAULT 0,
  portal_active_members INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_config_org ON portal_configurations(organization_id);

-- RLS Policies for portal_themes
ALTER TABLE portal_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_themes_select" ON portal_themes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "portal_themes_insert" ON portal_themes
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "portal_themes_update" ON portal_themes
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "portal_themes_delete" ON portal_themes
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Public read access for portal themes (needed for member portal to load branding)
CREATE POLICY "portal_themes_public_read" ON portal_themes
  FOR SELECT USING (true);

-- RLS Policies for portal_configurations
ALTER TABLE portal_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_config_select" ON portal_configurations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "portal_config_insert" ON portal_configurations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "portal_config_update" ON portal_configurations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "portal_config_delete" ON portal_configurations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Public read for portal config (needed for subdomain resolution)
CREATE POLICY "portal_config_public_read" ON portal_configurations
  FOR SELECT USING (true);
