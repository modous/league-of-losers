import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import WorkoutCard from "./WorkoutCard";

export default async function WorkoutOverviewPage() {
  const supabase = await createServerSupabase();

  console.log("🔵 WorkoutOverview: fetching workouts…");

  // --- Check user ---
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("🟣 User:", user);
  console.log("🟣 userError:", userError);

  // Base query
  let query = supabase
    .from("workouts")
    .select("id, name, muscle_groups, user_id")
    .order("created_at", { ascending: false });

  if (!user) {
    console.log("🟠 No user logged in → fetching ONLY global workouts");
    query = query.is("user_id", null);
  } else {
    console.log("🟢 User logged in:", user.id);
    query = query.or(`user_id.eq.${user.id},user_id.is.null`);
  }

  const { data: workouts, error } = await query;

  console.log("🔴 Query ERROR:", error);
  console.log("🟡 Raw workouts from DB:", workouts);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Workout Overzicht</h1>
          
          <Link
            href="/workouts/new"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition"
          >
            + Nieuwe Workout
          </Link>
        </div>

        {!workouts || workouts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-slate-400 mb-4">Geen workouts gevonden.</p>
            <Link
              href="/workouts/new"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg transition"
            >
              Maak je eerste workout
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
