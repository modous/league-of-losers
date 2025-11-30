"use client";

import { Check } from "lucide-react";

type Exercise = {
  id: string | number;
  name: string;
  muscle_group: string;
};

type ExerciseToggleProps = {
  exercise: Exercise;
  workoutId: string | number;
  isLinked: boolean;
  linkId: string | number;
};

export function ExerciseToggle({ exercise, workoutId, isLinked, linkId }: ExerciseToggleProps) {
  async function toggle() {
    if (isLinked) {
      await fetch(`/api/workout_exercises/${linkId}`, {
        method: "DELETE",
      });
    } else {
      await fetch(`/api/workout_exercises`, {
        method: "POST",
        body: JSON.stringify({ workoutId, exerciseId: exercise.id }),
        headers: { "Content-Type": "application/json" },
      });
    }

    window.location.reload();
  }

  return (
    <button
      onClick={toggle}
      className={`
        w-full flex items-center justify-between
        px-4 py-3 rounded-xl border transition-all
        ${isLinked ? "bg-yellow-400/20 border-yellow-400" : "border-[#333]"}
        hover:border-yellow-400
      `}
    >
      {/* Left side */}
      <div className="text-left">
        <div className="font-semibold text-white">{exercise.name}</div>
        <div className="text-gray-400 text-sm">{exercise.muscle_group}</div>
      </div>

      {/* Right side checkmark */}
      <div
        className={`
          w-6 h-6 flex items-center justify-center rounded-full border
          transition-all
          ${isLinked ? "bg-yellow-400 border-yellow-400" : "border-gray-600"}
        `}
      >
        {isLinked && <Check size={16} className="text-black" />}
      </div>
    </button>
  );
}
