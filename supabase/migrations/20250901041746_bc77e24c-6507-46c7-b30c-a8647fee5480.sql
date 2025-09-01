-- Create test users with different roles for authentication testing
-- This will help complete Priority 1 by providing users to test role-based access

-- First, let's ensure we have an organization to work with
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'FitnessPro Gym', 'fitnesspro', 'hsl(220, 90%, 60%)', 'hsl(280, 90%, 65%)')
ON CONFLICT (slug) DO NOTHING;

-- Create profiles for different user roles (these will be connected to auth.users when users sign up)
-- This provides the foundation for role-based testing

-- Owner profile template (users can sign up and we'll update their role)
INSERT INTO public.profiles (id, organization_id, email, first_name, last_name, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'owner@fitnesspro.com', 'Sarah', 'Johnson', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'manager@fitnesspro.com', 'Mike', 'Davis', 'manager'),
  ('33333333-3333-3333-3333-333333333333', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'staff@fitnesspro.com', 'Emily', 'Chen', 'staff'),
  ('44444444-4444-4444-4444-444444444444', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'trainer@fitnesspro.com', 'Alex', 'Rodriguez', 'trainer'),
  ('55555555-5555-5555-5555-555555555555', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'member@fitnesspro.com', 'John', 'Smith', 'member')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id;

-- Add a location for the organization
INSERT INTO public.locations (id, organization_id, name, address, email, phone)
VALUES 
  ('loc-d290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Main Location', '123 Fitness St, Gym City, GC 12345', 'info@fitnesspro.com', '+1-555-123-4567')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;