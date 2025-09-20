-- Create retail products table
CREATE TABLE public.retail_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  brand TEXT,
  supplier TEXT,
  cost_price NUMERIC(10,2),
  sale_price NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  requires_age_verification BOOLEAN DEFAULT false,
  weight_grams INTEGER,
  dimensions TEXT,
  image_url TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, sku)
);

-- Create inventory items table for stock tracking
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.retail_products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_point INTEGER DEFAULT 0,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  last_count_date DATE,
  cost_per_unit NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, location_id)
);

-- Create retail transactions table
CREATE TABLE public.retail_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  transaction_number TEXT NOT NULL,
  member_id UUID,
  cashier_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  amount_tendered NUMERIC(10,2),
  change_given NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_reference TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  void_reason TEXT,
  voided_by UUID,
  voided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  UNIQUE(organization_id, transaction_number)
);

-- Create retail transaction items table
CREATE TABLE public.retail_transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.retail_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.retail_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock movements table for inventory tracking
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.retail_transactions(id),
  movement_type TEXT NOT NULL, -- 'sale', 'restock', 'adjustment', 'return', 'waste'
  quantity_change INTEGER NOT NULL,
  reference_number TEXT,
  reason TEXT,
  performed_by UUID NOT NULL,
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.retail_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retail_products
CREATE POLICY "Staff can manage retail products" ON public.retail_products
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Members can view active products" ON public.retail_products
FOR SELECT USING (
  is_active = true AND 
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
);

-- RLS Policies for inventory_items
CREATE POLICY "Staff can manage inventory" ON public.inventory_items
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for retail_transactions
CREATE POLICY "Staff can manage transactions" ON public.retail_transactions
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

CREATE POLICY "Members can view their own transactions" ON public.retail_transactions
FOR SELECT USING (
  member_id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- RLS Policies for retail_transaction_items
CREATE POLICY "Staff can manage transaction items" ON public.retail_transaction_items
FOR ALL USING (
  transaction_id IN (
    SELECT id FROM retail_transactions 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff')
    )
  )
);

-- RLS Policies for stock_movements
CREATE POLICY "Staff can manage stock movements" ON public.stock_movements
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager', 'staff')
  )
);

-- Create indexes for better performance
CREATE INDEX idx_retail_products_org_active ON public.retail_products(organization_id, is_active);
CREATE INDEX idx_retail_products_sku ON public.retail_products(organization_id, sku);
CREATE INDEX idx_retail_products_category ON public.retail_products(organization_id, category);
CREATE INDEX idx_inventory_items_org_product ON public.inventory_items(organization_id, product_id);
CREATE INDEX idx_inventory_items_stock_level ON public.inventory_items(organization_id, current_stock, min_stock_level);
CREATE INDEX idx_retail_transactions_org_date ON public.retail_transactions(organization_id, transaction_date);
CREATE INDEX idx_retail_transactions_member ON public.retail_transactions(member_id);
CREATE INDEX idx_retail_transactions_cashier ON public.retail_transactions(cashier_id);
CREATE INDEX idx_stock_movements_org_date ON public.stock_movements(organization_id, movement_date);
CREATE INDEX idx_stock_movements_inventory ON public.stock_movements(inventory_item_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_retail_products_updated_at
  BEFORE UPDATE ON public.retail_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retail_transactions_updated_at
  BEFORE UPDATE ON public.retail_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update stock levels
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update inventory on sales
CREATE TRIGGER update_inventory_on_sale
  AFTER INSERT ON public.retail_transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_transaction();

-- Create function to generate transaction numbers
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION public.set_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := public.generate_transaction_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_transaction_number_trigger
  BEFORE INSERT ON public.retail_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_number();