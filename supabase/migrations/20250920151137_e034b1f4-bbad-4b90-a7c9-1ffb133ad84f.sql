-- Create the remaining incident management tables (incident_reports already exists)

-- Insurance claims tracking
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  incident_report_id UUID NOT NULL REFERENCES public.incident_reports(id),
  claim_number TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  policy_number TEXT,
  claim_type TEXT NOT NULL DEFAULT 'liability',
  claim_amount NUMERIC,
  claim_status TEXT NOT NULL DEFAULT 'filed',
  filed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  adjuster_name TEXT,
  adjuster_contact TEXT,
  settlement_amount NUMERIC,
  settlement_date DATE,
  claim_notes TEXT,
  documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Follow-up tasks for incidents
CREATE TABLE public.incident_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  incident_report_id UUID NOT NULL REFERENCES public.incident_reports(id),
  task_type TEXT NOT NULL DEFAULT 'follow_up_call',
  task_description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incident investigation notes
CREATE TABLE public.incident_investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  incident_report_id UUID NOT NULL REFERENCES public.incident_reports(id),
  investigator_id UUID NOT NULL REFERENCES auth.users(id),
  investigation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  findings TEXT NOT NULL,
  recommendations TEXT,
  contributing_factors TEXT[],
  preventability TEXT DEFAULT 'unknown',
  investigation_status TEXT NOT NULL DEFAULT 'ongoing',
  photos TEXT[],
  documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_investigations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_claims
CREATE POLICY "Staff can manage insurance claims"
ON public.insurance_claims
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for incident_follow_ups
CREATE POLICY "Staff can manage incident follow-ups"
ON public.incident_follow_ups
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for incident_investigations
CREATE POLICY "Staff can manage incident investigations"
ON public.incident_investigations
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create indexes for performance
CREATE INDEX idx_insurance_claims_organization ON public.insurance_claims(organization_id);
CREATE INDEX idx_incident_follow_ups_due ON public.incident_follow_ups(organization_id, due_date);
CREATE INDEX idx_incident_investigations_organization ON public.incident_investigations(organization_id);

-- Update triggers
CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_follow_ups_updated_at
  BEFORE UPDATE ON public.incident_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_investigations_updated_at
  BEFORE UPDATE ON public.incident_investigations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();