"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface ExerciseSet {
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface AddLogInput {
  exerciseId: string;
  sets: ExerciseSet[];
  notes?: string;
  date?: Date;
}

export async function addLog(input: AddLogInput) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("exercise_logs")
    .insert({
      user_id: user.id,
      exercise_id: input.exerciseId,
      sets: input.sets,
      notes: input.notes,
      performed_at: input.date || new Date(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add log: ${error.message}`);
  }

  return data;
}
