import { getWorkoutById } from "@/lib/workouts";
import Link from "next/link";

export default async function WorkoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
 const { id } = await params;

  const workout = await getWorkoutById(id);

  // ============================
  // DEBUG LOGGING
  // ============================
  console.log("========= WORKOUT DETAIL PAGE =========");
  console.log("Workout ID:", id);
  console.log("Full workout object:", workout);
 
  

  console.log("========================================");
  // ============================

  if (!workout) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-2xl font-bold">Workout niet gevonden</h1>
        <p className="text-slate-400 mt-2">ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">{workout.name}</h1>
        <p className="text-slate-400 mb-6">{workout.date}</p>

        <p className="text-slate-300 mb-6">
          <span className="font-semibold">Spiergroepen:</span>{" "}
          {workout.muscle_groups?.join(", ") || "-"}
        </p>

        <div className="space-y-4 mb-10">
         {workout.exercises.map((ex) => (
            <div
              key={ex.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <h2 className="text-lg font-bold">
                {ex.exercise?.name ?? ex.notes ?? "Onbekende oefening"}
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                {ex.sets?.length || 0} set(s)
              </p>
            </div>
          ))}
        </div>

        <Link
          href={`/workouts/${id}/start`}
          className="block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg"
        >
          Begin Workout
        </Link>
      </div>
    </div>
  );
}
