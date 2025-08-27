-- Add family relationship support to profiles
ALTER TABLE public.profiles 
ADD COLUMN parent_member_id uuid REFERENCES public.profiles(id),
ADD COLUMN relationship_type text CHECK (relationship_type IN ('parent', 'child', 'spouse', 'guardian', 'dependent')),
ADD COLUMN family_notes text;

-- Create member documents table
CREATE TABLE public.member_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('waiver', 'medical', 'contract', 'photo_id', 'payment', 'other')),
  file_url text,
  file_size integer,
  uploaded_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on member documents
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for member documents
CREATE POLICY "Members can view their own documents" 
ON public.member_documents 
FOR SELECT 
USING (
  member_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = (
      SELECT profiles.organization_id 
      FROM profiles 
      WHERE profiles.id = member_documents.member_id
    ) 
    AND profiles.role = ANY (ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

CREATE POLICY "Staff can manage member documents" 
ON public.member_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = (
      SELECT profiles.organization_id 
      FROM profiles 
      WHERE profiles.id = member_documents.member_id
    ) 
    AND profiles.role = ANY (ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
  )
);

-- Modify check_ins table to support guests (leads)
ALTER TABLE public.check_ins 
ADD COLUMN guest_name text,
ADD COLUMN guest_email text,
ADD COLUMN guest_phone text,
ADD COLUMN is_guest boolean DEFAULT false,
ADD COLUMN lead_id uuid REFERENCES public.leads(id);

-- Update check_ins policies to handle guests
DROP POLICY "Members can view their own check-ins" ON public.check_ins;
DROP POLICY "Staff can manage check-ins" ON public.check_ins;

-- Create new policies for check-ins with guest support
CREATE POLICY "Members can view their own check-ins" 
ON public.check_ins 
FOR SELECT 
USING (
  (member_id = auth.uid() AND is_guest = false) 
  OR (location_id IN (
    SELECT locations.id FROM locations 
    WHERE locations.organization_id IN (
      SELECT profiles.organization_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ANY (ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  ))
);

CREATE POLICY "Staff can manage all check-ins" 
ON public.check_ins 
FOR ALL 
USING (
  location_id IN (
    SELECT locations.id FROM locations 
    WHERE locations.organization_id IN (
      SELECT profiles.organization_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = ANY (ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  )
);

-- Create member attendance summary view
CREATE OR REPLACE VIEW member_attendance_summary AS
SELECT 
  p.id as member_id,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(c.id) as total_visits,
  COUNT(CASE WHEN c.checked_in_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as visits_last_30_days,
  COUNT(CASE WHEN c.checked_in_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as visits_last_7_days,
  MAX(c.checked_in_at) as last_visit,
  AVG(EXTRACT(EPOCH FROM (c.checked_out_at - c.checked_in_at))/60) as avg_duration_minutes
FROM profiles p
LEFT JOIN check_ins c ON p.id = c.member_id AND c.is_guest = false
WHERE p.role = 'member'
GROUP BY p.id, p.first_name, p.last_name, p.email;

-- Add trigger for member documents updated_at
CREATE TRIGGER update_member_documents_updated_at
BEFORE UPDATE ON public.member_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();