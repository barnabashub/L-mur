import Link from 'next/link';
import { requestPasswordReset } from '@/lib/actions/auth';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Elfelejtett jelszó' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">Elfelejtett jelszó</h1>
      <p className="mb-6 text-sm text-stone-600">
        Add meg az e-mail címedet, és küldünk egy visszaállító linket (1 óráig érvényes).
      </p>
      <Flash hiba={sp.hiba} />
      <form action={requestPasswordReset} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">E-mail cím</label>
          <input className="input" type="email" id="email" name="email" required autoComplete="email" />
        </div>
        <button className="btn-primary w-full">Visszaállító link küldése</button>
        <p className="text-center text-sm text-stone-500">
          <Link href="/belepes" className="font-medium text-rose-600 hover:underline">← Vissza a belépéshez</Link>
        </p>
      </form>
    </div>
  );
}
