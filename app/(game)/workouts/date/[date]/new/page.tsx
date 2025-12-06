"use client";

import { use, useState, useEffect } from "react";
import { createWorkout, getAllExercises } from "@/lib/workouts";
import { Plus, X } from "lucide-react";
import { createExercise } from "@/lib/exercises/createExercise";

export default function NewWorkoutPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);

  const [name, setName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);

  const [allExercises, setAllExercises] = useState<
    { id: string; name: string; muscle_group: string }[]
  >([]);

  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [creatingExercise, setCreatingExercise] = useState(false);

  // ---------------------------
  // LOAD EXERCISES FROM DATABASE
  // ---------------------------
  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const rows = await getAllExercises();
    const mapped = rows.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
    }));
    setAllExercises(mapped);
  }

  function openAddExerciseModal(muscleGroup: string) {
    setNewExerciseMuscleGroup(muscleGroup);
    setNewExerciseName("");
    setShowAddExercise(true);
  }

  async function handleCreateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    setCreatingExercise(true);

    try {
      const exercise = await createExercise({
        name: newExerciseName,
        category: "Compound", // Default
        muscle_group: newExerciseMuscleGroup,
      });

      // Reload exercises
      await loadExercises();

      // Auto-select the new exercise
      setSelectedExercises((prev) => [
        ...prev,
        {
          id: exercise.id,
          name: exercise.name,
          muscle_group: exercise.muscle_group,
        },
      ]);

      // Close modal
      setShowAddExercise(false);
      setNewExerciseName("");
    } catch (error) {
      alert("Fout bij toevoegen oefening");
      console.error(error);
    } finally {
      setCreatingExercise(false);
    }
  }


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
            {["Borst", "Rug", "Schouders", "Biceps", "Triceps", "Benen", "Core"].map((g) => {
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-yellow-300 text-lg font-medium">{g}</h3>
                  
                  <button
                    type="button"
                    onClick={() => openAddExerciseModal(g)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg transition"
                  >
                    <Plus size={16} />
                    Nieuwe oefening
                  </button>
                </div>

                <div className="space-y-3">
                 {allExercises
  .filter((ex) => ex.muscle_group === g)
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

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nieuwe Oefening</h2>
              <button
                onClick={() => setShowAddExercise(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Spiergroep
                </label>
                <input
                  type="text"
                  value={newExerciseMuscleGroup}
                  disabled
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Naam van de oefening *
                </label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Bijv. Bench Press"
                  autoFocus
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!newExerciseName.trim() || creatingExercise}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  {creatingExercise ? "Toevoegen..." : "Toevoegen"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExercise(false)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                >
                  Annuleer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
