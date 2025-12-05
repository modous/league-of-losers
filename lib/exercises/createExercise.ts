"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface CreateExerciseInput {
  name: string;
  category: string;
  muscle_group: string;
  description?: string;
  imageUrl?: string;
}

export async function createExercise(input: CreateExerciseInput) {
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
    .from("exercises")
    .insert({
      name: input.name,
      category: input.category,
      muscle_group: input.muscle_group,
      description: input.description,
      image_url: input.imageUrl,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  return data;
}
