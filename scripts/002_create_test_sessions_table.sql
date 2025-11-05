-- Tabelle für Test-Sitzungen
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  cheat_score DECIMAL(5,2),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "test_sessions_insert_public"
  ON public.test_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "test_sessions_select_all"
  ON public.test_sessions FOR SELECT
  USING (true);

CREATE POLICY "test_sessions_update_all"
  ON public.test_sessions FOR UPDATE
  USING (true);
