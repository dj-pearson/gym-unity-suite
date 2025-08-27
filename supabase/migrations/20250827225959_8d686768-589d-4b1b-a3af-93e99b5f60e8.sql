-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  priority TEXT NOT NULL DEFAULT 'normal',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Members can view their own notifications"
ON public.notifications
FOR SELECT
USING (member_id = auth.uid());

CREATE POLICY "Staff can manage all notifications in their organization"
ON public.notifications
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage notification templates"
ON public.notification_templates
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  class_reminders BOOLEAN NOT NULL DEFAULT true,
  waitlist_updates BOOLEAN NOT NULL DEFAULT true,
  membership_updates BOOLEAN NOT NULL DEFAULT true,
  marketing_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (member_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_organization_id ON public.notifications(organization_id);

-- Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for notification templates
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create default notification preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only create for members
  IF NEW.role = 'member' THEN
    INSERT INTO public.notification_preferences (member_id)
    VALUES (NEW.id)
    ON CONFLICT (member_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create notification preferences for new members
CREATE TRIGGER on_member_created_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Create function to send class reminder notifications
CREATE OR REPLACE FUNCTION public.create_class_reminder_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  class_record RECORD;
  booking_record RECORD;
BEGIN
  -- Find classes starting in 2 hours that need reminders
  FOR class_record IN 
    SELECT 
      c.id as class_id,
      c.name as class_name,
      c.scheduled_at,
      c.organization_id,
      l.name as location_name
    FROM classes c
    LEFT JOIN locations l ON c.location_id = l.id
    WHERE c.scheduled_at BETWEEN 
      (now() + INTERVAL '1 hour 45 minutes') AND 
      (now() + INTERVAL '2 hours 15 minutes')
  LOOP
    -- Create notifications for all booked members
    FOR booking_record IN
      SELECT cb.member_id, p.first_name, p.last_name
      FROM class_bookings cb
      JOIN profiles p ON cb.member_id = p.id
      JOIN notification_preferences np ON p.id = np.member_id
      WHERE cb.class_id = class_record.class_id
      AND cb.status = 'booked'
      AND np.class_reminders = true
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.member_id = cb.member_id 
        AND n.type = 'class_reminder'
        AND n.metadata->>'class_id' = class_record.class_id::text
      )
    LOOP
      INSERT INTO notifications (
        organization_id,
        member_id,
        type,
        title,
        message,
        metadata,
        scheduled_for
      ) VALUES (
        class_record.organization_id,
        booking_record.member_id,
        'class_reminder',
        'Class Reminder: ' || class_record.class_name,
        'Don''t forget! Your class "' || class_record.class_name || '" starts at ' || 
        to_char(class_record.scheduled_at, 'HH24:MI') || 
        COALESCE(' at ' || class_record.location_name, '') || '. See you there!',
        jsonb_build_object(
          'class_id', class_record.class_id,
          'class_name', class_record.class_name,
          'scheduled_at', class_record.scheduled_at
        ),
        now()
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Create function to send waitlist promotion notifications
CREATE OR REPLACE FUNCTION public.create_waitlist_promotion_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  class_info RECORD;
  member_info RECORD;
  org_id UUID;
BEGIN
  -- Only process waitlist promotions
  IF TG_OP = 'UPDATE' AND OLD.status = 'waiting' AND NEW.status = 'promoted' THEN
    -- Get class and member information
    SELECT c.name, c.scheduled_at, c.organization_id, l.name as location_name
    INTO class_info
    FROM classes c
    LEFT JOIN locations l ON c.location_id = l.id
    WHERE c.id = NEW.class_id;
    
    SELECT first_name, last_name, organization_id
    INTO member_info
    FROM profiles
    WHERE id = NEW.member_id;
    
    -- Create promotion notification
    INSERT INTO notifications (
      organization_id,
      member_id,
      type,
      title,
      message,
      priority,
      metadata,
      scheduled_for
    ) VALUES (
      class_info.organization_id,
      NEW.member_id,
      'waitlist_promotion',
      'Great News! You''re Off the Waitlist',
      'A spot opened up in "' || class_info.name || '" on ' || 
      to_char(class_info.scheduled_at, 'Mon, DD FMMonth at HH24:MI') ||
      COALESCE(' at ' || class_info.location_name, '') || 
      '. You''ve been automatically booked!',
      'high',
      jsonb_build_object(
        'class_id', NEW.class_id,
        'class_name', class_info.name,
        'scheduled_at', class_info.scheduled_at,
        'waitlist_id', NEW.id
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for waitlist promotions
CREATE TRIGGER on_waitlist_promotion_notification
  AFTER UPDATE ON public.class_waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.create_waitlist_promotion_notification();

-- Insert default notification templates
INSERT INTO public.notification_templates (
  organization_id, name, template_type, subject, content, variables, created_by
) 
SELECT 
  p.organization_id,
  'Class Reminder',
  'class_reminder',
  'Reminder: {{class_name}} starts soon!',
  'Hi {{member_name}}, your class "{{class_name}}" starts at {{class_time}} today. Don''t forget to bring your water bottle and towel!',
  '{"class_name": "Class Name", "member_name": "Member Name", "class_time": "Class Time"}',
  p.id
FROM profiles p 
WHERE p.role IN ('owner', 'manager') 
AND p.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_templates (
  organization_id, name, template_type, subject, content, variables, created_by
) 
SELECT 
  p.organization_id,
  'Waitlist Promotion',
  'waitlist_promotion',
  'You''re off the waitlist for {{class_name}}!',
  'Great news {{member_name}}! A spot opened up in "{{class_name}}" and you''ve been automatically enrolled. The class is on {{class_date}} at {{class_time}}.',
  '{"class_name": "Class Name", "member_name": "Member Name", "class_date": "Class Date", "class_time": "Class Time"}',
  p.id
FROM profiles p 
WHERE p.role IN ('owner', 'manager') 
AND p.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;