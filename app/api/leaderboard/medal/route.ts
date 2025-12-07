import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Get current user's medal for today or specific date
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

  // Get user's entry
  const { data: userEntry, error: userError } = await supabase
    .from("daily_leaderboard")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (userError) {
    console.error("Medal API - User entry error:", userError);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // If no user entry, return null early (no workout completed that day)
  if (!userEntry) {
    return NextResponse.json({
      userEntry: null,
      top3: [],
      date: date,
    });
  }

  // Get top 3 for tooltip
  const { data: top3Leaderboard } = await supabase
    .from("daily_leaderboard")
    .select("user_id, rank, medal, score")
    .eq("date", date)
    .order("rank", { ascending: true })
    .limit(3);

  // Get profiles for top 3 users
  let top3 = [];
  if (top3Leaderboard && top3Leaderboard.length > 0) {
    const userIds = top3Leaderboard.map(entry => entry.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);

    // Merge leaderboard data with profiles
    top3 = top3Leaderboard.map(entry => {
      const profile = profilesData?.find(p => p.id === entry.user_id);
      return {
        ...entry,
        username: profile?.username || 'Unknown',
        full_name: profile?.full_name || null,
      };
    });
  }

  return NextResponse.json({
    userEntry: userEntry,
    top3: top3,
    date: date,
  });
}
