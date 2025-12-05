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
      <div className="flex items-center justify-between mb-4 text-white">
        <button
          onClick={previousWeek}
          className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-md font-semibold px-3 py-2 sm:px-3 sm:py-2"
        >
          <span className="sm:hidden">←</span>
          <span className="hidden sm:inline">← Vorige</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="text-lg font-bold capitalize">
            {currentWeek[0].toLocaleDateString("nl-NL", {
              month: "long",
              year: "numeric",
            })}
          </div>

          {!isCurrentWeek() && (
            <button
              onClick={goToToday}
              className="text-black bg-yellow-400 hover:bg-yellow-500 px-2 py-1 rounded text-xs sm:text-sm font-semibold"
            >
              Vandaag
            </button>
          )}
        </div>

        <button
          onClick={nextWeek}
          className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-md font-semibold px-3 py-2 sm:px-3 sm:py-2"
        >
          <span className="sm:hidden">→</span>
          <span className="hidden sm:inline">Volgende →</span>
        </button>
      </div>

      {/* CALENDAR */}
      {loading ? (
        <div className="text-slate-400">Laden...</div>
      ) : (
        <div
          ref={scrollRef}
          className="
            flex sm:grid sm:grid-cols-7
            gap-4 overflow-x-auto pb-3
            scrollbar-hide snap-x snap-mandatory
          "
        >
          {currentWeek.map((date, i) => {
            const dateStr = format(date);
            const workout = weekData.find((w) => w.date === dateStr);

            return (
              <Link
                key={dateStr}
               href={`/workouts/date/${dateStr}`}
                className={`
                  snap-center flex-shrink-0 w-[100px] sm:w-auto text-center p-4 rounded-lg border-2 transition-all no-underline hover:no-underline
                  ${
                    isToday(date)
                      ? "border-yellow-300 bg-zinc-900"
                      : workout?.trained
                      ? "border-green-500 bg-zinc-900"
                      : "border-zinc-700 bg-zinc-900 hover:border-yellow-300"
                  }
                `}
              >
                <div className="text-slate-400 text-xs">{weekDays[i]}</div>

                <div className="text-xl font-bold text-white">
                  {date.getDate()}
                </div>

                {workout?.trained ? (
                  <div className="mt-2 space-y-1">
                    <div className="text-green-400 text-xs">
                      ✓ {workout.exercises_count} oefeningen
                    </div>
                    {workout.calories !== undefined && workout.calories > 0 && (
                      <div className="text-yellow-400 text-xs">
                        🔥 {workout.calories} kcal
                      </div>
                    )}
                    {workout.intensity !== undefined && workout.intensity > 0 && (
                      <div className="text-blue-400 text-xs">
                        💪 {workout.intensity}% intensiteit
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs mt-2">
                    Geen training
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
