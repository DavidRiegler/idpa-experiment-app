-- Tabelle für Test-Antworten
CREATE TABLE IF NOT EXISTS public.test_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  answer TEXT NOT NULL,
  response_time INTEGER NOT NULL, -- in Millisekunden
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_test_responses_session_id ON public.test_responses(session_id);

-- RLS aktivieren
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "test_responses_insert_public"
  ON public.test_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "test_responses_select_all"
  ON public.test_responses FOR SELECT
  USING (true);
