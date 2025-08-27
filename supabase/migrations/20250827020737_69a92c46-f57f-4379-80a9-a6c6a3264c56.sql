-- Create membership agreement templates table
CREATE TABLE public.membership_agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_agreement_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can manage agreement templates" 
ON public.membership_agreement_templates 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Create promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_months')),
  discount_value NUMERIC NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  applicable_plans TEXT[], -- Array of plan IDs or 'all'
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for promotions
CREATE POLICY "Staff can manage promotions" 
ON public.promotions 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
));

-- Enhance membership plans table
ALTER TABLE public.membership_plans 
ADD COLUMN plan_type TEXT DEFAULT 'individual' CHECK (plan_type IN ('individual', 'couple', 'family', 'corporate')),
ADD COLUMN requires_commitment BOOLEAN DEFAULT false,
ADD COLUMN commitment_months INTEGER,
ADD COLUMN signup_fee NUMERIC DEFAULT 0,
ADD COLUMN annual_maintenance_fee NUMERIC DEFAULT 0,
ADD COLUMN is_prepaid BOOLEAN DEFAULT false,
ADD COLUMN prepaid_months INTEGER,
ADD COLUMN features TEXT[] DEFAULT '{}';

-- Create member cards table
CREATE TABLE public.member_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_number TEXT UNIQUE NOT NULL,
  nfc_enabled BOOLEAN DEFAULT false,
  nfc_uid TEXT UNIQUE,
  barcode TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'lost', 'damaged')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on member cards
ALTER TABLE public.member_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for member cards
CREATE POLICY "Members can view their own cards" 
ON public.member_cards 
FOR SELECT 
USING (member_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = member_cards.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can manage member cards" 
ON public.member_cards 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = member_cards.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

-- Create membership agreements table for signed agreements
CREATE TABLE public.membership_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES membership_agreement_templates(id),
  agreement_content TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_data TEXT, -- For digital signatures
  witness_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on membership agreements
ALTER TABLE public.membership_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for membership agreements
CREATE POLICY "Members can view their own agreements" 
ON public.membership_agreements 
FOR SELECT 
USING (member_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = membership_agreements.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can manage agreements" 
ON public.membership_agreements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = membership_agreements.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'stripe', 'nfc')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference TEXT,
  stripe_payment_intent_id TEXT,
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for payment transactions
CREATE POLICY "Members can view their own transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (member_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = payment_transactions.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

CREATE POLICY "Staff can manage transactions" 
ON public.payment_transactions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.organization_id = (SELECT organization_id FROM profiles WHERE id = payment_transactions.member_id)
  AND profiles.role IN ('owner', 'manager', 'staff')
));

-- Add updated_at triggers
CREATE TRIGGER update_membership_agreement_templates_updated_at
BEFORE UPDATE ON public.membership_agreement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_cards_updated_at
BEFORE UPDATE ON public.member_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique card numbers
CREATE OR REPLACE FUNCTION public.generate_member_card_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_card_number TEXT;
    card_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 16-digit card number starting with gym prefix
        new_card_number := '4567' || LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
        
        -- Check if card number already exists
        SELECT EXISTS(SELECT 1 FROM public.member_cards WHERE card_number = new_card_number) INTO card_exists;
        
        IF NOT card_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_card_number;
END;
$$;