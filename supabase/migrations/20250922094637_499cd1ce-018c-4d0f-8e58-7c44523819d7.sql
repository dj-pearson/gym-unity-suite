-- Create pool management tables
CREATE TABLE public.pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  pool_type TEXT NOT NULL DEFAULT 'indoor',
  length_meters NUMERIC,
  width_meters NUMERIC,
  depth_min_meters NUMERIC,
  depth_max_meters NUMERIC,
  lane_count INTEGER DEFAULT 8,
  capacity_max INTEGER,
  temperature_celsius NUMERIC,
  ph_level NUMERIC,
  chlorine_level NUMERIC,
  alkalinity_level NUMERIC,
  is_active BOOLEAN DEFAULT true,
  location_id UUID,
  operating_hours JSONB DEFAULT '{}',
  amenities JSONB DEFAULT '[]',
  safety_equipment JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Pool maintenance schedules
CREATE TABLE public.pool_maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 7,
  estimated_duration_minutes INTEGER DEFAULT 60,
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  is_active BOOLEAN DEFAULT true,
  requires_pool_closure BOOLEAN DEFAULT false,
  equipment_needed JSONB DEFAULT '[]',
  safety_requirements JSONB DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool maintenance logs
CREATE TABLE public.pool_maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL,
  schedule_id UUID,
  maintenance_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  cost NUMERIC,
  vendor_id UUID,
  water_chemistry_before JSONB DEFAULT '{}',
  water_chemistry_after JSONB DEFAULT '{}',
  issues_found TEXT,
  actions_taken TEXT,
  next_maintenance_date DATE,
  photos_taken INTEGER DEFAULT 0,
  certification_required BOOLEAN DEFAULT false,
  certified_by UUID,
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tournament management tables
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  member_id UUID NOT NULL,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  seed_number INTEGER,
  status TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID,
  player2_id UUID,
  winner_id UUID,
  court_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pools
CREATE POLICY "Staff can manage pools" ON public.pools
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Members can view pools" ON public.pools
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for pool maintenance schedules
CREATE POLICY "Staff can manage pool maintenance schedules" ON public.pool_maintenance_schedules
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for pool maintenance logs
CREATE POLICY "Staff can manage pool maintenance logs" ON public.pool_maintenance_logs
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for tournament participants
CREATE POLICY "Members can register for tournaments" ON public.tournament_participants
FOR INSERT WITH CHECK (
  member_id = auth.uid() AND
  tournament_id IN (
    SELECT id FROM tournaments 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Members can view tournament participants" ON public.tournament_participants
FOR SELECT USING (
  tournament_id IN (
    SELECT id FROM tournaments 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage tournament participants" ON public.tournament_participants
FOR ALL USING (
  tournament_id IN (
    SELECT id FROM tournaments 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  )
);

-- RLS Policies for tournament matches
CREATE POLICY "Members can view tournament matches" ON public.tournament_matches
FOR SELECT USING (
  tournament_id IN (
    SELECT id FROM tournaments 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage tournament matches" ON public.tournament_matches
FOR ALL USING (
  tournament_id IN (
    SELECT id FROM tournaments 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  )
);

-- Update triggers
CREATE TRIGGER update_pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.pool_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_maintenance_logs_updated_at
  BEFORE UPDATE ON public.pool_maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate next maintenance date
CREATE OR REPLACE FUNCTION public.calculate_next_pool_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
  -- When maintenance is completed, calculate next due date
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.performed_at IS NULL AND NEW.performed_at IS NOT NULL) THEN
    UPDATE public.pool_maintenance_schedules
    SET 
      last_completed_date = NEW.performed_at::date,
      next_due_date = NEW.performed_at::date + (frequency_days || ' days')::interval
    WHERE id = NEW.schedule_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_calculate_next_pool_maintenance_date
  AFTER INSERT OR UPDATE ON public.pool_maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.calculate_next_pool_maintenance_date();