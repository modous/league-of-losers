import ProgressChart from "@/components/dashboard/ProgressChart";
import WeekCalendar from "./WeekCalendar";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function Dashboard() {
  // Fetch workout data for the chart (last 30 days)
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div className="text-white p-6">Not authenticated</div>;
  }
  
  // Get username from email or user metadata
  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Query workout sessions instead of workouts (which don't have dates)
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      workout_date,
      workout_id,
      workout:workout_id (
        workout_exercises (
          exercise_id
        )
      )
    `)
    .eq('user_id', user?.id)
    .not('completed_at', 'is', null)
    .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('workout_date', { ascending: true });

  // Get all unique exercise IDs from all sessions
  const exerciseIds = Array.from(new Set(
    sessions?.flatMap(s => {
      const workout = Array.isArray(s.workout) ? s.workout[0] : s.workout;
      return workout?.workout_exercises?.map(we => we.exercise_id) || [];
    }) || []
  ));

  // Fetch all exercise logs for these sessions
  const sessionIds = sessions?.map(s => s.id) || [];
  
  const { data: allLogs } = await supabase
    .from('exercise_logs')
    .select('session_id, exercise_id, weight, reps, created_at')
    .eq('user_id', user?.id)
    .in('session_id', sessionIds);

  // Group logs by session_id
  interface ExerciseLogData {
    session_id: string;
    exercise_id: string;
    weight: number;
    reps: number;
    created_at: string;
  }
  
  const logsBySession = new Map<string, ExerciseLogData[]>();
  allLogs?.forEach(log => {
    if (!logsBySession.has(log.session_id)) {
      logsBySession.set(log.session_id, []);
    }
    logsBySession.get(log.session_id)?.push(log);
  });

  // Transform data for the chart
  const progressData = sessions?.map(session => {
    const workout = Array.isArray(session.workout) ? session.workout[0] : session.workout;
    const exerciseIds = workout?.workout_exercises?.map(we => we.exercise_id) || [];
    const sessionLogs = logsBySession.get(session.id) || [];
    
    const exerciseCount = sessionLogs.length > 0 ? exerciseIds.length : 0;
    const weights = sessionLogs.map(log => log.weight || 0);
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    
    return {
      date: session.workout_date,
      exerciseCount,
      maxWeight
    };
  }).filter(w => w.exerciseCount > 0) || [];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">League of Losers</h1>

        <p className="text-xl text-slate-200 mb-8">
          Welkom terug, <span className="font-bold">{username}</span>
        </p>
        
        <WeekCalendar /> 

        <div className="mt-8 mb-8">
          <ProgressChart data={progressData} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Stats</h2>
          <div className="grid grid-cols-3 gap-4">
           
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{progressData.length}</p>
              <p className="text-sm text-slate-400">Workouts gedaan</p>
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
