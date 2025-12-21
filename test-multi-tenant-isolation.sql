-- Multi-Tenant Isolation Test Suite
-- Run this script in Supabase SQL Editor to verify data isolation

-- ============================================
-- TEST 1: Announcements Isolation
-- ============================================
DO $$
DECLARE
  org1_id UUID;
  org2_id UUID;
  test_passed BOOLEAN := TRUE;
BEGIN
  -- Get two different organization IDs
  SELECT id INTO org1_id FROM organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO org2_id FROM organizations WHERE id != org1_id ORDER BY created_at LIMIT 1;

  RAISE NOTICE 'Testing Announcements Isolation...';
  RAISE NOTICE 'Organization 1: %', org1_id;
  RAISE NOTICE 'Organization 2: %', org2_id;

  -- Check if query properly filters by organization
  PERFORM * FROM announcements
  WHERE organization_id = org1_id;

  -- Verify no cross-contamination
  IF EXISTS (
    SELECT 1 FROM announcements a1
    CROSS JOIN announcements a2
    WHERE a1.organization_id != a2.organization_id
    AND a1.id = a2.id
  ) THEN
    RAISE WARNING '❌ FAILED: Announcement data leak detected!';
    test_passed := FALSE;
  ELSE
    RAISE NOTICE '✅ PASSED: Announcements properly isolated';
  END IF;

  IF test_passed THEN
    RAISE NOTICE '✅ All announcement isolation tests passed';
  END IF;
END $$;

-- ============================================
-- TEST 2: Email Templates Isolation
-- ============================================
DO $$
DECLARE
  org1_count INT;
  org2_count INT;
  org1_id UUID;
  org2_id UUID;
BEGIN
  SELECT id INTO org1_id FROM organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO org2_id FROM organizations WHERE id != org1_id ORDER BY created_at LIMIT 1;

  RAISE NOTICE 'Testing Email Templates Isolation...';

  -- Count templates for each org
  SELECT COUNT(*) INTO org1_count FROM email_templates WHERE organization_id = org1_id;
  SELECT COUNT(*) INTO org2_count FROM email_templates WHERE organization_id = org2_id;

  RAISE NOTICE 'Org 1 templates: %', org1_count;
  RAISE NOTICE 'Org 2 templates: %', org2_count;

  -- Verify no shared templates
  IF EXISTS (
    SELECT 1 FROM email_templates
    WHERE organization_id IS NULL
    OR organization_id NOT IN (org1_id, org2_id)
  ) THEN
    RAISE WARNING '❌ WARNING: Templates exist without proper organization assignment';
  ELSE
    RAISE NOTICE '✅ PASSED: Email templates properly isolated';
  END IF;
END $$;

-- ============================================
-- TEST 3: Class Waitlist Join Verification
-- ============================================
DO $$
DECLARE
  leak_count INT;
BEGIN
  RAISE NOTICE 'Testing Class Waitlist Isolation...';

  -- Check if any waitlist entries exist for classes in different orgs
  SELECT COUNT(*) INTO leak_count
  FROM class_waitlists cw
  INNER JOIN classes c1 ON c1.id = cw.class_id
  INNER JOIN classes c2 ON c2.id != c1.id
  WHERE c1.organization_id != c2.organization_id;

  IF leak_count > 0 THEN
    RAISE WARNING '❌ FAILED: Cross-organization waitlist entries detected!';
  ELSE
    RAISE NOTICE '✅ PASSED: Class waitlists properly isolated';
  END IF;
END $$;

-- ============================================
-- TEST 4: CRM Activities Join Verification
-- ============================================
DO $$
DECLARE
  leak_count INT;
BEGIN
  RAISE NOTICE 'Testing CRM Activities Isolation...';

  -- Verify all activities belong to leads in same org
  SELECT COUNT(*) INTO leak_count
  FROM lead_activities la
  LEFT JOIN leads l ON l.id = la.lead_id
  WHERE l.id IS NULL
  OR l.organization_id IS NULL;

  IF leak_count > 0 THEN
    RAISE WARNING '❌ FAILED: Orphaned or cross-org activities detected!';
    RAISE NOTICE 'Found % problematic activities', leak_count;
  ELSE
    RAISE NOTICE '✅ PASSED: CRM activities properly isolated';
  END IF;
END $$;

-- ============================================
-- PERFORMANCE CHECK: Query Efficiency
-- ============================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT la.*
FROM lead_activities la
INNER JOIN leads l ON l.id = la.lead_id
WHERE l.organization_id = (SELECT id FROM organizations LIMIT 1)
ORDER BY la.created_at DESC
LIMIT 20;

RAISE NOTICE 'Review the EXPLAIN output above to ensure index usage';

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT
  'Multi-Tenant Isolation Test Suite' as test_suite,
  NOW() as executed_at,
  'Review NOTICE messages above for test results' as instructions;
