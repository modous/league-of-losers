import { createServerSupabase } from "@/lib/supabase-server";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { setup?: string };
}) {
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

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isSetup = searchParams.setup === "true";
  const weight = user.user_metadata?.weight;
  const height = user.user_metadata?.height;
  const age = user.user_metadata?.age;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        {isSetup && !profile?.username ? (
          <div className="mb-8">
            <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔒</span>
                <div>
                  <h1 className="text-3xl font-bold text-yellow-400 mb-2">Account Setup Vereist</h1>
                  <p className="text-slate-300 text-lg mb-2">
                    Voordat je de app kunt gebruiken, moet je eerst een gebruikersnaam instellen.
                  </p>
                  <p className="text-slate-400">
                    Dit is hoe vrienden je kunnen vinden en herkennen in de leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <h1 className="text-4xl font-bold text-white mb-8">Profiel</h1>
        )}

        {profile?.username && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Account Info</h2>
            <div className="space-y-2">
              <p className="text-slate-300">
                <span className="font-semibold">Gebruikersnaam:</span> {profile.username}
              </p>
              <p className="text-slate-300">
                <span className="font-semibold">Email:</span> {user.email}
              </p>
            </div>
          </div>
        )}

        <ProfileForm 
          username={profile?.username}
          fullName={profile?.full_name}
          weight={weight}
          height={height}
          age={age}
          isSetup={isSetup && !profile?.username}
        />
      </div>
    </div>
  );
}
