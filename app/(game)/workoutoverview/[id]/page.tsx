import { createServerSupabase } from "@/lib/supabase-server";
import { ExerciseToggle } from "./_components/ExerciseToggle";
import { BackButton } from "./_components/BackButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkoutDetail({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // 1) Load workout
  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .single();

  // 2) Load ALL exercises
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group");

  // 3) Load linked ones for THIS workout
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id, workout_id")
    .eq("workout_id", id);

  console.log("📄 PAGE workoutExercises RAW:", workoutExercises);

  // Build helper maps
  const linked = new Set(workoutExercises?.map((x) => x.exercise_id));
  const linkMap = new Map(
    workoutExercises?.map((we) => [we.exercise_id, we.id])
  );

  console.log(
    "📄 PAGE linkMap:",
    workoutExercises?.map((we) => ({
      rowId: we.id,
      exercise_id: we.exercise_id,
    }))
  );

  return (
  <div className="min-h-screen bg-black text-white p-6">
    <div className="max-w-2xl mx-auto">     {/* << CENTERED LIKE NEW WORKOUT PAGE */}
 <BackButton /> 
      <h1 className="text-3xl font-bold mb-6">{workout.name}</h1>

      <div className="space-y-3">
        {allExercises?.map((exercise) => (
          <ExerciseToggle
            key={exercise.id}
            exercise={exercise}
            workoutId={id}
            isLinked={linked.has(exercise.id)}
            linkId={linkMap.get(exercise.id)}
          />
        ))}
      </div>

    </div>
  </div>
);
}
