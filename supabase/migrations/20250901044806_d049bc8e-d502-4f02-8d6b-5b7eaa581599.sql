-- Create instructor_availability table
CREATE TABLE public.instructor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource_bookings table
CREATE TABLE public.resource_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('equipment', 'room')),
  booked_by UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructor_availability
CREATE POLICY "Instructors can manage their own availability" 
ON public.instructor_availability 
FOR ALL 
USING (instructor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  AND organization_id = (
    SELECT organization_id FROM profiles WHERE id = instructor_availability.instructor_id
  )
));

CREATE POLICY "Users can view instructor availability" 
ON public.instructor_availability 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p1, profiles p2
  WHERE p1.id = auth.uid() 
  AND p2.id = instructor_availability.instructor_id
  AND p1.organization_id = p2.organization_id
));

-- RLS policies for resource_bookings
CREATE POLICY "Users can manage their own resource bookings" 
ON public.resource_bookings 
FOR ALL 
USING (booked_by = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  AND organization_id = (
    SELECT organization_id FROM profiles WHERE id = resource_bookings.booked_by
  )
));

CREATE POLICY "Users can view resource bookings in their organization" 
ON public.resource_bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p1, profiles p2
  WHERE p1.id = auth.uid() 
  AND p2.id = resource_bookings.booked_by
  AND p1.organization_id = p2.organization_id
));

-- Add triggers for updated_at
CREATE TRIGGER update_instructor_availability_updated_at
  BEFORE UPDATE ON public.instructor_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_bookings_updated_at
  BEFORE UPDATE ON public.resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();