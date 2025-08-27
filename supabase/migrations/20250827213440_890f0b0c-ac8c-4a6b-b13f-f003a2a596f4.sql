-- Create analytics tables for comprehensive reporting

-- Create member analytics snapshot table
CREATE TABLE public.member_analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_members INTEGER NOT NULL DEFAULT 0,
  active_members INTEGER NOT NULL DEFAULT 0,
  new_members INTEGER NOT NULL DEFAULT 0,
  churned_members INTEGER NOT NULL DEFAULT 0,
  average_visits_per_member NUMERIC(5,2) DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

-- Create revenue analytics table
CREATE TABLE public.revenue_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  membership_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  class_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  refunds NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  average_transaction_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start, period_end, period_type)
);

-- Create class analytics table
CREATE TABLE public.class_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  class_id UUID,
  instructor_id UUID,
  class_date DATE NOT NULL,
  class_name TEXT NOT NULL,
  instructor_name TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  attendance INTEGER NOT NULL DEFAULT 0,
  no_shows INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  utilization_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing analytics table  
CREATE TABLE public.marketing_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  campaign_id UUID,
  campaign_type TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  roi NUMERIC(8,2) DEFAULT 0,
  click_through_rate NUMERIC(5,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  cost_per_lead NUMERIC(10,2) DEFAULT 0,
  customer_acquisition_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff performance analytics table
CREATE TABLE public.staff_performance_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  classes_taught INTEGER DEFAULT 0,
  total_class_revenue NUMERIC(10,2) DEFAULT 0,
  average_class_utilization NUMERIC(5,2) DEFAULT 0,
  member_satisfaction_score NUMERIC(3,2) DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  tours_conducted INTEGER DEFAULT 0,
  sales_made INTEGER DEFAULT 0,
  total_sales_revenue NUMERIC(10,2) DEFAULT 0,
  commission_earned NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, staff_id, period_start, period_end)
);

-- Create cohort analysis table for member retention
CREATE TABLE public.member_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  cohort_period TEXT NOT NULL, -- e.g., "2024-01", "2024-Q1"
  cohort_size INTEGER NOT NULL DEFAULT 0,
  month_1_retained INTEGER DEFAULT 0,
  month_2_retained INTEGER DEFAULT 0,
  month_3_retained INTEGER DEFAULT 0,
  month_6_retained INTEGER DEFAULT 0,
  month_12_retained INTEGER DEFAULT 0,
  month_1_rate NUMERIC(5,2) DEFAULT 0,
  month_2_rate NUMERIC(5,2) DEFAULT 0,
  month_3_rate NUMERIC(5,2) DEFAULT 0,
  month_6_rate NUMERIC(5,2) DEFAULT 0,
  month_12_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, cohort_period)
);

-- Create KPI tracking table
CREATE TABLE public.kpi_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN ('financial', 'operational', 'marketing', 'member_engagement', 'staff')),
  metric_value NUMERIC(15,2) NOT NULL,
  target_value NUMERIC(15,2),
  metric_unit TEXT, -- e.g., 'currency', 'percentage', 'count'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all analytics tables
ALTER TABLE public.member_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics tables (Staff can view analytics for their organization)
CREATE POLICY "Staff can view member analytics"
ON public.member_analytics_snapshots
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Staff can manage member analytics"
ON public.member_analytics_snapshots
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view revenue analytics"
ON public.revenue_analytics
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Staff can manage revenue analytics"
ON public.revenue_analytics
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view class analytics"
ON public.class_analytics
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff', 'trainer')
  )
);

CREATE POLICY "Staff can manage class analytics"
ON public.class_analytics
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view marketing analytics"
ON public.marketing_analytics
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Staff can manage marketing analytics"
ON public.marketing_analytics
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view staff performance analytics"
ON public.staff_performance_analytics
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  ) OR staff_id = auth.uid()
);

CREATE POLICY "Managers can manage staff performance analytics"
ON public.staff_performance_analytics
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view member cohorts"
ON public.member_cohorts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Managers can manage member cohorts"
ON public.member_cohorts
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Staff can view KPI metrics"
ON public.kpi_metrics
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Managers can manage KPI metrics"
ON public.kpi_metrics
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_revenue_analytics_updated_at
BEFORE UPDATE ON public.revenue_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_analytics_updated_at
BEFORE UPDATE ON public.marketing_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_performance_analytics_updated_at
BEFORE UPDATE ON public.staff_performance_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_cohorts_updated_at
BEFORE UPDATE ON public.member_cohorts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_member_analytics_org_date ON public.member_analytics_snapshots(organization_id, snapshot_date);
CREATE INDEX idx_revenue_analytics_org_period ON public.revenue_analytics(organization_id, period_start, period_end);
CREATE INDEX idx_class_analytics_org_date ON public.class_analytics(organization_id, class_date);
CREATE INDEX idx_marketing_analytics_org_period ON public.marketing_analytics(organization_id, period_start);
CREATE INDEX idx_staff_performance_org_period ON public.staff_performance_analytics(organization_id, period_start);
CREATE INDEX idx_kpi_metrics_org_category_period ON public.kpi_metrics(organization_id, metric_category, period_start);