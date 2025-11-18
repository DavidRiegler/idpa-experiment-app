-- Perfekt angepasste & stark verbesserte Version deiner Funktion
CREATE OR REPLACE FUNCTION calculate_cheat_score(p_session_id UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tab_switches            INTEGER := 0;
  v_copy_paste              INTEGER := 0;
  v_focus_losses            INTEGER := 0;
  v_time_anomalies          INTEGER := 0;
  v_paste_in_fill_blank     INTEGER := 0;
  v_combo_tab_paste         INTEGER := 0;
  v_combo_paste_switch      INTEGER := 0;
  v_response_latency_avg    INTEGER := 0;
  v_cheat_score             DECIMAL(5,2) := 0.00;
BEGIN

  -- === Alte Basis-Events (bleiben erhalten) ===
  SELECT COUNT(*) INTO v_tab_switches
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'tab_switch';

  SELECT COUNT(*) INTO v_copy_paste
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'copy_paste';

  SELECT COUNT(*) INTO v_focus_losses
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'focus_loss';

  SELECT COUNT(*) INTO v_time_anomalies
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'time_anomaly';

  -- === NEUE, EXTREM VERDÄCHTIGE EVENTS (hohe Gewichtung!) ===
  SELECT COUNT(*) INTO v_paste_in_fill_blank
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'paste_in_fill_blank';

  SELECT COUNT(*) INTO v_combo_tab_paste
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'suspicious_combo_tab_paste';

  SELECT COUNT(*) INTO v_combo_paste_switch
    FROM behavioral_data
   WHERE session_id = p_session_id AND event_type = 'suspicious_combo_paste_switch';

  -- Durchschnittliche Antwortzeit (in Millisekunden)
  SELECT COALESCE(AVG(response_time), 0)::INTEGER INTO v_response_latency_avg
    FROM test_responses
   WHERE session_id = p_session_id;

  -- === NEUE GEWICHTETE BERECHNUNG (dein Stil, aber viel schärfer) ===
  v_cheat_score := 
    -- Klassische verdächtige Aktionen (wie bisher)
    LEAST(v_tab_switches, 10)          * 2.0   +   -- max 20
    LEAST(v_copy_paste, 10)            * 1.5   +   -- max 15
    LEAST(v_focus_losses, 10)          * 1.5   +   -- max 15
    LEAST(v_time_anomalies, 10)        * 1.5   +   -- max 15

    -- Antwortzeit: je schneller unter 5 Sek, desto verdächtiger
    CASE 
      WHEN v_response_latency_avg < 5000  THEN 15.0
      WHEN v_response_latency_avg < 10000 THEN 8.0
      ELSE 0
    END +

    -- DIE NEUEN KILLER-KOMBINATIONEN (sehr hohe Punkte!)
    v_paste_in_fill_blank              * 12.0  +   -- max unbegrenzt (absichtliches Pasten!)
    v_combo_tab_paste                  * 18.0  +   -- Tab + Paste = fast immer ChatGPT
    v_combo_paste_switch               * 22.0;    -- Paste + Tab/Focus = 99% Schummeln

  -- Bonus bei extremem Verhalten
  IF v_cheat_score >= 80 THEN
    v_cheat_score := v_cheat_score + 30.0;
  ELSIF v_cheat_score >= 50 THEN
    v_cheat_score := v_cheat_score + 15.0;
  END IF;

  -- Maximal 200 (kann man später anpassen), niemals NULL
  RETURN LEAST(COALESCE(v_cheat_score, 0.00), 200.00);
END;
$$;