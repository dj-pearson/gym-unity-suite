-- Create certification requirements table
CREATE TABLE public.certification_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  certification_name TEXT NOT NULL,
  description TEXT,
  validity_period_months INTEGER NOT NULL DEFAULT 12,
  is_required BOOLEAN DEFAULT true,
  required_for_roles TEXT[] DEFAULT ARRAY['staff'::TEXT],
  renewal_notice_days INTEGER DEFAULT 30,
  training_provider TEXT,
  cost_estimate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff certifications table  
CREATE TABLE public.staff_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  requirement_id UUID NOT NULL,
  certification_number TEXT,
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  issuing_authority TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  renewal_cost DECIMAL(10,2),
  renewal_completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_requirements
CREATE POLICY "Staff can view certification requirements"
ON public.certification_requirements
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Managers can manage certification requirements"
ON public.certification_requirements
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

-- RLS Policies for staff_certifications
CREATE POLICY "Staff can view their own certifications"
ON public.staff_certifications
FOR SELECT
USING (
  staff_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Staff can manage staff certifications"
ON public.staff_certifications
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- Create indexes for performance
CREATE INDEX idx_certification_requirements_org ON public.certification_requirements(organization_id);
CREATE INDEX idx_staff_certifications_org ON public.staff_certifications(organization_id);
CREATE INDEX idx_staff_certifications_staff ON public.staff_certifications(staff_id);
CREATE INDEX idx_staff_certifications_expiry ON public.staff_certifications(expiry_date);

-- Create trigger for updated_at
CREATE TRIGGER update_certification_requirements_updated_at
  BEFORE UPDATE ON public.certification_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_certifications_updated_at
  BEFORE UPDATE ON public.staff_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();