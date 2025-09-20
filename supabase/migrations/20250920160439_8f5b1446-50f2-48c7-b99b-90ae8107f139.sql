-- Fix remaining security issues

-- Fix remaining functions that might not have search_path
CREATE OR REPLACE FUNCTION public.setup_default_lead_stages(org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
  -- Only create stages if none exist for the organization
  IF NOT EXISTS (SELECT 1 FROM lead_stages WHERE organization_id = org_id) THEN
    INSERT INTO lead_stages (name, organization_id, order_index, color, description, is_closed) VALUES
      ('New Lead', org_id, 1, '#3b82f6', 'Initial contact made', false),
      ('Qualified', org_id, 2, '#8b5cf6', 'Lead shows genuine interest', false),
      ('Tour Scheduled', org_id, 3, '#f59e0b', 'Facility tour booked', false),
      ('Tour Completed', org_id, 4, '#10b981', 'Completed facility tour', false),
      ('Proposal Sent', org_id, 5, '#f97316', 'Membership proposal provided', false),
      ('Negotiating', org_id, 6, '#ef4444', 'Discussing terms and pricing', false),
      ('Closed Won', org_id, 7, '#22c55e', 'Converted to member', true),
      ('Closed Lost', org_id, 8, '#6b7280', 'Lead did not convert', true);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_setup_lead_stages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
  -- Set up default lead stages for the user's organization
  IF NEW.organization_id IS NOT NULL THEN
    PERFORM setup_default_lead_stages(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_equipment_maintenance_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
  -- Update equipment's last maintenance date and calculate next maintenance date
  UPDATE public.equipment 
  SET 
    last_maintenance_date = NEW.maintenance_date::date,
    next_maintenance_date = (NEW.maintenance_date::date + INTERVAL '1 day' * COALESCE(maintenance_interval_days, 90))
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_member_barcode_generation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
    -- Only generate barcode for members without one
    IF NEW.role = 'member' AND (NEW.barcode IS NULL OR NEW.barcode = '') THEN
        NEW.barcode := public.generate_member_barcode();
        NEW.barcode_generated_at := now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Check for views with security definer - these might be the issue
-- If there are any SECURITY DEFINER views, they would need to be recreated without that property
-- For now, let's see if this resolves the function issues