"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    muscle_groups: string[];
    user_id: string | null;
  };
  currentUserId?: string;
}

export default function WorkoutCard({ workout, currentUserId }: WorkoutCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const router = useRouter();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const isOwner = workout.user_id === currentUserId;
  const canDelete = isOwner && workout.user_id !== null; // Can't delete global workouts

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Weet je zeker dat je "${workout.name}" wilt verwijderen?`)) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Delete workout (cascade will handle workout_exercises)
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workout.id);

      if (error) {
        console.error("Error deleting workout:", error);
        alert("Fout bij verwijderen. Probeer opnieuw.");
        setDeleting(false);
        return;
      }

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      alert("Er ging iets mis.");
      setDeleting(false);
    }
  }

  // Long press handlers for mobile
  const handleTouchStart = () => {
    if (!canDelete) return;
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
    if (canDelete) {
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
      <Link
        href={`/workoutoverview/${workout.id}`}
        className="block bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {workout.name}{" "}
              {workout.user_id === null && (
                <span className="text-xs text-yellow-400">(Global)</span>
              )}
            </h2>

            {workout.muscle_groups?.length > 0 && (
              <p className="text-slate-300 text-sm mt-2">
                Spiergroepen: {workout.muscle_groups.join(", ")}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Delete Button - Show on hover (desktop) or long press (mobile) */}
      {canDelete && showDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-full p-2 transition-all shadow-lg z-10"
          aria-label="Verwijder workout"
        >
          {deleting ? "..." : <X size={16} />}
        </button>
      )}
    </div>
  );
}
