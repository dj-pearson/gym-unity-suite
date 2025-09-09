-- Create marketing_campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  target_segment TEXT NOT NULL DEFAULT 'all_members',
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create retention_campaigns table
CREATE TABLE public.retention_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'email',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_criteria JSONB NOT NULL DEFAULT '{}',
  message_template TEXT,
  trigger_event TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketing_campaigns
CREATE POLICY "Staff can manage marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for retention_campaigns
CREATE POLICY "Staff can manage retention campaigns" 
ON public.retention_campaigns 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create update triggers
CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retention_campaigns_updated_at
BEFORE UPDATE ON public.retention_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();