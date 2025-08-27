-- Create default lead stages for organizations that don't have them
-- First, let's create a function to set up default stages for an organization
CREATE OR REPLACE FUNCTION setup_default_lead_stages(org_id uuid)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically set up lead stages for new organizations
CREATE OR REPLACE FUNCTION trigger_setup_lead_stages()
RETURNS TRIGGER AS $$
BEGIN
  -- Set up default lead stages for the user's organization
  IF NEW.organization_id IS NOT NULL THEN
    PERFORM setup_default_lead_stages(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new profile is created
DROP TRIGGER IF EXISTS setup_lead_stages_on_profile ON profiles;
CREATE TRIGGER setup_lead_stages_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_setup_lead_stages();

-- Set up stages for existing organizations (FitCore Gym)
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT DISTINCT organization_id FROM profiles WHERE organization_id IS NOT NULL LOOP
    PERFORM setup_default_lead_stages(org_record.organization_id);
  END LOOP;
END $$;