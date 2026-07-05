/** Egyszeri üzenetsáv az URL ?hiba= / ?uzenet= paramétereiből. */
export function Flash({ hiba, uzenet }: { hiba?: string; uzenet?: string }) {
  if (!hiba && !uzenet) return null;
  return (
    <div className="mb-6 space-y-2">
      {hiba && <p className="flash-err">{hiba}</p>}
      {uzenet && <p className="flash-ok">{uzenet}</p>}
    </div>
  );
}
