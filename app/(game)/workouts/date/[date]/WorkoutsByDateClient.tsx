"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkoutsByDate, Workout } from "@/lib/workouts";

export default function WorkoutsByDateClient({ date }: { date: string }) {
  console.log("🔥 Client received date:", date);

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getWorkoutsByDate(date);
      setWorkouts(data);
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

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="text-2xl font-bold mb-6 capitalize">{formatted}</h1>

      {/* WORKOUT LIST */}
      <div className="space-y-6">
        {workouts.map((w) => (
          <div
            key={w.id}
            className="border border-zinc-800 rounded-lg bg-zinc-900 p-4 hover:border-yellow-400 transition"
          >
            {/* Entire card clickable */}
            <Link href={`/workoutoverview/${w.id}`}>
              <div>
                <h2 className="font-bold text-lg">
                  {w.name || `Workout #${w.id}`}
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  Spiergroepen: {w.muscle_groups?.join(", ") || "–"}
                </p>

                <p className="text-slate-400 text-sm mt-2">
                  {w.exercises.length} oefening(en)
                </p>
              </div>
            </Link>

            {/* Start Workout button */}
            <Link
              href={`/workoutoverview/${w.id}/start`}
              className="mt-3 block text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg"
            >
              Start Workout
            </Link>
          </div>
        ))}

        {workouts.length === 0 && (
          <div className="text-slate-500">Nog geen workouts vandaag.</div>
        )}
      </div>

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
  );
}
