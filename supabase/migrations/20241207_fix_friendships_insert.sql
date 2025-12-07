-- Fix RLS policy for friendships to allow users to create friendships when accepting friend requests
-- The previous policy blocked ALL inserts with WITH CHECK (false)
-- This allows authenticated users to create friendships

DROP POLICY IF EXISTS "Users can create friendships (system only)" ON friendships;

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
