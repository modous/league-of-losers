"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface CreateExerciseInput {
  name: string;
  category: string;
  muscle_group: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateExerciseWithImageInput extends CreateExerciseInput {
  imageFile?: File;
}

// Generate default descriptions based on muscle group
function getDefaultDescription(muscleGroup: string, exerciseName: string): string {
  const descriptions: Record<string, string> = {
    'Borst': `${exerciseName} voor borst - Focus op het opbouwen van kracht en massa in de borstspieren`,
    'Rug': `${exerciseName} voor rug - Verbeter je rugkracht en postuur`,
    'Benen': `${exerciseName} voor benen - Bouw sterke en krachtige benen`,
    'Schouders': `${exerciseName} voor schouders - Ontwikkel brede en sterke schouders`,
    'Biceps': `${exerciseName} voor biceps - Vergroot je armkracht en -omvang`,
    'Triceps': `${exerciseName} voor triceps - Ontwikkel sterke triceps voor krachtige armen`,
    'Core': `${exerciseName} voor core - Versterk je core voor betere stabiliteit`,
    'Full Body': `${exerciseName} - Effectieve full body oefening voor algehele kracht`,
  };

  return descriptions[muscleGroup] || `${exerciseName} voor ${muscleGroup.toLowerCase()}`;
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

  // Use provided description or generate default based on muscle group
  const description = input.description || getDefaultDescription(input.muscle_group, input.name);

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: input.name,
      category: input.category,
      muscle_group: input.muscle_group,
      description: description,
      image_url: input.imageUrl,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${data.id}`);

  return data;
}

export async function createExerciseWithImage(input: CreateExerciseInput, imageFile?: File) {
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

  // First create the exercise
  const exercise = await createExercise(input);

  // If image file provided, upload it
  if (imageFile && exercise.id) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${exercise.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exercise-images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("exercise-images").getPublicUrl(fileName);

    // Update exercise with image URL
    const { error: updateError } = await supabase
      .from("exercises")
      .update({ image_url: publicUrl })
      .eq("id", exercise.id);

    if (updateError) {
      throw new Error(`Failed to update exercise with image: ${updateError.message}`);
    }

    revalidatePath("/exercises");
    revalidatePath(`/exercises/${exercise.id}`);

    return { ...exercise, image_url: publicUrl };
  }

  return exercise;
}
