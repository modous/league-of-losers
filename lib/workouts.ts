import { createBrowserClient } from "@supabase/ssr";

// --------------------------------------------------
// SUPABASE CLIENT
// --------------------------------------------------
function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// --------------------------------------------------
// TYPES
// --------------------------------------------------
export interface WorkoutSet {
  weight: number;
  reps: number;
  completed?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  image_url?: string;
  description?: string;
}

export interface WorkoutExercise {
  id: string;               // id of the workout_exercises row
  exercise_id: string;      // FK -> exercises.id
  notes: string | null;
  sets: WorkoutSet[];
  exercise: Exercise;       // FULL exercise data
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  muscle_groups: string[];
  exercises: WorkoutExercise[];
}

export interface CreateWorkoutExercise {
  exercise_id: string;
  sets: WorkoutSet[];
  notes?: string | null;
}

// --------------------------------------------------
// GET WORKOUTS BY DATE
// --------------------------------------------------
export async function getWorkoutsByDate(date: string): Promise<Workout[]> {
  const db = supabase();

  // Note: workouts table doesn't have a date column - it's a template table
  // This function should query workout_sessions instead to get workouts for a specific date
  // For now, returning empty array until proper implementation
  return [];

  /* OLD CODE - workouts table has no date column
  const { data: workouts, error } = await db
    .from("workouts")
    .select("id, date, name, muscle_groups")
    .eq("date", date)
    .order("id");

  if (error || !workouts) return [];

  if (workouts.length === 0) return [];

  // 2) load exercises for all workouts
  const { data: rows } = await db
    .from("workout_exercises")
    .select(
      `
        id,
        workout_id,
        exercise_id,
        sets,
        notes,
        exercise:exercise_id (
          id,
          name,
          category,
          muscle_group,
          image_url,
          description
        )
      `
    )
    .in("workout_id", workouts.map((w) => w.id));

  // Group exercises by workout
  const map: Record<string, WorkoutExercise[]> = {};
  workouts.forEach((w) => (map[w.id] = []));

  rows?.forEach((row) => {
    if (!row.exercise) {
      // should never happen if exercise_id is valid
      return;
    }

    const workoutExercise: WorkoutExercise = {
      id: row.id,
      exercise_id: row.exercise_id,
      notes: row.notes,
      sets: row.sets,
     exercise: Array.isArray(row.exercise)
  ? row.exercise[0]      // correct single item
  : row.exercise,        // already object/
    };

    map[row.workout_id].push(workoutExercise);
  });

  // merge workouts + exercises
  return workouts.map((w) => ({
    ...w,
    exercises: map[w.id] ?? [],
  }));
  */
}

// --------------------------------------------------
// GET WEEK WORKOUTS
// --------------------------------------------------

interface ExerciseLog {
  reps: number;
  weight: number;
  created_at?: string;
}

interface WorkoutExerciseBase {
  exercise_id: string;
}

interface WorkoutWithStatsBase {
  id: string;
  date: string;
  name: string;
  muscle_groups: string[];
  workout_exercises?: WorkoutExerciseBase[];
}

