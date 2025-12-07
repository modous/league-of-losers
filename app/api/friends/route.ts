import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Fetch all friends for the current user
export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get friendships where user is either user_id_1 or user_id_2
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("user_id_1, user_id_2, created_at")
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the friend IDs (the other user in each friendship)
  const friendIds = friendships?.map((f) =>
    f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
  ) || [];

  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch profiles for all friends
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", friendIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  return NextResponse.json(profiles);
}
