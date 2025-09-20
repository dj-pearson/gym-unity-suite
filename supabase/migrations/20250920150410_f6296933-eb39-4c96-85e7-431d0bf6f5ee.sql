-- Create locker management system tables

-- Locker inventory and specifications
CREATE TABLE public.lockers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  locker_number TEXT NOT NULL,
  locker_type TEXT NOT NULL DEFAULT 'standard',
  size_category TEXT NOT NULL DEFAULT 'medium',
  has_lock BOOLEAN DEFAULT true,
  lock_type TEXT DEFAULT 'combination',
  lock_combination TEXT,
  key_number TEXT,
  monthly_rate NUMERIC DEFAULT 10.00,
  daily_rate NUMERIC DEFAULT 2.00,
  deposit_amount NUMERIC DEFAULT 25.00,
  is_available BOOLEAN DEFAULT true,
  is_out_of_order BOOLEAN DEFAULT false,
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, locker_number)
);

-- Locker rental agreements
CREATE TABLE public.locker_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  locker_id UUID NOT NULL REFERENCES public.lockers(id),
  member_id UUID NOT NULL,
  rental_type TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_rate NUMERIC NOT NULL,
  deposit_paid NUMERIC DEFAULT 0,
  deposit_refunded BOOLEAN DEFAULT false,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  payment_method TEXT DEFAULT 'auto',
  last_payment_date DATE,
  next_payment_due DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Locker maintenance and inspection logs
CREATE TABLE public.locker_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  locker_id UUID NOT NULL REFERENCES public.lockers(id),
  maintenance_type TEXT NOT NULL DEFAULT 'inspection',
  performed_by UUID REFERENCES auth.users(id),
  maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  issue_description TEXT,
  resolution_notes TEXT,
  parts_replaced TEXT[],
  labor_time_minutes INTEGER,
  cost NUMERIC DEFAULT 0,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  status TEXT NOT NULL DEFAULT 'completed',
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Locker access history and audit trail  
CREATE TABLE public.locker_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  locker_id UUID NOT NULL REFERENCES public.lockers(id),
  member_id UUID,
  staff_id UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL DEFAULT 'member_access',
  access_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_method TEXT DEFAULT 'combination',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lockers
CREATE POLICY "Staff can manage lockers"
ON public.lockers
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Members can view available lockers"
ON public.lockers
FOR SELECT
USING ((is_available = true AND is_out_of_order = false) AND organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- RLS Policies for locker_rentals
CREATE POLICY "Staff can manage locker rentals"
ON public.locker_rentals
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Members can view their own rentals"
ON public.locker_rentals
FOR SELECT
USING (member_id = auth.uid() OR organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for locker_maintenance
CREATE POLICY "Staff can manage locker maintenance"
ON public.locker_maintenance
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for locker_access_log
CREATE POLICY "Staff can manage access logs"
ON public.locker_access_log
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Members can view their own access logs"
ON public.locker_access_log
FOR SELECT
USING (member_id = auth.uid() OR organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create indexes for performance
CREATE INDEX idx_lockers_organization ON public.lockers(organization_id);
CREATE INDEX idx_lockers_available ON public.lockers(organization_id, is_available, is_out_of_order);
CREATE INDEX idx_locker_rentals_organization ON public.locker_rentals(organization_id);
CREATE INDEX idx_locker_rentals_member ON public.locker_rentals(member_id);
CREATE INDEX idx_locker_rentals_active ON public.locker_rentals(organization_id, status);
CREATE INDEX idx_locker_maintenance_organization ON public.locker_maintenance(organization_id);
CREATE INDEX idx_locker_access_log_time ON public.locker_access_log(access_time);

-- Update triggers
CREATE TRIGGER update_lockers_updated_at
  BEFORE UPDATE ON public.lockers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locker_rentals_updated_at
  BEFORE UPDATE ON public.locker_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locker_maintenance_updated_at
  BEFORE UPDATE ON public.locker_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically set next payment due date
CREATE OR REPLACE FUNCTION public.calculate_next_payment_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rental_type = 'monthly' THEN
    NEW.next_payment_due := NEW.start_date + INTERVAL '1 month';
  ELSIF NEW.rental_type = 'quarterly' THEN
    NEW.next_payment_due := NEW.start_date + INTERVAL '3 months';
  ELSIF NEW.rental_type = 'annual' THEN
    NEW.next_payment_due := NEW.start_date + INTERVAL '1 year';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to calculate payment due dates
CREATE TRIGGER calculate_payment_due_date
  BEFORE INSERT ON public.locker_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_next_payment_due();