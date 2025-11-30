'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  weight?: number;
  height?: number;
  age?: number;
}

export async function updateProfile(input: UpdateProfileInput) {
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

  const updateData: Record<string, number | null> = {};
  
  if (input.weight !== undefined) updateData.weight = input.weight || null;
  if (input.height !== undefined) updateData.height = input.height || null;
  if (input.age !== undefined) updateData.age = input.age || null;

  const { error } = await supabase
    .from("players")
    .update(updateData)
    .eq("id", user.id); 

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath('/profile');
}
