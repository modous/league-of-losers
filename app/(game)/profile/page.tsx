import { createServerSupabase } from "@/lib/supabase-server";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Profiel</h1>
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
            <p className="text-red-400">
              Niet ingelogd.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get user metadata
  const username = user.email?.split("@")[0] || "Gebruiker";
  const weight = user.user_metadata?.weight;
  const height = user.user_metadata?.height;
  const age = user.user_metadata?.age;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Profiel</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Account Info</h2>
          <div className="space-y-2">
            <p className="text-slate-300">
              <span className="font-semibold">Gebruikersnaam:</span> {username}
            </p>
            <p className="text-slate-300">
              <span className="font-semibold">Email:</span> {user.email}
            </p>
          </div>
        </div>

        <ProfileForm 
          weight={weight}
          height={height}
          age={age}
        />
      </div>
    </div>
  );
}
