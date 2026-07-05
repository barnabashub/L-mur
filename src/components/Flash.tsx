/** Egyszeri üzenetsáv az URL ?hiba= / ?uzenet= paramétereiből. */
export function Flash({ hiba, uzenet }: { hiba?: string; uzenet?: string }) {
  if (!hiba && !uzenet) return null;
  return (
    <div className="mb-6 space-y-2">
      {hiba && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {hiba}
        </p>
      )}
      {uzenet && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {uzenet}
        </p>
      )}
    </div>
  );
}
