import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { ExerciseCard } from "./ExerciseCard";

export default async function ExercisesPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // User ophalen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-white">Niet ingelogd.</div>;
  }

  // Oefeningen ophalen (alleen eigen exercises en templates)
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name", { ascending: true });

  if (error) {
    console.log(error);
    return <div className="p-6 text-white">Kon oefeningen niet laden.</div>;
  }

  // Get hidden exercises for this user
  const { data: hiddenExercises } = await supabase
    .from("hidden_exercises")
    .select("exercise_id")
    .eq("user_id", user.id);

  const hiddenIds = new Set(hiddenExercises?.map((h) => h.exercise_id) || []);

  // Filter out hidden exercises
  const visibleExercises = exercises?.filter((ex) => !hiddenIds.has(ex.id)) || [];

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Mijn Oefeningen</h1>

      <Link
        href="/exercises/new"
        className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded inline-block mb-6 hover:bg-yellow-500 transition"
      >
        + Nieuwe oefening
      </Link>

      {visibleExercises.length === 0 && (
        <p>Je hebt nog geen oefeningen toegevoegd.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleExercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} currentUserId={user.id} />
        ))}
      </div>
    </div>
  );
}
