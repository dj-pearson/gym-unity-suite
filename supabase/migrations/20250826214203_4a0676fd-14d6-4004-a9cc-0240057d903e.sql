-- Create sample classes without instructor assignments for now
INSERT INTO public.classes (organization_id, location_id, category_id, name, description, duration_minutes, max_capacity, scheduled_at)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  categories.id,
  class_data.name,
  class_data.description,
  class_data.duration,
  class_data.capacity,
  class_data.scheduled_at
FROM (
  SELECT id FROM public.class_categories WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001' ORDER BY name LIMIT 1
) AS categories
CROSS JOIN (VALUES
  ('Morning Yoga Flow', 'Start your day with energizing yoga poses and mindful breathing', 60, 15, (NOW() + INTERVAL '1 day' + INTERVAL '7 hours')::timestamp),
  ('HIIT Blast', 'High-intensity interval training for maximum calorie burn', 45, 12, (NOW() + INTERVAL '1 day' + INTERVAL '18 hours')::timestamp),
  ('Strength & Conditioning', 'Build muscle and improve functional fitness', 75, 10, (NOW() + INTERVAL '2 days' + INTERVAL '9 hours')::timestamp),
  ('Cardio Kickboxing', 'Fun cardio workout with martial arts moves', 50, 20, (NOW() + INTERVAL '2 days' + INTERVAL '19 hours')::timestamp),
  ('Evening Yoga Restore', 'Gentle yoga to unwind and relax after a long day', 60, 15, (NOW() + INTERVAL '3 days' + INTERVAL '19 hours')::timestamp),
  ('Morning HIIT', 'Quick morning workout to energize your day', 30, 15, (NOW() + INTERVAL '4 days' + INTERVAL '6 hours')::timestamp),
  ('Powerlifting Basics', 'Introduction to powerlifting fundamentals', 90, 8, (NOW() + INTERVAL '5 days' + INTERVAL '10 hours')::timestamp),
  ('Spin Class', 'High-energy cycling workout with motivating music', 45, 25, (NOW() + INTERVAL '6 days' + INTERVAL '8 hours')::timestamp)
) AS class_data(name, description, duration, capacity, scheduled_at);