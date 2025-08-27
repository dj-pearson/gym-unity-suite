-- Create lead sources table for tracking where leads come from
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'digital', -- digital, referral, walk_in, advertising
  tracking_url TEXT,
  utm_parameters JSONB,
  cost_per_lead NUMERIC(10,2),
  conversion_rate NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create facility tours table
CREATE TABLE public.facility_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  tour_type TEXT NOT NULL DEFAULT 'general', -- general, personal_training, group_fitness
  guide_id UUID, -- staff member conducting tour
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  outcome TEXT, -- interested, not_interested, follow_up_needed
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales quotes table
CREATE TABLE public.sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  quote_number TEXT NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, accepted, expired, rejected
  valid_until DATE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms_conditions TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quote line items table
CREATE TABLE public.quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- membership_plan, personal_training, addon
  item_id UUID, -- reference to membership_plan or other service
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'general', -- welcome, follow_up, promotion, reminder
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_sources
CREATE POLICY "Staff can manage lead sources" ON public.lead_sources
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for facility_tours
CREATE POLICY "Staff can manage facility tours" ON public.facility_tours
FOR ALL USING (lead_id IN (
  SELECT id FROM leads WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for sales_quotes
CREATE POLICY "Staff can manage sales quotes" ON public.sales_quotes
FOR ALL USING (lead_id IN (
  SELECT id FROM leads WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for quote_line_items
CREATE POLICY "Staff can manage quote line items" ON public.quote_line_items
FOR ALL USING (quote_id IN (
  SELECT id FROM sales_quotes WHERE lead_id IN (
    SELECT id FROM leads WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  )
));

-- Create RLS policies for email_templates
CREATE POLICY "Staff can manage email templates" ON public.email_templates
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_lead_sources_updated_at
BEFORE UPDATE ON public.lead_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_tours_updated_at
BEFORE UPDATE ON public.facility_tours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_quotes_updated_at
BEFORE UPDATE ON public.sales_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraints
ALTER TABLE public.lead_sources ADD CONSTRAINT lead_sources_name_org_unique 
UNIQUE (organization_id, name);

ALTER TABLE public.sales_quotes ADD CONSTRAINT sales_quotes_number_unique 
UNIQUE (quote_number);

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_name_org_unique 
UNIQUE (organization_id, name);