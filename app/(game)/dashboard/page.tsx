import { syncUser } from "@/lib/game/syncUser";
import ProgressChart from "@/components/dashboard/ProgressChart";
import WeekCalendar from "./WeekCalendar";

export default async function Dashboard() {
  const player = await syncUser() as unknown as { username: string; streak: number };
  
 
  
  

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">League of Losers</h1>

        <p className="text-xl text-slate-200 mb-8">
          Welkom terug, <span className="font-bold">{player.username}</span>
        </p>
        
         <WeekCalendar /> 

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
          <a href="/workouts" className="btn-primary flex-1 text-center">
            🏋️ Workouts
          </a>
          <a href="/exercises/new" className="btn-primary flex-1 text-center">
            + Nieuwe Oefening
          </a>
        </div>
      </div>
    </div>
  );
}
