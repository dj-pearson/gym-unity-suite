-- Create class waitlists table
CREATE TABLE public.class_waitlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  member_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, member_id)
);

-- Enable RLS for class waitlists
ALTER TABLE public.class_waitlists ENABLE ROW LEVEL SECURITY;

-- Create policies for class waitlists
CREATE POLICY "Members can view their own waitlist entries" 
ON public.class_waitlists 
FOR SELECT 
USING (
  member_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
    AND profiles.organization_id = (
      SELECT profiles.organization_id 
      FROM profiles 
      WHERE profiles.id = class_waitlists.member_id
    )
  )
);

CREATE POLICY "Members can join waitlists" 
ON public.class_waitlists 
FOR INSERT 
WITH CHECK (
  member_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_waitlists.class_id
    AND classes.organization_id = (
      SELECT profiles.organization_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage waitlists" 
ON public.class_waitlists 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'manager', 'staff', 'trainer')
    AND profiles.organization_id = (
      SELECT classes.organization_id 
      FROM classes 
      WHERE classes.id = class_waitlists.class_id
    )
  )
);

-- Create function to automatically update priority order
CREATE OR REPLACE FUNCTION public.update_waitlist_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Set priority order based on join time
  IF TG_OP = 'INSERT' THEN
    NEW.priority_order := COALESCE(
      (SELECT MAX(priority_order) + 1 FROM class_waitlists WHERE class_id = NEW.class_id),
      1
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waitlist priority
CREATE TRIGGER set_waitlist_priority
  BEFORE INSERT ON public.class_waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waitlist_priority();

-- Create function to promote from waitlist when booking is cancelled
CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_member_id UUID;
  class_capacity INTEGER;
  current_bookings INTEGER;
BEGIN
  -- Only process when a booking is cancelled
  IF TG_OP = 'UPDATE' AND OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
    -- Check if there are people on the waitlist for this class
    SELECT member_id INTO next_member_id
    FROM class_waitlists 
    WHERE class_id = NEW.class_id 
    AND status = 'waiting'
    ORDER BY priority_order ASC, joined_at ASC
    LIMIT 1;
    
    IF next_member_id IS NOT NULL THEN
      -- Get class capacity and current bookings
      SELECT max_capacity INTO class_capacity
      FROM classes 
      WHERE id = NEW.class_id;
      
      SELECT COUNT(*) INTO current_bookings
      FROM class_bookings 
      WHERE class_id = NEW.class_id 
      AND status = 'booked';
      
      -- If there's space, promote the first person from waitlist
      IF current_bookings < class_capacity THEN
        -- Create booking for waitlisted member
        INSERT INTO class_bookings (class_id, member_id, status, booked_at)
        VALUES (NEW.class_id, next_member_id, 'booked', now());
        
        -- Update waitlist status
        UPDATE class_waitlists 
        SET status = 'promoted', notified_at = now()
        WHERE class_id = NEW.class_id 
        AND member_id = next_member_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic waitlist promotion
CREATE TRIGGER promote_waitlist_on_cancellation
  AFTER UPDATE ON public.class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_from_waitlist();

-- Add updated_at trigger for waitlists
CREATE TRIGGER update_class_waitlists_updated_at
  BEFORE UPDATE ON public.class_waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_class_waitlists_class_id ON public.class_waitlists(class_id);
CREATE INDEX idx_class_waitlists_member_id ON public.class_waitlists(member_id);
CREATE INDEX idx_class_waitlists_priority ON public.class_waitlists(class_id, priority_order, joined_at);