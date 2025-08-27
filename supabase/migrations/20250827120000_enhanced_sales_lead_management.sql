-- Enhanced Sales & Lead Management Module Database Schema
-- This migration adds comprehensive tables for the complete sales and lead management system

-- Create lead sources table for attribution tracking
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('online', 'referral', 'advertising', 'social_media', 'direct', 'other')),
  description TEXT,
  tracking_code TEXT, -- For digital tracking
  is_active BOOLEAN DEFAULT true,
  cost_per_lead DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create lead scoring rules table
CREATE TABLE public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('demographic', 'behavioral', 'engagement', 'source')),
  criteria_field TEXT NOT NULL, -- Which field to evaluate
  criteria_operator TEXT NOT NULL CHECK (criteria_operator IN ('equals', 'contains', 'greater_than', 'less_than', 'exists')),
  criteria_value TEXT, -- The value to match against
  score_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lead scores tracking table
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  qualification_status TEXT NOT NULL DEFAULT 'unqualified' CHECK (qualification_status IN ('unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity')),
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score_breakdown JSONB, -- Breakdown of how score was calculated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Create sales quotes/proposals table
CREATE TABLE public.sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  quote_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  terms_conditions TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales quote items table
CREATE TABLE public.sales_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.sales_quotes(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('membership_plan', 'service', 'product', 'discount', 'fee')),
  item_reference_id UUID, -- Could reference membership_plans or other tables
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tour scheduling table
CREATE TABLE public.facility_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES public.profiles(id), -- Staff member conducting tour
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  tour_type TEXT DEFAULT 'standard' CHECK (tour_type IN ('standard', 'premium', 'group', 'virtual')),
  notes TEXT,
  outcome_notes TEXT, -- Notes after tour completion
  follow_up_scheduled TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create follow-up tasks/reminders table
