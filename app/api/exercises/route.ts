import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  }
);
}

export async function GET() {
  const supabase = await getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Haal zowel user exercises als default exercises op
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(exercises || []);
}

export async function POST(request: Request) {
  const supabase = await getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, muscle_group } = body;

    if (!name || !muscle_group) {
      return NextResponse.json(
        { error: "Name and muscle_group are required" },
        { status: 400 }
      );
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        user_id: user.id,
        name: name.trim(),
        muscle_group,
      })
      .select("id, name, muscle_group")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
