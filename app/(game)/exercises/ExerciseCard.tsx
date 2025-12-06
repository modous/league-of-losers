"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Exercise = {
  id: string | number;
  name: string;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
  user_id: string;
};

type ExerciseCardProps = {
  exercise: Exercise;
  currentUserId: string;
};

export function ExerciseCard({ exercise, currentUserId }: ExerciseCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const router = useRouter();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isOwner = exercise.user_id === currentUserId;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Weet je zeker dat je "${exercise.name}" wilt verbergen?`)) {
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // If user owns the exercise, delete it completely
    if (isOwner) {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exercise.id);

      if (error) {
        alert("Fout bij verwijderen: " + error.message);
        return;
      }
    } else {
      // If it's a template exercise, hide it for this user
      const { error } = await supabase
        .from("hidden_exercises")
        .insert({
          user_id: currentUserId,
          exercise_id: exercise.id,
        });

      if (error) {
        alert("Fout bij verbergen: " + error.message);
        return;
      }
    }

    router.refresh();
  }

  // Long press handlers for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      setShowDelete(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setLongPressActive(false);
  };

  const handleMouseEnter = () => {
    setShowDelete(true);
  };

  const handleMouseLeave = () => {
    if (!longPressActive) {
      setShowDelete(false);
    }
  };

  return (
    <div
      className="relative h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Link
        href={`/exercises/${exercise.id}`}
        className="flex flex-col h-full bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden hover:bg-neutral-800 transition"
      >
        {exercise.image_url ? (
          <div className="relative w-full h-48 flex-shrink-0">
            <Image
              src={exercise.image_url}
              alt={exercise.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 flex-shrink-0 bg-neutral-800" />
        )}

        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-xl font-semibold line-clamp-1">{exercise.name}</h2>

          {exercise.category && (
            <p className="text-sm text-neutral-400 line-clamp-1">{exercise.category}</p>
          )}

          {exercise.description && (
            <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
              {exercise.description}
            </p>
          )}
        </div>
      </Link>

      {/* Delete Button - Show on hover (desktop) or long press (mobile) */}
      {showDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all shadow-lg z-10"
          aria-label="Verwijder oefening"
          title={isOwner ? "Verwijderen" : "Verbergen"}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
