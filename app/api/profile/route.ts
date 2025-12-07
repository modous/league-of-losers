import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Get current user's profile
export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile || null);
}

// POST - Create or update profile
export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, full_name, avatar_url } = body;

  if (!username || username.trim().length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  // Check if username is taken (excluding current user)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .neq("id", user.id)
    .single();

  if (existingProfile) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 400 }
    );
  }

  // Upsert profile
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: username.trim(),
        full_name: full_name?.trim() || null,
        avatar_url: avatar_url || null,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
