-- Funktion zur Berechnung des Cheat-Scores
CREATE OR REPLACE FUNCTION calculate_cheat_score(p_session_id UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tab_switches INTEGER;
  v_copy_paste INTEGER;
  v_time_anomalies INTEGER;
  v_response_latency_avg INTEGER;
  v_mouse_movements INTEGER;
  v_keyboard_patterns INTEGER;
  v_focus_losses INTEGER;
  v_cheat_score DECIMAL(5,2);
BEGIN
  -- Zähle verschiedene Ereignistypen
  SELECT COUNT(*) INTO v_tab_switches
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'tab_switch';

  SELECT COUNT(*) INTO v_copy_paste
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'copy_paste';

  SELECT COUNT(*) INTO v_time_anomalies
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'time_anomaly';

  SELECT COUNT(*) INTO v_mouse_movements
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'mouse_movement';

  SELECT COUNT(*) INTO v_keyboard_patterns
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'keyboard_pattern';

  SELECT COUNT(*) INTO v_focus_losses
  FROM behavioral_data
  WHERE session_id = p_session_id AND event_type = 'focus_loss';

  -- Durchschnittliche Antwortzeit
  SELECT COALESCE(AVG(response_time), 0)::INTEGER INTO v_response_latency_avg
  FROM test_responses
  WHERE session_id = p_session_id;

  -- Berechne Cheat-Score mit Gewichtungen
  v_cheat_score := 
    (v_tab_switches * 10) +
    (v_copy_paste * 15) +
    (v_focus_losses * 5) +
    (v_suspicious_combination * 50);

  RETURN LEAST(v_cheat_score, 100.00);
END;
$$;
