-- Create a default organization for testing
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color)
VALUES (
  'org_default_test',
  'Rep Club Fitness',
  'rep-club-fitness',
  '#2563eb',
  '#f97316'
) ON CONFLICT (id) DO NOTHING;

-- Create a default location for the organization
INSERT INTO public.locations (id, organization_id, name, address, phone, email, timezone)
VALUES (
  'loc_default_test',
  'org_default_test',
  'Main Location',
  '123 Fitness Street, City, State 12345',
  '+1 (555) 123-4567',
  'info@repclubfitness.com',
  'America/New_York'
) ON CONFLICT (id) DO NOTHING;

-- Create the missing profile for the current user
INSERT INTO public.profiles (id, organization_id, location_id, email, first_name, last_name, role)
VALUES (
  '80cb2e43-2acc-4355-b08c-c165cdd5f760',
  'org_default_test',
  'loc_default_test',
  'pearsonperformance@gmail.com',
  'Test',
  'User',
  'owner'
) ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  location_id = EXCLUDED.location_id,
  email = EXCLUDED.email,
  role = EXCLUDED.role;