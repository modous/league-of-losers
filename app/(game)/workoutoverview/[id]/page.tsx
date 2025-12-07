import { createServerSupabase } from "@/lib/supabase-server";
import { ExerciseToggle } from "./_components/ExerciseToggle";
import { BackButton } from "./_components/BackButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkoutDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // 1) Load workout
  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .single();

  // 2) Load ALL exercises with image_url
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, image_url");

  // 3) Load linked ones for THIS workout
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id, workout_id")
    .eq("workout_id", id);

  // Build helper maps
  const linked = new Set(workoutExercises?.map((x) => x.exercise_id));
  const linkMap = new Map(
    workoutExercises?.map((we) => [we.exercise_id, we.id])
  );

  // Check if current user owns this workout
  const isOwner = user?.id === workout?.user_id;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6">{workout?.name}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allExercises?.map((exercise) => (
            <ExerciseToggle
              key={exercise.id}
              exercise={exercise}
              workoutId={id}
              isLinked={linked.has(exercise.id)}
              linkId={linkMap.get(exercise.id)}
              isOwner={isOwner}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
