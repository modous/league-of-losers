"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MedalData {
  userEntry: {
    rank: number;
    medal: "gold" | "silver" | "bronze" | null;
    score: number;
    total_intensity: number;
    total_calories: number;
  } | null;
  top3: Array<{
    rank: number;
    medal: string;
    score: number;
    profiles: {
      username: string;
    };
  }>;
  date: string;
}

export default function DailyMedalCard() {
  const [medalData, setMedalData] = useState<MedalData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedal() {
      const res = await fetch("/api/leaderboard/medal");
      if (res.ok) {
        const data = await res.json();
        setMedalData(data);
      }
      setLoading(false);
    }
    
    fetchMedal();
  }, []);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-32 mb-4"></div>
        <div className="h-16 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (!medalData?.userEntry) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-3 text-yellow-400">
          🏆 Daily Ranking
        </h3>
        <p className="text-zinc-400 text-sm mb-4">
          Complete a workout today to earn your ranking!
        </p>
        <Link
          href="/leaderboard"
          className="text-yellow-400 hover:text-yellow-500 text-sm font-semibold underline"
        >
          View Leaderboard →
        </Link>
      </div>
    );
  }

  const getMedalEmoji = (medal: string | null) => {
    if (!medalData?.userEntry) return "";
    
    switch (medal) {
      case "gold":
        return "🥇";
      case "silver":
        return "🥈";
      case "bronze":
        return "🥉";
      default:
        return `#${medalData.userEntry.rank}`;
    }
  };

  const getMedalColor = (medal: string | null) => {
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
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
      <h3 className="text-lg font-bold mb-4 text-yellow-400">
        🏆 Today&apos;s Ranking
      </h3>

      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`bg-gradient-to-br ${getMedalColor(
            medalData.userEntry.medal
          )} p-1 rounded-2xl cursor-pointer transform transition-transform hover:scale-105`}
        >
          <div className="bg-zinc-900 rounded-xl p-6 text-center min-w-[200px]">
            <div className="text-6xl mb-2">
              {getMedalEmoji(medalData.userEntry.medal)}
            </div>
            <div className="text-2xl font-black text-white mb-1">
              Rank {medalData.userEntry.rank}
            </div>
            <div className="text-sm text-zinc-400">
              Score: {medalData.userEntry.score}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && medalData.top3.length > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
            <div className="bg-black border border-yellow-400 rounded-lg p-4 shadow-xl min-w-[250px]">
              <div className="text-xs font-bold text-yellow-400 mb-3 text-center">
                TODAY&apos;S TOP 3
              </div>
              <div className="space-y-2">
                {medalData.top3.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {entry.rank === 1
                          ? "🥇"
                          : entry.rank === 2
                          ? "🥈"
                          : "🥉"}
                      </span>
                      <span className="font-semibold text-white">
                        {entry.profiles.username}
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
                <Link
                  href="/leaderboard"
                  className="text-yellow-400 hover:text-yellow-500 text-xs font-semibold"
                >
                  View Full Leaderboard →
                </Link>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]">
              <div className="border-8 border-transparent border-t-yellow-400"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 text-xs">Intensity</div>
          <div className="font-bold text-blue-400">
            {Math.round(medalData.userEntry.total_intensity)}
          </div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 text-xs">Calories</div>
          <div className="font-bold text-orange-400">
            {Math.round(medalData.userEntry.total_calories)}
          </div>
        </div>
      </div>

      <Link
        href="/leaderboard"
        className="block mt-4 text-center text-yellow-400 hover:text-yellow-500 text-sm font-semibold"
      >
        View Full Leaderboard →
      </Link>
    </div>
  );
}
