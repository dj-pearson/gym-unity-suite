-- Create SMS/Email provider configuration table
CREATE TABLE public.communication_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('sms', 'email')),
  provider_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication templates table
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('sms', 'email')),
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT, -- For email templates only
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available variables for template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message history table
CREATE TABLE public.message_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('member', 'staff', 'lead')),
  recipient_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('sms', 'email', 'push')),
  template_id UUID,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign executions enhancements for SMS/Email
ALTER TABLE public.campaign_executions 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'email' CHECK (message_type IN ('sms', 'email', 'push')),
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed'));

-- Enable RLS
ALTER TABLE public.communication_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communication_providers
CREATE POLICY "Staff can manage communication providers" ON public.communication_providers
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

-- RLS Policies for communication_templates  
CREATE POLICY "Staff can manage communication templates" ON public.communication_templates
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

-- RLS Policies for message_history
CREATE POLICY "Staff can view message history" ON public.message_history
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

CREATE POLICY "Staff can create message history" ON public.message_history
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
    AND sent_by = auth.uid()
  );

-- Add updated_at triggers
CREATE TRIGGER update_communication_providers_updated_at
  BEFORE UPDATE ON public.communication_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at
  BEFORE UPDATE ON public.communication_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_history_updated_at
  BEFORE UPDATE ON public.message_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();