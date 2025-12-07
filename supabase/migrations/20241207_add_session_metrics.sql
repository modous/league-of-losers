-- Add metrics columns to workout_sessions for leaderboard calculation
ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS intensity NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS calories NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercises_count INTEGER DEFAULT 0;

-- Create function to calculate session metrics from exercise logs
CREATE OR REPLACE FUNCTION calculate_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the session with calculated metrics when a log is added/updated
  UPDATE workout_sessions
  SET 
    exercises_count = (
      SELECT COUNT(DISTINCT exercise_id)
      FROM exercise_logs
      WHERE session_id = NEW.session_id
    ),
    -- Simple calorie estimation: (weight * reps * 0.5) summed
    calories = (
      SELECT COALESCE(SUM((weight * reps * 0.5)), 0)
      FROM exercise_logs
      WHERE session_id = NEW.session_id
    ),
    -- Intensity based on average weight lifted
    intensity = (
      SELECT COALESCE(AVG(weight * reps), 0)
      FROM exercise_logs
      WHERE session_id = NEW.session_id
    )
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate metrics when exercise logs are inserted or updated
DROP TRIGGER IF EXISTS trigger_calculate_session_metrics ON exercise_logs;
CREATE TRIGGER trigger_calculate_session_metrics
  AFTER INSERT OR UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_metrics();

-- Backfill existing sessions with calculated metrics
UPDATE workout_sessions ws
SET 
  exercises_count = (
    SELECT COUNT(DISTINCT exercise_id)
    FROM exercise_logs el
    WHERE el.session_id = ws.id
  ),
  calories = (
    SELECT COALESCE(SUM((weight * reps * 0.5)), 0)
    FROM exercise_logs el
    WHERE el.session_id = ws.id
  ),
  intensity = (
    SELECT COALESCE(AVG(weight * reps), 0)
    FROM exercise_logs el
    WHERE el.session_id = ws.id
  )
WHERE completed_at IS NOT NULL;
