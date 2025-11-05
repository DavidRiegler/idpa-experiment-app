-- Tabelle für Teilnehmer
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_code TEXT UNIQUE NOT NULL,
  experiment_group TEXT NOT NULL CHECK (experiment_group IN ('control', 'experimental')),
  consent_given BOOLEAN DEFAULT false,
  data_deletion_requested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Policies: Jeder kann Teilnehmer erstellen und seine eigenen Daten lesen
CREATE POLICY "participants_insert_public"
  ON public.participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "participants_select_own"
  ON public.participants FOR SELECT
  USING (true);

CREATE POLICY "participants_update_own"
  ON public.participants FOR UPDATE
  USING (true);

CREATE POLICY "participants_delete_own"
  ON public.participants FOR DELETE
  USING (true);
