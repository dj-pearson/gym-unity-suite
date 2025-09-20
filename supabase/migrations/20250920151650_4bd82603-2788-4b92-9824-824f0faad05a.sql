-- Create sports courts management tables
CREATE TABLE public.sports_courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  court_number TEXT NOT NULL,
  court_type TEXT NOT NULL DEFAULT 'tennis', -- tennis, pickleball, racquetball, basketball, etc
  surface_type TEXT DEFAULT 'hard', -- hard, clay, grass, indoor, etc
  is_indoor BOOLEAN DEFAULT false,
  max_players INTEGER DEFAULT 4,
  hourly_rate NUMERIC DEFAULT 25.00,
  lighting_available BOOLEAN DEFAULT true,
  equipment_included TEXT[] DEFAULT '{}', -- nets, posts, etc
  maintenance_notes TEXT,
  is_available BOOLEAN DEFAULT true,
  is_out_of_order BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create court reservations table
CREATE TABLE public.court_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  court_id UUID NOT NULL REFERENCES public.sports_courts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  hourly_rate NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, cancelled, refunded
  payment_method TEXT,
  additional_players TEXT[], -- names or member IDs of other players
  special_requests TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'confirmed' -- confirmed, cancelled, completed, no_show
);

-- Create equipment checkout table
CREATE TABLE public.equipment_checkout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  equipment_item_id UUID NOT NULL,
  member_id UUID NOT NULL,
  checked_out_by UUID, -- staff member who processed checkout
  checked_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_back_at TIMESTAMP WITH TIME ZONE NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID, -- staff member who processed return
  rental_fee NUMERIC DEFAULT 0.00,
  deposit_amount NUMERIC DEFAULT 0.00,
  damage_fee NUMERIC DEFAULT 0.00,
  condition_out TEXT DEFAULT 'good', -- excellent, good, fair, poor
  condition_in TEXT,
  damage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'checked_out' -- checked_out, returned, overdue, lost, damaged
);

-- Create equipment inventory table for sports equipment
CREATE TABLE public.sports_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  equipment_type TEXT NOT NULL, -- racket, ball, paddle, net, etc
  sport TEXT NOT NULL, -- tennis, pickleball, racquetball, etc
  brand TEXT,
  model TEXT,
  size_specification TEXT, -- grip size, ball type, etc
  purchase_date DATE,
  purchase_price NUMERIC,
  rental_rate_hourly NUMERIC DEFAULT 5.00,
  rental_rate_daily NUMERIC DEFAULT 15.00,
  deposit_required NUMERIC DEFAULT 25.00,
  current_condition TEXT DEFAULT 'good', -- excellent, good, fair, poor, out_of_service
  maintenance_notes TEXT,
  is_available_for_rental BOOLEAN DEFAULT true,
  total_rentals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  equipment_code TEXT NOT NULL, -- unique identifier/barcode
  description TEXT,
  notes TEXT
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  tournament_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  tournament_type TEXT DEFAULT 'single_elimination', -- single_elimination, double_elimination, round_robin
  entry_fee NUMERIC DEFAULT 0.00,
  max_participants INTEGER,
  registration_deadline DATE,
  tournament_start_date DATE NOT NULL,
  tournament_end_date DATE NOT NULL,
  prize_pool NUMERIC DEFAULT 0.00,
  winner_id UUID,
  runner_up_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registration_open', -- registration_open, registration_closed, in_progress, completed, cancelled
  description TEXT,
  rules TEXT,
  contact_info TEXT
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  partner_id UUID, -- for doubles tournaments
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  seed_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' -- registered, eliminated, advanced, withdrew
);

-- Enable Row Level Security
ALTER TABLE public.sports_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_checkout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sports_courts
CREATE POLICY "Members can view available courts" ON public.sports_courts
  FOR SELECT USING (
    is_available = true AND 
    is_out_of_order = false AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage sports courts" ON public.sports_courts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for court_reservations
CREATE POLICY "Members can view their own reservations" ON public.court_reservations
  FOR SELECT USING (
    member_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

CREATE POLICY "Members can create reservations" ON public.court_reservations
  FOR INSERT WITH CHECK (
    member_id = auth.uid() AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage all reservations" ON public.court_reservations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for equipment_checkout
CREATE POLICY "Members can view their own checkouts" ON public.equipment_checkout
  FOR SELECT USING (
    member_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

CREATE POLICY "Staff can manage equipment checkouts" ON public.equipment_checkout
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for sports_equipment
CREATE POLICY "Members can view available equipment" ON public.sports_equipment
  FOR SELECT USING (
    is_available_for_rental = true AND 
    current_condition != 'out_of_service' AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage sports equipment" ON public.sports_equipment
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for tournaments
CREATE POLICY "Members can view tournaments" ON public.tournaments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage tournaments" ON public.tournaments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
    )
  );

-- RLS Policies for tournament_participants
CREATE POLICY "Members can view tournament participants" ON public.tournament_participants
  FOR SELECT USING (
    tournament_id IN (
      SELECT id FROM tournaments 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can register for tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (
    member_id = auth.uid() AND 
    tournament_id IN (
      SELECT id FROM tournaments 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage tournament participants" ON public.tournament_participants
  FOR ALL USING (
    tournament_id IN (
      SELECT id FROM tournaments 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() 
        AND role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_sports_courts_organization ON public.sports_courts(organization_id);
CREATE INDEX idx_sports_courts_type ON public.sports_courts(court_type);
CREATE INDEX idx_court_reservations_organization ON public.court_reservations(organization_id);
CREATE INDEX idx_court_reservations_member ON public.court_reservations(member_id);
CREATE INDEX idx_court_reservations_date ON public.court_reservations(reservation_date, start_time);
CREATE INDEX idx_equipment_checkout_member ON public.equipment_checkout(member_id);
CREATE INDEX idx_equipment_checkout_status ON public.equipment_checkout(status);
CREATE INDEX idx_sports_equipment_organization ON public.sports_equipment(organization_id);
CREATE INDEX idx_sports_equipment_sport ON public.sports_equipment(sport);
CREATE INDEX idx_tournaments_organization ON public.tournaments(organization_id);
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);

-- Add update triggers
CREATE TRIGGER update_sports_courts_updated_at
  BEFORE UPDATE ON public.sports_courts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_court_reservations_updated_at
  BEFORE UPDATE ON public.court_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_checkout_updated_at
  BEFORE UPDATE ON public.equipment_checkout
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sports_equipment_updated_at
  BEFORE UPDATE ON public.sports_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();