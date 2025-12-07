import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import WorkoutSummary from "./WorkoutSummary";

export const dynamic = "force-dynamic";

export default async function WorkoutCompletePage({ params, searchParams }: { params: { id: string }; searchParams: { date?: string } }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const workoutDate = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
  const supabase = await createServerSupabase();

  // Fetch workout details
  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, muscle_groups")
    .eq("id", id)
    .single();

  if (!workout) {
    redirect("/dashboard");
  }

  // Fetch user profile data
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("weight, height, age")
    .eq("id", user?.id || "")
    .single();

  const userWeight = profile?.weight || 75; // Default 75kg if not set
  const userHeight = profile?.height || 175; // Default 175cm if not set
  const userAge = profile?.age || 25; // Default 25 years if not set

  // Fetch workout exercises
  const { data: workoutExercises, error: workoutExercisesError } = await supabase
    .from("workout_exercises")
    .select(`
      id,
      exercise_id,
      exercises (
        id,
        name,
        muscle_group
      )
    `)
    .eq("workout_id", id);

  console.log("🔍 [Complete Page] Workout Exercises:", workoutExercises);
  console.log("🔍 [Complete Page] Workout Exercises Error:", workoutExercisesError);

  // Fetch the most recent workout session for this workout on this date
  const { data: allSessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("workout_id", id);
  
  console.log("🔍 [Complete Page] All sessions for this workout:", allSessions);

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, notes, completed_at, workout_date")
    .eq("workout_id", id)
    .eq("workout_date", workoutDate)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  console.log("🔍 [Complete Page] Workout Date:", workoutDate);
  console.log("🔍 [Complete Page] Session:", session);
  console.log("🔍 [Complete Page] Session Error:", sessionError);

  if (!session) {
    console.log("⚠️ [Complete Page] No completed session found");
  }

  // Fetch exercise logs for this session
  const exerciseIds = workoutExercises?.map(we => we.exercise_id) || [];
  console.log("🔍 [Complete Page] Exercise IDs:", exerciseIds);
  
  const { data: allLogs } = await supabase
    .from("exercise_logs")
    .select("id, exercise_id, reps, weight, created_at")
    .eq("session_id", session?.id || "00000000-0000-0000-0000-000000000000")
    .in("exercise_id", exerciseIds);

  console.log("🔍 [Complete Page] Logs found:", allLogs?.length);
  console.log("🔍 [Complete Page] Logs data:", JSON.stringify(allLogs, null, 2));

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
    
    // Calculate workout duration estimate (minutes)
    // Assume 2 minutes per set (including rest time)
    const estimatedDurationMinutes = totalSets * 2;
    
    // MET values for resistance training
    // Light: 3.5, Moderate: 5.0, Vigorous: 6.0
    // Determine MET based on intensity
    const avgWeightPerRep = totalWeight > 0 && totalReps > 0 ? totalWeight / totalReps : 0;
    const relativeIntensity = avgWeightPerRep / userWeight; // weight lifted relative to bodyweight
    
    let metValue = 3.5; // Light
    if (relativeIntensity > 0.5) {
      metValue = 6.0; // Vigorous
    } else if (relativeIntensity > 0.2) {
      metValue = 5.0; // Moderate
    }
    
    // Calorie calculation using MET formula
    // Calories = MET * weight(kg) * time(hours)
    const estimatedCalories = Math.round(metValue * userWeight * (estimatedDurationMinutes / 60));
    
    // Intensity score (0-100): based on relative strength and volume
    // Factors:
    // 1. Relative strength: weight lifted vs bodyweight (0-40 points)
    // 2. Volume: total reps (0-30 points)
    // 3. Consistency: number of sets (0-30 points)
    const strengthScore = Math.min(40, relativeIntensity * 80);
    const volumeScore = Math.min(30, totalReps * 0.5);
    const setScore = Math.min(30, totalSets * 5);
    const intensityScore = Math.min(100, Math.round(strengthScore + volumeScore + setScore));

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
      sessionId={session?.id || ""}
      workoutName={workout.name}
      workoutDate={workoutDate}
      totalCalories={totalCalories}
      avgIntensity={avgIntensity}
      totalExercises={totalExercises}
      totalSets={totalSets}
      exerciseStats={exerciseStats}
      initialNotes={session?.notes || ""}
    />
  );
}
