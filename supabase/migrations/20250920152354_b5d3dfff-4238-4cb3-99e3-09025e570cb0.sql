-- Create pool/aquatic center management tables
CREATE TABLE public.pool_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  pool_name TEXT NOT NULL,
  pool_type TEXT NOT NULL DEFAULT 'indoor', -- indoor, outdoor, heated, therapy, lap, recreational
  length_meters NUMERIC,
  width_meters NUMERIC,
  depth_min NUMERIC,
  depth_max NUMERIC,
  lane_count INTEGER DEFAULT 6,
  temperature_target NUMERIC DEFAULT 78.0,
  is_heated BOOLEAN DEFAULT true,
  has_diving_board BOOLEAN DEFAULT false,
  has_slides BOOLEAN DEFAULT false,
  capacity_max INTEGER DEFAULT 50,
  is_available BOOLEAN DEFAULT true,
  is_closed_for_maintenance BOOLEAN DEFAULT false,
  operating_hours_start TIME DEFAULT '06:00',
  operating_hours_end TIME DEFAULT '22:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  safety_notes TEXT,
  amenities TEXT[]
);

-- Create pool lane reservations table
CREATE TABLE public.pool_lane_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.pool_facilities(id) ON DELETE CASCADE,
  lane_number INTEGER NOT NULL,
  member_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  purpose TEXT DEFAULT 'lap_swimming', -- lap_swimming, training, private_lesson, therapy
  hourly_rate NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  special_equipment TEXT[],
  special_requests TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'confirmed'
);

-- Create swim lessons table
CREATE TABLE public.swim_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.pool_facilities(id),
  instructor_id UUID NOT NULL,
  lesson_name TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'group', -- private, semi_private, group
  skill_level TEXT NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced, competitive
  max_participants INTEGER DEFAULT 8,
  age_group TEXT DEFAULT 'adult', -- toddler, child, teen, adult, senior, all_ages
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  lesson_fee NUMERIC NOT NULL,
  recurring_schedule TEXT, -- weekly, biweekly, monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  requirements TEXT,
  equipment_provided TEXT[],
  status TEXT NOT NULL DEFAULT 'scheduled'
);

-- Create swim lesson enrollments table
CREATE TABLE public.swim_lesson_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.swim_lessons(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  enrollment_status TEXT DEFAULT 'enrolled', -- enrolled, waitlisted, completed, cancelled
  payment_status TEXT DEFAULT 'pending',
  payment_amount NUMERIC NOT NULL,
  special_needs TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create lifeguard schedules table
CREATE TABLE public.lifeguard_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.pool_facilities(id),
  lifeguard_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_type TEXT DEFAULT 'regular', -- regular, break_coverage, event_coverage, training
  is_head_lifeguard BOOLEAN DEFAULT false,
  certification_expires DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, no_show, cancelled
  notes TEXT
);

-- Create water quality logs table
CREATE TABLE public.water_quality_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.pool_facilities(id),
  tested_by UUID NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_time TIME NOT NULL DEFAULT CURRENT_TIME,
  ph_level NUMERIC,
  chlorine_ppm NUMERIC,
  alkalinity_ppm NUMERIC,
  temperature_fahrenheit NUMERIC,
  clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  bacteria_count INTEGER,
  chemical_balance_ok BOOLEAN DEFAULT true,
  action_required TEXT,
  actions_taken TEXT,
  next_test_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  compliance_status TEXT DEFAULT 'compliant' -- compliant, warning, critical
);

