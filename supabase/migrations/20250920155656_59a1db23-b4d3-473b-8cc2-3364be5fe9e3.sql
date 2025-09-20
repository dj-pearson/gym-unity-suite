-- Equipment Safety Inspections System
-- Critical for safety compliance and liability protection

-- Create inspection checklists table (reusable templates)
CREATE TABLE public.inspection_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  checklist_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL, -- matches equipment.equipment_type
  description TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 30, -- inspection frequency
  is_active BOOLEAN DEFAULT true,
  requires_certification BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection checklist items
CREATE TABLE public.inspection_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL,
  item_number INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT false, -- critical safety item
  expected_condition TEXT, -- what should pass
  inspection_method TEXT, -- visual, functional, measurement, etc.
  pass_criteria TEXT,
  fail_criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safety inspections table
CREATE TABLE public.safety_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  checklist_id UUID NOT NULL,
  inspector_id UUID NOT NULL, -- staff member conducting inspection
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  overall_status TEXT NOT NULL DEFAULT 'pending' CHECK (overall_status IN ('pending', 'passed', 'failed', 'needs_attention')),
  total_items INTEGER DEFAULT 0,
  passed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  critical_failures INTEGER DEFAULT 0,
  next_inspection_date DATE,
  estimated_duration_minutes INTEGER DEFAULT 30,
  actual_duration_minutes INTEGER,
  inspection_notes TEXT,
  recommendations TEXT,
  requires_immediate_attention BOOLEAN DEFAULT false,
  equipment_taken_offline BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection results for each checklist item
CREATE TABLE public.inspection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL,
  checklist_item_id UUID NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('pass', 'fail', 'not_applicable', 'needs_repair')),
  inspector_notes TEXT,
  photo_urls TEXT[], -- array of photo URLs for documentation
  measurements JSONB, -- store any measurements taken
  action_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create violations table for tracking safety issues
CREATE TABLE public.safety_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  inspection_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  violation_type TEXT NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  photo_documentation TEXT[], -- photo evidence
  immediate_action_taken TEXT,
  corrective_action_required TEXT,
  assigned_to UUID, -- staff member responsible for fix
  target_resolution_date DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  compliance_impact TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Enable RLS
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_checklists
CREATE POLICY "Staff can view checklists in their organization"
  ON public.inspection_checklists FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

CREATE POLICY "Staff can manage checklists in their organization"
  ON public.inspection_checklists FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

-- RLS Policies for inspection_checklist_items
CREATE POLICY "Staff can view checklist items"
  ON public.inspection_checklist_items FOR SELECT
  USING (checklist_id IN (
    SELECT id FROM inspection_checklists 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  ));

CREATE POLICY "Staff can manage checklist items"
  ON public.inspection_checklist_items FOR ALL
  USING (checklist_id IN (
    SELECT id FROM inspection_checklists 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  ));

-- RLS Policies for safety_inspections
CREATE POLICY "Staff can view inspections in their organization"
  ON public.safety_inspections FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

CREATE POLICY "Staff can manage inspections in their organization"
  ON public.safety_inspections FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

-- RLS Policies for inspection_results
CREATE POLICY "Staff can view inspection results"
  ON public.inspection_results FOR SELECT
  USING (inspection_id IN (
    SELECT id FROM safety_inspections 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  ));

CREATE POLICY "Staff can manage inspection results"
  ON public.inspection_results FOR ALL
  USING (inspection_id IN (
    SELECT id FROM safety_inspections 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  ));

-- RLS Policies for safety_violations
CREATE POLICY "Staff can view violations in their organization"
  ON public.safety_violations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

CREATE POLICY "Staff can manage violations in their organization"
  ON public.safety_violations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ));

