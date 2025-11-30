// lib/game/syncUser.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function syncUser() {
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

  // 1. Get the user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 2. Check if player exists
  const { data: existingPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("id", user.id)
    .single();

  // 3. If exists → return it
  if (existingPlayer) return existingPlayer;

  // 4. Create player
  const { data: newPlayer, error } = await supabase
    .from("players")
    .insert({
      id: user.id,
      username: user.email ? user.email.split("@")[0] : "unknown", // default
      xp: 0,
      level: 1,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create player:", error);
    return null;
  }

  return newPlayer;
}
