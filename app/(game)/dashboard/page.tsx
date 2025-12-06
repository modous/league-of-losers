import ProgressChart from "@/components/dashboard/ProgressChart";
import WeekCalendar from "./WeekCalendar";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { Calendar, TrendingUp, Flame, Dumbbell, Trophy, Target } from "lucide-react";

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
      completed_at,
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

  // Calculate stats
  const totalWorkouts = progressData.length;
  const thisWeek = sessions?.filter(s => {
    const sessionDate = new Date(s.workout_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length || 0;

  const totalVolume = allLogs?.reduce((sum, log) => sum + (log.weight * log.reps), 0) || 0;
  const avgWorkoutsPerWeek = totalWorkouts > 0 ? (totalWorkouts / 4.3).toFixed(1) : 0; // 30 days ≈ 4.3 weeks

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <Dumbbell className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-yellow-400">
                League of Losers
              </h1>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-slate-300 ml-15">
            Welkom terug, <span className="font-bold text-yellow-400">{username}</span> 💪
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="text-yellow-400" size={20} />
              <p className="text-sm text-slate-400 font-medium">Totaal Workouts</p>
            </div>
            <p className="text-3xl font-black text-white">{totalWorkouts}</p>
            <p className="text-xs text-slate-500 mt-1">laatste 30 dagen</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="text-blue-400" size={20} />
              <p className="text-sm text-slate-400 font-medium">Deze Week</p>
            </div>
            <p className="text-3xl font-black text-white">{thisWeek}</p>
            <p className="text-xs text-slate-500 mt-1">workouts gedaan</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-400" size={20} />
              <p className="text-sm text-slate-400 font-medium">Totaal Volume</p>
            </div>
            <p className="text-3xl font-black text-white">{(totalVolume / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500 mt-1">kg getild</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-purple-400" size={20} />
              <p className="text-sm text-slate-400 font-medium">Gemiddeld</p>
            </div>
            <p className="text-3xl font-black text-white">{avgWorkoutsPerWeek}</p>
            <p className="text-xs text-slate-500 mt-1">per week</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-yellow-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Deze Week</h2>
          </div>
          <WeekCalendar />
        </div>

        {/* Progress Chart */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-yellow-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Progressie</h2>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <ProgressChart data={progressData} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href={`/workouts/date/${today}`}
            className="group relative overflow-hidden bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/50"
          >
            <div className="flex items-center justify-center gap-3">
              <Dumbbell size={24} />
              <span className="text-lg">Start Workout</span>
            </div>
          </Link>
          
          <Link 
            href="/exercises" 
            className="group relative overflow-hidden bg-zinc-900 hover:bg-zinc-800 border-2 border-yellow-400 text-yellow-400 font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/30"
          >
            <div className="flex items-center justify-center gap-3">
              <Target size={24} />
              <span className="text-lg">Oefeningen</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
