-- Create SMS campaigns table
CREATE TABLE public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all_members', 'active_members', 'leads', 'staff', 'custom')),
  recipient_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can manage SMS campaigns" 
ON public.sms_campaigns 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create SMS campaign recipients table
CREATE TABLE public.sms_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view campaign recipients" 
ON public.sms_campaign_recipients 
FOR SELECT 
USING (campaign_id IN (
  SELECT id FROM sms_campaigns 
  WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  )
));

-- Create trigger
CREATE TRIGGER update_sms_campaigns_updated_at
  BEFORE UPDATE ON public.sms_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();