"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface WorkoutExecutionProps {
  workoutId: string;
  workoutName: string;
  exercises: Exercise[];
}

export default function WorkoutExecution({
  workoutId,
  workoutName,
  exercises,
}: WorkoutExecutionProps) {
  const router = useRouter();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 0, weight: 0 }]);
  const [saving, setSaving] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const updateSet = (index: number, field: "reps" | "weight", value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    setSaving(true);

    try {
      // Save logs for current exercise
      for (const set of sets) {
        if (set.reps > 0 || set.weight > 0) {
          await fetch("/api/exercise-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workoutId,
              exerciseId: currentExercise.id,
              reps: set.reps,
              weight: set.weight,
            }),
          });
        }
      }

      // Mark exercise as completed
      setCompletedExercises(new Set([...completedExercises, currentExerciseIndex]));

      if (isLastExercise) {
        // Workout complete! Redirect to summary page
        router.push(`/workoutoverview/${workoutId}/complete`);
      } else {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setSets([{ reps: 0, weight: 0 }]);
      }
    } catch (error) {
      console.error("Error saving exercise logs:", error);
      alert("Er ging iets mis bij het opslaan. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLastExercise) {
      router.push(`/workoutoverview/${workoutId}`);
    } else {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSets([{ reps: 0, weight: 0 }]);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setSets([{ reps: 0, weight: 0 }]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{workoutName}</h1>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Oefening {currentExerciseIndex + 1} van {exercises.length}
            </span>
            <span>{Math.round(progress)}% voltooid</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold mb-2">{currentExercise.name}</h2>
          <p className="text-slate-400">{currentExercise.muscle_group}</p>
        </div>

        {/* Sets */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Sets</h3>
            <button
              onClick={addSet}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg text-sm"
            >
              + Set toevoegen
            </button>
          </div>

          {sets.map((set, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Reps
                  </label>
                  <input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) =>
                      updateSet(index, "reps", parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) =>
                      updateSet(index, "weight", parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    placeholder="0"
                    step="0.5"
                  />
                </div>
              </div>

              {sets.length > 1 && (
                <button
                  onClick={() => removeSet(index)}
                  className="flex-shrink-0 text-red-400 hover:text-red-300 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentExerciseIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold py-3 rounded-lg"
            >
              ← Vorige
            </button>
          )}

          <button
            onClick={handleSkip}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold py-3 rounded-lg"
          >
            Overslaan
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {saving
              ? "Opslaan..."
              : isLastExercise
              ? "Voltooien 🎉"
              : "Volgende →"}
          </button>
        </div>
      </div>
    </div>
  );
}
