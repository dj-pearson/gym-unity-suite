-- Create child profiles table
CREATE TABLE public.child_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  parent_member_id UUID NOT NULL,
  child_first_name TEXT NOT NULL,
  child_last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  dietary_restrictions TEXT,
  special_instructions TEXT,
  authorized_pickup_contacts JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT child_profiles_gender_check CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
);

-- Create childcare activities table
CREATE TABLE public.childcare_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  activity_name TEXT NOT NULL,
  description TEXT,
  age_group_min_months INTEGER NOT NULL DEFAULT 0,
  age_group_max_months INTEGER NOT NULL DEFAULT 144, -- 12 years
  max_participants INTEGER DEFAULT 15,
  staff_ratio_requirement INTEGER DEFAULT 8, -- 1 staff per X children
  activity_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location_room TEXT,
  equipment_needed TEXT[] DEFAULT '{}',
  activity_fee NUMERIC(10,2) DEFAULT 0.00,
  requires_registration BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMPTZ,
  activity_type TEXT DEFAULT 'play',
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  assigned_staff UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT childcare_activities_type_check CHECK (activity_type IN ('play', 'education', 'arts_crafts', 'story_time', 'outdoor', 'free_play')),
  CONSTRAINT childcare_activities_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- Create childcare check-ins table
CREATE TABLE public.childcare_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.childcare_activities(id) ON DELETE SET NULL,
  parent_member_id UUID NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_time TIMESTAMPTZ,
  checked_in_by UUID NOT NULL,
  checked_out_by UUID,
  drop_off_notes TEXT,
  pick_up_notes TEXT,
  child_condition_checkin TEXT DEFAULT 'good',
  child_condition_checkout TEXT,
  authorized_pickup_person TEXT,
  pickup_person_id TEXT,
  incident_occurred BOOLEAN DEFAULT false,
  incident_description TEXT,
  diaper_changes INTEGER DEFAULT 0,
  meals_eaten TEXT[],
  nap_start_time TIMESTAMPTZ,
  nap_end_time TIMESTAMPTZ,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  activities_participated TEXT[],
  status TEXT DEFAULT 'checked_in',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT childcare_checkins_status_check CHECK (status IN ('checked_in', 'checked_out', 'emergency_pickup')),
  CONSTRAINT childcare_checkins_condition_check CHECK (
    child_condition_checkin IN ('excellent', 'good', 'fair', 'sick', 'upset') AND
    (child_condition_checkout IS NULL OR child_condition_checkout IN ('excellent', 'good', 'fair', 'sick', 'upset'))
  )
);

-- Create childcare activity registrations table
CREATE TABLE public.childcare_activity_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  activity_id UUID NOT NULL REFERENCES public.childcare_activities(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  parent_member_id UUID NOT NULL,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (activity_id, child_id),
  CONSTRAINT childcare_registrations_payment_check CHECK (payment_status IN ('pending', 'paid', 'waived', 'refunded'))
);

-- Create childcare staff schedules table
CREATE TABLE public.childcare_staff_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  max_children_capacity INTEGER DEFAULT 8,
  current_children_count INTEGER DEFAULT 0,
  room_assignment TEXT,
  age_group_specialization TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (staff_id, schedule_date, start_time)
);

-- Create childcare daily reports table
CREATE TABLE public.childcare_daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  meals JSON DEFAULT '[]'::json,
  naps JSON DEFAULT '[]'::json,
  diaper_changes JSON DEFAULT '[]'::json,
  activities JSON DEFAULT '[]'::json,
  mood_observations TEXT,
  learning_milestones TEXT,
  social_interactions TEXT,
  parent_communication TEXT,
  photos_taken INTEGER DEFAULT 0,
  incidents JSON DEFAULT '[]'::json,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  staff_notes TEXT,
  parent_signature_required BOOLEAN DEFAULT false,
  parent_signed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (child_id, report_date)
);

-- Enable RLS
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_activity_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for child_profiles
CREATE POLICY "Parents can view their own children profiles" 
ON public.child_profiles 
FOR SELECT 
USING (
  parent_member_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Parents can create child profiles" 
ON public.child_profiles 
FOR INSERT 
WITH CHECK (
  parent_member_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Parents and staff can update child profiles" 
ON public.child_profiles 
FOR UPDATE 
USING (
  parent_member_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Staff can manage child profiles" 
ON public.child_profiles 
FOR DELETE 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role])
  )
);

-- RLS Policies for childcare_activities
CREATE POLICY "Members can view childcare activities" 
ON public.childcare_activities 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can manage childcare activities" 
ON public.childcare_activities 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for childcare_checkins
CREATE POLICY "Parents can view their children check-ins" 
ON public.childcare_checkins 
FOR SELECT 
USING (
  parent_member_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Staff can manage all check-ins" 
ON public.childcare_checkins 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for childcare_activity_registrations
CREATE POLICY "Parents can register their children" 
ON public.childcare_activity_registrations 
FOR ALL 
USING (
  parent_member_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for childcare_staff_schedules
CREATE POLICY "Staff can view schedules" 
ON public.childcare_staff_schedules 
FOR SELECT 
USING (
  staff_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Staff can manage their own schedules" 
ON public.childcare_staff_schedules 
FOR ALL 
USING (
  staff_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role])
  )
);

-- RLS Policies for childcare_daily_reports
CREATE POLICY "Parents can view their children reports" 
ON public.childcare_daily_reports 
FOR SELECT 
USING (
  child_id IN (
    SELECT id FROM child_profiles WHERE parent_member_id = auth.uid()
  )
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Staff can manage daily reports" 
ON public.childcare_daily_reports 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- Create indexes for performance
CREATE INDEX idx_child_profiles_organization_parent ON public.child_profiles(organization_id, parent_member_id);
CREATE INDEX idx_child_profiles_date_of_birth ON public.child_profiles(date_of_birth);
CREATE INDEX idx_childcare_activities_organization_date ON public.childcare_activities(organization_id, activity_date);
CREATE INDEX idx_childcare_activities_age_group ON public.childcare_activities(age_group_min_months, age_group_max_months);
CREATE INDEX idx_childcare_checkins_organization ON public.childcare_checkins(organization_id);
CREATE INDEX idx_childcare_checkins_child ON public.childcare_checkins(child_id);
CREATE INDEX idx_childcare_checkins_status ON public.childcare_checkins(status, check_out_time);
CREATE INDEX idx_childcare_staff_schedules_date_staff ON public.childcare_staff_schedules(schedule_date, staff_id);
CREATE INDEX idx_childcare_daily_reports_child_date ON public.childcare_daily_reports(child_id, report_date);

-- Create triggers for updated_at
CREATE TRIGGER update_child_profiles_updated_at 
BEFORE UPDATE ON public.child_profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_childcare_activities_updated_at 
BEFORE UPDATE ON public.childcare_activities 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_childcare_checkins_updated_at 
BEFORE UPDATE ON public.childcare_checkins 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_childcare_activity_registrations_updated_at 
BEFORE UPDATE ON public.childcare_activity_registrations 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_childcare_staff_schedules_updated_at 
BEFORE UPDATE ON public.childcare_staff_schedules 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_childcare_daily_reports_updated_at 
BEFORE UPDATE ON public.childcare_daily_reports 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Utility function to calculate child age in months
CREATE OR REPLACE FUNCTION public.calculate_child_age_months(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date)) * 12 + 
         EXTRACT(MONTH FROM age(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;