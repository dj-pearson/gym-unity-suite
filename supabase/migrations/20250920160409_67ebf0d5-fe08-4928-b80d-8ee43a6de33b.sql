-- Fix security definer functions that don't have proper search_path
-- These are likely existing functions that need to be updated

-- Update existing functions to have proper search_path setting
CREATE OR REPLACE FUNCTION public.recalculate_lead_scores(org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
  -- Reset all lead scores for the organization
  UPDATE public.leads 
  SET lead_score = 0, qualification_status = 'unqualified'
  WHERE organization_id = org_id;
  
  -- This is a placeholder for the actual scoring logic
  -- In a real implementation, you would loop through scoring rules
  -- and apply them to calculate scores for each lead
  
  -- Update qualification status based on score ranges
  UPDATE public.leads 
  SET qualification_status = CASE 
    WHEN lead_score >= 80 THEN 'qualified'
    WHEN lead_score >= 60 THEN 'hot'
    WHEN lead_score >= 40 THEN 'warm'
    WHEN lead_score >= 20 THEN 'cold'
    ELSE 'unqualified'
  END
  WHERE organization_id = org_id;
END;
$$;

-- Update other functions that might have search_path issues
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
BEGIN
  -- Update stock when transaction item is inserted (sale)
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory_items 
    SET current_stock = current_stock - NEW.quantity
    WHERE product_id = NEW.product_id;
    
    -- Create stock movement record
    INSERT INTO public.stock_movements (
      organization_id,
      inventory_item_id,
      transaction_id,
      movement_type,
      quantity_change,
      performed_by
    )
    SELECT 
      rt.organization_id,
      ii.id,
      NEW.transaction_id,
      'sale',
      -NEW.quantity,
      rt.cashier_id
    FROM retail_transactions rt
    JOIN inventory_items ii ON ii.product_id = NEW.product_id
    WHERE rt.id = NEW.transaction_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_transaction_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate transaction number: current date + 6 random digits
    new_number := to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM public.retail_transactions WHERE transaction_number = new_number) INTO number_exists;
    
    IF NOT number_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_waitlist_priority()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
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

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public  -- Add this line
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