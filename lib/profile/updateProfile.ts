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

  // Store in user metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      weight: input.weight,
      height: input.height,
      age: input.age,
    }
  });

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }

  revalidatePath("/profile");
}

