import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import Image from "next/image";

export default async function ExercisesPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // User ophalen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-white">Niet ingelogd.</div>;
  }

  // Oefeningen ophalen
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return <div className="p-6 text-white">Kon oefeningen niet laden.</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Mijn Oefeningen</h1>

      <a
        href="/exercises/new"
        className="bg-purple-600 px-4 py-2 rounded inline-block mb-6"
      >
        + Nieuwe oefening
      </a>

      {exercises.length === 0 && (
        <p>Je hebt nog geen oefeningen toegevoegd.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.map((ex) => (
          <a
            key={ex.id}
            href={`/exercises/${ex.id}`}
            className="bg-neutral-900 border border-neutral-700 rounded p-4 hover:bg-neutral-800 transition"
          >
            {ex.image_url && (
              <Image
                src={ex.image_url}
                alt={ex.name}
                width={400}
                height={160}
                className="w-full h-40 object-cover rounded mb-3"
              />
            )}

            <h2 className="text-xl font-semibold">{ex.name}</h2>

            {ex.category && (
              <p className="text-sm text-gray-400">{ex.category}</p>
            )}

            {ex.description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {ex.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
