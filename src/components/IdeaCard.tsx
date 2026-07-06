import Link from 'next/link';
import { ACCESSIBILITY_BY_KEY } from '@/lib/constants';
import { parseTags } from '@/lib/discover';
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
  accessibility?: string | null;
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
          <span className="badge-brand">{idea.category}</span>
          {idea.partner && <span className="badge-amber">🎟️ kedvezmény</span>}
          {idea.isSeasonal && idea.seasonLabel && (
            <span className="badge-sky">📅 {idea.seasonLabel}</span>
          )}
          {parseTags(idea.accessibility).map((key) => {
            const opt = ACCESSIBILITY_BY_KEY[key];
            return opt ? (
              <span key={key} className="badge-lime" title={opt.label} aria-label={opt.label}>
                {opt.emoji}
              </span>
            ) : null;
          })}
        </div>
        <h3 className="font-semibold text-ink group-hover:text-brand">{idea.title}</h3>
        <p className="text-xs text-mute">
          {idea.isLocationIndependent ? '🌍 Bárhol megvalósítható' : `📍 ${idea.locationName}`}
        </p>
        <div className="flex items-center justify-between">
          <Stars value={idea.avg} count={idea.reviews.length} />
          <span className="text-xs text-mute">✔ {idea.completionCount} pár pipálta</span>
        </div>
      </div>
    </Link>
  );
}
