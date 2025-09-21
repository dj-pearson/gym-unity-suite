-- Corporate Membership Management System

-- Corporate accounts table
CREATE TABLE public.corporate_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_address TEXT,
  tax_id TEXT,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  total_member_allocation INTEGER NOT NULL DEFAULT 0,
  used_member_allocation INTEGER NOT NULL DEFAULT 0,
  monthly_rate_per_member DECIMAL(10,2) NOT NULL,
  setup_fee DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  auto_billing BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),
  account_manager_id UUID,
  payment_terms TEXT DEFAULT '30 days',
  special_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Corporate membership plans (special corporate rates)
CREATE TABLE public.corporate_membership_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  corporate_account_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  description TEXT,
  monthly_rate DECIMAL(10,2) NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'standard' CHECK (access_level IN ('basic', 'standard', 'premium', 'executive')),
  included_services JSONB DEFAULT '[]'::jsonb,
  excluded_services JSONB DEFAULT '[]'::jsonb,
  guest_privileges INTEGER DEFAULT 0,
  class_booking_priority BOOLEAN DEFAULT false,
  personal_training_discount DECIMAL(5,2) DEFAULT 0,
  retail_discount DECIMAL(5,2) DEFAULT 0,
  parking_included BOOLEAN DEFAULT false,
  locker_included BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link individual members to corporate accounts
CREATE TABLE public.corporate_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_account_id UUID NOT NULL,
  member_id UUID NOT NULL,
  corporate_plan_id UUID,
  employee_id TEXT,
  department TEXT,
  job_title TEXT,
  manager_member_id UUID, -- For hierarchical relationships
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  billing_responsibility TEXT DEFAULT 'corporate' CHECK (billing_responsibility IN ('corporate', 'employee', 'shared')),
  employee_contribution DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(corporate_account_id, member_id)
);

-- Corporate invoicing and billing
CREATE TABLE public.corporate_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  corporate_account_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_due_date DATE,
  payment_received_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  late_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Corporate invoice line items (for detailed billing)
CREATE TABLE public.corporate_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  member_id UUID,
  item_type TEXT NOT NULL CHECK (item_type IN ('membership', 'personal_training', 'classes', 'retail', 'fee', 'other')),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bulk member operations tracking
CREATE TABLE public.bulk_member_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  corporate_account_id UUID,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('bulk_add', 'bulk_update', 'bulk_suspend', 'bulk_terminate', 'bulk_transfer')),
  initiated_by UUID NOT NULL,
  total_members INTEGER DEFAULT 0,
  processed_members INTEGER DEFAULT 0,
  failed_members INTEGER DEFAULT 0,
  operation_data JSONB DEFAULT '{}'::jsonb,
  error_log JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_member_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corporate_accounts
CREATE POLICY "Staff can manage corporate accounts" 
ON public.corporate_accounts 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
));

-- RLS Policies for corporate_membership_plans
CREATE POLICY "Staff can manage corporate plans" 
ON public.corporate_membership_plans 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
));

-- RLS Policies for corporate_members
CREATE POLICY "Staff can manage corporate members" 
ON public.corporate_members 
FOR ALL 
USING (corporate_account_id IN (
  SELECT id FROM corporate_accounts 
  WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
  )
));

CREATE POLICY "Members can view their corporate info" 
ON public.corporate_members 
FOR SELECT 
USING (member_id = auth.uid());

-- RLS Policies for corporate_invoices
CREATE POLICY "Staff can manage corporate invoices" 
ON public.corporate_invoices 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
));

-- RLS Policies for corporate_invoice_items
CREATE POLICY "Staff can manage invoice items" 
ON public.corporate_invoice_items 
FOR ALL 
USING (invoice_id IN (
  SELECT id FROM corporate_invoices 
  WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
  )
));

-- RLS Policies for bulk_member_operations
CREATE POLICY "Staff can manage bulk operations" 
ON public.bulk_member_operations 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner', 'manager', 'staff'])
));

-- Indexes for performance
CREATE INDEX idx_corporate_accounts_org_id ON public.corporate_accounts(organization_id);
CREATE INDEX idx_corporate_accounts_status ON public.corporate_accounts(status);
CREATE INDEX idx_corporate_members_account_id ON public.corporate_members(corporate_account_id);
CREATE INDEX idx_corporate_members_member_id ON public.corporate_members(member_id);
CREATE INDEX idx_corporate_members_manager ON public.corporate_members(manager_member_id);
CREATE INDEX idx_corporate_invoices_account_id ON public.corporate_invoices(corporate_account_id);
CREATE INDEX idx_corporate_invoices_status ON public.corporate_invoices(status);
CREATE INDEX idx_corporate_invoices_due_date ON public.corporate_invoices(payment_due_date);
CREATE INDEX idx_invoice_items_invoice_id ON public.corporate_invoice_items(invoice_id);

-- Triggers for updated_at
CREATE TRIGGER update_corporate_accounts_updated_at
  BEFORE UPDATE ON public.corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_membership_plans_updated_at
  BEFORE UPDATE ON public.corporate_membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_members_updated_at
  BEFORE UPDATE ON public.corporate_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_invoices_updated_at
  BEFORE UPDATE ON public.corporate_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update member allocation counts
CREATE OR REPLACE FUNCTION public.update_corporate_member_allocation()
RETURNS trigger AS $$
BEGIN
  -- Update used allocation count when members are added/removed/changed
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE public.corporate_accounts 
    SET used_member_allocation = used_member_allocation + 1
    WHERE id = NEW.corporate_account_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Member became active
    IF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE public.corporate_accounts 
      SET used_member_allocation = used_member_allocation + 1
      WHERE id = NEW.corporate_account_id;
    -- Member became inactive
    ELSIF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE public.corporate_accounts 
      SET used_member_allocation = GREATEST(used_member_allocation - 1, 0)
      WHERE id = NEW.corporate_account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE public.corporate_accounts 
    SET used_member_allocation = GREATEST(used_member_allocation - 1, 0)
    WHERE id = OLD.corporate_account_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for allocation tracking
CREATE TRIGGER update_member_allocation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.corporate_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_corporate_member_allocation();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_corporate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate invoice number: CORP + YYYYMM + 6 random digits
    new_number := 'CORP' || to_char(CURRENT_DATE, 'YYYYMM') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM public.corporate_invoices WHERE invoice_number = new_number) INTO number_exists;
    
    IF NOT number_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to set invoice number
CREATE OR REPLACE FUNCTION public.set_corporate_invoice_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_corporate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON public.corporate_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_corporate_invoice_number();