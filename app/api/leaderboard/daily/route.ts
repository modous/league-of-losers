import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Fetch daily leaderboard rankings
export async function GET(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Get leaderboard for specific date
  const { data: leaderboard, error } = await supabase
    .from("daily_leaderboard")
    .select("*")
    .eq("date", date)
    .order("rank", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!leaderboard || leaderboard.length === 0) {
    return NextResponse.json([]);
  }

  // Get profiles for all users in the leaderboard
  const userIds = leaderboard.map(entry => entry.user_id);
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", userIds);

  // Merge leaderboard data with profiles
  const leaderboardWithProfiles = leaderboard.map(entry => {
    const profile = profilesData?.find(p => p.id === entry.user_id);
    return {
      ...entry,
      profiles: {
        username: profile?.username || 'Unknown',
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
      }
    };
  });

  return NextResponse.json(leaderboardWithProfiles);
}

// POST - Calculate and update daily leaderboard
export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await request.json();
  const targetDate = date || new Date().toISOString().split("T")[0];

  // Get all completed workouts for the target date
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("user_id, intensity, calories, exercises_count, workout_date, completed_at")
    .eq("workout_date", targetDate)
    .not("completed_at", "is", null);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ message: "No workouts found for this date" });
  }

  // Aggregate data per user
  const userStats: Record<string, {
    total_intensity: number;
    total_calories: number;
    total_exercises: number;
    workout_count: number;
  }> = {};

  sessions.forEach((session) => {
    if (!userStats[session.user_id]) {
      userStats[session.user_id] = {
        total_intensity: 0,
        total_calories: 0,
        total_exercises: 0,
        workout_count: 0,
      };
    }

    userStats[session.user_id].total_intensity += session.intensity || 0;
    userStats[session.user_id].total_calories += session.calories || 0;
    userStats[session.user_id].total_exercises += session.exercises_count || 0;
    userStats[session.user_id].workout_count += 1;
  });

  // Calculate scores and rank users
  const rankings = Object.entries(userStats).map(([userId, stats]) => {
    // Score formula: (avg_intensity * 0.4) + (total_calories * 0.003) + (total_exercises * 2) + (workout_count * 10)
    const avgIntensity = stats.total_intensity / stats.workout_count;
    const score =
      avgIntensity * 0.4 +
      stats.total_calories * 0.003 +
      stats.total_exercises * 2 +
      stats.workout_count * 10;

    return {
      user_id: userId,
      date: targetDate,
      total_intensity: stats.total_intensity,
      total_calories: stats.total_calories,
      total_exercises: stats.total_exercises,
      workout_count: stats.workout_count,
      score: Math.round(score * 100) / 100,
    };
  });

  // Sort by score descending
  rankings.sort((a, b) => b.score - a.score);

  // Assign ranks and medals
  const leaderboardEntries = rankings.map((entry, index) => {
    const rank = index + 1;
    let medal = null;
    if (rank === 1) medal = "gold";
    else if (rank === 2) medal = "silver";
    else if (rank === 3) medal = "bronze";

    return {
      ...entry,
      rank,
      medal,
    };
  });

  // Upsert leaderboard entries
  const { error: upsertError } = await supabase
    .from("daily_leaderboard")
    .upsert(leaderboardEntries, {
      onConflict: "user_id,date",
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    entries: leaderboardEntries.length,
    date: targetDate,
  });
}
