"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkoutsByDate, getAllWorkouts, Workout } from "@/lib/workouts";

export default function WorkoutsByDateClient({ date }: { date: string }) {
  console.log("🔥 Client received date:", date);

  const [loading, setLoading] = useState(true);
  const [workoutsForDate, setWorkoutsForDate] = useState<Workout[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [dateWorkouts, all] = await Promise.all([
        getWorkoutsByDate(date),
        getAllWorkouts()
      ]);
      setWorkoutsForDate(dateWorkouts);
      setAllWorkouts(all);
      setLoading(false);
    }
    load();
  }, [date]);

  if (loading) {
    return <div className="text-white p-6">Laden...</div>;
  }

  const formatted = new Date(date).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Separate workouts: those for this date vs available workouts
  const workoutsForDateIds = new Set(workoutsForDate.map(w => w.id));
  const availableWorkouts = allWorkouts.filter(w => !workoutsForDateIds.has(w.id));

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 capitalize">{formatted}</h1>

        {/* WORKOUTS FOR THIS DATE */}
        {workoutsForDate.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Workouts voor vandaag</h2>
            <div className="space-y-4">
              {workoutsForDate.map((w) => (
                <div
                  key={w.id}
                  className="border-2 border-green-500 rounded-lg bg-zinc-900 p-4 hover:border-green-400 transition"
                >
                  <Link href={`/workoutoverview/${w.id}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="font-bold text-lg">{w.name || `Workout #${w.id}`}</h2>
                        <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full font-semibold">
                          Gepland
                        </span>
                      </div>

                      <p className="text-slate-400 text-sm mt-1">
                        Spiergroepen: {w.muscle_groups?.join(", ") || "–"}
                      </p>

                      <p className="text-slate-400 text-sm mt-2">
                        {w.exercises.length} oefening(en)
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={`/workoutoverview/${w.id}/start`}
                    className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg"
                  >
                    Start Workout
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVAILABLE WORKOUTS */}
        {availableWorkouts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-400">Beschikbare workouts</h2>
            <div className="space-y-4">
              {availableWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="border border-zinc-800 rounded-lg bg-zinc-900 p-4 hover:border-yellow-400 transition"
                >
                  <Link href={`/workoutoverview/${w.id}`}>
                    <div>
                      <h2 className="font-bold text-lg">{w.name || `Workout #${w.id}`}</h2>

                      <p className="text-slate-400 text-sm mt-1">
                        Spiergroepen: {w.muscle_groups?.join(", ") || "–"}
                      </p>

                      <p className="text-slate-400 text-sm mt-2">
                        {w.exercises.length} oefening(en)
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={`/workoutoverview/${w.id}/start`}
                    className="mt-3 block text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg"
                  >
                    Start Workout
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {workoutsForDate.length === 0 && availableWorkouts.length === 0 && (
          <div className="text-slate-500 text-center py-8">
            Nog geen workouts beschikbaar. Maak er een aan!
          </div>
        )}

        {/* ADD NEW WORKOUT */}
        <div className="mt-6">
          <Link
            href={`/workouts/date/${date}/new`}
            className="w-full block text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg"
          >
            + Nieuwe Workout
          </Link>
        </div>
      </div>
    </div>
  );
}
