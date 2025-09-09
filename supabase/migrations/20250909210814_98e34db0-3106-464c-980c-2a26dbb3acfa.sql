-- Create maintenance_schedules table
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL DEFAULT 'routine',
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
  assigned_to UUID,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'scheduled',
  completion_date TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  cost NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_logs table
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  maintenance_schedule_id UUID,
  performed_by UUID NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  cost NUMERIC(10,2),
  parts_used TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for maintenance_schedules
CREATE POLICY "Staff can manage maintenance schedules" 
ON public.maintenance_schedules 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

CREATE POLICY "Assigned staff can view their maintenance tasks" 
ON public.maintenance_schedules 
FOR SELECT 
USING (assigned_to = auth.uid() OR organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for maintenance_logs
CREATE POLICY "Staff can manage maintenance logs" 
ON public.maintenance_logs 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create update triggers
CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON public.maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();