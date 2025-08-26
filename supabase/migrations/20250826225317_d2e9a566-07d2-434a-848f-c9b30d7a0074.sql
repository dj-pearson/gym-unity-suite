-- Create a default organization for testing with proper UUID
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color)
VALUES (
  gen_random_uuid(),
  'Rep Club Fitness',
  'rep-club-fitness',
  '#2563eb',
  '#f97316'
) ON CONFLICT DO NOTHING
RETURNING id;

-- Get or create organization and location, then create profile
DO $$
DECLARE
    org_id UUID;
    loc_id UUID;
BEGIN
    -- Get existing organization or create new one
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'rep-club-fitness' LIMIT 1;
    
    IF org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug, primary_color, secondary_color)
        VALUES ('Rep Club Fitness', 'rep-club-fitness', '#2563eb', '#f97316')
        RETURNING id INTO org_id;
    END IF;
    
    -- Get existing location or create new one
    SELECT id INTO loc_id FROM public.locations WHERE organization_id = org_id LIMIT 1;
    
    IF loc_id IS NULL THEN
        INSERT INTO public.locations (organization_id, name, address, phone, email, timezone)
        VALUES (org_id, 'Main Location', '123 Fitness Street, City, State 12345', '+1 (555) 123-4567', 'info@repclubfitness.com', 'America/New_York')
        RETURNING id INTO loc_id;
    END IF;
    
    -- Create or update the profile for the current user
    INSERT INTO public.profiles (id, organization_id, location_id, email, first_name, last_name, role)
    VALUES (
        '80cb2e43-2acc-4355-b08c-c165cdd5f760',
        org_id,
        loc_id,
        'pearsonperformance@gmail.com',
        'Test',
        'User',
        'owner'
    ) ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        location_id = EXCLUDED.location_id,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
        
END $$;