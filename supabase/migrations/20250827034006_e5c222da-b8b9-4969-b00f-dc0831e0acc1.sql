-- Fix security definer view issue by removing SECURITY DEFINER and adding proper RLS policies
DROP VIEW IF EXISTS member_attendance_summary CASCADE;

-- Create member attendance summary view without SECURITY DEFINER
CREATE VIEW member_attendance_summary AS
SELECT 
  p.id as member_id,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(c.id) as total_visits,
  COUNT(CASE WHEN c.checked_in_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as visits_last_30_days,
  COUNT(CASE WHEN c.checked_in_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as visits_last_7_days,
  MAX(c.checked_in_at) as last_visit,
  AVG(EXTRACT(EPOCH FROM (c.checked_out_at - c.checked_in_at))/60) as avg_duration_minutes
FROM profiles p
LEFT JOIN check_ins c ON p.id = c.member_id AND c.is_guest = false
WHERE p.role = 'member'
GROUP BY p.id, p.first_name, p.last_name, p.email;

-- Enable RLS on the view
ALTER VIEW member_attendance_summary SET (security_barrier = true);

-- Add RLS policy for the view
CREATE POLICY "Staff can view member attendance summaries"
ON member_attendance_summary
FOR SELECT
USING (
  member_id IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.organization_id IN (
      SELECT profiles.organization_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ANY (ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  )
);