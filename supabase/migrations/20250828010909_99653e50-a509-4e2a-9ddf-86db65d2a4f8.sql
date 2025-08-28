-- Fix the member_engagement_summary view
DROP VIEW IF EXISTS member_engagement_summary;

-- Create improved member engagement summary view
CREATE VIEW member_engagement_summary AS
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

-- Enable RLS on daily snapshots
ALTER TABLE public.daily_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily snapshots
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