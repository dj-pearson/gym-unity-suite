-- Add sample marketing campaigns with correct column names based on actual schema
INSERT INTO marketing_campaigns (
    organization_id, 
    name, 
    subject, 
    content,
    campaign_type, 
    status, 
    sent_count, 
    opened_count, 
    clicked_count,
    target_segment,
    created_by,
    created_at,
    scheduled_at
) 
SELECT 
    p.organization_id,
    'New Member Welcome Series' as name,
    'Welcome to RepClub! Your fitness journey starts now 💪' as subject,
    'Welcome to our fitness community! We''re excited to help you achieve your fitness goals.' as content,
    'email' as campaign_type,
    'active' as status,
    45 as sent_count,
    38 as opened_count,  -- 38/45 = 0.84 open rate
    10 as clicked_count, -- 10/45 = 0.22 click rate
    'new_members' as target_segment,
    p.id as created_by,
    NOW() - INTERVAL '5 days' as created_at,
    NULL as scheduled_at
FROM profiles p
WHERE p.role IN ('owner', 'manager') 
AND NOT EXISTS (
    SELECT 1 FROM marketing_campaigns 
    WHERE organization_id = p.organization_id 
    AND name = 'New Member Welcome Series'
)
LIMIT 1;

INSERT INTO marketing_campaigns (
    organization_id, 
    name, 
    subject, 
    content,
    campaign_type, 
    status, 
    sent_count, 
    opened_count, 
    clicked_count,
    target_segment,
    created_by,
    created_at,
    scheduled_at
) 
SELECT 
    p.organization_id,
    'Class Reminder Campaign' as name,
    'Don''t forget your yoga class tomorrow at 10 AM!' as subject,
    'This is a friendly reminder about your upcoming class. We look forward to seeing you there!' as content,
    'email' as campaign_type,
    'scheduled' as status,
    0 as sent_count,
    0 as opened_count,
    0 as clicked_count,
    'active_members' as target_segment,
    p.id as created_by,
    NOW() - INTERVAL '2 days' as created_at,
    NOW() + INTERVAL '1 day' as scheduled_at
FROM profiles p
WHERE p.role IN ('owner', 'manager') 
AND NOT EXISTS (
    SELECT 1 FROM marketing_campaigns 
    WHERE organization_id = p.organization_id 
    AND name = 'Class Reminder Campaign'
)
LIMIT 1;

INSERT INTO marketing_campaigns (
    organization_id, 
    name, 
    subject, 
    content,
    campaign_type, 
    status, 
    sent_count, 
    opened_count, 
    clicked_count,
    target_segment,
    created_by,
    created_at,
    scheduled_at
) 
SELECT 
    p.organization_id,
    'Member Retention Offer' as name,
    '🎯 Special offer just for you - Come back to RepClub' as subject,
    'We miss you! Here''s a special offer to welcome you back to your fitness journey.' as content,
    'email' as campaign_type,
    'completed' as status,
    23 as sent_count,
    15 as opened_count,  -- 15/23 = 0.65 open rate
    3 as clicked_count,  -- 3/23 = 0.13 click rate
    'at_risk_members' as target_segment,
    p.id as created_by,
    NOW() - INTERVAL '10 days' as created_at,
    NULL as scheduled_at
FROM profiles p
WHERE p.role IN ('owner', 'manager') 
AND NOT EXISTS (
    SELECT 1 FROM marketing_campaigns 
    WHERE organization_id = p.organization_id 
    AND name = 'Member Retention Offer'
)
LIMIT 1;