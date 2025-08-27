-- Fix function search path security issues for existing functions

-- Update promote_from_waitlist function 
CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
$$;

-- Update update_waitlist_priority function
CREATE OR REPLACE FUNCTION public.update_waitlist_priority()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
$$;