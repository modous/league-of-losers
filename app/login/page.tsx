"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      setError("Vul alle velden in");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) throw error;
        
        // Show email confirmation message
        setShowEmailConfirm(true);
        setLoading(false);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        window.location.href = '/dashboard';
        return;
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Email not confirmed')) {
        setError('Je moet je email nog bevestigen. Check je inbox.');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('Verkeerde email of wachtwoord');
      } else {
        setError(errorMessage || "Er ging iets mis");
      }
    } finally {
      setLoading(false);
    }
  }

  if (showEmailConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Bevestig je email</h1>
          <p className="text-slate-300 mb-6">
            We hebben een bevestigingsmail gestuurd naar <span className="font-semibold text-white">{email}</span>
          </p>
          <p className="text-slate-400 text-sm mb-6">
            Klik op de link in de email om je account te activeren. Daarna kun je inloggen.
          </p>
          <button
            onClick={() => {
              setShowEmailConfirm(false);
              setIsSignUp(false);
              setPassword("");
            }}
            className="w-full btn-primary"
          >
            Terug naar login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">League of Losers</h1>
          <p className="text-slate-300">
            {isSignUp ? "Maak een account" : "Login om te beginnen met trainen"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg ${
              error.includes('aangemaakt')
                ? 'bg-green-900/30 border border-green-700 text-green-400' 
                : 'bg-red-900/30 border border-red-700 text-red-400'
            }`}>
              {error}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Bezig..." : isSignUp ? "Account Aanmaken" : "Inloggen"}
          </button>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="w-full text-slate-400 hover:text-white transition-colors text-sm"
          >
            {isSignUp ? "Heb je al een account? Inloggen" : "Nog geen account? Aanmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}
