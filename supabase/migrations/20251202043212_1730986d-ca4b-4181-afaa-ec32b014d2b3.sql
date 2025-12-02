-- =============================================
-- Blog & Social Media AI Automation System
-- Database Schema Migration
-- =============================================

-- Table 1: AI Model Configuration (Centralized)
CREATE TABLE IF NOT EXISTS public.ai_model_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Primary AI Provider Configuration
  primary_provider TEXT DEFAULT 'claude', -- 'claude', 'openai', 'gemini', 'lovable'
  primary_model TEXT DEFAULT 'claude-sonnet-4-5',
  fallback_provider TEXT DEFAULT 'claude',
  fallback_model TEXT DEFAULT 'claude-opus-4-1-20250805',
  
  -- Model Parameters
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  
  -- Provider-Specific Settings
  claude_version TEXT DEFAULT '2023-06-01',
  openai_organization_id TEXT,
  
  -- Usage Tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(organization_id)
);

-- Table 2: Blog Auto-Generation Settings
CREATE TABLE IF NOT EXISTS public.blog_auto_generation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Generation Schedule
  is_enabled BOOLEAN DEFAULT false,
  generation_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  generation_time TIME DEFAULT '09:00:00',
  generation_timezone TEXT DEFAULT 'America/New_York',
  last_generation_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  
  -- Content Settings
  target_word_count INTEGER DEFAULT 1200,
  content_style TEXT DEFAULT 'professional', -- 'professional', 'conversational', 'technical', 'casual'
  industry_focus TEXT[] DEFAULT '{"fitness", "health", "wellness"}',
  target_keywords TEXT[] DEFAULT '{}',
  
  -- SEO & GEO Settings
  optimize_for_geographic BOOLEAN DEFAULT false,
  target_locations TEXT[] DEFAULT '{}',
  seo_focus TEXT DEFAULT 'balanced', -- 'aggressive', 'balanced', 'minimal'
  geo_optimization BOOLEAN DEFAULT true, -- Generative Engine Optimization
  perplexity_optimization BOOLEAN DEFAULT true,
  ai_search_optimization BOOLEAN DEFAULT true,
  
  -- Content Diversity
  topic_diversity_enabled BOOLEAN DEFAULT true,
  minimum_topic_gap_days INTEGER DEFAULT 30,
  content_analysis_depth TEXT DEFAULT 'excerpt', -- 'title', 'excerpt', 'full'
  
  -- Publishing Settings
  auto_publish BOOLEAN DEFAULT false,
  publish_as_draft BOOLEAN DEFAULT true,
  require_review BOOLEAN DEFAULT true,
  notify_on_generation BOOLEAN DEFAULT true,
  notification_emails TEXT[] DEFAULT '{}',
  
  -- Customization
  content_template TEXT,
  custom_instructions TEXT,
  brand_voice_guidelines TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(organization_id)
);

-- Table 3: Blog Generation Queue
CREATE TABLE IF NOT EXISTS public.blog_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  priority INTEGER DEFAULT 5, -- 1-10 (10 is highest)
  
  suggested_topic TEXT,
  target_keywords TEXT[] DEFAULT '{}',
  custom_parameters JSONB DEFAULT '{}',
  
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  generation_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Blog Topic History (for diversity tracking)
CREATE TABLE IF NOT EXISTS public.blog_topic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  
  primary_topic TEXT NOT NULL,
  secondary_topics TEXT[] DEFAULT '{}',
  keywords_used TEXT[] DEFAULT '{}',
  topic_category TEXT,
  content_type TEXT DEFAULT 'article',
  
  target_keywords TEXT[] DEFAULT '{}',
  geo_targets TEXT[] DEFAULT '{}',
  seo_score DECIMAL(5,2),
  readability_score DECIMAL(5,2),
  
  generation_model TEXT,
  generation_time_seconds INTEGER,
  ai_confidence_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 5: Social Media Automation Settings
