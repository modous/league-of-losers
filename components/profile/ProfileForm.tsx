'use client';

import { useState, useEffect } from 'react';
import { updateProfile } from '@/lib/profile/updateProfile';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  username?: string;
  fullName?: string;
  weight?: number;
  height?: number;
  age?: number;
  isSetup?: boolean;
}

export default function ProfileForm({ 
  username, 
  fullName,
  weight, 
  height, 
  age,
  isSetup = false 
}: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: username || '',
    fullName: fullName || '',
    weight: weight?.toString() || '',
    height: height?.toString() || '',
    age: age?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [attemptedNavigation, setAttemptedNavigation] = useState(false);

  // Prevent navigation away during setup if username not set
  useEffect(() => {
    if (!isSetup || username) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!formData.username.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (!formData.username.trim()) {
        e.preventDefault();
        setAttemptedNavigation(true);
        setMessage('Je moet eerst een gebruikersnaam instellen voordat je verder kunt!');
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Add initial history state
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSetup, username, formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Save username and full name to profiles table
      if (formData.username.trim()) {
        const profileRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username.trim(),
            full_name: formData.fullName.trim() || null,
          }),
        });

        if (!profileRes.ok) {
          const error = await profileRes.json();
          setMessage(error.error || 'Fout bij opslaan gebruikersnaam');
          setSaving(false);
          return;
        }
      }

      // Save weight, height, age to user_metadata
      await updateProfile({
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        age: formData.age ? Number(formData.age) : undefined,
      });

      setMessage('Profiel opgeslagen! ✓');
      
      // If this was initial setup, redirect to dashboard
      if (isSetup) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      setMessage('Fout bij opslaan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      {isSetup ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-2">Stel je profiel in</h2>
          {attemptedNavigation && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-900/30 border border-yellow-600 text-yellow-400 flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <span>Je kunt de app niet gebruiken zonder een gebruikersnaam in te stellen!</span>
            </div>
          )}
        </>
      ) : (
        <h2 className="text-2xl font-bold text-white mb-4">Profiel Gegevens</h2>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
            Gebruikersnaam {isSetup && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="jouwgebruikersnaam"
            required={isSetup}
            minLength={3}
            disabled={!!username && !isSetup}
          />
          {username && !isSetup && (
            <p className="text-xs text-zinc-500 mt-1">
              Gebruikersnaam kan niet worden gewijzigd
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
            Volledige naam (optioneel)
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Jan de Vries"
          />
        </div>

        <div className="border-t border-zinc-700 pt-4 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Persoonlijke Gegevens</h3>
          
          <div className="space-y-4">
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
          </div>
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

        {isSetup && !formData.username.trim() && (
          <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-400">
            💡 Een gebruikersnaam is verplicht om de app te gebruiken en vrienden te kunnen vinden.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || (isSetup && !formData.username.trim())}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Opslaan...' : isSetup ? 'Doorgaan naar Dashboard' : 'Opslaan'}
        </button>
      </form>
    </div>
  );
}
