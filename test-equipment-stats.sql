-- Equipment Stats Verification Script
-- Replace '<your_org_id>' with actual organization ID
-- Run in Supabase SQL Editor

-- ============================================
-- CONFIGURATION
-- ============================================
-- Set your organization ID here
\set org_id '00000000-0000-0000-0000-000000000000'

-- Or use this to get the first organization
DO $$
DECLARE
  test_org_id UUID;
BEGIN
  SELECT id INTO test_org_id FROM organizations ORDER BY created_at LIMIT 1;
  RAISE NOTICE 'Testing with Organization ID: %', test_org_id;
END $$;

-- ============================================
-- TEST 1: Total Equipment Count
-- ============================================
WITH equipment_stats AS (
  SELECT
    COUNT(*) as total_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
  FROM equipment
  WHERE organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
)
SELECT
  'Total Equipment' as metric,
  total_count as value,
  recent_count || ' added in last 30 days' as details
FROM equipment_stats;

-- ============================================
-- TEST 2: Maintenance Due (Next 7 Days)
-- ============================================
WITH maintenance_stats AS (
  SELECT
    COUNT(*) as count_due,
    MIN(ms.scheduled_date) as next_date
  FROM maintenance_schedules ms
  INNER JOIN equipment e ON e.id = ms.equipment_id
  WHERE e.organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  AND ms.status = 'scheduled'
  AND ms.scheduled_date >= NOW()
  AND ms.scheduled_date <= NOW() + INTERVAL '7 days'
)
SELECT
  'Maintenance Due' as metric,
  count_due as value,
  CASE
    WHEN next_date::date = CURRENT_DATE THEN 'Next: Today'
    WHEN next_date::date = CURRENT_DATE + 1 THEN 'Next: Tomorrow'
    WHEN next_date IS NOT NULL THEN 'Next: ' || TO_CHAR(next_date, 'Mon DD, YYYY')
    ELSE 'No maintenance scheduled'
  END as details
FROM maintenance_stats;

-- ============================================
-- TEST 3: Facility Areas
-- ============================================
SELECT
  'Facility Areas' as metric,
  COUNT(*) as value,
  'All operational' as details
FROM facility_areas
WHERE organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1);

-- ============================================
-- TEST 4: Open Incidents
-- ============================================
WITH incident_stats AS (
  SELECT
    COUNT(*) as total_open,
    COUNT(CASE WHEN priority IN ('high', 'critical') THEN 1 END) as high_priority
  FROM incident_reports
  WHERE organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  AND status IN ('open', 'in_progress')
)
SELECT
  'Open Incidents' as metric,
  total_open as value,
  high_priority || ' high priority' as details,
  CASE WHEN high_priority > 0 THEN 'red' ELSE 'green' END as badge_color
FROM incident_stats;

-- ============================================
-- COMPREHENSIVE STATS SUMMARY
-- ============================================
WITH org AS (
  SELECT id, name FROM organizations ORDER BY created_at LIMIT 1
),
stats AS (
  SELECT
    -- Equipment
    (SELECT COUNT(*) FROM equipment WHERE organization_id = org.id) as total_equipment,
    (SELECT COUNT(*) FROM equipment WHERE organization_id = org.id AND created_at >= NOW() - INTERVAL '30 days') as equipment_growth,

    -- Maintenance
    (SELECT COUNT(*) FROM maintenance_schedules ms
     INNER JOIN equipment e ON e.id = ms.equipment_id
     WHERE e.organization_id = org.id
     AND ms.status = 'scheduled'
     AND ms.scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as maintenance_due,

    (SELECT MIN(ms.scheduled_date) FROM maintenance_schedules ms
     INNER JOIN equipment e ON e.id = ms.equipment_id
     WHERE e.organization_id = org.id
     AND ms.status = 'scheduled'
     AND ms.scheduled_date >= NOW()) as next_maintenance,

    -- Facilities
    (SELECT COUNT(*) FROM facility_areas WHERE organization_id = org.id) as facility_areas,

    -- Incidents
    (SELECT COUNT(*) FROM incident_reports WHERE organization_id = org.id AND status IN ('open', 'in_progress')) as open_incidents,
    (SELECT COUNT(*) FROM incident_reports WHERE organization_id = org.id AND status IN ('open', 'in_progress') AND priority IN ('high', 'critical')) as high_priority

  FROM org
)
SELECT
  org.name as organization,
  'Equipment Stats Summary' as report_type,
  NOW() as generated_at,
  json_build_object(
    'total_equipment', total_equipment,
    'equipment_growth', equipment_growth,
    'maintenance_due', maintenance_due,
    'next_maintenance', next_maintenance,
    'facility_areas', facility_areas,
    'open_incidents', open_incidents,
    'high_priority_incidents', high_priority
  ) as stats_json
FROM org, stats;

-- ============================================
-- PERFORMANCE VERIFICATION
-- ============================================
-- Check if queries are using indexes efficiently
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM equipment
WHERE organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1);

EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM maintenance_schedules ms
INNER JOIN equipment e ON e.id = ms.equipment_id
WHERE e.organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
AND ms.status = 'scheduled';

-- ============================================
-- DATA QUALITY CHECK
-- ============================================
-- Verify no orphaned records
SELECT
  'Data Quality Check' as check_type,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as null_org_count,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as valid_org_count,
  'Equipment table' as table_name
FROM equipment

UNION ALL

SELECT
  'Data Quality Check',
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END),
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END),
  'Facility Areas table'
FROM facility_areas

UNION ALL

SELECT
  'Data Quality Check',
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END),
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END),
  'Incident Reports table'
FROM incident_reports;

RAISE NOTICE '✅ Equipment stats verification complete';
RAISE NOTICE 'Compare these values with the Equipment page in the UI';
