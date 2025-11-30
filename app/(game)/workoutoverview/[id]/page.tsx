import { createServerSupabase } from "@/lib/supabase-server";

export default async function WorkoutDetail(props: { params: Promise<{ id: string }> }) {
  // Next 15: params is a Promise
  const { id } = await props.params;

  // ✅ Use your server-side Supabase client (with cookies / auth)
  const supabase = await createServerSupabase();

  // 1) Get the workout itself
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .single();

  console.log("Workout detail - workout:", workout, workoutError);

  if (workoutError || !workout) {
    return <div className="p-6 text-white">Workout not found.</div>;
  }

  // 2) Get all entries from workout_exercises for this workout
  const { data: workoutExercises, error: weError } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id, sets, notes")
    .eq("workout_id", id);

  console.log("Workout detail - workoutExercises:", workoutExercises, weError);

  if (weError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
        <p className="text-gray-400 mb-6">{workout.date}</p>
        <p>Could not load exercises.</p>
      </div>
    );
  }

  if (!workoutExercises || workoutExercises.length === 0) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
        <p className="text-gray-400 mb-6">{workout.date}</p>
        <h2 className="text-2xl font-semibold mb-4">Exercises</h2>
        <p className="text-gray-400">No exercises linked to this workout yet.</p>
      </div>
    );
  }

  // 3) Collect all exercise IDs for this workout
  const exerciseIds = workoutExercises.map((we) => we.exercise_id);

  // 4) Get all those exercises
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("*")
    .in("id", exerciseIds);

  console.log("Workout detail - exercises:", exercises, exError);

  // Map exercise_id -> exercise row
  const exerciseMap = new Map<string, any>();
  (exercises ?? []).forEach((ex) => {
    exerciseMap.set(ex.id, ex);
  });

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
      <p className="text-gray-400 mb-6">{workout.date}</p>

      <h2 className="text-2xl font-semibold mb-4">Exercises</h2>

      <div className="space-y-3">
        {workoutExercises.map((we) => {
          const ex = exerciseMap.get(we.exercise_id);
          if (!ex) return null; // should not happen, but just in case

          return (
            <div key={we.id} className="p-4 rounded bg-[#1c1c1c]">
              <div className="text-lg font-semibold">{ex.name}</div>
              <div className="text-gray-400">
                Muscle group: {ex.muscle_group}
              </div>
              <div className="text-gray-500 text-sm">
                Sets (raw json): {JSON.stringify(we.sets)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
