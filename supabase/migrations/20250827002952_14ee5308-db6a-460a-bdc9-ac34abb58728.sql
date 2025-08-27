-- Fix security issues by setting search_path on functions
CREATE OR REPLACE FUNCTION public.generate_member_barcode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_barcode TEXT;
    barcode_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 12-digit barcode: 2 digits for gym + 10 random digits
        new_barcode := '01' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        
        -- Check if barcode already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE barcode = new_barcode) INTO barcode_exists;
        
        IF NOT barcode_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_barcode;
END;
$$;

-- Fix trigger function security issue
CREATE OR REPLACE FUNCTION public.handle_member_barcode_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only generate barcode for members without one
    IF NEW.role = 'member' AND (NEW.barcode IS NULL OR NEW.barcode = '') THEN
        NEW.barcode := public.generate_member_barcode();
        NEW.barcode_generated_at := now();
    END IF;
    
    RETURN NEW;
END;
$$;