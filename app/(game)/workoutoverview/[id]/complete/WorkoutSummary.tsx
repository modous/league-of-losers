"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ExerciseStat {
  exerciseName: string;
  muscleGroup: string;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  maxWeight: number;
  estimatedCalories: number;
  intensityScore: number;
}

interface WorkoutSummaryProps {
  workoutId: string;
  workoutName: string;
  workoutDate: string;
  totalCalories: number;
  avgIntensity: number;
  totalExercises: number;
  totalSets: number;
  exerciseStats: ExerciseStat[];
}

export default function WorkoutSummary({
  workoutId,
  workoutName,
  workoutDate,
  totalCalories,
  avgIntensity,
  totalExercises,
  totalSets,
  exerciseStats,
}: WorkoutSummaryProps) {
  const router = useRouter();

  // Intensity Chart Data
  const intensityOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      toolbar: { show: false },
      background: "transparent",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 8,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#eab308"],
    xaxis: {
      categories: exerciseStats.map(s => s.exerciseName),
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
        },
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      title: {
        text: "Intensity Score",
        style: {
          color: "#94a3b8",
        },
      },
      labels: {
        style: {
          colors: "#94a3b8",
        },
      },
      max: 100,
    },
    grid: {
      borderColor: "#374151",
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `${val} / 100`,
      },
    },
  };

  const intensitySeries = [
    {
      name: "Intensity",
      data: exerciseStats.map(s => s.intensityScore),
    },
  ];

  // Calories Chart Data
  const caloriesOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      toolbar: { show: false },
      background: "transparent",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#22c55e"],
    xaxis: {
      labels: {
        style: {
          colors: "#94a3b8",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
        },
      },
    },
    grid: {
      borderColor: "#374151",
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `${val} kcal`,
      },
    },
  };

  const caloriesSeries = [
    {
      name: "Calories",
      data: exerciseStats.map(s => ({
        x: s.exerciseName,
        y: s.estimatedCalories,
      })),
    },
  ];

  const handleFinish = () => {
    router.push(`/workouts/date/${workoutDate}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold mb-2">Workout Voltooid!</h1>
          <p className="text-xl text-slate-400">{workoutName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{totalCalories}</div>
            <div className="text-sm text-slate-400 mt-1">Calorieën</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{avgIntensity}</div>
            <div className="text-sm text-slate-400 mt-1">Gem. Intensiteit</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{totalExercises}</div>
            <div className="text-sm text-slate-400 mt-1">Oefeningen</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{totalSets}</div>
            <div className="text-sm text-slate-400 mt-1">Totaal Sets</div>
          </div>
        </div>

        {/* Intensity Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Workout Intensiteit</h2>
          <Chart
            options={intensityOptions}
            series={intensitySeries}
            type="bar"
            height={300}
          />
        </div>

        {/* Calories Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Calorieën per Oefening</h2>
          <Chart
            options={caloriesOptions}
            series={caloriesSeries}
            type="bar"
            height={300}
          />
        </div>

        {/* Exercise Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Oefeningen Overzicht</h2>
          <div className="space-y-3">
            {exerciseStats.map((stat, index) => (
              <div
                key={index}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{stat.exerciseName}</h3>
                  <span className="text-sm text-slate-400">{stat.muscleGroup}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Sets:</span>{" "}
                    <span className="font-semibold">{stat.totalSets}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Reps:</span>{" "}
                    <span className="font-semibold">{stat.totalReps}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Max Gewicht:</span>{" "}
                    <span className="font-semibold">{stat.maxWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Calorieën:</span>{" "}
                    <span className="font-semibold">{stat.estimatedCalories} kcal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finish Button */}
        <button
          onClick={handleFinish}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg text-lg"
        >
          Terug naar Kalender
        </button>
      </div>
    </div>
  );
}
