/**
 * Tiszta (adatbázis-független) jogosultsági szabályok — egységtesztelve.
 */

type CoupleScoped = { userId: string; userCoupleId: string | null };

/**
 * Láthatja-e a néző egy teljesítés/emlék PRIVÁT részeit?
 * Igen, ha ő a tulajdonos, vagy ugyanannak a párnak a tagja.
 */
export function canViewPrivate(
  viewer: CoupleScoped | null,
  owner: CoupleScoped
): boolean {
  if (!viewer) return false;
  if (viewer.userId === owner.userId) return true;
  return viewer.userCoupleId !== null && viewer.userCoupleId === owner.userCoupleId;
}

export function isModerator(role: string): boolean {
  return role === 'MODERATOR' || role === 'ADMIN';
}

/** Láthatja-e a néző az ötletet az állapota alapján? */
export function canViewIdea(
  status: string,
  submitterId: string,
  viewer: { id: string; role: string } | null
): boolean {
  if (status === 'APPROVED') return true;
  if (!viewer) return false;
  return viewer.id === submitterId || isModerator(viewer.role);
}
