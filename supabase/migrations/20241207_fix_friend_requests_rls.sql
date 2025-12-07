-- Fix RLS policy for friend_requests to allow both sender and receiver to update
-- This allows:
-- - Receiver to accept/reject incoming requests
-- - Sender to cancel outgoing requests

DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;

CREATE POLICY "Users can update their friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
