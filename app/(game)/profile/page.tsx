import { syncUser } from "@/lib/game/syncUser";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const player = await syncUser();

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Profiel</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Account Info</h2>
          <div className="space-y-2">
            <p className="text-slate-300">
              <span className="font-semibold">Gebruikersnaam:</span> {player.username}
            </p>
            <p className="text-slate-300">
              <span className="font-semibold">Level:</span> {player.level}
            </p>
            <p className="text-slate-300">
              <span className="font-semibold">Streak:</span> {player.streak} dagen
            </p>
          </div>
        </div>

        <ProfileForm 
          weight={player.weight}
          height={player.height}
          age={player.age}
        />
      </div>
    </div>
  );
}