-- Create pool maintenance logs table
CREATE TABLE public.pool_maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.pool_facilities(id),
  maintenance_type TEXT NOT NULL, -- cleaning, chemical_treatment, equipment_repair, inspection
  performed_by UUID NOT NULL,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  end_time TIME,
  scheduled_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  equipment_used TEXT[],
  chemicals_used JSONB, -- {chemical_name: amount_used}
  issues_found TEXT,
  actions_performed TEXT NOT NULL,
  followup_required BOOLEAN DEFAULT false,
  followup_due_date DATE,
  cost_estimate NUMERIC,
  actual_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  maintenance_status TEXT DEFAULT 'completed', -- scheduled, in_progress, completed, delayed
  priority_level TEXT DEFAULT 'medium', -- low, medium, high, emergency
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.pool_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_lane_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swim_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swim_lesson_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifeguard_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pool_facilities
CREATE POLICY "Members can view available pools" ON public.pool_facilities
  FOR SELECT USING (
    is_available = true AND 
    is_closed_for_maintenance = false AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage pools" ON public.pool_facilities
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for pool_lane_reservations
CREATE POLICY "Members can view their own reservations" ON public.pool_lane_reservations
  FOR SELECT USING (
    member_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

CREATE POLICY "Members can create lane reservations" ON public.pool_lane_reservations
  FOR INSERT WITH CHECK (
    member_id = auth.uid() AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage lane reservations" ON public.pool_lane_reservations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for swim_lessons
CREATE POLICY "Members can view swim lessons" ON public.swim_lessons
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff and instructors can manage swim lessons" ON public.swim_lessons
  FOR ALL USING (
    instructor_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for swim_lesson_enrollments
CREATE POLICY "Members can view their own enrollments" ON public.swim_lesson_enrollments
  FOR SELECT USING (
    member_id = auth.uid() OR 
    lesson_id IN (
      SELECT id FROM swim_lessons 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
      )
    )
  );

CREATE POLICY "Members can enroll in lessons" ON public.swim_lesson_enrollments
  FOR INSERT WITH CHECK (
    member_id = auth.uid()
  );

CREATE POLICY "Staff can manage enrollments" ON public.swim_lesson_enrollments
  FOR ALL USING (
    lesson_id IN (
      SELECT id FROM swim_lessons 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
      )
    )
  );

-- RLS Policies for lifeguard_schedules
CREATE POLICY "Lifeguards can view their schedules" ON public.lifeguard_schedules
  FOR SELECT USING (
    lifeguard_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

CREATE POLICY "Staff can manage lifeguard schedules" ON public.lifeguard_schedules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for water_quality_logs
CREATE POLICY "Staff can manage water quality logs" ON public.water_quality_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for pool_maintenance_logs
CREATE POLICY "Staff can manage maintenance logs" ON public.pool_maintenance_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- Create indexes for performance
CREATE INDEX idx_pool_facilities_organization ON public.pool_facilities(organization_id);
CREATE INDEX idx_pool_lane_reservations_organization ON public.pool_lane_reservations(organization_id);
CREATE INDEX idx_pool_lane_reservations_member ON public.pool_lane_reservations(member_id);
CREATE INDEX idx_pool_lane_reservations_date ON public.pool_lane_reservations(reservation_date, start_time);
CREATE INDEX idx_swim_lessons_organization ON public.swim_lessons(organization_id);
CREATE INDEX idx_swim_lessons_instructor ON public.swim_lessons(instructor_id);
CREATE INDEX idx_swim_lesson_enrollments_member ON public.swim_lesson_enrollments(member_id);
CREATE INDEX idx_lifeguard_schedules_organization ON public.lifeguard_schedules(organization_id);
CREATE INDEX idx_lifeguard_schedules_lifeguard ON public.lifeguard_schedules(lifeguard_id);
CREATE INDEX idx_water_quality_logs_pool ON public.water_quality_logs(pool_id, test_date);
CREATE INDEX idx_pool_maintenance_logs_pool ON public.pool_maintenance_logs(pool_id, maintenance_date);

-- Add update triggers
CREATE TRIGGER update_pool_facilities_updated_at
  BEFORE UPDATE ON public.pool_facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_lane_reservations_updated_at
  BEFORE UPDATE ON public.pool_lane_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swim_lessons_updated_at
  BEFORE UPDATE ON public.swim_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swim_lesson_enrollments_updated_at
  BEFORE UPDATE ON public.swim_lesson_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lifeguard_schedules_updated_at
  BEFORE UPDATE ON public.lifeguard_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_water_quality_logs_updated_at
  BEFORE UPDATE ON public.water_quality_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pool_maintenance_logs_updated_at
  BEFORE UPDATE ON public.pool_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();