-- Add indexes for performance
CREATE INDEX idx_inspection_checklists_org_id ON public.inspection_checklists(organization_id);
CREATE INDEX idx_inspection_checklists_equipment_type ON public.inspection_checklists(equipment_type);
CREATE INDEX idx_checklist_items_checklist_id ON public.inspection_checklist_items(checklist_id);
CREATE INDEX idx_safety_inspections_org_id ON public.safety_inspections(organization_id);
CREATE INDEX idx_safety_inspections_equipment_id ON public.safety_inspections(equipment_id);
CREATE INDEX idx_safety_inspections_scheduled_date ON public.safety_inspections(scheduled_date);
CREATE INDEX idx_inspection_results_inspection_id ON public.inspection_results(inspection_id);
CREATE INDEX idx_safety_violations_org_id ON public.safety_violations(organization_id);
CREATE INDEX idx_safety_violations_equipment_id ON public.safety_violations(equipment_id);
CREATE INDEX idx_safety_violations_status ON public.safety_violations(status);

-- Add triggers for updated_at
CREATE TRIGGER update_inspection_checklists_updated_at 
  BEFORE UPDATE ON public.inspection_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_checklist_items_updated_at 
  BEFORE UPDATE ON public.inspection_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_inspections_updated_at 
  BEFORE UPDATE ON public.safety_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_results_updated_at 
  BEFORE UPDATE ON public.inspection_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_violations_updated_at 
  BEFORE UPDATE ON public.safety_violations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate inspection statistics
CREATE OR REPLACE FUNCTION public.update_inspection_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inspection totals based on results
  UPDATE public.safety_inspections 
  SET 
    total_items = (
      SELECT COUNT(*) FROM inspection_results 
      WHERE inspection_id = NEW.inspection_id
    ),
    passed_items = (
      SELECT COUNT(*) FROM inspection_results 
      WHERE inspection_id = NEW.inspection_id AND result_status = 'pass'
    ),
    failed_items = (
      SELECT COUNT(*) FROM inspection_results 
      WHERE inspection_id = NEW.inspection_id AND result_status IN ('fail', 'needs_repair')
    ),
    critical_failures = (
      SELECT COUNT(*) FROM inspection_results ir
      JOIN inspection_checklist_items ici ON ir.checklist_item_id = ici.id
      WHERE ir.inspection_id = NEW.inspection_id 
      AND ir.result_status IN ('fail', 'needs_repair')
      AND ici.is_critical = true
    )
  WHERE id = NEW.inspection_id;
  
  -- Update overall status
  UPDATE public.safety_inspections 
  SET overall_status = CASE
    WHEN critical_failures > 0 THEN 'failed'
    WHEN failed_items > 0 THEN 'needs_attention'
    WHEN total_items > 0 AND passed_items = total_items THEN 'passed'
    ELSE 'pending'
  END
  WHERE id = NEW.inspection_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update inspection statistics
CREATE TRIGGER update_inspection_stats_on_result_change
  AFTER INSERT OR UPDATE OR DELETE ON public.inspection_results
  FOR EACH ROW EXECUTE FUNCTION public.update_inspection_statistics();

-- Function to schedule next inspection
CREATE OR REPLACE FUNCTION public.schedule_next_inspection()
RETURNS TRIGGER AS $$
DECLARE
  checklist_frequency INTEGER;
BEGIN
  -- Only schedule when inspection is completed
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at != NEW.completed_at) THEN
    -- Get checklist frequency
    SELECT frequency_days INTO checklist_frequency
    FROM inspection_checklists 
    WHERE id = NEW.checklist_id;
    
    -- Calculate and set next inspection date
    NEW.next_inspection_date := NEW.completed_at::date + (checklist_frequency || ' days')::interval;
    
    -- Update equipment's next inspection date
    UPDATE equipment 
    SET next_maintenance_date = NEW.next_inspection_date
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for scheduling next inspection
CREATE TRIGGER schedule_next_inspection_trigger
  BEFORE UPDATE ON public.safety_inspections
  FOR EACH ROW EXECUTE FUNCTION public.schedule_next_inspection();

-- Insert default inspection checklists for common equipment types
INSERT INTO public.inspection_checklists (organization_id, checklist_name, equipment_type, description, frequency_days, created_by) VALUES
-- Note: These will be inserted by the application after user creates organization
-- This is just the structure for reference