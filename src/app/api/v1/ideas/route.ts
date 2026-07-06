import { z } from 'zod';
import { db } from '@/lib/db';
import { fetchApprovedIdeas, type IdeaFilter } from '@/lib/ideas';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';
import { isModerator } from '@/lib/permissions';
import { ACCESSIBILITY_OPTIONS, CATEGORIES } from '@/lib/constants';
import { parseTags } from '@/lib/discover';

/** GET /api/v1/ideas?q=&kategoria=&hely=&rendezes= — jóváhagyott ötletek. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hely = url.searchParams.get('hely');
  const rendezes = url.searchParams.get('rendezes');
  const filter: IdeaFilter = {
    q: url.searchParams.get('q') ?? undefined,
    akadalymentes: url.searchParams.get('akadalymentes') ?? undefined,
    category: url.searchParams.get('kategoria') ?? undefined,
    hely: hely === 'helyfuggetlen' || hely === 'helyhez-kotott' ? hely : undefined,
    rendezes: rendezes === 'ertekeles' || rendezes === 'nepszeru' ? rendezes : 'legujabb',
  };
  const ideas = await fetchApprovedIdeas(filter);
  return apiOk(
    ideas.map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      imagePath: i.imagePath,
      locationName: i.locationName,
      isLocationIndependent: i.isLocationIndependent,
      isSeasonal: i.isSeasonal,
      seasonLabel: i.seasonLabel,
      avg: i.avg,
      reviewCount: i.reviews.length,
      completionCount: i.completionCount,
      hasDiscount: !!i.partner,
      accessibility: parseTags(i.accessibility),
    }))
  );
}

const submitSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  category: z.enum(CATEGORIES),
  locationName: z.string().max(160).optional(),
  isLocationIndependent: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  seasonLabel: z.string().max(120).optional(),
  accessibility: z.array(z.enum(ACCESSIBILITY_OPTIONS.map((o) => o.key) as [string, ...string[]])).optional(),
});

/** POST /api/v1/ideas — ötletjavaslat beküldése (moderációra kerül). */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const parsed = submitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'Érvénytelen adatok: ' + parsed.error.issues[0].message);
  const data = parsed.data;
  if (!data.isLocationIndependent && !data.locationName) {
    return apiError(400, 'Add meg a helyszínt, vagy jelöld helyfüggetlennek.');
  }

  const autoApprove = isModerator(user.role);
  const idea = await db.dateIdea.create({
    data: {
      ...data,
      locationName: data.isLocationIndependent ? null : data.locationName,
      seasonLabel: data.isSeasonal ? data.seasonLabel : null,
      accessibility: data.accessibility?.length ? data.accessibility.join(',') : null,
      submitterId: user.id,
      status: autoApprove ? 'APPROVED' : 'PENDING',
    },
  });

  if (!autoApprove) {
    const mods = await db.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN'] } },
      select: { id: true },
    });
    await db.notification.createMany({
      data: mods.map((m) => ({
        userId: m.id,
        type: 'MODERATION',
        message: `Új ötletjavaslat érkezett: „${idea.title}"`,
        link: '/moderacio',
      })),
    });
  }

  return apiOk({ id: idea.id, status: idea.status }, 201);
}
