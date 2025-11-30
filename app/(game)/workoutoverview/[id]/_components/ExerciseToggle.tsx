"use client";

export function ExerciseToggle({ exercise, workoutId, isLinked, linkId }) {
  async function toggle() {
    console.log("🟢 TOGGLE CLICK", {
      exerciseId: exercise.id,
      workoutId,
      isLinked,
      linkId,
    });

    if (isLinked) {
      // REMOVE using workout_exercises.id
      const res = await fetch(`/api/workout_exercises/${linkId}`, {
        method: "DELETE",
      });

      console.log("🟢 DELETE RESPONSE STATUS:", res.status);
    } else {
      // ADD using exercise.id
      const res = await fetch(`/api/workout_exercises`, {
        method: "POST",
        body: JSON.stringify({ workoutId, exerciseId: exercise.id }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("🟢 ADD RESPONSE STATUS:", res.status);
    }

    window.location.reload();
  }

  return (
    <button
      onClick={toggle}
      className={`p-4 w-full rounded flex justify-between ${
        isLinked ? "bg-green-600" : "bg-[#222]"
      }`}
    >
      <span>
        <div className="font-semibold">{exercise.name}</div>
        <div className="text-gray-400 text-sm">{exercise.muscle_group}</div>
      </span>

      <span className="text-sm opacity-70">
        {isLinked ? "Remove" : "Add"}
      </span>
    </button>
  );
}