export async function getWeekWorkouts(start: string, end: string) {
  const db = supabase();

  console.log("🔵 [getWeekWorkouts] Fetching workouts between:", start, "and", end);

  // Get current user
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    console.log("❌ [getWeekWorkouts] No authenticated user");
    return [];
  }

  console.log("👤 [getWeekWorkouts] User ID:", user.id);

  // Query workout_sessions for the date range AND current user
  const { data: sessions } = await db
    .from("workout_sessions")
    .select(`
      id,
      workout_date,
      completed_at,
      workout:workout_id (
        id,
        name,
        muscle_groups,
        workout_exercises (
          exercise_id
        )
      )
    `)
    .eq("user_id", user.id)
    .gte("workout_date", start)
    .lte("workout_date", end)
    .not("completed_at", "is", null)
    .order("workout_date");

  console.log("🔵 [getWeekWorkouts] Sessions found:", sessions?.length);

  if (!sessions || sessions.length === 0) return [];

  // Get all session IDs to fetch their logs
  const sessionIds = sessions.map(s => s.id);

  // Fetch all exercise logs for these sessions (also filter by user_id for extra security)
  const { data: allLogs } = await db
    .from("exercise_logs")
    .select("session_id, exercise_id, reps, weight")
    .eq("user_id", user.id)
    .in("session_id", sessionIds);

  console.log("🔵 [getWeekWorkouts] Exercise logs found:", allLogs?.length);

  // Group logs by session_id
  const logsBySession = new Map<string, Array<{ exercise_id: string; reps: number; weight: number }>>();
  
  allLogs?.forEach((log) => {
    if (!logsBySession.has(log.session_id)) {
      logsBySession.set(log.session_id, []);
    }
    logsBySession.get(log.session_id)?.push(log);
  });

  return sessions.map((session) => {
    const workout = Array.isArray(session.workout) ? session.workout[0] : session.workout;
    const sessionLogs = logsBySession.get(session.id) || [];
    
    const exercises_count = workout?.workout_exercises?.length || 0;
    
    // Calculate total weight lifted
    const totalWeight = sessionLogs.reduce((sum, log) => 
      sum + (log.weight || 0) * (log.reps || 0), 0
    );
    
    // Estimate calories (simple formula)
    const calories = Math.round(totalWeight * 0.05);
    
    // Calculate intensity score
    const totalSets = sessionLogs.length;
    const totalReps = sessionLogs.reduce((sum, log) => sum + (log.reps || 0), 0);
    const maxWeight = sessionLogs.length > 0 
      ? Math.max(...sessionLogs.map((log) => log.weight || 0), 0)
      : 0;
    const intensity = exercises_count > 0 && sessionLogs.length > 0
      ? Math.min(100, Math.round((totalSets * 5) + (totalReps * 0.5) + (maxWeight * 0.3)))
      : 0;

    return {
      id: workout?.id || session.id,
      date: session.workout_date,
      name: workout?.name || "Unknown Workout",
      muscle_groups: workout?.muscle_groups || [],
      trained: sessionLogs.length > 0,
      exercises_count,
      calories,
      intensity,
    };
  });
}

// --------------------------------------------------
// CREATE WORKOUT
// --------------------------------------------------
export async function createWorkout({
  name,
  muscleGroups,
  exercises,
}: {
  name: string;
  muscleGroups: string[];
  exercises: CreateWorkoutExercise[];
}) {
  console.log('💪 [createWorkout] Creating workout:', { name, muscleGroups, exerciseCount: exercises.length });
  const db = supabase();

  const {
    data: { user },
  } = await db.auth.getUser();

  console.log('👤 [createWorkout] User:', user?.id);
  if (!user) throw new Error("Not authenticated");

  // 1) insert workout template (no date - it's reusable)
  console.log('📝 [createWorkout] Inserting workout into workouts table...');
  const { data: workout, error } = await db
    .from("workouts")
    .insert([
      {
        user_id: user.id,
        name,
        muscle_groups: muscleGroups,
      },
    ])
    .select()
    .single();

  console.log('📊 [createWorkout] Workout insert result:', { workout, error });
  if (error) {
    console.log('❌ [createWorkout] Error inserting workout:', error);
    throw error;
  }

  // 2) insert linked exercises
  console.log('🏋️ [createWorkout] Inserting', exercises.length, 'exercises...');
  const exerciseRows = exercises.map((ex) => ({
    workout_id: workout.id,
    exercise_id: ex.exercise_id,
    sets: ex.sets,
    notes: ex.notes ?? null,
  }));

  const { error: err2 } = await db
    .from("workout_exercises")
    .insert(exerciseRows);

  console.log('📊 [createWorkout] Exercises insert result:', { error: err2 });
  if (err2) {
    console.log('❌ [createWorkout] Error inserting exercises:', err2);
    throw err2;
  }

  console.log('✅ [createWorkout] Workout created successfully:', workout.id);
  return workout;
}

