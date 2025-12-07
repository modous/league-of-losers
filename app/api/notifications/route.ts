import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface MessageBySender {
  sender_id: string;
  username: string;
  avatar_url: string | null;
  count: number;
  created_at: string;
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending friend requests
    const { data: friendRequests, error: requestsError } = await supabase
      .from("friend_requests")
      .select("id, sender_id, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (requestsError) {
      console.error("Error fetching friend requests:", requestsError);
    }

    // Fetch sender profiles for friend requests
    const requestSenderIds = friendRequests?.map(r => r.sender_id) || [];
    let requestSenderProfiles: Record<string, { username: string; avatar_url: string | null }> = {};
    if (requestSenderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", requestSenderIds);
      
      requestSenderProfiles = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = { username: profile.username, avatar_url: profile.avatar_url };
        return acc;
      }, {} as Record<string, { username: string; avatar_url: string | null }>);
    }

    // Add sender info to friend requests
    const friendRequestsWithSender = friendRequests?.map(req => ({
      ...req,
      sender: requestSenderProfiles[req.sender_id] || { username: 'Unknown', avatar_url: null }
    })) || [];


    // Get unread messages count per friend
    const { data: unreadMessages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("sender_id, created_at")
      .eq("receiver_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Error fetching unread messages:", messagesError);
    }

    console.log("Unread messages raw data:", unreadMessages);
    console.log("Messages count:", unreadMessages?.length || 0);

    // Get unique sender IDs
    const senderIds = Array.from(new Set(unreadMessages?.map(m => m.sender_id) || []));
    
    // Fetch sender profiles
    let senderProfiles: Record<string, { username: string; avatar_url: string | null }> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", senderIds);
      
      senderProfiles = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = { username: profile.username, avatar_url: profile.avatar_url };
        return acc;
      }, {} as Record<string, { username: string; avatar_url: string | null }>);
    }

    // Group unread messages by sender
    const messagesBySender = unreadMessages?.reduce((acc: MessageBySender[], msg) => {
      const existing = acc.find(m => m.sender_id === msg.sender_id);
      const profile = senderProfiles[msg.sender_id];
      
      if (existing) {
        existing.count += 1;
        if (new Date(msg.created_at) > new Date(existing.created_at)) {
          existing.created_at = msg.created_at;
        }
      } else {
        acc.push({
          sender_id: msg.sender_id,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          count: 1,
          created_at: msg.created_at
        });
      }
      return acc;
    }, []) || [];

    // Get friends who are on a streak (3+ consecutive days of workouts)
    // First, get all friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_id_1, user_id_2");

    const friendIds = friendships?.map(f => 
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    ) || [];

    if (friendIds.length === 0) {
      return NextResponse.json({
        friendRequests: friendRequestsWithSender || [],
        unreadMessages: messagesBySender,
        streaks: []
      });
    }

    // Get recent workout data for friends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: friendWorkouts, error: workoutsError } = await supabase
      .from("daily_leaderboard")
      .select("user_id, date, workout_count")
      .in("user_id", friendIds)
      .gte("date", sevenDaysAgo.toISOString().split('T')[0])
      .gt("workout_count", 0)
      .order("date", { ascending: false });

    if (workoutsError) {
      console.error("Error fetching friend workouts:", workoutsError);
    }

    // Fetch profiles for friends with workouts
    let friendProfiles: Record<string, { username: string; avatar_url: string | null }> = {};
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", friendIds);
      
      friendProfiles = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = { username: profile.username, avatar_url: profile.avatar_url };
        return acc;
      }, {} as Record<string, { username: string; avatar_url: string | null }>);
    }

    // Calculate streaks for each friend
    const streaksByFriend = new Map<string, { streak: number, lastDate: string, username: string, avatar_url: string | null }>();
    
    friendWorkouts?.forEach((workout) => {
      const userId = workout.user_id;
      if (!streaksByFriend.has(userId)) {
        const profile = friendProfiles[userId];
        streaksByFriend.set(userId, {
          streak: 0,
          lastDate: '',
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null
        });
      }
    });

    // Calculate consecutive days for each friend
    friendIds.forEach(friendId => {
      const workouts = friendWorkouts?.filter((w) => w.user_id === friendId) || [];
      if (workouts.length === 0) return;

      // Sort by date descending
      workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const workout of workouts) {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      if (streak >= 3) {
        const friendData = streaksByFriend.get(friendId);
        if (friendData) {
          friendData.streak = streak;
          friendData.lastDate = workouts[0].date;
        }
      }
    });

    // Convert to array and filter out streaks < 3
    const streaks = Array.from(streaksByFriend.entries())
      .filter(([, data]) => data.streak >= 3)
      .map(([userId, data]) => ({
        user_id: userId,
        username: data.username,
        avatar_url: data.avatar_url,
        streak: data.streak,
        last_date: data.lastDate
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5); // Limit to top 5

    return NextResponse.json({
      friendRequests: friendRequestsWithSender || [],
      unreadMessages: messagesBySender,
      streaks
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
