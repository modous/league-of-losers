'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/profile/updateProfile';

interface ProfileFormProps {
  weight?: number;
  height?: number;
  age?: number;
}

export default function ProfileForm({ weight, height, age }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    weight: weight?.toString() || '',
    height: height?.toString() || '',
    age: age?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await updateProfile({
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        age: formData.age ? Number(formData.age) : undefined,
      });
      setMessage('Profiel opgeslagen! ✓');
    } catch (error) {
      setMessage('Fout bij opslaan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Persoonlijke Gegevens</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-2">
            Gewicht (kg)
          </label>
          <input
            type="number"
            id="weight"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="75.5"
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-2">
            Lengte (cm)
          </label>
          <input
            type="number"
            id="height"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="180"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-2">
            Leeftijd (jaar)
          </label>
          <input
            type="number"
            id="age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="25"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('✓') 
              ? 'bg-green-900/30 border border-green-700 text-green-400' 
              : 'bg-red-900/30 border border-red-700 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </div>
  );
}
