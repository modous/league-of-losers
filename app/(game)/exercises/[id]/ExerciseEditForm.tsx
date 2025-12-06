"use client";

import { useState, useRef } from "react";
import { updateExercise } from "@/lib/exercises/updateExercise";
import { Pencil, X, Check, Camera, Upload } from "lucide-react";
import Image from "next/image";

interface ExerciseEditFormProps {
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
    category: string | null;
    description: string | null;
    image_url: string | null;
    user_id: string | null;
  };
  currentUserId: string;
}

export default function ExerciseEditForm({ exercise, currentUserId }: ExerciseEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category || "");
  const [muscleGroup, setMuscleGroup] = useState(exercise.muscle_group);
  const [description, setDescription] = useState(exercise.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(exercise.image_url);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only show edit button if user owns the exercise
  const canEdit = exercise.user_id === currentUserId;

  if (!canEdit) {
    return null;
  }

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateExercise({
        id: exercise.id,
        name,
        category: category || undefined,
        muscle_group: muscleGroup,
        description: description || undefined,
      }, imageFile || undefined);
      setIsEditing(false);
      window.location.reload(); // Reload to show updated image
    } catch (error) {
      console.error("Failed to update exercise:", error);
      alert("Er ging iets mis bij het opslaan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(exercise.name);
    setCategory(exercise.category || "");
    setMuscleGroup(exercise.muscle_group);
    setDescription(exercise.description || "");
    setImagePreview(exercise.image_url);
    setImageFile(null);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg hover:bg-yellow-400/20 transition-colors"
      >
        <Pencil size={16} />
        Bewerk oefening
      </button>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Bewerk oefening</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Naam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Spiergroep *
          </label>
          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            required
          >
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
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Categorie
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="bijv. Compound, Isolatie..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Beschrijving
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Beschrijf de oefening..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Foto
          </label>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-zinc-700">
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
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800 px-6 py-8 hover:bg-zinc-700">
                    <Upload size={24} className="text-slate-400" />
                    <span className="text-slate-300">Upload foto</span>
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
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800 px-6 py-8 hover:bg-zinc-700">
                    <Camera size={24} className="text-slate-400" />
                    <span className="text-slate-300">Maak foto</span>
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

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !name || !muscleGroup}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={16} />
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            <X size={16} />
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
