-- Create marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'in_app')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
    subject TEXT,
    content TEXT NOT NULL,
    target_segment TEXT NOT NULL DEFAULT 'all_members' CHECK (target_segment IN ('all_members', 'new_members', 'active_members', 'at_risk_members', 'vip_members', 'custom')),
    custom_recipients UUID[],
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketing_campaigns
CREATE POLICY "Staff can manage marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (
    organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
    )
);

-- Create campaign executions table (already exists, but add if missing)
-- This tracks individual campaign sends to members

-- Create loyalty program rules table
CREATE TABLE IF NOT EXISTS public.loyalty_program_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_program_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loyalty_program_rules
CREATE POLICY "Staff can manage loyalty rules" 
ON public.loyalty_program_rules 
FOR ALL 
USING (
    organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
    )
);

-- Create loyalty rewards catalog table
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    points_cost INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    redemption_limit INTEGER,
    expiry_date DATE,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loyalty_rewards
CREATE POLICY "Staff can manage loyalty rewards" 
ON public.loyalty_rewards 
FOR ALL 
USING (
    organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
    )
);

CREATE POLICY "Members can view available rewards" 
ON public.loyalty_rewards 
FOR SELECT 
USING (
    is_active = true AND
    organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
    )
);

-- Create loyalty redemptions table
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    fulfilled_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loyalty_redemptions
CREATE POLICY "Members can view their own redemptions" 
ON public.loyalty_redemptions 
FOR SELECT 
USING (
    member_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
        AND profiles.organization_id = (
            SELECT profiles_1.organization_id
            FROM profiles profiles_1
            WHERE profiles_1.id = loyalty_redemptions.member_id
        )
    )
);

CREATE POLICY "Members can create their own redemptions" 
ON public.loyalty_redemptions 
FOR INSERT 
WITH CHECK (member_id = auth.uid());

CREATE POLICY "Staff can manage redemptions" 
ON public.loyalty_redemptions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
        AND profiles.organization_id = (
            SELECT profiles_1.organization_id
            FROM profiles profiles_1
            WHERE profiles_1.id = loyalty_redemptions.member_id
        )
    )
);

-- Create member segments table for marketing
CREATE TABLE IF NOT EXISTS public.member_segments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    member_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    is_dynamic BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_segments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for member_segments
CREATE POLICY "Staff can manage member segments" 
ON public.member_segments 
FOR ALL 
USING (
    organization_id IN (
        SELECT profiles.organization_id
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'manager', 'staff')
    )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON public.marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_program_rules_updated_at
    BEFORE UPDATE ON public.loyalty_program_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at
    BEFORE UPDATE ON public.loyalty_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_redemptions_updated_at
    BEFORE UPDATE ON public.loyalty_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_segments_updated_at
    BEFORE UPDATE ON public.member_segments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_organization_id ON public.marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_at ON public.marketing_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_loyalty_program_rules_organization_id ON public.loyalty_program_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_program_rules_activity_type ON public.loyalty_program_rules(activity_type);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_organization_id ON public.loyalty_rewards(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_category ON public.loyalty_rewards(category);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_member_id ON public.loyalty_redemptions(member_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_reward_id ON public.loyalty_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status ON public.loyalty_redemptions(status);

CREATE INDEX IF NOT EXISTS idx_member_segments_organization_id ON public.member_segments(organization_id);