import WorkoutsByDateClient from "./WorkoutsByDateClient";

export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params; // <-- FIX
  return <WorkoutsByDateClient date={date} />;
}
