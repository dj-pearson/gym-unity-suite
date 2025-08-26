-- Create lead stages for sales pipeline
CREATE TABLE public.lead_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6b7280',
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

-- Create leads table that can convert to members
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead', -- 'lead' or 'member'
  stage_id UUID REFERENCES public.lead_stages(id),
  assigned_to UUID, -- staff member assigned
  source TEXT, -- how they found us
  interest_level TEXT DEFAULT 'cold', -- cold, warm, hot
  estimated_value DECIMAL,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create lead activities for tracking all interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'call', 'email', 'appointment', 'note', 'follow_up'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE, -- for appointments/follow-ups
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL, -- staff member who created
  outcome TEXT, -- result of call/meeting
  next_action TEXT, -- what to do next
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create default lead stages
INSERT INTO public.lead_stages (organization_id, name, description, order_index, color) VALUES
-- Using a placeholder organization_id - this will need to be updated per organization
('00000000-0000-0000-0000-000000000000', 'New Lead', 'Initial contact made', 1, '#3b82f6'),
('00000000-0000-0000-0000-000000000000', 'Qualified', 'Lead shows genuine interest', 2, '#8b5cf6'),
('00000000-0000-0000-0000-000000000000', 'Tour Scheduled', 'Facility tour booked', 3, '#f59e0b'),
('00000000-0000-0000-0000-000000000000', 'Tour Completed', 'Completed facility tour', 4, '#10b981'),
('00000000-0000-0000-0000-000000000000', 'Proposal Sent', 'Membership proposal provided', 5, '#f97316'),
('00000000-0000-0000-0000-000000000000', 'Negotiating', 'Discussing terms and pricing', 6, '#ef4444'),
('00000000-0000-0000-0000-000000000000', 'Closed Won', 'Converted to member', 7, '#22c55e', TRUE),
('00000000-0000-0000-0000-000000000000', 'Closed Lost', 'Lead did not convert', 8, '#6b7280', TRUE);

-- Create RLS policies for lead_stages
CREATE POLICY "Users can view lead stages in their organization" 
ON public.lead_stages 
FOR SELECT 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Staff can manage lead stages" 
ON public.lead_stages 
FOR ALL 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for leads
CREATE POLICY "Staff can view leads in their organization" 
ON public.leads 
FOR SELECT 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

CREATE POLICY "Staff can manage leads" 
ON public.leads 
FOR ALL 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for lead_activities
CREATE POLICY "Staff can view lead activities" 
ON public.lead_activities 
FOR SELECT 
USING (lead_id IN (
  SELECT leads.id
  FROM leads
  WHERE leads.organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "Staff can manage lead activities" 
ON public.lead_activities 
FOR ALL 
USING (lead_id IN (
  SELECT leads.id
  FROM leads
  WHERE leads.organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create triggers for updated_at
CREATE TRIGGER update_lead_stages_updated_at
BEFORE UPDATE ON public.lead_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();