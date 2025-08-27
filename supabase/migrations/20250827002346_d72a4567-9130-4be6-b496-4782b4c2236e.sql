-- Add barcode support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN barcode TEXT UNIQUE,
ADD COLUMN barcode_generated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to generate unique barcode
CREATE OR REPLACE FUNCTION public.generate_member_barcode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to auto-generate barcode for members
CREATE OR REPLACE FUNCTION public.handle_member_barcode_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to auto-generate barcodes
CREATE TRIGGER trigger_generate_member_barcode
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_member_barcode_generation();