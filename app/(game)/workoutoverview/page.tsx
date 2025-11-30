import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

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
    .select("id, name, date, muscle_groups, user_id")
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
        <h1 className="text-3xl font-bold mb-6">Workout Overzicht</h1>

        {!workouts || workouts.length === 0 ? (
          <p className="text-slate-400">Geen workouts gevonden.</p>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workoutoverview/${workout.id}`}
                className="block bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition"
              >
                <h2 className="text-xl font-semibold">
                  {workout.name}{" "}
                  {workout.user_id === null && (
                    <span className="text-xs text-yellow-400">(Global)</span>
                  )}
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  {workout.date
                    ? new Date(workout.date).toLocaleDateString("nl-NL")
                    : "Geen datum"}
                </p>

                {workout.muscle_groups?.length > 0 && (
                  <p className="text-slate-300 text-sm mt-2">
                    Spiergroepen: {workout.muscle_groups.join(", ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
