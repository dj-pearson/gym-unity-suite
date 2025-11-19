-- Create email threads table (one per domain)
CREATE TABLE public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, domain)
);

-- Create SMTP settings table (per thread)
CREATE TABLE public.smtp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  use_tls BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(thread_id)
);

-- Create email messages table
CREATE TABLE public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_name TEXT,
  from_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  received_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'disregarded')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(external_id)
);

-- Create email responses table (for tracking sent replies)
CREATE TABLE public.email_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.email_messages(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_threads
CREATE POLICY "Users can view their org's email threads"
  ON public.email_threads FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can manage email threads"
  ON public.email_threads FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- RLS Policies for smtp_settings
CREATE POLICY "Owners can view SMTP settings"
  ON public.smtp_settings FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM public.email_threads 
      WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

CREATE POLICY "Owners can manage SMTP settings"
  ON public.smtp_settings FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM public.email_threads 
      WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- RLS Policies for email_messages
CREATE POLICY "Users can view their org's email messages"
  ON public.email_messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM public.email_threads 
      WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Staff can manage email messages"
  ON public.email_messages FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM public.email_threads 
      WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- RLS Policies for email_responses
CREATE POLICY "Users can view email responses"
  ON public.email_responses FOR SELECT
  USING (
    message_id IN (
      SELECT em.id FROM public.email_messages em
      JOIN public.email_threads et ON em.thread_id = et.id
      WHERE et.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Staff can create email responses"
  ON public.email_responses FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT em.id FROM public.email_messages em
      JOIN public.email_threads et ON em.thread_id = et.id
      WHERE et.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'staff')
  );

-- Create indexes
CREATE INDEX idx_email_threads_org ON public.email_threads(organization_id);
CREATE INDEX idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX idx_email_messages_status ON public.email_messages(status);
CREATE INDEX idx_email_messages_external_id ON public.email_messages(external_id);
CREATE INDEX idx_email_responses_message ON public.email_responses(message_id);

-- Create trigger for updated_at
CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();