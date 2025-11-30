export default function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <a href="/exercises" className="text-blue-600 hover:underline">
          ← Terug naar oefeningen
        </a>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Oefening #{params.id}</h1>
        <p className="text-gray-600">Categorie: Borst</p>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Details</h2>
        <div className="space-y-2">
          <p>
            <strong>Naam:</strong> Bankdrukken
          </p>
          <p>
            <strong>Beschrijving:</strong> Een oefening voor de borstspieren
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Logs</h2>
        <div className="space-y-4">
          {/* Exercise logs will go here */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">28 november 2025</span>
              <span className="text-sm text-gray-500">14:30</span>
            </div>
            <div className="space-y-1 text-sm">
              <p>Set 1: 60kg × 10 reps</p>
              <p>Set 2: 60kg × 8 reps</p>
              <p>Set 3: 60kg × 6 reps</p>
            </div>
          </div>

          <p className="text-gray-500">Geen logs gevonden</p>
        </div>
      </div>
    </div>
  );
}
