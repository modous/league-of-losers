-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- Ensure consistent ordering to prevent duplicates
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "Users can create friendships (system only)" ON friendships;
CREATE POLICY "Users can create friendships (system only)"
  ON friendships FOR INSERT
  WITH CHECK (false); -- Only through friend request acceptance

-- RLS Policies for friend_requests
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages" ON chat_messages;
CREATE POLICY "Users can update their received messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Create daily_leaderboard table
CREATE TABLE IF NOT EXISTS daily_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_intensity NUMERIC DEFAULT 0,
  total_calories NUMERIC DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  workout_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0, -- Overall score combining all metrics
  rank INTEGER,
  medal TEXT CHECK (medal IN ('gold', 'silver', 'bronze', null)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for daily_leaderboard
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_date ON daily_leaderboard(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_user ON daily_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_rank ON daily_leaderboard(date DESC, rank ASC);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_score ON daily_leaderboard(date DESC, score DESC);

-- Enable Row Level Security
ALTER TABLE daily_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_leaderboard
DROP POLICY IF EXISTS "Users can view all leaderboard entries" ON daily_leaderboard;
CREATE POLICY "Users can view all leaderboard entries"
  ON daily_leaderboard FOR SELECT
  USING (true); -- Everyone can see the leaderboard

DROP POLICY IF EXISTS "System can insert leaderboard entries" ON daily_leaderboard;
CREATE POLICY "System can insert leaderboard entries"
  ON daily_leaderboard FOR INSERT
  WITH CHECK (true); -- System inserts through API

DROP POLICY IF EXISTS "System can update leaderboard entries" ON daily_leaderboard;
CREATE POLICY "System can update leaderboard entries"
  ON daily_leaderboard FOR UPDATE
  USING (true); -- System updates through API
