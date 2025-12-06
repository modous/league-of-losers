"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function NewWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);
  const [allExercises, setAllExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadExercises() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabase
        .from("exercises")
        .select("id, name, muscle_group")
        .order("name");

      if (data) {
        setAllExercises(data);
      }
    }

    loadExercises();
  }, []);

  function toggleGroup(g: string) {
    setSelectedGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function toggleExercise(ex: { id: string; name: string; muscle_group: string }) {
    setSelectedExercises((prev) =>
      prev.find((x) => x.id === ex.id)
        ? prev.filter((x) => x.id !== ex.id)
        : [...prev, ex]
    );
  }

  async function saveWorkout() {
    if (!name || selectedExercises.length === 0) {
      alert("Voeg een naam en minimaal één oefening toe.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Je moet ingelogd zijn om een workout te maken.");
        setSaving(false);
        return;
      }

      // Insert workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          name,
          muscle_groups: selectedGroups,
        })
        .select()
        .single();

      if (workoutError) {
        console.error("Error creating workout:", workoutError);
        alert("Fout bij aanmaken workout.");
        setSaving(false);
        return;
      }

      // Insert workout exercises
      const exerciseRows = selectedExercises.map((ex) => ({
        workout_id: workout.id,
        exercise_id: ex.id,
        sets: [],
        notes: null,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(exerciseRows);

      if (exercisesError) {
        console.error("Error adding exercises:", exercisesError);
        alert("Fout bij toevoegen oefeningen.");
        setSaving(false);
        return;
      }

      router.push("/workoutoverview");
    } catch (error) {
      console.error("Error:", error);
      alert("Er ging iets mis.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nieuwe Workout</h1>

        {/* WORKOUT INFO */}
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl mb-8">
          <label className="text-slate-300 text-sm">Workout Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Push Day, Leg Day..."
            className="w-full mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
          />

          <h3 className="font-semibold mt-6 mb-3">Spiergroepen</h3>

          <div className="flex flex-wrap gap-3">
            {["Borst", "Rug", "Schouders", "Biceps", "Triceps", "Benen", "Core"].map((g) => {
              const selected = selectedGroups.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    selected ? "bg-yellow-400 text-black" : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* EXERCISE LIST */}
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl mb-8">
          <h2 className="text-xl font-semibold mb-1">
            Oefeningen ({selectedExercises.length})
          </h2>

          {selectedGroups.length === 0 ? (
            <p className="text-slate-500 text-sm mt-4">
              Selecteer eerst spiergroepen.
            </p>
          ) : (
            selectedGroups.map((g) => (
              <div key={g} className="mt-6">
                <h3 className="text-yellow-300 text-lg font-medium mb-3">{g}</h3>

                <div className="space-y-3">
                  {allExercises
                    .filter((ex) => ex.muscle_group === g)
                    .map((ex) => {
                      const selected = selectedExercises.some((x) => x.id === ex.id);

                      return (
                        <button
                          key={ex.id}
                          onClick={() => toggleExercise(ex)}
                          className={`w-full p-4 rounded-lg border transition ${
                            selected
                              ? "bg-yellow-400 border-yellow-400 text-black"
                              : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {ex.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition"
          >
            Annuleren
          </button>
          <button
            onClick={saveWorkout}
            disabled={saving || !name || selectedExercises.length === 0}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-slate-500 text-black font-bold py-3 rounded-lg transition"
          >
            {saving ? "Opslaan..." : "Workout Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
