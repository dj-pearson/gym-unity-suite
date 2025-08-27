-- Create member messages table for in-app messaging
CREATE TABLE public.member_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general' CHECK (message_type IN ('general', 'reminder', 'announcement', 'support')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fitness assessments table
CREATE TABLE public.fitness_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fitness_goals TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  workout_preferences TEXT[] NOT NULL DEFAULT '{}',
  workout_frequency TEXT NOT NULL CHECK (workout_frequency IN ('1-2', '3-4', '5-6', 'daily')),
  specific_goals TEXT,
  health_conditions TEXT,
  previous_injuries TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member orientations table
CREATE TABLE public.member_orientations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  orientation_type TEXT NOT NULL CHECK (orientation_type IN ('gym_tour', 'personal_training', 'group_orientation')),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  completed_at TIMESTAMP WITH TIME ZONE,
  staff_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general' CHECK (announcement_type IN ('general', 'maintenance', 'event', 'policy', 'emergency')),
  target_audience TEXT NOT NULL DEFAULT 'all_members' CHECK (target_audience IN ('all_members', 'active_members', 'staff', 'trainers', 'custom')),
  custom_recipients UUID[],
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'equipment', 'complaint', 'suggestion')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member milestones table
CREATE TABLE public.member_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('membership_anniversary', 'birthday', 'fitness_goal', 'attendance', 'referral')),
  title TEXT NOT NULL,
  description TEXT,
  achievement_date DATE NOT NULL,
  recognition_sent BOOLEAN NOT NULL DEFAULT false,
  recognition_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.member_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_messages
CREATE POLICY "Users can view their own messages" ON public.member_messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.member_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Staff can manage all messages" ON public.member_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff')
      AND profiles.organization_id IN (
        SELECT sender_profile.organization_id FROM public.profiles sender_profile WHERE sender_profile.id = member_messages.sender_id
        UNION
        SELECT recipient_profile.organization_id FROM public.profiles recipient_profile WHERE recipient_profile.id = member_messages.recipient_id
      )
    )
  );

-- RLS Policies for fitness_assessments
CREATE POLICY "Members can view their own assessments" ON public.fitness_assessments
  FOR SELECT USING (member_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
    AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = fitness_assessments.member_id)
  ));

CREATE POLICY "Members can create their own assessments" ON public.fitness_assessments
  FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Staff can manage assessments" ON public.fitness_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
      AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = fitness_assessments.member_id)
    )
  );

-- RLS Policies for member_orientations
CREATE POLICY "Members can view their own orientations" ON public.member_orientations
  FOR SELECT USING (member_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
    AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = member_orientations.member_id)
  ));

CREATE POLICY "Members can create their own orientations" ON public.member_orientations
  FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Staff can manage orientations" ON public.member_orientations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
      AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = member_orientations.member_id)
    )
  );

-- RLS Policies for announcements
CREATE POLICY "Staff can manage announcements" ON public.announcements
  FOR ALL USING (
    organization_id IN (
      SELECT profiles.organization_id FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can view published announcements" ON public.announcements
  FOR SELECT USING (
    is_published = true 
    AND organization_id IN (
      SELECT profiles.organization_id FROM public.profiles WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for support_tickets
CREATE POLICY "Members can manage their own tickets" ON public.support_tickets
  FOR ALL USING (member_id = auth.uid());

CREATE POLICY "Staff can manage all tickets" ON public.support_tickets
  FOR ALL USING (
    organization_id IN (
      SELECT profiles.organization_id FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

-- RLS Policies for member_milestones
CREATE POLICY "Members can view their own milestones" ON public.member_milestones
  FOR SELECT USING (member_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff')
    AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = member_milestones.member_id)
  ));

CREATE POLICY "Staff can manage milestones" ON public.member_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager', 'staff')
      AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = member_milestones.member_id)
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_member_messages_updated_at
  BEFORE UPDATE ON public.member_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fitness_assessments_updated_at
  BEFORE UPDATE ON public.fitness_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_orientations_updated_at
  BEFORE UPDATE ON public.member_orientations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();