import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();
    
    console.log('📝 [exercise-logs] Received body:', body);
    
    const { sessionId, exerciseId, reps, weight } = body;

    if (!sessionId || !exerciseId) {
      console.log('❌ [exercise-logs] Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 [exercise-logs] User:', user?.id);
    console.log('👤 [exercise-logs] User error:', userError);
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Insert exercise log with session_id
    console.log('💾 [exercise-logs] Inserting:', {
      user_id: user.id,
      session_id: sessionId,
      exercise_id: exerciseId,
      reps: reps || 0,
      weight: weight || 0,
    });
    
    const { data, error } = await supabase
      .from("exercise_logs")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        exercise_id: exerciseId,
        reps: reps || 0,
        weight: weight || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [exercise-logs] Error inserting exercise log:", error);
      console.error("❌ [exercise-logs] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [exercise-logs] Successfully inserted:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [exercise-logs] Error in POST /api/exercise-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
