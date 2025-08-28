-- Create advanced analytics views for real-time reporting

-- Create member engagement summary view
CREATE OR REPLACE VIEW member_engagement_summary AS
SELECT 
    p.id as member_id,
    p.first_name,
    p.last_name,
    p.email,
    p.organization_id,
    p.join_date,
    COALESCE(visit_stats.total_visits, 0) as total_visits,
    COALESCE(visit_stats.visits_last_30_days, 0) as visits_last_30_days,
    COALESCE(visit_stats.avg_visit_duration, 0) as avg_visit_duration_minutes,
    COALESCE(class_stats.classes_attended, 0) as classes_attended,
    COALESCE(class_stats.classes_booked_last_30, 0) as classes_booked_last_30,
    CASE 
        WHEN visit_stats.last_visit_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
        WHEN visit_stats.last_visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'at_risk'
        ELSE 'inactive'
    END as engagement_status,
    visit_stats.last_visit_date
FROM profiles p
LEFT JOIN (
    SELECT 
        member_id,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN checked_in_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as visits_last_30_days,
        AVG(EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60) as avg_visit_duration,
        MAX(checked_in_at) as last_visit_date
    FROM check_ins 
    WHERE is_guest = false
    GROUP BY member_id
) visit_stats ON p.id = visit_stats.member_id
LEFT JOIN (
    SELECT 
        cb.member_id,
        COUNT(*) as classes_attended,
        COUNT(CASE WHEN cb.booked_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as classes_booked_last_30
    FROM class_bookings cb
    WHERE cb.status = 'booked'
    GROUP BY cb.member_id
) class_stats ON p.id = class_stats.member_id
WHERE p.role = 'member';

-- Create daily snapshots table for trend analysis
CREATE TABLE IF NOT EXISTS public.daily_analytics_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_members INTEGER NOT NULL DEFAULT 0,
    active_members INTEGER NOT NULL DEFAULT 0,
    new_members_today INTEGER NOT NULL DEFAULT 0,
    total_check_ins INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    classes_scheduled INTEGER NOT NULL DEFAULT 0,
    class_bookings INTEGER NOT NULL DEFAULT 0,
    class_attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.daily_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Organizations can view their analytics snapshots" 
ON public.daily_analytics_snapshots 
FOR SELECT 
USING (organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
));

CREATE POLICY "Staff can manage analytics snapshots" 
ON public.daily_analytics_snapshots 
FOR ALL 
USING (organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create function to update daily snapshots
CREATE OR REPLACE FUNCTION update_daily_analytics_snapshot(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    snapshot_data RECORD;
BEGIN
    -- Calculate today's metrics
    SELECT 
        COUNT(CASE WHEN p.role = 'member' THEN 1 END) as total_members,
        COUNT(CASE WHEN p.role = 'member' AND EXISTS(
            SELECT 1 FROM check_ins ci 
            WHERE ci.member_id = p.id 
            AND ci.checked_in_at >= CURRENT_DATE - INTERVAL '30 days'
        ) THEN 1 END) as active_members,
        COUNT(CASE WHEN p.role = 'member' AND p.join_date = CURRENT_DATE THEN 1 END) as new_members_today,
        COALESCE((
            SELECT COUNT(*) FROM check_ins 
            WHERE checked_in_at::date = CURRENT_DATE 
            AND EXISTS(SELECT 1 FROM profiles WHERE id = check_ins.member_id AND organization_id = org_id)
        ), 0) as total_check_ins,
        COALESCE((
            SELECT SUM(amount) FROM payment_transactions pt
            JOIN profiles p ON pt.organization_id = p.organization_id
            WHERE pt.created_at::date = CURRENT_DATE 
            AND pt.payment_status = 'completed'
            AND p.organization_id = org_id
        ), 0) as total_revenue,
        COALESCE((
            SELECT COUNT(*) FROM classes 
            WHERE organization_id = org_id 
            AND scheduled_at::date = CURRENT_DATE
        ), 0) as classes_scheduled,
        COALESCE((
            SELECT COUNT(*) FROM class_bookings cb
            JOIN classes c ON cb.class_id = c.id
            WHERE c.organization_id = org_id 
            AND cb.booked_at::date = CURRENT_DATE
        ), 0) as class_bookings
    INTO snapshot_data
    FROM profiles p
    WHERE p.organization_id = org_id;

    -- Insert or update daily snapshot
    INSERT INTO daily_analytics_snapshots (
        organization_id,
        snapshot_date,
        total_members,
        active_members,
        new_members_today,
        total_check_ins,
        total_revenue,
        classes_scheduled,
        class_bookings,
        class_attendance_rate
    ) VALUES (
        org_id,
        CURRENT_DATE,
        snapshot_data.total_members,
        snapshot_data.active_members,
        snapshot_data.new_members_today,
        snapshot_data.total_check_ins,
        snapshot_data.total_revenue,
        snapshot_data.classes_scheduled,
        snapshot_data.class_bookings,
        CASE 
            WHEN snapshot_data.classes_scheduled > 0 
            THEN (snapshot_data.class_bookings::decimal / snapshot_data.classes_scheduled * 100)
            ELSE 0 
        END
    )
    ON CONFLICT (organization_id, snapshot_date) 
    DO UPDATE SET
        total_members = EXCLUDED.total_members,
        active_members = EXCLUDED.active_members,
        new_members_today = EXCLUDED.new_members_today,
        total_check_ins = EXCLUDED.total_check_ins,
        total_revenue = EXCLUDED.total_revenue,
        classes_scheduled = EXCLUDED.classes_scheduled,
        class_bookings = EXCLUDED.class_bookings,
        class_attendance_rate = EXCLUDED.class_attendance_rate,
        created_at = now();
END;
$$;