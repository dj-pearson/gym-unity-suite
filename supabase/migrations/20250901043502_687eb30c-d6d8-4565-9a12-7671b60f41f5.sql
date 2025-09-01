-- Create organization and location for authentication testing with proper UUID format

-- Ensure we have an organization to work with
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'FitnessPro Gym', 'fitnesspro', 'hsl(220, 90%, 60%)', 'hsl(280, 90%, 65%)')
ON CONFLICT (slug) DO NOTHING;

-- Add a location for the organization with proper UUID
INSERT INTO public.locations (id, organization_id, name, address, email, phone)
VALUES 
  ('a290f1ee-6c54-4b01-90e6-d701748f0851', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Main Location', '123 Fitness St, Gym City, GC 12345', 'info@fitnesspro.com', '+1-555-123-4567')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;