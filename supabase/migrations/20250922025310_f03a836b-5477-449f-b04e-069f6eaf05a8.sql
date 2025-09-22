-- Create POS products table
CREATE TABLE public.pos_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create POS sales table
CREATE TABLE public.pos_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  sale_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL,
  customer_id UUID,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'completed',
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create POS sale items table
CREATE TABLE public.pos_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pos_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Staff can manage POS products" 
ON public.pos_products 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create policies for sales
CREATE POLICY "Staff can manage POS sales" 
ON public.pos_sales 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create policies for sale items
CREATE POLICY "Staff can view POS sale items" 
ON public.pos_sale_items 
FOR SELECT 
USING (sale_id IN (
  SELECT id FROM pos_sales 
  WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
  )
));

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION public.generate_pos_sale_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate sale number: POS + current date + 4 random digits
    new_number := 'POS' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM public.pos_sales WHERE sale_number = new_number) INTO number_exists;
    
    IF NOT number_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Create trigger for sale number
CREATE OR REPLACE FUNCTION public.set_pos_sale_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := public.generate_pos_sale_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pos_sale_number_trigger
  BEFORE INSERT ON public.pos_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pos_sale_number();

-- Create triggers for updated_at
CREATE TRIGGER update_pos_products_updated_at
  BEFORE UPDATE ON public.pos_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();