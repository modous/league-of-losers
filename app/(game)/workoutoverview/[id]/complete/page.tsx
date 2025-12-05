import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import WorkoutSummary from "./WorkoutSummary";

export const dynamic = "force-dynamic";

export default async function WorkoutCompletePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Fetch workout details
  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, date, muscle_groups")
    .eq("id", id)
    .single();

  if (!workout) {
    redirect("/dashboard");
  }

  // Fetch workout exercises
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      id,
      exercise_id,
      exercises!inner (
        id,
        name,
        muscle_group
      )
    `)
    .eq("workout_id", id);

  // Fetch all exercise logs for this workout's exercises
  const exerciseIds = workoutExercises?.map(we => we.exercise_id) || [];
  
  const { data: allLogs } = await supabase
    .from("exercise_logs")
    .select("id, exercise_id, reps, weight, created_at")
    .in("exercise_id", exerciseIds);

  // Group logs by exercise_id
  interface ExerciseLogData {
    id: string;
    exercise_id: string;
    reps: number;
    weight: number;
    created_at: string;
  }
  
  const logsByExercise = new Map<string, ExerciseLogData[]>();
  allLogs?.forEach(log => {
    if (!logsByExercise.has(log.exercise_id)) {
      logsByExercise.set(log.exercise_id, []);
    }
    logsByExercise.get(log.exercise_id)?.push(log);
  });

  // Calculate workout stats
  const exerciseStats = workoutExercises?.map((we) => {
    const exercise = we.exercises as unknown as { id: string; name: string; muscle_group: string };
    const logs = logsByExercise.get(we.exercise_id) || [];
    
    const totalSets = logs.length;
    const totalReps = logs.reduce((sum, log) => sum + (log.reps || 0), 0);
    const totalWeight = logs.reduce((sum, log) => sum + (log.weight || 0) * (log.reps || 0), 0);
    const maxWeight = Math.max(...logs.map(log => log.weight || 0), 0);
    
    // Simple calorie calculation: (total weight lifted in kg * 0.05)
    const estimatedCalories = Math.round(totalWeight * 0.05);
    
    // Intensity score (0-100): based on sets, reps, and weight
    const intensityScore = Math.min(100, Math.round(
      (totalSets * 5) + (totalReps * 0.5) + (maxWeight * 0.3)
    ));

    return {
      exerciseName: exercise.name,
      muscleGroup: exercise.muscle_group,
      totalSets,
      totalReps,
      totalWeight,
      maxWeight,
      estimatedCalories,
      intensityScore
    };
  }) || [];

  const totalCalories = exerciseStats.reduce((sum, stat) => sum + stat.estimatedCalories, 0);
  const avgIntensity = exerciseStats.length > 0 
    ? Math.round(exerciseStats.reduce((sum, stat) => sum + stat.intensityScore, 0) / exerciseStats.length)
    : 0;
  const totalExercises = exerciseStats.length;
  const totalSets = exerciseStats.reduce((sum, stat) => sum + stat.totalSets, 0);

  return (
    <WorkoutSummary
      workoutId={id}
      workoutName={workout.name}
      workoutDate={workout.date}
      totalCalories={totalCalories}
      avgIntensity={avgIntensity}
      totalExercises={totalExercises}
      totalSets={totalSets}
      exerciseStats={exerciseStats}
    />
  );
}
