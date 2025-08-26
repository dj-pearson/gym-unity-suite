-- Fix the security definer function to include proper search path
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;