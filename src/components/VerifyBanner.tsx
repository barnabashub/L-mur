import { getCurrentUser } from '@/lib/auth';
import { resendVerification } from '@/lib/actions/auth';

/** Figyelmeztető sáv, amíg a felhasználó nem erősítette meg az e-mail címét. */
export async function VerifyBanner() {
  const user = await getCurrentUser();
  if (!user || user.emailVerifiedAt) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm text-amber-900">
        ✉️ Erősítsd meg az e-mail címedet — elküldtük a linket a(z) <strong>{user.email}</strong> címre.
        <form action={resendVerification}>
          <button className="font-semibold underline hover:text-amber-700">Újraküldés</button>
        </form>
      </div>
    </div>
  );
}
