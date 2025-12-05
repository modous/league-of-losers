// app/api/workout_exercises/route.ts
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  try {
    const { workoutId, exerciseId } = await req.json();

    console.log("API POST add exercise:", { workoutId, exerciseId });

    const { error } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: [],
      });

    if (error) {
      console.error("Supabase insert error", error);
      return Response.json({ success: false, error });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("JSON parse error:", err);
    return Response.json({ success: false, error: err }, { status: 400 });
  }
}
