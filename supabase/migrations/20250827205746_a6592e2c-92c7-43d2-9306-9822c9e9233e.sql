-- Create lead_scoring_rules table
CREATE TABLE public.lead_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('source', 'demographic', 'behavioral', 'engagement')),
  criteria_field TEXT NOT NULL,
  criteria_operator TEXT NOT NULL CHECK (criteria_operator IN ('equals', 'contains', 'greater_than', 'less_than', 'exists')),
  criteria_value TEXT NOT NULL,
  score_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing fields to leads table
ALTER TABLE public.leads 
ADD COLUMN lead_score INTEGER DEFAULT 0,
ADD COLUMN qualification_status TEXT DEFAULT 'unqualified' CHECK (qualification_status IN ('unqualified', 'cold', 'warm', 'hot', 'qualified'));

-- Enable RLS on lead_scoring_rules table
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_scoring_rules
CREATE POLICY "Staff can manage lead scoring rules" 
ON public.lead_scoring_rules 
FOR ALL 
USING (organization_id IN (
  SELECT profiles.organization_id 
  FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create trigger for updated_at on lead_scoring_rules
CREATE TRIGGER update_lead_scoring_rules_updated_at
BEFORE UPDATE ON public.lead_scoring_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to recalculate lead scores
CREATE OR REPLACE FUNCTION public.recalculate_lead_scores(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset all lead scores for the organization
  UPDATE public.leads 
  SET lead_score = 0, qualification_status = 'unqualified'
  WHERE organization_id = org_id;
  
  -- This is a placeholder for the actual scoring logic
  -- In a real implementation, you would loop through scoring rules
  -- and apply them to calculate scores for each lead
  
  -- Update qualification status based on score ranges
  UPDATE public.leads 
  SET qualification_status = CASE 
    WHEN lead_score >= 80 THEN 'qualified'
    WHEN lead_score >= 60 THEN 'hot'
    WHEN lead_score >= 40 THEN 'warm'
    WHEN lead_score >= 20 THEN 'cold'
    ELSE 'unqualified'
  END
  WHERE organization_id = org_id;
END;
$$;