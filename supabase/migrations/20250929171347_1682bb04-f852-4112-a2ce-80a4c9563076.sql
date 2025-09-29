-- Create early access requests table
CREATE TABLE public.early_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  phone TEXT,
  business_type TEXT NOT NULL,
  current_members TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'converted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.early_access_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting early access requests (anyone can submit)
CREATE POLICY "Anyone can submit early access requests"
ON public.early_access_requests
FOR INSERT
WITH CHECK (true);

-- Create policy for staff to view and manage requests
CREATE POLICY "Staff can manage early access requests"
ON public.early_access_requests
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('owner', 'manager', 'staff')
));

-- Create index for better performance
CREATE INDEX idx_early_access_email ON public.early_access_requests(email);
CREATE INDEX idx_early_access_status ON public.early_access_requests(status);
CREATE INDEX idx_early_access_created_at ON public.early_access_requests(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_early_access_updated_at
  BEFORE UPDATE ON public.early_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();