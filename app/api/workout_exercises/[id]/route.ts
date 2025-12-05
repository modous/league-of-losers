import { createServerSupabase } from "@/lib/supabase-server";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();

  console.log("🧨 API DELETE workout_exercise with id:", id);

  // 1) Probeer delete + log de verwijderde rijen
  const { data: deleted, error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", id)
    .select("id, workout_id, exercise_id"); // ← laat zien wat er echt weg is

  console.log("🧨 DELETE result -> deleted rows:", deleted, "error:", error);

  // 2) Check wat er NOG in de tabel staat
  const { data: after, error: afterError } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, exercise_id")
    .order("created_at", { ascending: false });

  console.log("🧨 TABLE AFTER DELETE:", after, "error:", afterError);

  if (error) {
    return Response.json({ success: false, error }, { status: 400 });
  }

  return Response.json({ success: true, deleted }, { status: 200 });
}
