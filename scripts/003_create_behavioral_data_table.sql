-- Tabelle für Verhaltensdaten
CREATE TABLE IF NOT EXISTS public.behavioral_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'tab_switch',
    'copy_paste',
    'time_anomaly',
    'response_latency',
    'mouse_movement',
    'keyboard_pattern',
    'focus_loss'
  )),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_behavioral_data_session_id ON public.behavioral_data(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_data_event_type ON public.behavioral_data(event_type);

-- RLS aktivieren
ALTER TABLE public.behavioral_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "behavioral_data_insert_public"
  ON public.behavioral_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "behavioral_data_select_all"
  ON public.behavioral_data FOR SELECT
  USING (true);
