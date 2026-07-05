import Link from 'next/link';
import { IdeaImage } from './IdeaImage';
import { Stars } from './Stars';

type IdeaCardData = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string;
  locationName: string | null;
  isLocationIndependent: boolean;
  isSeasonal: boolean;
  seasonLabel: string | null;
  avg: number | null;
  completionCount: number;
  reviews: { stars: number }[];
  partner: { id: string; name: string } | null;
};

export function IdeaCard({ idea }: { idea: IdeaCardData }) {
  return (
    <Link href={`/otletek/${idea.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <IdeaImage
        imagePath={idea.imagePath}
        category={idea.category}
        title={idea.title}
        className="h-40 w-full"
      />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-rose-50 text-rose-700">{idea.category}</span>
          {idea.partner && <span className="badge bg-amber-50 text-amber-700">🎟️ kedvezmény</span>}
          {idea.isSeasonal && idea.seasonLabel && (
            <span className="badge bg-sky-50 text-sky-700">📅 {idea.seasonLabel}</span>
          )}
        </div>
        <h3 className="font-semibold text-stone-900 group-hover:text-rose-700">{idea.title}</h3>
        <p className="text-xs text-stone-500">
          {idea.isLocationIndependent ? '🌍 Bárhol megvalósítható' : `📍 ${idea.locationName}`}
        </p>
        <div className="flex items-center justify-between">
          <Stars value={idea.avg} count={idea.reviews.length} />
          <span className="text-xs text-stone-500">✔ {idea.completionCount} pár pipálta</span>
        </div>
      </div>
    </Link>
  );
}
