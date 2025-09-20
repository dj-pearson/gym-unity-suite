-- Create spa services table
CREATE TABLE public.spa_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL DEFAULT 'massage',
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  base_price NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 0.00,
  requires_certification TEXT[] DEFAULT '{}',
  equipment_needed TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  max_advance_booking_days INTEGER DEFAULT 30,
  min_advance_booking_hours INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spa appointments table
CREATE TABLE public.spa_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.spa_services(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL,
  therapist_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  deposit_paid NUMERIC(10,2) DEFAULT 0.00,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'scheduled',
  special_requests TEXT,
  preparation_notes TEXT,
  post_service_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT spa_appointments_status_check CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT spa_appointments_payment_status_check CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded'))
);

-- Create spa inventory table
CREATE TABLE public.spa_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL DEFAULT 'oil',
  brand TEXT,
  product_code TEXT,
  description TEXT,
  unit_of_measurement TEXT DEFAULT 'ml',
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  maximum_stock INTEGER DEFAULT 100,
  cost_per_unit NUMERIC(10,2) DEFAULT 0.00,
  retail_price NUMERIC(10,2) DEFAULT 0.00,
  supplier_name TEXT,
  supplier_contact TEXT,
  last_restock_date DATE,
  expiry_date DATE,
  storage_location TEXT,
  usage_per_service NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_certification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT spa_inventory_category_check CHECK (product_category IN ('oil', 'lotion', 'cream', 'towel', 'equipment', 'supplement', 'retail'))
);

-- Create spa service packages table
CREATE TABLE public.spa_service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  package_name TEXT NOT NULL,
  description TEXT,
  service_ids UUID[] NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  individual_price NUMERIC(10,2) NOT NULL,
  package_price NUMERIC(10,2) NOT NULL,
  savings_amount NUMERIC(10,2) GENERATED ALWAYS AS (individual_price - package_price) STORED,
  max_validity_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create therapist availability table
CREATE TABLE public.therapist_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  therapist_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_available BOOLEAN DEFAULT true,
  specializations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (therapist_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE public.spa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spa_services
CREATE POLICY "Members can view active spa services" 
ON public.spa_services 
FOR SELECT 
USING (
  is_active = true 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can manage spa services" 
ON public.spa_services 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for spa_appointments
CREATE POLICY "Members can view their own spa appointments" 
ON public.spa_appointments 
FOR SELECT 
USING (
  member_id = auth.uid() 
  OR therapist_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Members can book spa appointments" 
ON public.spa_appointments 
FOR INSERT 
WITH CHECK (
  member_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Therapists and staff can manage spa appointments" 
ON public.spa_appointments 
FOR ALL 
USING (
  therapist_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for spa_inventory
CREATE POLICY "Staff can manage spa inventory" 
ON public.spa_inventory 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for spa_service_packages
CREATE POLICY "Members can view active spa packages" 
ON public.spa_service_packages 
FOR SELECT 
USING (
  is_active = true 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can manage spa packages" 
ON public.spa_service_packages 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- RLS Policies for therapist_availability
CREATE POLICY "Members can view therapist availability" 
ON public.therapist_availability 
FOR SELECT 
USING (
  is_available = true 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Therapists can manage their own availability" 
ON public.therapist_availability 
FOR ALL 
USING (
  therapist_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- Create indexes for performance
CREATE INDEX idx_spa_services_organization_active ON public.spa_services(organization_id, is_active);
CREATE INDEX idx_spa_appointments_organization_date ON public.spa_appointments(organization_id, appointment_date);
CREATE INDEX idx_spa_appointments_therapist_date ON public.spa_appointments(therapist_id, appointment_date);
CREATE INDEX idx_spa_appointments_member ON public.spa_appointments(member_id);
CREATE INDEX idx_spa_inventory_organization_active ON public.spa_inventory(organization_id, is_active);
CREATE INDEX idx_spa_inventory_stock_level ON public.spa_inventory(organization_id, current_stock, minimum_stock);
CREATE INDEX idx_therapist_availability_therapist_day ON public.therapist_availability(therapist_id, day_of_week);

-- Create triggers for updated_at
CREATE TRIGGER update_spa_services_updated_at 
BEFORE UPDATE ON public.spa_services 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spa_appointments_updated_at 
BEFORE UPDATE ON public.spa_appointments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spa_inventory_updated_at 
BEFORE UPDATE ON public.spa_inventory 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spa_service_packages_updated_at 
BEFORE UPDATE ON public.spa_service_packages 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_therapist_availability_updated_at 
BEFORE UPDATE ON public.therapist_availability 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();