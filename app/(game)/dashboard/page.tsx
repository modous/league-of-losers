import { syncUser } from "@/lib/game/syncUser";
import ProgressChart from "@/components/dashboard/ProgressChart";
import WeekCalendar from "./WeekCalendar";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function Dashboard() {
  const player = await syncUser() as unknown as { username: string; streak: number };
  
  // Fetch workout data for the chart (last 30 days)
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      date,
      workout_exercises (
        exercise_id
      )
    `)
    .eq('user_id', user?.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Get all unique exercise IDs from all workouts
  const exerciseIds = Array.from(new Set(
    workouts?.flatMap(w => 
      w.workout_exercises?.map(we => we.exercise_id) || []
    ) || []
  ));

  // Fetch all exercise logs for these exercises
  const { data: allLogs } = await supabase
    .from('exercise_logs')
    .select('exercise_id, weight, reps, created_at')
    .eq('user_id', user?.id)
    .in('exercise_id', exerciseIds)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Group logs by exercise_id
  interface ExerciseLogData {
    exercise_id: string;
    weight: number;
    reps: number;
    created_at: string;
  }
  
  const logsByExercise = new Map<string, ExerciseLogData[]>();
  allLogs?.forEach(log => {
    if (!logsByExercise.has(log.exercise_id)) {
      logsByExercise.set(log.exercise_id, []);
    }
    logsByExercise.get(log.exercise_id)?.push(log);
  });

  // Transform data for the chart
  const progressData = workouts?.map(workout => {
    const exerciseIds = workout.workout_exercises?.map(we => we.exercise_id) || [];
    const workoutLogs = exerciseIds.flatMap(id => logsByExercise.get(id) || []);
    
    const exerciseCount = workoutLogs.length > 0 ? exerciseIds.length : 0;
    const weights = workoutLogs.map(log => log.weight || 0);
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    
    return {
      date: workout.date,
      exerciseCount,
      maxWeight
    };
  }).filter(w => w.exerciseCount > 0) || [];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">League of Losers</h1>

        <p className="text-xl text-slate-200 mb-8">
          Welkom terug, <span className="font-bold">{player.username}</span>
        </p>
        
        <WeekCalendar /> 

        <div className="mt-8 mb-8">
          <ProgressChart data={progressData} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Stats</h2>
          <div className="grid grid-cols-3 gap-4">
           
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{player.streak}</p>
              <p className="text-sm text-slate-400">Streak</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/workouts" className="btn-primary flex-1 text-center">
            🏋️ Workouts
          </Link>
          <Link href="/exercises/new" className="btn-primary flex-1 text-center">
            + Nieuwe Oefening
          </Link>
        </div>
      </div>
    </div>
  );
}
