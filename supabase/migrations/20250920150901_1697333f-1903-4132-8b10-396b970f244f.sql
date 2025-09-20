-- Create incident reporting system tables

-- Main incident reports table
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  incident_number TEXT NOT NULL,
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  incident_type TEXT NOT NULL DEFAULT 'accident',
  severity_level TEXT NOT NULL DEFAULT 'minor',
  location_description TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  equipment_involved_id UUID REFERENCES public.equipment(id),
  
  -- People involved
  injured_person_name TEXT,
  injured_person_type TEXT DEFAULT 'member',
  injured_person_id UUID REFERENCES auth.users(id),
  witness_names TEXT[],
  witness_contact_info TEXT[],
  
  -- Incident details
  incident_description TEXT NOT NULL,
  injury_description TEXT,
  body_parts_affected TEXT[],
  immediate_action_taken TEXT,
  medical_attention_required BOOLEAN DEFAULT false,
  medical_facility TEXT,
  paramedics_called BOOLEAN DEFAULT false,
  police_called BOOLEAN DEFAULT false,
  
  -- Environmental factors
  weather_conditions TEXT,
  lighting_conditions TEXT,
  surface_conditions TEXT,
  equipment_condition TEXT,
  
  -- Follow-up and resolution
  corrective_actions_taken TEXT,
  prevention_measures TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Insurance and legal
  insurance_notified BOOLEAN DEFAULT false,
  insurance_claim_number TEXT,
  insurance_company TEXT,
  legal_action_potential BOOLEAN DEFAULT false,
  attorney_contacted BOOLEAN DEFAULT false,
  
  -- Status and resolution
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Photos and documentation
  photos TEXT[],
  documents TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, incident_number)
);

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

-- Enable RLS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_investigations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_reports
CREATE POLICY "Staff can manage incident reports"
ON public.incident_reports
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

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
CREATE INDEX idx_incident_reports_organization ON public.incident_reports(organization_id);
CREATE INDEX idx_incident_reports_date ON public.incident_reports(incident_date);
CREATE INDEX idx_incident_reports_status ON public.incident_reports(organization_id, status);
CREATE INDEX idx_incident_reports_severity ON public.incident_reports(organization_id, severity_level);
CREATE INDEX idx_insurance_claims_organization ON public.insurance_claims(organization_id);
CREATE INDEX idx_incident_follow_ups_due ON public.incident_follow_ups(organization_id, due_date);

-- Update triggers
CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

-- Function to generate incident numbers
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    year_suffix TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get current year suffix
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM incident_reports 
    WHERE incident_number LIKE 'INC' || year_suffix || '%';
    
    -- Format: INC2024001, INC2024002, etc.
    new_number := 'INC' || year_suffix || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$;

-- Function to auto-generate incident number on insert
CREATE OR REPLACE FUNCTION public.set_incident_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.incident_number IS NULL OR NEW.incident_number = '' THEN
        NEW.incident_number := public.generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to auto-generate incident numbers
CREATE TRIGGER set_incident_number_trigger
  BEFORE INSERT ON public.incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_incident_number();