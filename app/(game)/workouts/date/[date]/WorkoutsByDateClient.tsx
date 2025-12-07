"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Workout, getAllWorkouts } from "@/lib/workouts";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft } from "lucide-react";

export default function WorkoutsByDateClient({ date }: { date: string }) {
  console.log("🔥 Client received date:", date);

  const [loading, setLoading] = useState(true);
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(new Set());
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    async function load() {
      console.log('🔍 [WorkoutsByDateClient] Starting load for date:', date);
      setLoading(true);
      
      // Get all workout templates
      console.log('📥 [WorkoutsByDateClient] Fetching all workouts...');
      const workouts = await getAllWorkouts();
      console.log('✅ [WorkoutsByDateClient] Received workouts:', workouts);
      console.log('📊 [WorkoutsByDateClient] Workout count:', workouts.length);
      setAllWorkouts(workouts);
      
      // Get workout sessions completed on this date
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      console.log('🔎 [WorkoutsByDateClient] Checking workout_sessions for date:', date);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ [WorkoutsByDateClient] No authenticated user');
        setLoading(false);
        return;
      }
      
      console.log('👤 [WorkoutsByDateClient] User ID:', user.id);
      const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('workout_id')
        .eq('user_id', user.id)
        .eq('workout_date', date)
        .not('completed_at', 'is', null);
      
      console.log('📋 [WorkoutsByDateClient] Sessions result:', { sessions, error: sessionError });
      
      const completedIds = new Set(sessions?.map(s => s.workout_id) || []);
      console.log('✔️ [WorkoutsByDateClient] Completed workout IDs:', Array.from(completedIds));
      setCompletedWorkoutIds(completedIds);
      
      setLoading(false);
      console.log('🏁 [WorkoutsByDateClient] Load complete');
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

  // Separate workouts: completed today vs available
  const completedWorkouts = allWorkouts.filter(w => completedWorkoutIds.has(w.id));
  const availableWorkouts = allWorkouts.filter(w => !completedWorkoutIds.has(w.id));
  
  console.log('🎯 [WorkoutsByDateClient] Completed workouts:', completedWorkouts.length);
  console.log('🎯 [WorkoutsByDateClient] Available workouts:', availableWorkouts.length);

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Terug naar dashboard</span>
        </Link>
        
        <h1 className="text-2xl font-bold mb-6 capitalize">{formatted}</h1>

        {/* COMPLETED WORKOUTS */}
        {completedWorkouts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Voltooid vandaag</h2>
            <div className="space-y-4">
              {completedWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="border-2 border-green-500 rounded-lg bg-zinc-900 p-4 hover:border-green-400 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-bold text-lg">{w.name || `Workout #${w.id}`}</h2>
                    <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full font-semibold">
                      ✓ Voltooid
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm mt-1">
                    Spiergroepen: {w.muscle_groups?.join(", ") || "–"}
                  </p>

                  <p className="text-slate-400 text-sm mt-2">
                    {w.exercises.length} oefening(en)
                  </p>

                  <Link
                    href={`/workoutoverview/${w.id}/complete?date=${date}`}
                    className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg transition-colors"
                  >
                    📊 Bekijk resultaten
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
                    href={`/workoutoverview/${w.id}/start?date=${date}`}
                    className="mt-3 block text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg"
                  >
                    Start Workout
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedWorkouts.length === 0 && availableWorkouts.length === 0 && (
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
