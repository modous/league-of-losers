import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Search for users by username
export async function GET(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Search for users by username
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .ilike("username", `%${query}%`)
    .neq("id", user.id)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profiles || []);
}
