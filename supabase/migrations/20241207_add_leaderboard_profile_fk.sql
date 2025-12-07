-- Add foreign key relationship from daily_leaderboard to profiles
-- This allows joining leaderboard with user profiles for username display

-- First, check if profiles table exists and has data
-- Then add foreign key constraint if it doesn't exist already

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'daily_leaderboard_user_id_fkey'
    AND table_name = 'daily_leaderboard'
  ) THEN
    -- Add foreign key to profiles table
    ALTER TABLE daily_leaderboard
      ADD CONSTRAINT daily_leaderboard_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;
