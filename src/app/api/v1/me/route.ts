import { db } from '@/lib/db';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const partner = user.couple?.members.find((m) => m.id !== user.id) ?? null;
  const [completionCount, ideaCount, listCount] = await Promise.all([
    db.completion.count({ where: { userId: user.id } }),
    db.dateIdea.count({ where: { submitterId: user.id } }),
    db.bucketList.count({ where: { ownerId: user.id } }),
  ]);

  return apiOk({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: !!user.emailVerifiedAt,
    createdAt: user.createdAt,
    partner: partner ? { id: partner.id, name: partner.name } : null,
    inviteCode: user.couple && user.couple.members.length < 2 ? user.couple.inviteCode : null,
    stats: { completionCount, ideaCount, listCount },
  });
}
