-- Add salesperson tracking and commission system tables

-- Add salesperson fields to leads table
ALTER TABLE public.leads 
ADD COLUMN entered_by UUID REFERENCES public.profiles(id),
ADD COLUMN assigned_salesperson UUID REFERENCES public.profiles(id),
ADD COLUMN referral_code TEXT,
ADD COLUMN attribution_status TEXT DEFAULT 'confirmed' CHECK (attribution_status IN ('confirmed', 'disputed', 'pending_approval'));

-- Create salesperson commission settings table
CREATE TABLE public.salesperson_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id),
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'flat_rate')),
  commission_value NUMERIC NOT NULL,
  revenue_basis TEXT NOT NULL CHECK (revenue_basis IN ('total_contract', 'monthly_recurring', 'first_payment')),
  duration_months INTEGER, -- NULL means indefinite
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create organization commission settings table
CREATE TABLE public.organization_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  default_commission_type TEXT NOT NULL CHECK (default_commission_type IN ('percentage', 'flat_rate')),
  default_commission_value NUMERIC NOT NULL,
  default_revenue_basis TEXT NOT NULL CHECK (default_revenue_basis IN ('total_contract', 'monthly_recurring', 'first_payment')),
  default_duration_months INTEGER,
  allow_split_commissions BOOLEAN DEFAULT false,
  max_split_salespeople INTEGER DEFAULT 2,
  require_manager_approval_for_attribution BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lead split commissions table for multiple salespeople
CREATE TABLE public.lead_split_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id),
  commission_percentage NUMERIC NOT NULL CHECK (commission_percentage > 0 AND commission_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create referral links table
CREATE TABLE public.salesperson_referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id),
  referral_code TEXT NOT NULL UNIQUE,
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, salesperson_id)
);

-- Create attribution disputes table
CREATE TABLE public.lead_attribution_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  disputing_salesperson_id UUID NOT NULL REFERENCES public.profiles(id),
  current_salesperson_id UUID REFERENCES public.profiles(id),
  dispute_reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission calculations table
CREATE TABLE public.commission_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  salesperson_id UUID NOT NULL REFERENCES public.profiles(id),
  membership_id UUID REFERENCES public.memberships(id),
  commission_amount NUMERIC NOT NULL,
  commission_type TEXT NOT NULL,
  revenue_basis TEXT NOT NULL,
  payment_period_start DATE,
  payment_period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.salesperson_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_split_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salesperson_referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_attribution_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salesperson_commissions
CREATE POLICY "Staff can manage salesperson commissions" ON public.salesperson_commissions
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

CREATE POLICY "Salespeople can view their own commissions" ON public.salesperson_commissions
FOR SELECT USING (salesperson_id = auth.uid());

-- RLS Policies for organization_commission_settings
CREATE POLICY "Staff can manage org commission settings" ON public.organization_commission_settings
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role])
));

-- RLS Policies for lead_split_commissions
CREATE POLICY "Staff can manage split commissions" ON public.lead_split_commissions
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- RLS Policies for salesperson_referral_links
CREATE POLICY "Staff can manage referral links" ON public.salesperson_referral_links
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

CREATE POLICY "Salespeople can view their own referral links" ON public.salesperson_referral_links
FOR SELECT USING (salesperson_id = auth.uid());

-- RLS Policies for lead_attribution_disputes
CREATE POLICY "Staff can manage attribution disputes" ON public.lead_attribution_disputes
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- RLS Policies for commission_calculations
CREATE POLICY "Staff can manage commission calculations" ON public.commission_calculations
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "Salespeople can view their own commissions calc" ON public.commission_calculations
FOR SELECT USING (salesperson_id = auth.uid());

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.salesperson_referral_links WHERE referral_code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_salesperson_commissions_updated_at
BEFORE UPDATE ON public.salesperson_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_commission_settings_updated_at
BEFORE UPDATE ON public.organization_commission_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salesperson_referral_links_updated_at
BEFORE UPDATE ON public.salesperson_referral_links  
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_attribution_disputes_updated_at
BEFORE UPDATE ON public.lead_attribution_disputes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_calculations_updated_at
BEFORE UPDATE ON public.commission_calculations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();