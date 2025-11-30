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
export async function getWeekWorkouts(start: string, end: string) {
  const db = supabase();

  const { data } = await db
    .from("workouts")
    .select("id, date, name, muscle_groups")
    .gte("date", start)
    .lte("date", end)
    .order("date");

  return (
    data?.map((w) => ({
      ...w,
      trained: true,
      exercises_count: 0,
    })) ?? []
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
    .eq("id", id)
    .maybeSingle(); // <- was .single()

  if (error) {
    console.error("getWorkoutById error:", error);
    return null;
  }

  if (!data) {
    console.warn("getWorkoutById: no workout found for id", id);
    return null;
  }

 const exercises: WorkoutExercise[] = data.workout_exercises.map((row) => ({
      id: row.id,
      exercise_id: row.exercise_id,
      notes: row.notes,
      sets: row.sets,
      exercise: Array.isArray(row.exercise)
        ? row.exercise[0]
        : row.exercise,
    }));

  return {
    ...data,
    exercises,
  };
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