CREATE TABLE IF NOT EXISTS public.social_media_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  is_active BOOLEAN DEFAULT true,
  auto_post_on_publish BOOLEAN DEFAULT false,
  
  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  
  -- AI Content Generation
  ai_content_generation BOOLEAN DEFAULT true,
  platforms_enabled JSONB DEFAULT '["linkedin", "twitter", "facebook", "instagram"]'::jsonb,
  
  -- Scheduling & Templates
  posting_schedule JSONB DEFAULT '{}'::jsonb,
  content_templates JSONB DEFAULT '{}'::jsonb,
  
  -- Platform-Specific Settings
  twitter_character_limit INTEGER DEFAULT 280,
  linkedin_character_limit INTEGER DEFAULT 3000,
  facebook_character_limit INTEGER DEFAULT 63206,
  instagram_character_limit INTEGER DEFAULT 2200,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(organization_id)
);

-- Table 6: Social Media Automation Logs
CREATE TABLE IF NOT EXISTS public.social_media_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  
  trigger_type TEXT NOT NULL, -- 'manual', 'auto_publish', 'scheduled', 'webhook'
  platforms_processed JSONB DEFAULT '[]'::jsonb,
  posts_created INTEGER DEFAULT 0,
  
  -- Webhook Tracking
  webhook_sent BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_response JSONB DEFAULT '{}'::jsonb,
  webhook_response_status INTEGER,
  
  -- Generated Content
  generated_content JSONB DEFAULT '{}'::jsonb,
  
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_blog_queue_status_scheduled ON public.blog_generation_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_blog_queue_org_status ON public.blog_generation_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_topic_history_org_created ON public.blog_topic_history(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_logs_blog_post ON public.social_media_automation_logs(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_social_logs_org_created ON public.social_media_automation_logs(organization_id, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_auto_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_topic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_model_settings
CREATE POLICY "Organizations can view their AI settings"
  ON public.ai_model_settings FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners can manage AI settings"
  ON public.ai_model_settings FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- RLS Policies for blog_auto_generation_settings
CREATE POLICY "Organizations can view their blog settings"
  ON public.blog_auto_generation_settings FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners can manage blog settings"
  ON public.blog_auto_generation_settings FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- RLS Policies for blog_generation_queue
CREATE POLICY "Organizations can view their blog queue"
  ON public.blog_generation_queue FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners can manage blog queue"
  ON public.blog_generation_queue FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- RLS Policies for blog_topic_history
CREATE POLICY "Organizations can view their topic history"
  ON public.blog_topic_history FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "System can insert topic history"
  ON public.blog_topic_history FOR INSERT
  WITH CHECK (true); -- Edge functions will insert

-- RLS Policies for social_media_automation_settings
CREATE POLICY "Organizations can view their social settings"
  ON public.social_media_automation_settings FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners can manage social settings"
  ON public.social_media_automation_settings FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- RLS Policies for social_media_automation_logs
CREATE POLICY "Organizations can view their social logs"
  ON public.social_media_automation_logs FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "System can insert social logs"
  ON public.social_media_automation_logs FOR INSERT
  WITH CHECK (true); -- Edge functions will insert

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_ai_automation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update triggers
CREATE TRIGGER update_ai_model_settings_updated_at
  BEFORE UPDATE ON public.ai_model_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_automation_updated_at();

CREATE TRIGGER update_blog_auto_generation_settings_updated_at
  BEFORE UPDATE ON public.blog_auto_generation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_automation_updated_at();

CREATE TRIGGER update_blog_generation_queue_updated_at
  BEFORE UPDATE ON public.blog_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_automation_updated_at();

CREATE TRIGGER update_social_media_automation_settings_updated_at
  BEFORE UPDATE ON public.social_media_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_automation_updated_at();

CREATE TRIGGER update_social_media_automation_logs_updated_at
  BEFORE UPDATE ON public.social_media_automation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_automation_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.ai_model_settings IS 'Centralized AI model configuration for all content generation - single source of truth';
COMMENT ON TABLE public.blog_auto_generation_settings IS 'Configuration for automated blog content generation with AI';
COMMENT ON TABLE public.blog_generation_queue IS 'Queue for scheduled blog generation jobs with retry logic';
COMMENT ON TABLE public.blog_topic_history IS 'Tracks generated topics to prevent repetitive content';
COMMENT ON TABLE public.social_media_automation_settings IS 'Social media automation configuration and webhook settings';
COMMENT ON TABLE public.social_media_automation_logs IS 'Execution logs for social media automation and debugging';