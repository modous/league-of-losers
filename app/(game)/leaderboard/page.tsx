"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  date: string;
  total_intensity: number;
  total_calories: number;
  total_exercises: number;
  workout_count: number;
  score: number;
  rank: number;
  medal: "gold" | "silver" | "bronze" | null;
  profiles: {
    username: string;
    full_name: string;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  async function loadLeaderboard() {
    setLoading(true);
    const res = await fetch(`/api/leaderboard/daily?date=${selectedDate}`);
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data);
    }
    setLoading(false);
  }

  async function recalculateLeaderboard() {
    setCalculating(true);
    const res = await fetch("/api/leaderboard/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate }),
    });

    if (res.ok) {
      await loadLeaderboard();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to calculate leaderboard");
    }
    setCalculating(false);
  }

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const res = await fetch(`/api/leaderboard/daily?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, [selectedDate]);

  function getMedalEmoji(medal: string | null) {
    switch (medal) {
      case "gold":
        return "🥇";
      case "silver":
        return "🥈";
      case "bronze":
        return "🥉";
      default:
        return "";
    }
  }

  function getMedalColor(medal: string | null) {
    switch (medal) {
      case "gold":
        return "from-yellow-400 to-yellow-600";
      case "silver":
        return "from-gray-300 to-gray-500";
      case "bronze":
        return "from-orange-400 to-orange-600";
      default:
        return "from-zinc-700 to-zinc-800";
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={recalculateLeaderboard}
              disabled={calculating}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {calculating ? "..." : "Recalculate"}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-zinc-400">
            <strong className="text-yellow-400">Score Formula:</strong> Based on
            average intensity, total calories, exercises completed, and workout
            count. Top 3 performers earn medals! 🥇🥈🥉
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400 text-lg mb-4">
              No data for this date yet.
            </p>
            <button
              onClick={recalculateLeaderboard}
              disabled={calculating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg transition-all"
            >
              Calculate Leaderboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`bg-gradient-to-r ${getMedalColor(
                  entry.medal
                )} p-[2px] rounded-xl`}
              >
                <div className="bg-zinc-900 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      {entry.medal ? (
                        <span className="text-4xl sm:text-5xl">
                          {getMedalEmoji(entry.medal)}
                        </span>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-zinc-600">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg sm:text-xl text-white truncate">
                        {entry.profiles.username}
                      </div>
                      {entry.profiles.full_name && (
                        <div className="text-sm text-zinc-400 truncate">
                          {entry.profiles.full_name}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:grid sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xs text-zinc-400">Score</div>
                        <div className="font-bold text-yellow-400">
                          {entry.score}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Intensity</div>
                        <div className="font-bold text-blue-400">
                          {Math.round(entry.total_intensity)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Calories</div>
                        <div className="font-bold text-orange-400">
                          {Math.round(entry.total_calories)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Exercises</div>
                        <div className="font-bold text-green-400">
                          {entry.total_exercises}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="sm:hidden flex flex-col items-end gap-1">
                      <div className="text-lg font-bold text-yellow-400">
                        {entry.score}
                      </div>
                      <div className="text-xs text-zinc-400">points</div>
                    </div>
                  </div>

                  {/* Mobile Stats Grid */}
                  <div className="sm:hidden grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800">
                    <div className="text-center">
                      <div className="text-xs text-zinc-400">Intensity</div>
                      <div className="font-bold text-blue-400">
                        {Math.round(entry.total_intensity)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-400">Calories</div>
                      <div className="font-bold text-orange-400">
                        {Math.round(entry.total_calories)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-400">Exercises</div>
                      <div className="font-bold text-green-400">
                        {entry.total_exercises}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
