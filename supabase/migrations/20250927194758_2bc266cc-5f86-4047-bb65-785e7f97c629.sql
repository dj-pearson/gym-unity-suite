-- Create integrations table for third-party service connections
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook endpoints table
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  secret_key TEXT,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook logs table for delivery tracking
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  webhook_endpoint_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retry')),
  response_code INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Store hashed version
  key_preview TEXT NOT NULL, -- First/last few characters for display
  permissions TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integration activity logs for audit trail
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  integration_id UUID,
  api_key_id UUID,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations
CREATE POLICY "Staff can manage integrations in their organization"
ON public.integrations
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for webhook endpoints
CREATE POLICY "Staff can manage webhook endpoints in their organization"
ON public.webhook_endpoints
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for webhook logs
CREATE POLICY "Staff can view webhook logs in their organization"
ON public.webhook_logs
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "System can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true); -- Allow system to insert logs

-- RLS Policies for API keys
CREATE POLICY "Staff can manage API keys in their organization"
ON public.api_keys
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for integration logs
CREATE POLICY "Staff can view integration logs in their organization"
ON public.integration_logs
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "System can insert integration logs"
ON public.integration_logs
FOR INSERT
WITH CHECK (true); -- Allow system to insert logs

-- Create foreign key relationships
ALTER TABLE public.webhook_logs 
ADD CONSTRAINT fk_webhook_logs_endpoint 
FOREIGN KEY (webhook_endpoint_id) 
REFERENCES public.webhook_endpoints(id) 
ON DELETE CASCADE;

ALTER TABLE public.integration_logs 
ADD CONSTRAINT fk_integration_logs_integration 
FOREIGN KEY (integration_id) 
REFERENCES public.integrations(id) 
ON DELETE CASCADE;

ALTER TABLE public.integration_logs 
ADD CONSTRAINT fk_integration_logs_api_key 
FOREIGN KEY (api_key_id) 
REFERENCES public.api_keys(id) 
ON DELETE CASCADE;

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_integrations_organization_id ON public.integrations(organization_id);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_webhook_endpoints_organization_id ON public.webhook_endpoints(organization_id);
CREATE INDEX idx_webhook_endpoints_status ON public.webhook_endpoints(status);
CREATE INDEX idx_webhook_logs_organization_id ON public.webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_endpoint_id ON public.webhook_logs(webhook_endpoint_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);
CREATE INDEX idx_integration_logs_organization_id ON public.integration_logs(organization_id);
CREATE INDEX idx_integration_logs_created_at ON public.integration_logs(created_at DESC);