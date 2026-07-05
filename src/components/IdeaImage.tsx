import { CATEGORY_META } from '@/lib/constants';

/** Ötletkép — feltöltött kép, vagy kategóriaszínű helykitöltő. */
export function IdeaImage({
  imagePath,
  category,
  title,
  className = '',
}: {
  imagePath: string | null;
  category: string;
  title: string;
  className?: string;
}) {
  if (imagePath) {
    // Futásidőben feltöltött lokális fájlok miatt sima <img> (next/image nélkül).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imagePath} alt={title} className={`object-cover ${className}`} />;
  }
  const meta = CATEGORY_META[category] ?? { emoji: '💛', gradient: 'from-stone-300 to-stone-400' };
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br text-5xl ${meta.gradient} ${className}`}
      role="img"
      aria-label={title}
    >
      {meta.emoji}
    </div>
  );
}
