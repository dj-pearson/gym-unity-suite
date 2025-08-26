-- Fix infinite recursion in profiles RLS policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a proper policy without recursion
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);