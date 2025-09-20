-- Create towel inventory management system

-- Towel inventory table for tracking towel stock
CREATE TABLE public.towel_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  towel_type TEXT NOT NULL DEFAULT 'standard', -- standard, premium, workout, pool
  size TEXT NOT NULL DEFAULT 'medium', -- small, medium, large
  color TEXT NOT NULL DEFAULT 'white',
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  rented_quantity INTEGER NOT NULL DEFAULT 0,
  in_cleaning INTEGER NOT NULL DEFAULT 0,
  damaged_quantity INTEGER NOT NULL DEFAULT 0,
  cost_per_towel DECIMAL(10,2) DEFAULT 0.00,
  rental_price DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  replacement_cost DECIMAL(10,2) DEFAULT 0.00,
  min_stock_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Towel rentals table for tracking individual rentals
CREATE TABLE public.towel_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  towel_inventory_id UUID NOT NULL,
  rental_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rental_time TIME NOT NULL DEFAULT CURRENT_TIME,
  return_date DATE,
  return_time TIME,
  rental_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  late_fee DECIMAL(10,2) DEFAULT 0.00,
  damage_fee DECIMAL(10,2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'member_account', -- cash, card, member_account
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, waived
  towel_condition_out TEXT DEFAULT 'good', -- excellent, good, fair, damaged
  towel_condition_in TEXT,
  staff_out UUID NOT NULL, -- staff member who issued towel
  staff_in UUID, -- staff member who received towel back
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' -- active, returned, lost, damaged
);

-- Towel cleaning logs for tracking cleaning schedules and cycles
CREATE TABLE public.towel_cleaning_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  towel_inventory_id UUID NOT NULL,
  cleaning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_cleaned INTEGER NOT NULL DEFAULT 0,
  cleaning_method TEXT NOT NULL DEFAULT 'machine_wash', -- machine_wash, hand_wash, dry_clean, sanitize
  detergent_used TEXT,
  temperature_celsius INTEGER DEFAULT 60,
  cycle_duration_minutes INTEGER DEFAULT 45,
  staff_assigned UUID NOT NULL,
  quality_check_passed BOOLEAN DEFAULT true,
  quality_check_notes TEXT,
  cost DECIMAL(10,2) DEFAULT 0.00,
  next_cleaning_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  batch_number TEXT, -- for tracking cleaning batches
  cleaning_status TEXT NOT NULL DEFAULT 'completed' -- scheduled, in_progress, completed, failed
);

-- Enable RLS on all tables
ALTER TABLE public.towel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towel_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towel_cleaning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for towel_inventory
CREATE POLICY "Staff can manage towel inventory"
  ON public.towel_inventory
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Members can view towel inventory"
  ON public.towel_inventory
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for towel_rentals
CREATE POLICY "Staff can manage towel rentals"
  ON public.towel_rentals
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Members can view their own towel rentals"
  ON public.towel_rentals
  FOR SELECT
  USING (
    member_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- RLS Policies for towel_cleaning_logs
CREATE POLICY "Staff can manage cleaning logs"
  ON public.towel_cleaning_logs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- Create function to update towel inventory quantities
CREATE OR REPLACE FUNCTION public.update_towel_inventory_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory quantities based on rental status changes
  IF TG_OP = 'INSERT' THEN
    -- New rental: decrease available, increase rented
    UPDATE public.towel_inventory 
    SET 
      available_quantity = available_quantity - 1,
      rented_quantity = rented_quantity + 1,
      updated_at = now()
    WHERE id = NEW.towel_inventory_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed from active to returned
    IF OLD.status = 'active' AND NEW.status = 'returned' THEN
      -- Check if towel needs cleaning or is ready for rent
      IF NEW.towel_condition_in IN ('excellent', 'good') THEN
        UPDATE public.towel_inventory 
        SET 
          available_quantity = available_quantity + 1,
          rented_quantity = rented_quantity - 1,
          updated_at = now()
        WHERE id = NEW.towel_inventory_id;
      ELSE
        -- Towel needs cleaning or is damaged
        UPDATE public.towel_inventory 
        SET 
          rented_quantity = rented_quantity - 1,
          in_cleaning = in_cleaning + 1,
          updated_at = now()
        WHERE id = NEW.towel_inventory_id;
      END IF;
    
    -- Status changed to lost or damaged
    ELSIF OLD.status = 'active' AND NEW.status IN ('lost', 'damaged') THEN
      UPDATE public.towel_inventory 
      SET 
        rented_quantity = rented_quantity - 1,
        damaged_quantity = damaged_quantity + 1,
        updated_at = now()
      WHERE id = NEW.towel_inventory_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for updating inventory quantities
CREATE TRIGGER update_towel_inventory_quantities_trigger
  AFTER INSERT OR UPDATE ON public.towel_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_towel_inventory_quantities();

-- Create function to handle cleaning completion
CREATE OR REPLACE FUNCTION public.handle_cleaning_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When cleaning is completed, move towels from cleaning back to available
  IF TG_OP = 'UPDATE' AND OLD.cleaning_status != 'completed' AND NEW.cleaning_status = 'completed' AND NEW.quality_check_passed = true THEN
    UPDATE public.towel_inventory 
    SET 
      in_cleaning = GREATEST(in_cleaning - NEW.quantity_cleaned, 0),
      available_quantity = available_quantity + NEW.quantity_cleaned,
      updated_at = now()
    WHERE id = NEW.towel_inventory_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for cleaning completion
CREATE TRIGGER handle_cleaning_completion_trigger
  AFTER UPDATE ON public.towel_cleaning_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_cleaning_completion();

-- Create updated_at triggers for all tables
CREATE TRIGGER update_towel_inventory_updated_at
  BEFORE UPDATE ON public.towel_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_towel_rentals_updated_at
  BEFORE UPDATE ON public.towel_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_towel_cleaning_logs_updated_at
  BEFORE UPDATE ON public.towel_cleaning_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_towel_inventory_organization_id ON public.towel_inventory(organization_id);
CREATE INDEX idx_towel_inventory_type_size ON public.towel_inventory(towel_type, size);
CREATE INDEX idx_towel_rentals_organization_id ON public.towel_rentals(organization_id);
CREATE INDEX idx_towel_rentals_member_id ON public.towel_rentals(member_id);
CREATE INDEX idx_towel_rentals_status ON public.towel_rentals(status);
CREATE INDEX idx_towel_rentals_rental_date ON public.towel_rentals(rental_date);
CREATE INDEX idx_towel_cleaning_logs_organization_id ON public.towel_cleaning_logs(organization_id);
CREATE INDEX idx_towel_cleaning_logs_cleaning_date ON public.towel_cleaning_logs(cleaning_date);