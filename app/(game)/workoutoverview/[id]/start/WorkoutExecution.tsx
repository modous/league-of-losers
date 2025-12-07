"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

interface ExerciseSet {
  reps: number;
  weight: number;
  isBodyweight: boolean;
  extraWeight: number; // Extra gewicht bij bodyweight oefeningen
}

interface WorkoutExecutionProps {
  workoutId: string;
  workoutName: string;
  workoutDate: string;
  exercises: Exercise[];
}

export default function WorkoutExecution({
  workoutId,
  workoutName,
  workoutDate,
  exercises,
}: WorkoutExecutionProps) {
  const router = useRouter();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 0, weight: 0, isBodyweight: false, extraWeight: 0 }]);
  const [saving, setSaving] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [userBodyweight, setUserBodyweight] = useState<number | null>(null);

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  // Create workout session on mount
  useEffect(() => {
    async function createSession() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('❌ No user found');
          alert('Je moet ingelogd zijn om een workout te starten.');
          return;
        }

        const { data, error } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            workout_id: workoutId,
            workout_date: workoutDate,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          console.error('❌ Error creating workout session:', error);
          alert('Kon geen workout sessie starten. Probeer opnieuw.');
          return;
        }

        console.log('✅ Created workout session:', data.id);
        setSessionId(data.id);

        // Get user bodyweight from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('weight')
          .eq('id', user.id)
          .single();

        if (profileData?.weight) {
          setUserBodyweight(profileData.weight);
        }
      } catch (error) {
        console.error('❌ Error in createSession:', error);
      } finally {
        setLoadingSession(false);
      }
    }

    createSession();
  }, [workoutId, workoutDate]);

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0, isBodyweight: false, extraWeight: 0 }]);
  };

  const updateSet = (index: number, field: "reps" | "weight" | "isBodyweight" | "extraWeight", value: number | boolean) => {
    const newSets = [...sets];
    if (field === "isBodyweight") {
      newSets[index][field] = value as boolean;
      // When toggling bodyweight off, reset extraWeight
      if (!value) {
        newSets[index].extraWeight = 0;
      }
    } else if (field === "extraWeight") {
      newSets[index][field] = value as number;
    } else {
      newSets[index][field] = value as number;
    }
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    if (!sessionId) {
      alert('Geen actieve sessie. Herlaad de pagina.');
      return;
    }

    setSaving(true);

    try {
      // Save logs for current exercise
      for (const set of sets) {
        if (set.reps > 0 || set.weight > 0) {
          // Calculate total weight: bodyweight + extra weight if isBodyweight, otherwise just weight
          // Use 75kg as default if no user bodyweight is set
          const finalWeight = set.isBodyweight
            ? (userBodyweight || 75) + set.extraWeight 
            : set.weight;
          
          const response = await fetch("/api/exercise-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              exerciseId: currentExercise.id,
              reps: set.reps,
              weight: finalWeight,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Failed to save exercise log:', error);
            throw new Error(error.error || 'Failed to save');
          }
        }
      }

      // Mark exercise as completed
      setCompletedExercises(new Set([...completedExercises, currentExerciseIndex]));

      if (isLastExercise) {
        // Mark session as completed
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        await supabase
          .from('workout_sessions')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', sessionId);

        // Workout complete! Redirect to summary page
        router.push(`/workoutoverview/${workoutId}/complete?date=${workoutDate}`);
      } else {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setSets([{ reps: 0, weight: 0, isBodyweight: false, extraWeight: 0 }]);
      }
    } catch (error) {
      console.error("Error saving exercise logs:", error);
      alert("Er ging iets mis bij het opslaan. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = confirm('Weet je zeker dat je deze workout wilt annuleren? Alle voortgang gaat verloren.');
    
    if (!confirmed) return;

    try {
      // Delete the workout session if it exists
      if (sessionId) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Delete exercise logs first (foreign key constraint)
        await supabase
          .from('exercise_logs')
          .delete()
          .eq('session_id', sessionId);

        // Delete the session
        await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', sessionId);
      }

      // Redirect to workouts page
      router.push(`/workouts/date/${workoutDate}`);
    } catch (error) {
      console.error('Error cancelling workout:', error);
      alert('Er ging iets mis bij het annuleren.');
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setSets([{ reps: 0, weight: 0, isBodyweight: false, extraWeight: 0 }]);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">⏳</div>
          <p>Workout sessie wordt gestart...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">❌</div>
          <p className="mb-4">Kon geen workout sessie starten</p>
          <button
            onClick={() => router.back()}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg"
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {workoutName}
          </h1>
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 mb-2">
            <span className="font-medium">
              Oefening {currentExerciseIndex + 1} van {exercises.length}
            </span>
            <span className="font-semibold text-yellow-400">{Math.round(progress)}% voltooid</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-3xl sm:text-4xl font-black mb-2 sm:mb-3">{currentExercise.name}</h2>
          <div className="inline-block bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full">
            {currentExercise.muscle_group}
          </div>
        </div>

        {/* Sets */}
        <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl sm:text-2xl font-bold">Sets</h3>
            <button
              onClick={addSet}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-all transform hover:scale-105"
            >
              <span className="hidden sm:inline">+ Set toevoegen</span>
              <span className="sm:hidden">+ Set</span>
            </button>
          </div>

          {sets.map((set, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-200 hover:border-zinc-700"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-lg">
                  {index + 1}
                </div>

                <div className="flex-1 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-400 mb-1.5 sm:mb-2">
                        Reps
                      </label>
                      <input
                        type="number"
                        value={set.reps || ""}
                        onChange={(e) =>
                          updateSet(index, "reps", parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-base sm:text-lg font-semibold focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-400 mb-1.5 sm:mb-2">
                        {set.isBodyweight ? 'Extra (kg)' : 'Gewicht (kg)'}
                      </label>
                      <input
                        type="number"
                        value={set.isBodyweight ? (set.extraWeight || "") : (set.weight || "")}
                        onChange={(e) =>
                          updateSet(index, set.isBodyweight ? "extraWeight" : "weight", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-base sm:text-lg font-semibold focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                        placeholder="0"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 bg-zinc-800/50 rounded-lg p-2.5 sm:p-3">
                      <input
                        type="checkbox"
                        id={`bodyweight-${index}`}
                        checked={set.isBodyweight}
                        onChange={(e) => updateSet(index, "isBodyweight", e.target.checked)}
                        className="w-5 h-5 bg-zinc-700 border-2 border-zinc-600 rounded text-yellow-400 focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                      />
                      <label htmlFor={`bodyweight-${index}`} className="text-xs sm:text-sm text-slate-300 cursor-pointer flex-1">
                        <span className="font-semibold">Bodyweight</span>
                        <span className="text-slate-500 ml-1 hidden sm:inline">
                          {userBodyweight ? `(${userBodyweight} kg)` : '(75 kg standaard)'}
                        </span>
                      </label>
                    </div>
                    {set.isBodyweight && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-lg">💪</span>
                        <span className="text-sm sm:text-base font-bold text-green-400">
                          Totaal: {(userBodyweight || 75) + set.extraWeight} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(index)}
                    className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold text-xl"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 sticky bottom-0 sm:relative bg-black/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-4 sm:p-0 -mx-4 sm:mx-0">
          {currentExerciseIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition-all hover:scale-105 col-span-2 sm:col-span-1 sm:flex-1"
            >
              <span className="hidden sm:inline">← Vorige</span>
              <span className="sm:hidden">← Vorige</span>
            </button>
          )}

          <button
            onClick={handleCancel}
            className={`bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 border-2 border-red-700 text-white font-bold py-2.5 sm:py-4 px-3 sm:px-4 rounded-xl transition-all hover:scale-105 text-sm sm:text-base ${currentExerciseIndex === 0 ? 'col-span-1' : ''} ${currentExerciseIndex > 0 ? 'col-span-1' : 'sm:flex-1'}`}
          >
            <span className="hidden sm:inline">✕ Annuleren</span>
            <span className="sm:hidden">✕</span>
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-black py-3 sm:py-4 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 col-span-1 sm:flex-1"
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
