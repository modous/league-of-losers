"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createExercise } from "@/lib/exercises/createExercise";

export default function NewExercisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get params from URL
  const preselectedMuscleGroup = searchParams.get("muscleGroup");
  const returnTo = searchParams.get("returnTo");

  const [muscleGroup, setMuscleGroup] = useState(preselectedMuscleGroup || "");

  useEffect(() => {
    if (preselectedMuscleGroup) {
      setMuscleGroup(preselectedMuscleGroup);
    }
  }, [preselectedMuscleGroup]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const muscle_group = formData.get("muscle_group") as string;
    const description = formData.get("description") as string;

    if (!name || !category || !muscle_group) {
      setError("Naam, categorie en spiergroep zijn verplicht");
      setLoading(false);
      return;
    }

    try {
      const exercise = await createExercise({
        name,
        category,
        muscle_group,
        description: description || undefined,
      });

      // If there's a return URL, go back there; otherwise go to exercise detail
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push(`/exercises/${exercise.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
      setLoading(false);
    }
  }

  function handleCancel() {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push("/exercises");
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Nieuwe Oefening</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block font-medium">
            Naam *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Bijv. Bankdrukken"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-2 block font-medium">
            Categorie *
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Selecteer categorie</option>
            <option value="Compound">Compound</option>
            <option value="Isolation">Isolation</option>
            <option value="Cardio">Cardio</option>
            <option value="Stretching">Stretching</option>
          </select>
        </div>

        <div>
          <label htmlFor="muscle_group" className="mb-2 block font-medium">
            Spiergroep *
          </label>
          <select
            id="muscle_group"
            name="muscle_group"
            required
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Selecteer spiergroep</option>
            <option value="Borst">Borst</option>
            <option value="Rug">Rug</option>
            <option value="Benen">Benen</option>
            <option value="Schouders">Schouders</option>
            <option value="Biceps">Biceps</option>
            <option value="Triceps">Triceps</option>
            <option value="Core">Core</option>
            <option value="Full Body">Full Body</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block font-medium">
            Beschrijving
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Beschrijf de oefening..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Opslaan"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-100"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
