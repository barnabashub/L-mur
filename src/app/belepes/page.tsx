import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Belépés' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Belépés</h1>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />
      <form action={login} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">E-mail cím</label>
          <input className="input" type="email" id="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Jelszó</label>
          <input className="input" type="password" id="password" name="password" required autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full">Belépés</button>
        <p className="text-center text-sm text-stone-500">
          Még nincs fiókod?{' '}
          <Link href="/regisztracio" className="font-medium text-rose-600 hover:underline">
            Regisztrálj itt
          </Link>
        </p>
      </form>
    </div>
  );
}
