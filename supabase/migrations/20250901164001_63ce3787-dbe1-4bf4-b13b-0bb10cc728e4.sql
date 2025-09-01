-- Create personal training sessions table
CREATE TABLE public.personal_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  member_id UUID NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  session_type TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'scheduled',
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training packages table
CREATE TABLE public.training_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  session_count INTEGER NOT NULL,
  session_duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL,
  expiration_days INTEGER NOT NULL DEFAULT 90,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member training packages table (purchased packages)
CREATE TABLE public.member_training_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  package_id UUID NOT NULL,
  sessions_remaining INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trainer availability table
CREATE TABLE public.trainer_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_training_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personal_training_sessions
CREATE POLICY "Members can view their own training sessions"
ON public.personal_training_sessions FOR SELECT
USING (
  (member_id = auth.uid()) OR 
  (trainer_id = auth.uid()) OR
  (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  ))
);

CREATE POLICY "Trainers and staff can manage training sessions"
ON public.personal_training_sessions FOR ALL
USING (
  (trainer_id = auth.uid()) OR
  (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  ))
);

CREATE POLICY "Members can book training sessions"
ON public.personal_training_sessions FOR INSERT
WITH CHECK (
  (member_id = auth.uid()) AND
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
);

-- Create RLS policies for training_packages
CREATE POLICY "Users can view training packages in their organization"
ON public.training_packages FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can manage training packages"
ON public.training_packages FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- Create RLS policies for member_training_packages
CREATE POLICY "Members can view their own training packages"
ON public.member_training_packages FOR SELECT
USING (
  (member_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_training_packages.member_id
    )
  ))
);

CREATE POLICY "Staff can manage member training packages"
ON public.member_training_packages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_training_packages.member_id
    )
  )
);

-- Create RLS policies for trainer_availability
CREATE POLICY "Trainers can manage their own availability"
ON public.trainer_availability FOR ALL
USING (
  (trainer_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = trainer_availability.trainer_id
    )
  ))
);

CREATE POLICY "Users can view trainer availability in their organization"
ON public.trainer_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = trainer_availability.trainer_id 
    AND p1.organization_id = p2.organization_id
  )
);

-- Create update triggers
CREATE TRIGGER update_personal_training_sessions_updated_at
BEFORE UPDATE ON public.personal_training_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_packages_updated_at
BEFORE UPDATE ON public.training_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_availability_updated_at
BEFORE UPDATE ON public.trainer_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();