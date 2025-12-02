-- Add missing columns to profiles table for onboarding and dashboard preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.onboarding_state IS 'Stores user onboarding tour progress and state';
COMMENT ON COLUMN public.profiles.dashboard_preferences IS 'Stores user dashboard widget preferences and layout';