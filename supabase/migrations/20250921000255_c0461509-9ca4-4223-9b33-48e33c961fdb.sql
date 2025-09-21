-- Multi-Location Management System
-- Enable comprehensive multi-location gym chain management

-- Create location hierarchy table for organizational structure
CREATE TABLE public.location_hierarchies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  parent_location_id UUID REFERENCES public.locations(id),
  child_location_id UUID NOT NULL REFERENCES public.locations(id),
  hierarchy_type TEXT NOT NULL DEFAULT 'branch', -- 'branch', 'franchise', 'corporate'
  relationship_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  relationship_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_location_id, parent_location_id)
);

-- Create cross-location staff assignments
CREATE TABLE public.cross_location_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  assignment_type TEXT NOT NULL DEFAULT 'primary', -- 'primary', 'secondary', 'floating'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  permissions JSONB DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member location access table
CREATE TABLE public.member_location_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  access_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'limited', 'guest'
  access_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  access_end_date DATE,
  visit_limit INTEGER, -- for limited access
  visits_used INTEGER DEFAULT 0,
  additional_fee DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cross-location transfers table
CREATE TABLE public.cross_location_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  transfer_type TEXT NOT NULL, -- 'member', 'staff', 'equipment', 'inventory'
  entity_id UUID NOT NULL, -- ID of the member/staff/equipment being transferred
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  transfer_fee DECIMAL(10,2) DEFAULT 0.00,
  approval_required BOOLEAN DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  initiated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'approved', 'rejected', 'completed'
);

-- Create location analytics summary table
CREATE TABLE public.location_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  cancelled_members INTEGER DEFAULT 0,
  daily_checkins INTEGER DEFAULT 0,
  peak_hour_checkins INTEGER DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0.00,
  revenue_memberships DECIMAL(12,2) DEFAULT 0.00,
  revenue_classes DECIMAL(12,2) DEFAULT 0.00,
  revenue_personal_training DECIMAL(12,2) DEFAULT 0.00,
  revenue_retail DECIMAL(12,2) DEFAULT 0.00,
  classes_held INTEGER DEFAULT 0,
  equipment_maintenance_requests INTEGER DEFAULT 0,
  staff_hours_worked DECIMAL(8,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_id, analytics_date)
);

-- Add multi-location support to existing locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS square_footage INTEGER,
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'under_construction', 'closed', 'maintenance'

-- Enable RLS on all new tables
ALTER TABLE public.location_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_location_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_location_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for location hierarchies
CREATE POLICY "Staff can view location hierarchies in their organization" 
ON public.location_hierarchies FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Managers can manage location hierarchies" 
ON public.location_hierarchies FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager')
));

-- Create RLS policies for cross-location staff assignments
CREATE POLICY "Staff can view their assignments" 
ON public.cross_location_assignments FOR SELECT 
USING (
  staff_id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Managers can manage staff assignments" 
ON public.cross_location_assignments FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager')
));

-- Create RLS policies for member location access
CREATE POLICY "Members can view their location access" 
ON public.member_location_access FOR SELECT 
USING (
  member_id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Staff can manage member location access" 
ON public.member_location_access FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create RLS policies for cross-location transfers
CREATE POLICY "Staff can view transfers in their organization" 
ON public.cross_location_transfers FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can create transfer requests" 
ON public.cross_location_transfers FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  ) AND initiated_by = auth.uid()
);

CREATE POLICY "Managers can manage transfers" 
ON public.cross_location_transfers FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager')
));

-- Create RLS policies for location analytics
CREATE POLICY "Staff can view location analytics in their organization" 
ON public.location_analytics FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Managers can manage location analytics" 
ON public.location_analytics FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager')
));

-- Create indexes for performance
CREATE INDEX idx_location_hierarchies_org_id ON public.location_hierarchies(organization_id);
CREATE INDEX idx_location_hierarchies_parent ON public.location_hierarchies(parent_location_id);
CREATE INDEX idx_location_hierarchies_child ON public.location_hierarchies(child_location_id);

CREATE INDEX idx_cross_location_assignments_org ON public.cross_location_assignments(organization_id);
CREATE INDEX idx_cross_location_assignments_staff ON public.cross_location_assignments(staff_id);
CREATE INDEX idx_cross_location_assignments_location ON public.cross_location_assignments(location_id);

CREATE INDEX idx_member_location_access_org ON public.member_location_access(organization_id);
CREATE INDEX idx_member_location_access_member ON public.member_location_access(member_id);
CREATE INDEX idx_member_location_access_location ON public.member_location_access(location_id);

CREATE INDEX idx_cross_location_transfers_org ON public.cross_location_transfers(organization_id);
CREATE INDEX idx_cross_location_transfers_from ON public.cross_location_transfers(from_location_id);
CREATE INDEX idx_cross_location_transfers_to ON public.cross_location_transfers(to_location_id);

CREATE INDEX idx_location_analytics_org ON public.location_analytics(organization_id);
CREATE INDEX idx_location_analytics_location ON public.location_analytics(location_id);
CREATE INDEX idx_location_analytics_date ON public.location_analytics(analytics_date);

-- Create trigger for updating timestamps
CREATE TRIGGER update_location_hierarchies_updated_at
  BEFORE UPDATE ON public.location_hierarchies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_location_assignments_updated_at
  BEFORE UPDATE ON public.cross_location_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_location_access_updated_at
  BEFORE UPDATE ON public.member_location_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_location_transfers_updated_at
  BEFORE UPDATE ON public.cross_location_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_analytics_updated_at
  BEFORE UPDATE ON public.location_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();