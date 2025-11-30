"use client";

import { use, useState, useEffect } from "react";
import { createWorkout, getAllExercises } from "@/lib/workouts";

export default function NewWorkoutPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);

  
const MUSCLE_MAP: Record<string, string> = {
  Borst: "Chest",
  Rug: "Back",
  Schouders: "Shoulders",
  Armen: "Arms",
  Benen: "Legs",
  Buik: "Abs",
};

  const [name, setName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);

  const [allExercises, setAllExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);

  const [saving, setSaving] = useState(false);

  // ---------------------------
  // LOAD EXERCISES FROM DATABASE
  // ---------------------------
 useEffect(() => {
  async function load() {
    console.log("🔥 Fetching all exercises from DB...");
    
    const rows = await getAllExercises();

    console.log("🔥 RAW EXERCISES FROM DB:", rows);

    const mapped = rows.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
    }));

    console.log("🔥 MAPPED EXERCISES:", mapped);

    setAllExercises(mapped);
  }

  load();
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
    if (!name || selectedExercises.length === 0) return;

    setSaving(true);

    await createWorkout({
      date,
      name,
      muscleGroups: selectedGroups,
      exercises: selectedExercises.map((ex) => ({
        exercise_id: ex.id,
        sets: [],
        notes: null,
      })),
    });

    window.location.href = `/workouts/date/${date}`;
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
            className="w-full mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
          />

          <h3 className="font-semibold mt-6 mb-3">Spiergroepen</h3>

          <div className="flex flex-wrap gap-3">
            {["Borst", "Rug", "Schouders", "Armen", "Benen", "Buik"].map((g) => {
              const selected = selectedGroups.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`px-4 py-2 rounded-xl font-medium ${
                    selected ? "bg-yellow-400 text-black" : "bg-zinc-800"
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
  .filter((ex) => ex.muscle_group === MUSCLE_MAP[g])
  .map((ex) => {
    const selected = selectedExercises.some((x) => x.id === ex.id);

    return (
      <button
        key={ex.id}
        onClick={() => toggleExercise(ex)}
        className={`w-full p-4 rounded-lg border ${
          selected
            ? "bg-yellow-400 border-yellow-400 text-black"
            : "bg-zinc-900 border-zinc-700"
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

        <button
          disabled={!name || selectedExercises.length === 0 || saving}
          onClick={saveWorkout}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Workout Opslaan"}
        </button>
      </div>
    </div>
  );
}
