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

  // 1) load workouts (no exercises yet)
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

  const { data: workouts } = await db
    .from("workouts")
    .select(`
      id, 
      date, 
      name, 
      muscle_groups,
      workout_exercises (
        exercise_id
      )
    `)
    .gte("date", start)
    .lte("date", end)
    .order("date");

  console.log("🔵 [getWeekWorkouts] Workouts found:", workouts?.length);
  console.log("🔵 [getWeekWorkouts] Workouts data:", JSON.stringify(workouts, null, 2));

  if (!workouts || workouts.length === 0) return [];

  // Get all exercise IDs from all workouts
  const allExerciseIds = workouts.flatMap(w => 
    (w.workout_exercises || []).map((we: WorkoutExerciseBase) => we.exercise_id)
  );

  console.log("🔵 [getWeekWorkouts] All exercise IDs:", allExerciseIds);

  if (allExerciseIds.length === 0) {
    console.log("🔵 [getWeekWorkouts] No exercises found in workouts");
    return workouts.map(w => ({
      id: w.id,
      date: w.date,
      name: w.name,
      muscle_groups: w.muscle_groups,
      trained: false,
      exercises_count: 0,
      calories: 0,
      intensity: 0,
    }));
  }

  // Fetch all exercise logs for these exercises (no date filter - we want all logs for these exercises)
  const { data: allLogs } = await db
    .from("exercise_logs")
    .select("exercise_id, reps, weight, created_at")
    .in("exercise_id", allExerciseIds);

  console.log("🔵 [getWeekWorkouts] Exercise logs found:", allLogs?.length);
  console.log("🔵 [getWeekWorkouts] Exercise logs:", JSON.stringify(allLogs, null, 2));

  // Group logs by exercise_id (we match by exercise, not by date)
  const logsByExercise = new Map<string, ExerciseLog[]>();
  
  allLogs?.forEach((log: ExerciseLog & { exercise_id: string }) => {
    console.log("🔵 [getWeekWorkouts] Processing log - Exercise:", log.exercise_id, "Created:", log.created_at);
    
    if (!logsByExercise.has(log.exercise_id)) {
      logsByExercise.set(log.exercise_id, []);
    }
    
    logsByExercise.get(log.exercise_id)?.push({
      reps: log.reps,
      weight: log.weight,
      created_at: log.created_at
    });
  });

  console.log("🔵 [getWeekWorkouts] Logs grouped by exercise:", Array.from(logsByExercise.keys()));

  return (
    (workouts as WorkoutWithStatsBase[] | null)?.map((w) => {
      const exercises_count = w.workout_exercises?.length || 0;
      
      console.log("🔵 [getWeekWorkouts] Processing workout:", w.date, "- Exercises:", exercises_count);
      
      // Get all logs for this workout's exercises (from ANY time period)
      const workoutLogs = (w.workout_exercises || []).flatMap((we: WorkoutExerciseBase) => 
        logsByExercise.get(we.exercise_id) || []
      );
      
      console.log("🔵 [getWeekWorkouts] Workout logs for", w.date, ":", workoutLogs.length);
      
      // Calculate total weight lifted
      const totalWeight = workoutLogs.reduce((sum: number, log) => 
        sum + (log.weight || 0) * (log.reps || 0), 0
      );
      
      // Estimate calories (simple formula)
      const calories = Math.round(totalWeight * 0.05);
      
      // Calculate intensity score
      const totalSets = workoutLogs.length;
      const totalReps = workoutLogs.reduce((sum: number, log) => sum + (log.reps || 0), 0);
      const maxWeight = workoutLogs.length > 0 
        ? Math.max(...workoutLogs.map((log) => log.weight || 0), 0)
        : 0;
      const intensity = exercises_count > 0 && workoutLogs.length > 0
        ? Math.min(100, Math.round((totalSets * 5) + (totalReps * 0.5) + (maxWeight * 0.3)))
        : 0;

      const result = {
        id: w.id,
        date: w.date,
        name: w.name,
        muscle_groups: w.muscle_groups,
        trained: workoutLogs.length > 0,
        exercises_count,
        calories,
        intensity,
      };

      console.log("🔵 [getWeekWorkouts] Result for", w.date, ":", result);

      return result;
    }) ?? []
  );
}

// --------------------------------------------------
// CREATE WORKOUT
// --------------------------------------------------
export async function createWorkout({
  date,
  name,
  muscleGroups,
  exercises,
}: {
  date: string;
  name: string;
  muscleGroups: string[];
  exercises: CreateWorkoutExercise[];
}) {
  const db = supabase();

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // 1) insert workout
  const { data: workout, error } = await db
    .from("workouts")
    .insert([
      {
        user_id: user.id,
        date,
        name,
        muscle_groups: muscleGroups,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // 2) insert linked exercises
  const exerciseRows = exercises.map((ex) => ({
    workout_id: workout.id,
    exercise_id: ex.exercise_id,
    sets: ex.sets,
    notes: ex.notes ?? null,
  }));

  const { error: err2 } = await db
    .from("workout_exercises")
    .insert(exerciseRows);

  if (err2) throw err2;

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
      date,
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
    exercises,
  };

  console.log("🟧 FINAL WORKOUT OBJECT:", JSON.stringify(finalWorkout, null, 2));

  return finalWorkout;
}


export async function getAllExercises() {
  const db = supabase();

  const { data, error } = await db
    .from("exercises")
    .select("id, name, category, muscle_group, image_url, description")
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
  date: string;
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
  const db = supabase();

  const { data, error } = await db
    .from("workouts")
    .select(`
      id,
      name,
      date,
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
    .order("date", { ascending: false });

  if (error || !data) return [];

  return (data as SupabaseWorkoutRow[]).map((w) => ({
    ...w,
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