// --------------------------------------------------
// GET SINGLE WORKOUT BY ID
// --------------------------------------------------
export async function getWorkoutById(id: string): Promise<Workout | null> {
  const db = supabase();

  console.log("🟦 [getWorkoutById] Fetching workout:", id);

  const { data, error } = await db
    .from("workouts")
    .select(`
      id,
      name,
      muscle_groups,
      workout_exercises:workout_exercises (
        id,
        workout_id,
        exercise_id,
        notes,
        sets,
        exercise:exercise_id (
          id,
          name,
          category,
          muscle_group,
          image_url,
          description
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  console.log("🟩 Raw data returned from Supabase:", JSON.stringify(data, null, 2));
  if (error) console.log("🟥 Supabase error:", error);

  if (!data) {
    console.log("🟥 No workout found for id:", id);
    return null;
  }

  console.log("🟦 Parsing workout_exercises...");
  console.log(
    "workout_exercises BEFORE fixing:",
    JSON.stringify(data.workout_exercises, null, 2)
  );

  const exercises: WorkoutExercise[] =
    data.workout_exercises?.map((row) => {
      console.log("➡️ Row BEFORE fixing:", row);

      const fixed = {
        id: row.id,
        exercise_id: row.exercise_id,
        notes: row.notes,
        sets: row.sets,
        exercise: Array.isArray(row.exercise)
          ? row.exercise[0]
          : row.exercise,
      };

      console.log("➡️ Row AFTER fixing:", fixed);
      return fixed;
    }) ?? [];

  console.log("🟩 Final parsed exercises:", JSON.stringify(exercises, null, 2));

  const finalWorkout = {
    ...data,
    date: '', // workouts table has no date - it's a template table
    exercises,
  };

  console.log("🟧 FINAL WORKOUT OBJECT:", JSON.stringify(finalWorkout, null, 2));

  return finalWorkout;
}


export async function getAllExercises() {
  const db = supabase();

  // Get current user
  const { data: { user } } = await db.auth.getUser();

  // Get user's own exercises + templates (user_id is null)
  const { data, error } = await db
    .from("exercises")
    .select("id, name, category, muscle_group, image_url, description")
    .or(`user_id.eq.${user?.id},user_id.is.null`)
    .order("name");

  if (error) {
    console.error("❌ getAllExercises ERROR:", error);
    return [];
  }

  return data;
}


type SupabaseWorkoutRow = {
  id: string;
  name: string;
  muscle_groups: string[];
  workout_exercises?: {
    id: string;
    exercise_id: string;
    notes: string | null;
    sets: WorkoutSet[];
    exercise: Exercise | Exercise[];
  }[];
};

export async function getAllWorkouts(): Promise<Workout[]> {
  console.log('🚀 [getAllWorkouts] Starting fetch...');
  const db = supabase();

  // Get current user
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    console.log('❌ [getAllWorkouts] No authenticated user');
    return [];
  }

  console.log('👤 [getAllWorkouts] User ID:', user.id);
  console.log('📥 [getAllWorkouts] Querying workouts table...');
  const { data, error } = await db
    .from("workouts")
    .select(`
      id,
      name,
      muscle_groups,
      workout_exercises:workout_exercises (
        id,
        exercise_id,
        notes,
        sets,
        exercise:exercise_id (
          id,
          name,
          category,
          muscle_group,
          image_url,
          description
        )
      )
    `)
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  console.log('📊 [getAllWorkouts] Query result:', { count: data?.length, error });
  if (error) {
    console.log('❌ [getAllWorkouts] Error:', error);
  }
  if (error || !data) return [];
  
  console.log('✅ [getAllWorkouts] Raw data:', JSON.stringify(data, null, 2));

  return (data as SupabaseWorkoutRow[]).map((w) => ({
    ...w,
    date: '', // workouts table has no date - it's a template table
    exercises:
      (w.workout_exercises ?? []).map((row) => ({
        id: row.id,
        exercise_id: row.exercise_id,
        notes: row.notes,
        sets: row.sets,
        exercise: Array.isArray(row.exercise)
          ? row.exercise[0]
          : row.exercise,
      })) || [],
  }));
}
