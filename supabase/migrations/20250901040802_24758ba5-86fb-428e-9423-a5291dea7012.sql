-- First, let's ensure we have all the necessary marketing tables with proper structure
-- Create marketing campaigns table if it doesn't exist (it does exist based on our table list)

-- Check if marketing_campaigns table needs any missing columns
DO $$
BEGIN
    -- Add any missing columns to marketing_campaigns table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'sent_count') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN sent_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'open_rate') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN open_rate DECIMAL(5,4) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'click_rate') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN click_rate DECIMAL(5,4) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'subject') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN subject TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'content') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'segment') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN segment TEXT DEFAULT 'all_members';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_campaigns' AND column_name = 'scheduled_at') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org_id ON marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON marketing_campaigns(created_at);

-- Add sample marketing campaigns for demonstration (if table is empty)
INSERT INTO marketing_campaigns (
    organization_id, 
    name, 
    subject, 
    content,
    campaign_type, 
    status, 
    sent_count, 
    open_rate, 
    click_rate,
    segment,
    created_at,
    scheduled_at
) 
SELECT 
    o.id as organization_id,
    'New Member Welcome Series' as name,
    'Welcome to RepClub! Your fitness journey starts now 💪' as subject,
    'Welcome to our fitness community! We''re excited to help you achieve your fitness goals.' as content,
    'email' as campaign_type,
    'active' as status,
    45 as sent_count,
    0.85 as open_rate,
    0.23 as click_rate,
    'new_members' as segment,
    NOW() - INTERVAL '5 days' as created_at,
    NULL as scheduled_at
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM marketing_campaigns WHERE organization_id = o.id)
LIMIT 1;

INSERT INTO marketing_campaigns (
    organization_id, 
    name, 
    subject, 
    content,
    campaign_type, 
    status, 
    sent_count, 
    open_rate, 
    click_rate,
    segment,
    created_at,
    scheduled_at
) 
SELECT 
    o.id as organization_id,
    'Class Reminder Campaign' as name,
    'Don''t forget your yoga class tomorrow at 10 AM!' as subject,
    'This is a friendly reminder about your upcoming class. We look forward to seeing you there!' as content,
    'email' as campaign_type,
    'scheduled' as status,
    0 as sent_count,
    0 as open_rate,
    0 as click_rate,
    'active_members' as segment,
    NOW() - INTERVAL '2 days' as created_at,
    NOW() + INTERVAL '1 day' as scheduled_at
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM marketing_campaigns WHERE organization_id = o.id AND name = 'Class Reminder Campaign')
LIMIT 1;