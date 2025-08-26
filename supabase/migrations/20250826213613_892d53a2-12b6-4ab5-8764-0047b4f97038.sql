-- Insert sample data for demo purposes

-- Create a sample organization
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'FitCore Gym', 'fitcore-gym', '#2563eb', '#f97316');

-- Create a sample location
INSERT INTO public.locations (id, organization_id, name, address, phone, email)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'FitCore Main Branch', '123 Fitness St, Gym City, GC 12345', '(555) 123-4567', 'info@fitcoregym.com');

-- Create sample membership plans
INSERT INTO public.membership_plans (organization_id, name, description, price, billing_interval, access_level, max_classes_per_month)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Basic Monthly', 'Basic gym access with limited classes', 49.99, 'monthly', 'single_location', 8),
  ('550e8400-e29b-41d4-a716-446655440001', 'Premium Monthly', 'Full gym access with unlimited classes', 79.99, 'monthly', 'single_location', NULL),
  ('550e8400-e29b-41d4-a716-446655440001', 'Elite Annual', 'Premium access across all locations', 799.99, 'yearly', 'all_locations', NULL);

-- Create sample class categories
INSERT INTO public.class_categories (organization_id, name, description, color)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Yoga', 'Mindful movement and flexibility', '#10b981'),
  ('550e8400-e29b-41d4-a716-446655440001', 'HIIT', 'High intensity interval training', '#ef4444'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Strength Training', 'Weight lifting and muscle building', '#3b82f6'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Cardio', 'Heart-pumping aerobic exercises', '#f59e0b');