CREATE TABLE public.lead_follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id),
  task_type TEXT NOT NULL CHECK (task_type IN ('call', 'email', 'appointment', 'follow_up', 'proposal', 'contract')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  completed_at TIMESTAMPTZ,
  result_notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email templates table for automated communications
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lead_welcome', 'follow_up', 'tour_confirmation', 'proposal', 'nurture', 'win_back')),
  subject_line TEXT NOT NULL,
  body_content TEXT NOT NULL, -- HTML content
  variables JSONB, -- Available merge variables
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create lead communication log table
CREATE TABLE public.lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'phone_call', 'meeting', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,
  sent_by UUID REFERENCES public.profiles(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_used UUID REFERENCES public.email_templates(id),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB, -- Additional tracking data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to leads table for enhanced functionality
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES public.lead_sources(id),
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualification_status TEXT DEFAULT 'unqualified' CHECK (qualification_status IN ('unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity')),
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist')),
ADD COLUMN IF NOT EXISTS original_source TEXT, -- First attribution source
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS annual_income TEXT,
ADD COLUMN IF NOT EXISTS fitness_goals TEXT[],
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
ADD COLUMN IF NOT EXISTS best_contact_time TEXT,
ADD COLUMN IF NOT EXISTS referrer_member_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversion_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_sources
CREATE POLICY "Users can view lead sources in their organization" ON public.lead_sources
FOR SELECT USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Staff can manage lead sources" ON public.lead_sources
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for lead_scoring_rules
CREATE POLICY "Users can view scoring rules in their organization" ON public.lead_scoring_rules
FOR SELECT USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Staff can manage scoring rules" ON public.lead_scoring_rules
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for lead_scores
CREATE POLICY "Staff can view lead scores" ON public.lead_scores
FOR SELECT USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "System can manage lead scores" ON public.lead_scores
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for sales_quotes
CREATE POLICY "Staff can view sales quotes" ON public.sales_quotes
FOR SELECT USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "Staff can manage sales quotes" ON public.sales_quotes
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for sales_quote_items
CREATE POLICY "Staff can view quote items" ON public.sales_quote_items
FOR SELECT USING (quote_id IN (
  SELECT id FROM public.sales_quotes WHERE lead_id IN (
    SELECT id FROM public.leads WHERE organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  )
));

CREATE POLICY "Staff can manage quote items" ON public.sales_quote_items
FOR ALL USING (quote_id IN (
  SELECT id FROM public.sales_quotes WHERE lead_id IN (
    SELECT id FROM public.leads WHERE organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  )
));

-- Create RLS policies for facility_tours
CREATE POLICY "Staff can view facility tours" ON public.facility_tours
FOR SELECT USING (location_id IN (
  SELECT id FROM public.locations WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "Staff can manage facility tours" ON public.facility_tours
FOR ALL USING (location_id IN (
  SELECT id FROM public.locations WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for lead_follow_up_tasks
CREATE POLICY "Staff can view follow up tasks" ON public.lead_follow_up_tasks
FOR SELECT USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
) OR assigned_to = auth.uid());

CREATE POLICY "Staff can manage follow up tasks" ON public.lead_follow_up_tasks
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create RLS policies for email_templates
CREATE POLICY "Users can view email templates in their organization" ON public.email_templates
FOR SELECT USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Staff can manage email templates" ON public.email_templates
FOR ALL USING (organization_id IN (
  SELECT organization_id FROM public.profiles 
  WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create RLS policies for lead_communications
CREATE POLICY "Staff can view lead communications" ON public.lead_communications
FOR SELECT USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

CREATE POLICY "Staff can manage lead communications" ON public.lead_communications
FOR ALL USING (lead_id IN (
  SELECT id FROM public.leads WHERE organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
));

-- Create functions for automated lead scoring
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_score INTEGER := 0;
    rule RECORD;
    lead_data RECORD;
    field_value TEXT;
BEGIN
    -- Get lead data
    SELECT * INTO lead_data FROM public.leads WHERE id = lead_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Iterate through active scoring rules for the organization
    FOR rule IN 
        SELECT * FROM public.lead_scoring_rules 
        WHERE organization_id = lead_data.organization_id 
        AND is_active = true
    LOOP
        -- Get the field value based on criteria_field
        CASE rule.criteria_field
            WHEN 'phone' THEN field_value := lead_data.phone;
            WHEN 'company_name' THEN field_value := lead_data.company_name;
            WHEN 'job_title' THEN field_value := lead_data.job_title;
            WHEN 'interest_level' THEN field_value := lead_data.interest_level;
            WHEN 'source' THEN field_value := lead_data.source;
            WHEN 'estimated_value' THEN field_value := lead_data.estimated_value::TEXT;
            ELSE field_value := NULL;
        END CASE;
        
        -- Apply scoring logic based on operator
        CASE rule.criteria_operator
            WHEN 'equals' THEN
                IF field_value = rule.criteria_value THEN
                    total_score := total_score + rule.score_points;
                END IF;
            WHEN 'contains' THEN
                IF field_value ILIKE '%' || rule.criteria_value || '%' THEN
                    total_score := total_score + rule.score_points;
                END IF;
            WHEN 'exists' THEN
                IF field_value IS NOT NULL AND field_value != '' THEN
                    total_score := total_score + rule.score_points;
                END IF;
            WHEN 'greater_than' THEN
                IF field_value::NUMERIC > rule.criteria_value::NUMERIC THEN
                    total_score := total_score + rule.score_points;
                END IF;
            WHEN 'less_than' THEN
                IF field_value::NUMERIC < rule.criteria_value::NUMERIC THEN
                    total_score := total_score + rule.score_points;
                END IF;
        END CASE;
    END LOOP;
    
    -- Update lead score
    UPDATE public.leads SET lead_score = total_score WHERE id = lead_uuid;
    
    -- Insert or update lead_scores table
    INSERT INTO public.lead_scores (lead_id, total_score, last_calculated_at)
    VALUES (lead_uuid, total_score, now())
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
        total_score = EXCLUDED.total_score,
        last_calculated_at = EXCLUDED.last_calculated_at;
    
    RETURN total_score;
END;
$$;

-- Create function to auto-assign qualification status based on score
CREATE OR REPLACE FUNCTION public.update_lead_qualification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-qualify leads based on score thresholds
    IF NEW.lead_score >= 80 THEN
        NEW.qualification_status := 'sales_qualified';
        NEW.lifecycle_stage := 'sales_qualified_lead';
    ELSIF NEW.lead_score >= 50 THEN
        NEW.qualification_status := 'marketing_qualified';
        NEW.lifecycle_stage := 'marketing_qualified_lead';
    ELSIF NEW.lead_score >= 25 THEN
        NEW.qualification_status := 'marketing_qualified';
        NEW.lifecycle_stage := 'lead';
    ELSE
        NEW.qualification_status := 'unqualified';
        NEW.lifecycle_stage := 'subscriber';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-update qualification on score changes
CREATE TRIGGER update_lead_qualification_on_score_change
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    WHEN (OLD.lead_score IS DISTINCT FROM NEW.lead_score)
    EXECUTE FUNCTION public.update_lead_qualification();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_lead_sources_updated_at
BEFORE UPDATE ON public.lead_sources FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scoring_rules_updated_at
BEFORE UPDATE ON public.lead_scoring_rules FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_scores_updated_at
BEFORE UPDATE ON public.lead_scores FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_quotes_updated_at
BEFORE UPDATE ON public.sales_quotes FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_tours_updated_at
BEFORE UPDATE ON public.facility_tours FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_follow_up_tasks_updated_at
BEFORE UPDATE ON public.lead_follow_up_tasks FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lead sources
INSERT INTO public.lead_sources (organization_id, name, category, description) VALUES
-- Using placeholder organization_id - this will need to be updated per organization
('00000000-0000-0000-0000-000000000000', 'Website Contact Form', 'online', 'Direct inquiries from website contact form'),
('00000000-0000-0000-0000-000000000000', 'Walk-in', 'direct', 'People who walked into the facility'),
('00000000-0000-0000-0000-000000000000', 'Phone Call', 'direct', 'Inbound phone inquiries'),
('00000000-0000-0000-0000-000000000000', 'Member Referral', 'referral', 'Referred by existing members'),
('00000000-0000-0000-0000-000000000000', 'Google Ads', 'advertising', 'Google advertising campaigns'),
('00000000-0000-0000-0000-000000000000', 'Facebook Ads', 'social_media', 'Facebook advertising campaigns'),
('00000000-0000-0000-0000-000000000000', 'Instagram', 'social_media', 'Instagram organic or paid'),
('00000000-0000-0000-0000-000000000000', 'Local Event', 'direct', 'Community events and health fairs'),
('00000000-0000-0000-0000-000000000000', 'Corporate Partnership', 'referral', 'Corporate wellness programs'),
('00000000-0000-0000-0000-000000000000', 'Other', 'other', 'Other sources not listed');

-- Insert default lead scoring rules
INSERT INTO public.lead_scoring_rules (organization_id, rule_name, criteria_type, criteria_field, criteria_operator, criteria_value, score_points) VALUES
-- Using placeholder organization_id - this will need to be updated per organization
('00000000-0000-0000-0000-000000000000', 'Has Phone Number', 'demographic', 'phone', 'exists', NULL, 10),
('00000000-0000-0000-0000-000000000000', 'High Interest Level', 'behavioral', 'interest_level', 'equals', 'hot', 25),
('00000000-0000-0000-0000-000000000000', 'Medium Interest Level', 'behavioral', 'interest_level', 'equals', 'warm', 15),
('00000000-0000-0000-0000-000000000000', 'Has Company Name', 'demographic', 'company_name', 'exists', NULL, 5),
('00000000-0000-0000-0000-000000000000', 'High Estimated Value', 'behavioral', 'estimated_value', 'greater_than', '100', 20),
('00000000-0000-0000-0000-000000000000', 'Member Referral Source', 'source', 'source', 'contains', 'referral', 15),
('00000000-0000-0000-0000-000000000000', 'Direct Contact (Walk-in/Call)', 'source', 'source', 'contains', 'direct', 20);

-- Insert default email templates
INSERT INTO public.email_templates (organization_id, name, category, subject_line, body_content, created_by) VALUES
-- Using placeholder organization_id and user_id - these will need to be updated per organization
('00000000-0000-0000-0000-000000000000', 'Welcome New Lead', 'lead_welcome', 'Welcome to [GYM_NAME]!', 
'<h2>Welcome to [GYM_NAME]!</h2>
<p>Hi [FIRST_NAME],</p>
<p>Thank you for your interest in [GYM_NAME]! We''re excited to help you on your fitness journey.</p>
<p>Our team will be in touch within 24 hours to schedule your complimentary tour and fitness consultation.</p>
<p>In the meantime, feel free to browse our <a href="[WEBSITE_URL]">facilities and programs</a>.</p>
<p>Best regards,<br>The [GYM_NAME] Team</p>', 
'00000000-0000-0000-0000-000000000000'),

('00000000-0000-0000-0000-000000000000', 'Tour Confirmation', 'tour_confirmation', 'Your gym tour is confirmed for [TOUR_DATE]',
'<h2>Tour Confirmation</h2>
<p>Hi [FIRST_NAME],</p>
<p>Your tour at [GYM_NAME] is confirmed for:</p>
<ul>
<li><strong>Date:</strong> [TOUR_DATE]</li>
<li><strong>Time:</strong> [TOUR_TIME]</li>
<li><strong>Duration:</strong> [TOUR_DURATION] minutes</li>
<li><strong>Location:</strong> [LOCATION_ADDRESS]</li>
<li><strong>Tour Guide:</strong> [GUIDE_NAME]</li>
</ul>
<p>Please arrive 10 minutes early. If you need to reschedule, please call us at [PHONE_NUMBER].</p>
<p>We''re looking forward to meeting you!</p>
<p>Best regards,<br>The [GYM_NAME] Team</p>', 
'00000000-0000-0000-0000-000000000000');