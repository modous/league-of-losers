"use client";

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="mb-6 flex items-center gap-2 text-slate-300 
                 hover:text-white transition px-3 py-2 rounded-lg 
                 bg-zinc-900 border border-zinc-700 hover:border-yellow-400"
    >
      ← Back
    </button>
  );
}
