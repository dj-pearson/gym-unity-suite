-- Add additional fields to profiles table for complete member information
ALTER TABLE public.profiles 
ADD COLUMN address_line1 TEXT,
ADD COLUMN address_line2 TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN country TEXT DEFAULT 'US',
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender TEXT,
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN interests TEXT[] DEFAULT '{}',
ADD COLUMN join_date DATE,
ADD COLUMN member_notes TEXT;