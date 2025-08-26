-- Create a security definer function to get user's organization_id to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy and recreate it properly
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a proper policy using the security definer function
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR organization_id = public.get_user_organization_id(auth.uid())
);