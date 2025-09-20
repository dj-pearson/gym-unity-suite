-- Create guest pass system tables

-- Guest pass types and pricing
CREATE TABLE public.guest_pass_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  validity_hours INTEGER NOT NULL DEFAULT 24,
  includes_amenities TEXT[] DEFAULT '{}',
  max_uses_per_member INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Guest pass purchases and tracking
CREATE TABLE public.guest_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pass_type_id UUID NOT NULL REFERENCES public.guest_pass_types(id),
  purchased_by UUID REFERENCES auth.users(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  used_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily visitor check-ins (separate from member check-ins)
CREATE TABLE public.visitor_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  guest_pass_id UUID REFERENCES public.guest_passes(id),
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  purpose TEXT DEFAULT 'day_pass',
  accompanied_by UUID REFERENCES auth.users(id),
  liability_waiver_signed BOOLEAN DEFAULT false,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Liability waivers
CREATE TABLE public.liability_waivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  visitor_checkin_id UUID REFERENCES public.visitor_checkins(id),
  signee_name TEXT NOT NULL,
  signee_email TEXT,
  signature_data TEXT,
  waiver_content TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  witness_staff_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_pass_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liability_waivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_pass_types
CREATE POLICY "Staff can manage guest pass types"
ON public.guest_pass_types
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Users can view active guest pass types"
ON public.guest_pass_types
FOR SELECT
USING (is_active = true AND organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- RLS Policies for guest_passes
CREATE POLICY "Staff can manage guest passes"
ON public.guest_passes
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Members can view passes they purchased"
ON public.guest_passes
FOR SELECT
USING (purchased_by = auth.uid() OR organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for visitor_checkins
CREATE POLICY "Staff can manage visitor checkins"
ON public.visitor_checkins
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- RLS Policies for liability_waivers
CREATE POLICY "Staff can manage liability waivers"
ON public.liability_waivers
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create indexes for performance
CREATE INDEX idx_guest_passes_organization ON public.guest_passes(organization_id);
CREATE INDEX idx_guest_passes_valid_until ON public.guest_passes(valid_until);
CREATE INDEX idx_visitor_checkins_organization ON public.visitor_checkins(organization_id);
CREATE INDEX idx_visitor_checkins_date ON public.visitor_checkins(check_in_time);

-- Update triggers
CREATE TRIGGER update_guest_pass_types_updated_at
  BEFORE UPDATE ON public.guest_pass_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guest_passes_updated_at
  BEFORE UPDATE ON public.guest_passes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();