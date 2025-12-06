"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface UpdateExerciseInput {
  id: string;
  name?: string;
  category?: string;
  muscle_group?: string;
  description?: string;
  image_url?: string;
}

export async function updateExercise(input: UpdateExerciseInput, imageFile?: File) {
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

  // Handle image upload if provided
  let imageUrl = input.image_url;
  if (imageFile) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${input.id}/${Date.now()}.${fileExt}`;

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

    imageUrl = publicUrl;
  }

  // Build update object with only provided fields
  const updateData: Partial<{
    name: string;
    category: string;
    muscle_group: string;
    description: string;
    image_url: string;
  }> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.muscle_group !== undefined) updateData.muscle_group = input.muscle_group;
  if (input.description !== undefined) updateData.description = input.description;
  if (imageUrl !== undefined) updateData.image_url = imageUrl;

  const { data, error } = await supabase
    .from("exercises")
    .update(updateData)
    .eq("id", input.id)
    .eq("user_id", user.id) // Only allow updating own exercises
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`);
  }

  revalidatePath(`/exercises/${input.id}`);
  revalidatePath("/exercises");

  return data;
}
