import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();
    
    const { workoutId, exerciseId, reps, weight } = body;

    if (!workoutId || !exerciseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Insert exercise log directly with exercise_id
    const { data, error } = await supabase
      .from("exercise_logs")
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        reps: reps || 0,
        weight: weight || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting exercise log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/exercise-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
