"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getWeekWorkouts } from "@/lib/workouts";

interface WeekWorkout {
  date: string;
  trained: boolean;
  exercises_count: number;
  muscle_groups?: string[];
  calories?: number;
  intensity?: number;
}

export default function WeekCalendar() {
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(new Date()));
  const [weekData, setWeekData] = useState<WeekWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  // 👉 MISTE DEZE
  const scrollRef = useRef<HTMLDivElement>(null);

  function getWeekDates(date: Date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const arr = [];
    for (let i = 0; i < 7; i++) {
      arr.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return arr;
  }

  function format(date: Date) {
    return date.toISOString().split("T")[0];
  }

  function isToday(date: Date) {
    return date.toDateString() === new Date().toDateString();
  }

  function isCurrentWeek() {
    return currentWeek.some(
      (d) => d.toDateString() === new Date().toDateString()
    );
  }

  // ---------------------------
  // LOAD WEEK DATA
  // ---------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);
      const start = format(currentWeek[0]);
      const end = format(currentWeek[6]);

      const data = await getWeekWorkouts(start, end);
      setWeekData(data);
      setLoading(false);
    }

    load();
  }, [currentWeek]);

  // ---------------------------
  // AUTO-SCROLL TO TODAY (mobile only)
  // ---------------------------
  useEffect(() => {
    if (!scrollRef.current) return;
    if (window.innerWidth >= 640) return; // only mobile

    const todayIndex = currentWeek.findIndex((d) =>
      isToday(d)
    );

    if (todayIndex === -1) return;

    const cardWidth = 100;
    const gap = 16;

    const target =
      todayIndex * (cardWidth + gap) -
      window.innerWidth / 2 +
      cardWidth / 2;

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        left: Math.max(0, target),
        behavior: "smooth",
      });
    }, 150);
  }, [currentWeek, weekData]); // 👈 weekData ipv workouts

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  function nextWeek() {
    const d = new Date(currentWeek[0]);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(getWeekDates(d));
  }

  function previousWeek() {
    const d = new Date(currentWeek[0]);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(getWeekDates(d));
  }

  function goToToday() {
    setCurrentWeek(getWeekDates(new Date()));
  }

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 text-white">
        <button
          onClick={previousWeek}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-lg font-bold px-4 py-2 sm:px-5 sm:py-2.5 shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
        >
          <span className="sm:hidden">←</span>
          <span className="hidden sm:inline">← Vorige</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-xl font-bold capitalize bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {currentWeek[0].toLocaleDateString("nl-NL", {
              month: "long",
              year: "numeric",
            })}
          </div>

          {!isCurrentWeek() && (
            <button
              onClick={goToToday}
              className="text-black bg-yellow-400 hover:bg-yellow-500 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-md hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
            >
              Vandaag
            </button>
          )}
        </div>

        <button
          onClick={nextWeek}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-lg font-bold px-4 py-2 sm:px-5 sm:py-2.5 shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
        >
          <span className="sm:hidden">→</span>
          <span className="hidden sm:inline">Volgende →</span>
        </button>
      </div>

      {/* CALENDAR */}
      {loading ? (
        <div className="text-slate-400 text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="
            flex sm:grid sm:grid-cols-7
            gap-3 overflow-x-auto sm:overflow-visible py-4 pb-6 px-1
            scrollbar-hide snap-x snap-mandatory
          "
        >
          {currentWeek.map((date, i) => {
            const dateStr = format(date);
            const workout = weekData.find((w) => w.date === dateStr);
            const today = isToday(date);

            return (
              <Link
                key={dateStr}
                href={`/workouts/date/${dateStr}`}
                className={`
                  snap-center flex-shrink-0 w-[110px] sm:w-auto text-center p-5 rounded-xl border-2 transition-all duration-300 no-underline hover:no-underline transform hover:scale-105 hover:shadow-xl backdrop-blur-sm
                  ${
                    today
                      ? "border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg shadow-yellow-400/30"
                      : workout?.trained
                      ? "border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:border-green-400 hover:shadow-green-400/30"
                      : "border-zinc-700/50 bg-zinc-900/50 hover:border-yellow-400/50 hover:bg-zinc-800/50"
                  }
                `}
              >
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${today ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {weekDays[i]}
                </div>

                <div className={`text-2xl font-black mb-3 ${today ? 'text-yellow-400' : 'text-white'}`}>
                  {date.getDate()}
                </div>

                {workout?.trained ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-green-400 text-xs font-semibold bg-green-500/10 rounded-full py-1 px-2">
                      <span>✓</span>
                      <span>{workout.exercises_count}</span>
                    </div>
                    {workout.calories !== undefined && workout.calories > 0 && (
                      <div className="text-orange-400 text-xs font-medium">
                        🔥 {workout.calories}
                      </div>
                    )}
                    {workout.intensity !== undefined && workout.intensity > 0 && (
                      <div className="text-blue-400 text-xs font-medium">
                        💪 {workout.intensity}%
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs font-medium">
                    Rust dag
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
