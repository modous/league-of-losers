import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import WorkoutExecution from "./WorkoutExecution";

export const dynamic = "force-dynamic";

export default async function StartWorkoutPage({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { date?: string };
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const workoutDate = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
  const supabase = await createServerSupabase();

  // Fetch workout with exercises
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select(`
      id,
      name,
      muscle_groups
    `)
    .eq("id", id)
    .single();

  if (workoutError || !workout) {
    redirect("/dashboard");
  }

  // Fetch workout exercises
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      exercise_id,
      exercises!inner (
        id,
        name,
        muscle_group
      )
    `)
    .eq("workout_id", id);

  interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
  }

  const exercises: Exercise[] = workoutExercises?.map((we) => {
    const exercise = we.exercises as unknown as Exercise;
    return {
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group
    };
  }) || [];

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Geen oefeningen</h1>
          <p className="text-slate-400 mb-6">
            Deze workout heeft geen oefeningen. Voeg eerst oefeningen toe.
          </p>
          <a
            href={`/workoutoverview/${id}`}
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg"
          >
            Terug naar workout
          </a>
        </div>
      </div>
    );
  }

  return (
    <WorkoutExecution
      workoutId={id}
      workoutName={workout.name}
      workoutDate={workoutDate}
      exercises={exercises}
    />
  );
}
