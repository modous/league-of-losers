"use client";

import { Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";

type Exercise = {
  id: string | number;
  name: string;
  muscle_group: string;
  image_url?: string | null;
};

type ExerciseToggleProps = {
  exercise: Exercise;
  workoutId: string | number;
  isLinked: boolean;
  linkId: string | number;
  isOwner: boolean;
};

export function ExerciseToggle({ exercise, workoutId, isLinked, linkId, isOwner }: ExerciseToggleProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    
    if (!confirm(`Remove ${exercise.name} from this workout?`)) {
      return;
    }

    await fetch(`/api/workout_exercises/${linkId}`, {
      method: "DELETE",
    });

    window.location.reload();
  }

  // Long press handlers for mobile
  const handleTouchStart = () => {
    if (!isLinked || !isOwner) return;
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      setShowDelete(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setLongPressActive(false);
  };

  const handleMouseEnter = () => {
    if (isLinked && isOwner) {
      setShowDelete(true);
    }
  };

  const handleMouseLeave = () => {
    if (!longPressActive) {
      setShowDelete(false);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={toggle}
        className={`
          w-full flex flex-col
          rounded-lg border transition-all overflow-hidden text-left
          ${isLinked 
            ? "bg-neutral-900 border-neutral-700 hover:bg-neutral-800" 
            : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
          }
        `}
      >
        {/* Exercise Image */}
        {exercise.image_url && (
          <div className="relative w-full aspect-video">
            <Image
              src={exercise.image_url}
              alt={exercise.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Exercise Info */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-white">{exercise.name}</div>
            <div className="text-neutral-400 text-sm">{exercise.muscle_group}</div>
          </div>

          {/* Checkmark */}
          <div
            className={`
              w-6 h-6 flex items-center justify-center rounded-full border
              transition-all flex-shrink-0
              ${isLinked 
                ? "bg-purple-600 border-purple-600" 
                : "border-neutral-600"
              }
            `}
          >
            {isLinked && <Check size={16} className="text-white" />}
          </div>
        </div>
      </button>

      {/* Remove Button - Show on hover (desktop) or long press (mobile) */}
      {isLinked && isOwner && showDelete && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all shadow-lg z-10"
          aria-label="Remove exercise"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
