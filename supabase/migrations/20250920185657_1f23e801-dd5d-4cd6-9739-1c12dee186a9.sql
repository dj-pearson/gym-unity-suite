-- Create department revenues table
CREATE TABLE IF NOT EXISTS public.department_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  department_name TEXT NOT NULL,
  revenue_source TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_amount NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_transaction_value NUMERIC DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost allocations table
CREATE TABLE IF NOT EXISTS public.cost_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  department_name TEXT NOT NULL,
  cost_category TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  allocation_basis TEXT NOT NULL,
  allocation_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department budgets table
CREATE TABLE IF NOT EXISTS public.department_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  department_name TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER,
  revenue_budget NUMERIC DEFAULT 0,
  expense_budget NUMERIC DEFAULT 0,
  profit_target NUMERIC DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, department_name, budget_year, budget_month)
);

-- Enable RLS on all tables
ALTER TABLE public.department_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can manage department revenues"
ON public.department_revenues
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can manage cost allocations"
ON public.cost_allocations
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can manage department budgets"
ON public.department_budgets
FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_department_revenues_updated_at') THEN
    CREATE TRIGGER update_department_revenues_updated_at
    BEFORE UPDATE ON public.department_revenues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cost_allocations_updated_at') THEN
    CREATE TRIGGER update_cost_allocations_updated_at
    BEFORE UPDATE ON public.cost_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_department_budgets_updated_at') THEN
    CREATE TRIGGER update_department_budgets_updated_at
    BEFORE UPDATE ON public.department_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_revenues_org_period ON public.department_revenues(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_department_revenues_department ON public.department_revenues(department_name);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_org_period ON public.cost_allocations(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_department ON public.cost_allocations(department_name);
CREATE INDEX IF NOT EXISTS idx_department_budgets_org_year ON public.department_budgets(organization_id, budget_year);