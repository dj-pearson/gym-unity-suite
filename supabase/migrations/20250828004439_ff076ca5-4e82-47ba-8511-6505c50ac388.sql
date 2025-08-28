-- Add staff management fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Create staff schedules table
CREATE TABLE IF NOT EXISTS public.staff_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    break_start TIME,
    break_end TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_schedules
CREATE POLICY "Staff schedules are viewable by organization members" 
ON public.staff_schedules 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = staff_schedules.organization_id
    )
);

CREATE POLICY "Staff can manage their own schedules" 
ON public.staff_schedules 
FOR ALL 
USING (
    staff_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = staff_schedules.organization_id
        AND profiles.role IN ('owner', 'manager')
    )
);

-- Create time tracking table
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_pay DECIMAL(10,2),
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reviewed')),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_entries
CREATE POLICY "Time entries are viewable by organization members" 
ON public.time_entries 
FOR SELECT 
USING (
    staff_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = time_entries.organization_id
        AND profiles.role IN ('owner', 'manager')
    )
);

CREATE POLICY "Staff can create their own time entries" 
ON public.time_entries 
FOR INSERT 
WITH CHECK (
    staff_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = time_entries.organization_id
    )
);

CREATE POLICY "Staff can update their own time entries" 
ON public.time_entries 
FOR UPDATE 
USING (
    staff_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = time_entries.organization_id
        AND profiles.role IN ('owner', 'manager')
    )
);

-- Create payroll periods table
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'paid')),
    total_amount DECIMAL(12,2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, start_date, end_date)
);

-- Enable RLS
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payroll_periods
CREATE POLICY "Payroll periods are viewable by managers" 
ON public.payroll_periods 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = payroll_periods.organization_id
        AND profiles.role IN ('owner', 'manager')
    )
);

CREATE POLICY "Managers can manage payroll periods" 
ON public.payroll_periods 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = payroll_periods.organization_id
        AND profiles.role IN ('owner', 'manager')
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_staff_schedules_updated_at
    BEFORE UPDATE ON public.staff_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON public.time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at
    BEFORE UPDATE ON public.payroll_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON public.staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_organization_id ON public.staff_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_staff_id ON public.time_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON public.time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_dates ON public.time_entries(clock_in, clock_out);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_organization_id ON public.payroll_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON public.payroll_periods(start_date, end_date);