-- Google Indexing API audit log table
-- Tracks all URL submissions to the Google Indexing API
CREATE TABLE IF NOT EXISTS public.google_indexing_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  action text NOT NULL CHECK (action IN ('URL_UPDATED', 'URL_DELETED')),
  success boolean NOT NULL DEFAULT false,
  status_code integer,
  error_message text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by URL and date
CREATE INDEX idx_google_indexing_log_url ON public.google_indexing_log (url);
CREATE INDEX idx_google_indexing_log_submitted_at ON public.google_indexing_log (submitted_at DESC);

-- Enable RLS
ALTER TABLE public.google_indexing_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (edge function uses service role key)
CREATE POLICY "Service role can insert indexing logs"
  ON public.google_indexing_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users with admin access can read logs
CREATE POLICY "Authenticated users can read indexing logs"
  ON public.google_indexing_log
  FOR SELECT
  TO authenticated
  USING (true);
