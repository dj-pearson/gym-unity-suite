-- Add sample classes and instructor data

-- First, create a sample instructor profile (we'll use a UUID that won't conflict)
INSERT INTO public.profiles (id, organization_id, location_id, email, first_name, last_name, role, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'sarah.trainer@fitcoregym.com', 'Sarah', 'Johnson', 'trainer', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'mike.trainer@fitcoregym.com', 'Mike', 'Chen', 'trainer', now(), now());

-- Create sample classes for the next week
INSERT INTO public.classes (organization_id, location_id, category_id, instructor_id, name, description, duration_minutes, max_capacity, scheduled_at)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  categories.id,
  instructors.id,
  class_data.name,
  class_data.description,
  class_data.duration,
  class_data.capacity,
  class_data.scheduled_at
FROM (
  SELECT id FROM public.class_categories WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001' ORDER BY name
) AS categories
CROSS JOIN (
  SELECT id FROM public.profiles 
  WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND role = 'trainer'
) AS instructors
CROSS JOIN (VALUES
  ('Morning Yoga Flow', 'Start your day with energizing yoga poses', 60, 15, (NOW() + INTERVAL '1 day' + INTERVAL '7 hours')::timestamp),
  ('HIIT Blast', 'High-intensity interval training for maximum burn', 45, 12, (NOW() + INTERVAL '1 day' + INTERVAL '18 hours')::timestamp),
  ('Strength & Conditioning', 'Build muscle and improve functional fitness', 75, 10, (NOW() + INTERVAL '2 days' + INTERVAL '9 hours')::timestamp),
  ('Cardio Kickboxing', 'Fun cardio workout with martial arts moves', 50, 20, (NOW() + INTERVAL '2 days' + INTERVAL '19 hours')::timestamp),
  ('Evening Yoga Restore', 'Gentle yoga to unwind and relax', 60, 15, (NOW() + INTERVAL '3 days' + INTERVAL '19 hours')::timestamp),
  ('Morning HIIT', 'Quick morning workout to energize your day', 30, 15, (NOW() + INTERVAL '4 days' + INTERVAL '6 hours')::timestamp),
  ('Powerlifting Class', 'Focus on the big three: squat, bench, deadlift', 90, 8, (NOW() + INTERVAL '5 days' + INTERVAL '10 hours')::timestamp),
  ('Spin Class', 'High-energy cycling workout', 45, 25, (NOW() + INTERVAL '6 days' + INTERVAL '8 hours')::timestamp)
) AS class_data(name, description, duration, capacity, scheduled_at)
LIMIT 8;