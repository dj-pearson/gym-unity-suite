-- Fix Security Definer View issues by recreating views with SECURITY INVOKER
-- This makes views use the privileges of the querying user, not the view creator
-- RLS policies on underlying tables (profiles, check_ins, class_bookings) will apply

-- Drop and recreate member_attendance_summary with SECURITY INVOKER
DROP VIEW IF EXISTS public.member_attendance_summary;

CREATE VIEW public.member_attendance_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id AS member_id,
  p.first_name,
  p.last_name,
  p.email,
  count(c.id) AS total_visits,
  count(CASE WHEN c.checked_in_at >= (CURRENT_DATE - '30 days'::interval) THEN 1 ELSE NULL END) AS visits_last_30_days,
  count(CASE WHEN c.checked_in_at >= (CURRENT_DATE - '7 days'::interval) THEN 1 ELSE NULL END) AS visits_last_7_days,
  max(c.checked_in_at) AS last_visit,
  avg(EXTRACT(epoch FROM (c.checked_out_at - c.checked_in_at)) / 60) AS avg_duration_minutes
FROM profiles p
LEFT JOIN check_ins c ON p.id = c.member_id AND c.is_guest = false
WHERE p.role = 'member'
GROUP BY p.id, p.first_name, p.last_name, p.email;

-- Drop and recreate member_engagement_summary with SECURITY INVOKER
DROP VIEW IF EXISTS public.member_engagement_summary;

CREATE VIEW public.member_engagement_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id AS member_id,
  p.first_name,
  p.last_name,
  p.email,
  p.organization_id,
  p.join_date,
  COALESCE(visit_stats.total_visits, 0) AS total_visits,
  COALESCE(visit_stats.visits_last_30_days, 0) AS visits_last_30_days,
  COALESCE(visit_stats.avg_visit_duration, 0) AS avg_visit_duration_minutes,
  COALESCE(class_stats.classes_attended, 0) AS classes_attended,
  COALESCE(class_stats.classes_booked_last_30, 0) AS classes_booked_last_30,
  CASE
    WHEN visit_stats.last_visit_date >= (CURRENT_DATE - '7 days'::interval) THEN 'active'
    WHEN visit_stats.last_visit_date >= (CURRENT_DATE - '30 days'::interval) THEN 'at_risk'
    ELSE 'inactive'
  END AS engagement_status,
  visit_stats.last_visit_date
FROM profiles p
LEFT JOIN (
  SELECT 
    member_id,
    count(*) AS total_visits,
    count(CASE WHEN checked_in_at >= (CURRENT_DATE - '30 days'::interval) THEN 1 ELSE NULL END) AS visits_last_30_days,
    avg(EXTRACT(epoch FROM (checked_out_at - checked_in_at)) / 60) AS avg_visit_duration,
    max(checked_in_at) AS last_visit_date
  FROM check_ins
  WHERE is_guest = false
  GROUP BY member_id
) visit_stats ON p.id = visit_stats.member_id
LEFT JOIN (
  SELECT 
    member_id,
    count(*) AS classes_attended,
    count(CASE WHEN booked_at >= (CURRENT_DATE - '30 days'::interval) THEN 1 ELSE NULL END) AS classes_booked_last_30
  FROM class_bookings
  WHERE status = 'booked'
  GROUP BY member_id
) class_stats ON p.id = class_stats.member_id
WHERE p.role = 'member';