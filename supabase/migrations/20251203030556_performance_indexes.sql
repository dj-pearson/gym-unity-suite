-- Performance Optimization Indexes
-- Created: 2025-12-03
-- Purpose: Add indexes for common query patterns to improve performance

-- =============================================================================
-- Member/Profile Indexes
-- =============================================================================

-- For member search by name within organization
CREATE INDEX IF NOT EXISTS idx_profiles_org_name
ON public.profiles(organization_id, first_name, last_name);

-- For filtering members by role within organization
CREATE INDEX IF NOT EXISTS idx_profiles_org_role
ON public.profiles(organization_id, role);

-- For email lookups within organization
CREATE INDEX IF NOT EXISTS idx_profiles_org_email
ON public.profiles(organization_id, email);

-- =============================================================================
-- Membership Indexes
-- =============================================================================

-- For membership status queries
CREATE INDEX IF NOT EXISTS idx_memberships_member_status
ON public.memberships(member_id, status);

-- For billing queries (upcoming renewals)
CREATE INDEX IF NOT EXISTS idx_memberships_billing_date
ON public.memberships(next_billing_date)
WHERE status = 'active';

-- =============================================================================
-- Class Indexes
-- =============================================================================

-- For upcoming classes within organization
CREATE INDEX IF NOT EXISTS idx_classes_org_scheduled
ON public.classes(organization_id, scheduled_at);

-- For instructor schedule lookups
CREATE INDEX IF NOT EXISTS idx_classes_instructor_scheduled
ON public.classes(instructor_id, scheduled_at);

-- For location-based class queries
CREATE INDEX IF NOT EXISTS idx_classes_location_scheduled
ON public.classes(location_id, scheduled_at);

-- =============================================================================
-- Class Booking Indexes
-- =============================================================================

-- For member booking history
CREATE INDEX IF NOT EXISTS idx_class_bookings_member
ON public.class_bookings(member_id);

-- For class roster queries
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_status
ON public.class_bookings(class_id, status);

-- =============================================================================
-- Check-in Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'check_ins') THEN
        -- For daily check-in reports
        CREATE INDEX IF NOT EXISTS idx_check_ins_org_date
        ON public.check_ins(organization_id, checked_in_at DESC);

        -- For member check-in history
        CREATE INDEX IF NOT EXISTS idx_check_ins_member_date
        ON public.check_ins(member_id, checked_in_at DESC);
    END IF;
END $$;

-- =============================================================================
-- Lead/CRM Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- For lead pipeline views
        CREATE INDEX IF NOT EXISTS idx_leads_org_status_updated
        ON public.leads(organization_id, status, updated_at DESC);

        -- For lead assignment queries
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_status
        ON public.leads(assigned_to, status)
        WHERE assigned_to IS NOT NULL;

        -- For lead source analytics
        CREATE INDEX IF NOT EXISTS idx_leads_org_source
        ON public.leads(organization_id, source);
    END IF;
END $$;

-- =============================================================================
-- Invoice/Billing Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        -- For invoice status queries
        CREATE INDEX IF NOT EXISTS idx_invoices_org_status
        ON public.invoices(organization_id, status);

        -- For overdue invoice queries
        CREATE INDEX IF NOT EXISTS idx_invoices_due_date
        ON public.invoices(due_date)
        WHERE status = 'pending';

        -- For member invoice history
        CREATE INDEX IF NOT EXISTS idx_invoices_member
        ON public.invoices(member_id, created_at DESC);
    END IF;
END $$;

-- =============================================================================
-- Equipment Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
        -- For equipment status queries
        CREATE INDEX IF NOT EXISTS idx_equipment_org_status
        ON public.equipment(organization_id, status);

        -- For maintenance scheduling
        CREATE INDEX IF NOT EXISTS idx_equipment_next_maintenance
        ON public.equipment(organization_id, next_maintenance_date)
        WHERE status = 'active';
    END IF;
END $$;

-- =============================================================================
-- Notification Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- For unread notifications
        CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON public.notifications(user_id, created_at DESC)
        WHERE read_at IS NULL;
    END IF;
END $$;

-- =============================================================================
-- Audit Log Indexes (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        -- For audit log queries by organization
        CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
        ON public.audit_logs(organization_id, created_at DESC);

        -- For user activity tracking
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
        ON public.audit_logs(user_id, created_at DESC);
    END IF;
END $$;

-- =============================================================================
-- Comment: Index Maintenance Notes
-- =============================================================================
--
-- Monitor index usage with:
--   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--   FROM pg_stat_user_indexes
--   ORDER BY idx_scan DESC;
--
-- Find unused indexes:
--   SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
--
-- Rebuild indexes if fragmented:
--   REINDEX INDEX index_name;
--
