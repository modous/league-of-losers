"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createExerciseWithImage } from "@/lib/exercises/createExercise";
import Image from "next/image";
import { Camera, Upload, X } from "lucide-react";

function NewExerciseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get params from URL
  const preselectedMuscleGroup = searchParams.get("muscleGroup");
  const returnTo = searchParams.get("returnTo");

  const [muscleGroup, setMuscleGroup] = useState(preselectedMuscleGroup || "");

  useEffect(() => {
    if (preselectedMuscleGroup) {
      setMuscleGroup(preselectedMuscleGroup);
    }
  }, [preselectedMuscleGroup]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      const exercise = await createExerciseWithImage({
        name,
        category,
        muscle_group,
        description: description || undefined,
      }, imageFile || undefined);

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

        <div>
          <label className="mb-2 block font-medium">
            Foto
          </label>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-gray-600">Upload foto</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100">
                    <Camera size={24} className="text-gray-400" />
                    <span className="text-gray-600">Maak foto</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
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

export default function NewExercisePage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6 text-white">Laden...</div>}>
      <NewExerciseForm />
    </Suspense>
  );
}
