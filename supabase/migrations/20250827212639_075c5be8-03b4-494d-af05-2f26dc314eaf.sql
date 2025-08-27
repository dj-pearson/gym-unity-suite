-- Create member engagement tracking table
CREATE TABLE public.member_engagement_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('check_in', 'class_booking', 'message_sent', 'message_opened', 'announcement_viewed', 'app_usage', 'payment', 'referral')),
  engagement_value NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty points table
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_redeemed INTEGER NOT NULL DEFAULT 0,
  current_balance INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('check_in', 'referral', 'class_attendance', 'milestone', 'bonus', 'redemption')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create retention campaigns table
CREATE TABLE public.retention_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('win_back', 'at_risk', 'loyalty_reward', 'milestone_celebration', 'birthday', 'anniversary')),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  message_template TEXT NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('discount', 'free_classes', 'merchandise', 'loyalty_points', 'guest_pass')),
  reward_value NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign executions table
CREATE TABLE public.campaign_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  member_id UUID NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'redeemed', 'expired')),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member feedback table
CREATE TABLE public.member_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'service', 'facility', 'equipment', 'staff', 'class', 'suggestion', 'complaint')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'closed')),
  assigned_to UUID,
  response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral programs table
CREATE TABLE public.referral_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  referrer_reward_type TEXT NOT NULL CHECK (referrer_reward_type IN ('discount', 'free_classes', 'cash_credit', 'loyalty_points', 'merchandise')),
  referrer_reward_value NUMERIC NOT NULL,
  referee_reward_type TEXT CHECK (referee_reward_type IN ('discount', 'free_classes', 'cash_credit', 'loyalty_points', 'merchandise')),
  referee_reward_value NUMERIC,
  max_referrals_per_member INTEGER,
  program_start_date DATE NOT NULL,
  program_end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral tracking table
CREATE TABLE public.member_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL,
  referrer_id UUID NOT NULL,
  referee_email TEXT NOT NULL,
  referee_name TEXT,
  referral_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded', 'expired')),
  signup_date TIMESTAMP WITH TIME ZONE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  reward_given_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.member_engagement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_engagement_history
CREATE POLICY "Members can view their own engagement history"
ON public.member_engagement_history
FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_engagement_history.member_id
    )
  )
);

CREATE POLICY "Staff can manage engagement history"
ON public.member_engagement_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_engagement_history.member_id
    )
  )
);

-- RLS Policies for loyalty_points
CREATE POLICY "Members can view their own loyalty points"
ON public.loyalty_points
FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = loyalty_points.member_id
    )
  )
);

CREATE POLICY "Staff can manage loyalty points"
ON public.loyalty_points
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = loyalty_points.member_id
    )
  )
);

-- RLS Policies for retention_campaigns
CREATE POLICY "Staff can manage retention campaigns"
ON public.retention_campaigns
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for campaign_executions
CREATE POLICY "Members can view their campaign executions"
ON public.campaign_executions
FOR SELECT
USING (
  member_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = campaign_executions.member_id
    )
  )
);

CREATE POLICY "Staff can manage campaign executions"
ON public.campaign_executions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = campaign_executions.member_id
    )
  )
);

-- RLS Policies for member_feedback
CREATE POLICY "Members can create and view their own feedback"
ON public.member_feedback
FOR ALL
USING (
  member_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_feedback.member_id
    )
  )
);

-- RLS Policies for referral_programs
CREATE POLICY "Users can view referral programs in their organization"
ON public.referral_programs
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can manage referral programs"
ON public.referral_programs
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for member_referrals
CREATE POLICY "Members can view their own referrals"
ON public.member_referrals
FOR SELECT
USING (
  referrer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_referrals.referrer_id
    )
  )
);

CREATE POLICY "Members can create referrals"
ON public.member_referrals
FOR INSERT
WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Staff can manage member referrals"
ON public.member_referrals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (
      SELECT organization_id FROM profiles WHERE id = member_referrals.referrer_id
    )
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_loyalty_points_updated_at
BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retention_campaigns_updated_at
BEFORE UPDATE ON public.retention_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_feedback_updated_at
BEFORE UPDATE ON public.member_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_programs_updated_at
BEFORE UPDATE ON public.referral_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_referrals_updated_at
BEFORE UPDATE ON public.member_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_member_engagement_history_member_id ON public.member_engagement_history(member_id);
CREATE INDEX idx_member_engagement_history_type_date ON public.member_engagement_history(engagement_type, created_at);
CREATE INDEX idx_loyalty_points_member_id ON public.loyalty_points(member_id);
CREATE INDEX idx_loyalty_points_activity_type ON public.loyalty_points(activity_type, created_at);
CREATE INDEX idx_campaign_executions_member_campaign ON public.campaign_executions(member_id, campaign_id);
CREATE INDEX idx_member_feedback_status ON public.member_feedback(status, created_at);
CREATE INDEX idx_member_referrals_referrer ON public.member_referrals(referrer_id, status);

-- Create view for member engagement summary
CREATE OR REPLACE VIEW member_engagement_summary AS
SELECT 
  p.id as member_id,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(meh.id) as total_engagements,
  COUNT(CASE WHEN meh.engagement_type = 'check_in' THEN 1 END) as check_ins,
  COUNT(CASE WHEN meh.engagement_type = 'class_booking' THEN 1 END) as class_bookings,
  COUNT(CASE WHEN meh.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as engagements_last_30_days,
  MAX(meh.created_at) as last_engagement,
  COALESCE(SUM(lp.current_balance), 0) as loyalty_points_balance
FROM profiles p
LEFT JOIN member_engagement_history meh ON p.id = meh.member_id
LEFT JOIN loyalty_points lp ON p.id = lp.member_id
WHERE p.role = 'member'
GROUP BY p.id, p.first_name, p.last_name, p.email;