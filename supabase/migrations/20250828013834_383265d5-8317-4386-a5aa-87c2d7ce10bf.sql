-- Equipment & Facility Management Module
-- Create equipment table for tracking gym equipment
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL DEFAULT 'cardio', -- cardio, strength, functional, other
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  warranty_expiry DATE,
  location_id UUID,
  status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, out_of_service, retired
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER DEFAULT 90,
  usage_hours INTEGER DEFAULT 0,
  notes TEXT,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_schedules table for planned maintenance
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL DEFAULT 'routine', -- routine, preventive, repair, inspection
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  estimated_duration_minutes INTEGER DEFAULT 60,
  assigned_to UUID, -- staff member
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, overdue
  completion_date TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  cost NUMERIC,
  vendor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_logs table for maintenance history
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  maintenance_schedule_id UUID,
  performed_by UUID NOT NULL, -- staff member
  maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  parts_used TEXT[],
  labor_hours NUMERIC,
  cost NUMERIC,
  next_maintenance_date DATE,
  photos TEXT[], -- array of photo URLs
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facility_areas table for different areas of the gym
CREATE TABLE public.facility_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID NOT NULL,
  name TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'general', -- general, cardio, strength, class_room, locker_room, pool, sauna
  square_footage INTEGER,
  max_capacity INTEGER,
  equipment_count INTEGER DEFAULT 0,
  cleaning_frequency TEXT DEFAULT 'daily', -- daily, weekly, monthly
  last_cleaned TIMESTAMP WITH TIME ZONE,
  temperature_range TEXT, -- e.g., "68-72°F"
  special_requirements TEXT,
  safety_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident_reports table for safety incidents
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID,
  reported_by UUID NOT NULL, -- staff or member
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  incident_type TEXT NOT NULL DEFAULT 'injury', -- injury, equipment_malfunction, property_damage, safety_violation, other
  severity TEXT NOT NULL DEFAULT 'minor', -- minor, moderate, major, critical
  description TEXT NOT NULL,
  injured_person_name TEXT,
  injured_person_type TEXT, -- member, staff, visitor
  injured_person_id UUID, -- member or staff ID if applicable
  equipment_involved UUID, -- equipment ID if applicable
  area_involved UUID, -- facility_area ID if applicable
  witnesses TEXT[],
  actions_taken TEXT,
  medical_attention_required BOOLEAN DEFAULT false,
  medical_provider TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  insurance_notified BOOLEAN DEFAULT false,
  insurance_claim_number TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  photos TEXT[], -- array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table for service providers
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  vendor_type TEXT NOT NULL DEFAULT 'maintenance', -- maintenance, cleaning, security, hvac, equipment_supplier, other
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  license_number TEXT,
  insurance_expiry DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  preferred_vendor BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning_schedules table for facility cleaning
CREATE TABLE public.cleaning_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  area_id UUID NOT NULL,
  task_name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  assigned_to UUID, -- staff member
  estimated_duration_minutes INTEGER DEFAULT 30,
  last_completed TIMESTAMP WITH TIME ZONE,
  next_due DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, overdue
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high
  supplies_needed TEXT[],
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Staff can manage equipment" ON public.equipment
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can view equipment in their organization" ON public.equipment
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Maintenance schedules policies
CREATE POLICY "Staff can manage maintenance schedules" ON public.maintenance_schedules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- Maintenance logs policies
CREATE POLICY "Staff can manage maintenance logs" ON public.maintenance_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- Facility areas policies
CREATE POLICY "Staff can manage facility areas" ON public.facility_areas
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can view facility areas" ON public.facility_areas
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Incident reports policies
CREATE POLICY "Staff can manage incident reports" ON public.incident_reports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can report incidents" ON public.incident_reports
  FOR INSERT WITH CHECK (
    reported_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Vendors policies
CREATE POLICY "Staff can manage vendors" ON public.vendors
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- Cleaning schedules policies
CREATE POLICY "Staff can manage cleaning schedules" ON public.cleaning_schedules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- Add foreign key relationships
ALTER TABLE public.equipment ADD CONSTRAINT equipment_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  
ALTER TABLE public.equipment ADD CONSTRAINT equipment_location_fk 
  FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE public.maintenance_schedules ADD CONSTRAINT maintenance_schedules_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  
ALTER TABLE public.maintenance_schedules ADD CONSTRAINT maintenance_schedules_equipment_fk 
  FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_logs ADD CONSTRAINT maintenance_logs_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  
ALTER TABLE public.maintenance_logs ADD CONSTRAINT maintenance_logs_equipment_fk 
  FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE public.facility_areas ADD CONSTRAINT facility_areas_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  
ALTER TABLE public.facility_areas ADD CONSTRAINT facility_areas_location_fk 
  FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.vendors ADD CONSTRAINT vendors_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.cleaning_schedules ADD CONSTRAINT cleaning_schedules_organization_fk 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  
ALTER TABLE public.cleaning_schedules ADD CONSTRAINT cleaning_schedules_area_fk 
  FOREIGN KEY (area_id) REFERENCES public.facility_areas(id) ON DELETE CASCADE;

-- Add triggers for updated_at columns
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_logs_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facility_areas_updated_at
  BEFORE UPDATE ON public.facility_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cleaning_schedules_updated_at
  BEFORE UPDATE ON public.cleaning_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update equipment maintenance dates
CREATE OR REPLACE FUNCTION public.update_equipment_maintenance_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Update equipment's last maintenance date and calculate next maintenance date
  UPDATE public.equipment 
  SET 
    last_maintenance_date = NEW.maintenance_date::date,
    next_maintenance_date = (NEW.maintenance_date::date + INTERVAL '1 day' * COALESCE(maintenance_interval_days, 90))
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update equipment maintenance dates
CREATE TRIGGER update_equipment_maintenance_dates
  AFTER INSERT ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_equipment_maintenance_schedule();

-- Create indexes for better performance
CREATE INDEX idx_equipment_organization_id ON public.equipment(organization_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_next_maintenance ON public.equipment(next_maintenance_date) WHERE next_maintenance_date IS NOT NULL;

CREATE INDEX idx_maintenance_schedules_organization_id ON public.maintenance_schedules(organization_id);
CREATE INDEX idx_maintenance_schedules_equipment_id ON public.maintenance_schedules(equipment_id);
CREATE INDEX idx_maintenance_schedules_scheduled_date ON public.maintenance_schedules(scheduled_date);

CREATE INDEX idx_incident_reports_organization_id ON public.incident_reports(organization_id);
CREATE INDEX idx_incident_reports_incident_date ON public.incident_reports(incident_date);
CREATE INDEX idx_incident_reports_severity ON public.incident_reports(severity);

CREATE INDEX idx_cleaning_schedules_organization_id ON public.cleaning_schedules(organization_id);
CREATE INDEX idx_cleaning_schedules_next_due ON public.cleaning_schedules(next_due);