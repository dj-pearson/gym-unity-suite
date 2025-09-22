-- Create missing pool maintenance scheduling tables (only if not exists)
CREATE TABLE IF NOT EXISTS public.pool_maintenance_schedules (
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

CREATE TABLE IF NOT EXISTS public.pool_maintenance_logs (
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

-- Tournament management tables (only if not exists)
CREATE TABLE IF NOT EXISTS public.tournament_matches (
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

-- Enable RLS (with IF NOT EXISTS equivalent check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pool_maintenance_schedules' AND policyname = 'Staff can manage pool maintenance schedules'
  ) THEN
    ALTER TABLE public.pool_maintenance_schedules ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Staff can manage pool maintenance schedules" ON public.pool_maintenance_schedules
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'staff')
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pool_maintenance_logs' AND policyname = 'Staff can manage pool maintenance logs'
  ) THEN
    ALTER TABLE public.pool_maintenance_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Staff can manage pool maintenance logs" ON public.pool_maintenance_logs
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'manager', 'staff')
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tournament_matches' AND policyname = 'Members can view tournament matches'
  ) THEN
    ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
    
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
  END IF;
END $$;