import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Fetch exercise details
  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();

  if (!exercise) {
    redirect("/exercises");
  }

  // Fetch all logs for this exercise
  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("id, reps, weight, notes, created_at")
    .eq("exercise_id", id)
    .order("created_at", { ascending: false });

  // Fetch workouts that contain this exercise
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      workout_id,
      workouts!inner (
        id,
        name,
        date
      )
    `)
    .eq("exercise_id", id);

  // Create a map of workout dates to workout info
  interface WorkoutInfo {
    id: string;
    name: string;
    date: string;
  }
  const workoutsByDate = new Map<string, WorkoutInfo>();
  
  workoutExercises?.forEach((we) => {
    const workout = (we.workouts as any);
    if (workout) {
      workoutsByDate.set(workout.date, {
        id: workout.id,
        name: workout.name,
        date: workout.date
      });
    }
  });

  // Group logs by date (match with workouts)
  interface WorkoutGroup {
    workoutId: string;
    workoutName: string;
    workoutDate: string;
    logs: Array<{
      id: string;
      reps: number;
      weight: number;
      notes: string | null;
      created_at: string;
    }>;
  }

  const workoutGroups = new Map<string, WorkoutGroup>();
  
  logs?.forEach((log) => {
    const logDate = log.created_at.split('T')[0]; // Extract date (YYYY-MM-DD)
    const workout = workoutsByDate.get(logDate);
    
    if (workout) {
      if (!workoutGroups.has(workout.id)) {
        workoutGroups.set(workout.id, {
          workoutId: workout.id,
          workoutName: workout.name,
          workoutDate: workout.date,
          logs: []
        });
      }

      workoutGroups.get(workout.id)?.logs.push({
        id: log.id,
        reps: log.reps,
        weight: log.weight,
        notes: log.notes,
        created_at: log.created_at
      });
    }
  });

  const sortedWorkouts = Array.from(workoutGroups.values()).sort(
    (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
  );

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/exercises" className="text-yellow-400 hover:text-yellow-300 mb-6 inline-block">
          ← Terug naar oefeningen
        </Link>

        {exercise.image_url && (
          <Image
            src={exercise.image_url}
            alt={exercise.name}
            width={800}
            height={300}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{exercise.name}</h1>
          <div className="flex gap-4 text-slate-400">
            <span>📍 {exercise.muscle_group}</span>
            {exercise.category && <span>🏷️ {exercise.category}</span>}
          </div>
          {exercise.description && (
            <p className="text-slate-300 mt-4">{exercise.description}</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Training History</h2>
          
          {sortedWorkouts.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-slate-400">Je hebt deze oefening nog niet gedaan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedWorkouts.map((workout) => {
                const date = new Date(workout.workoutDate);
                const formattedDate = date.toLocaleDateString("nl-NL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                });

                const totalVolume = workout.logs.reduce(
                  (sum, log) => sum + log.weight * log.reps,
                  0
                );
                const maxWeight = Math.max(...workout.logs.map(log => log.weight));

                return (
                  <div
                    key={workout.workoutId}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{workout.workoutName}</h3>
                        <p className="text-slate-400 text-sm capitalize">{formattedDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Volume</p>
                        <p className="text-lg font-bold text-yellow-400">{totalVolume}kg</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {workout.logs.map((log, index) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center bg-zinc-800 rounded p-3"
                        >
                          <span className="text-slate-300">Set {index + 1}</span>
                          <div className="flex gap-4 text-white font-semibold">
                            <span>{log.weight}kg</span>
                            <span>×</span>
                            <span>{log.reps} reps</span>
                          </div>
                          {log.notes && (
                            <span className="text-xs text-slate-400 italic">{log.notes}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-6 text-sm">
                      <div>
                        <span className="text-slate-400">Sets: </span>
                        <span className="text-white font-semibold">{workout.logs.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Max gewicht: </span>
                        <span className="text-white font-semibold">{maxWeight}kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Totale reps: </span>
                        <span className="text-white font-semibold">
                          {workout.logs.reduce((sum, log) => sum + log.reps, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
