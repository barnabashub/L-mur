import Link from 'next/link';
import { register } from '@/lib/actions/auth';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Regisztráció' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">Regisztráció</h1>
      <p className="mb-6 text-sm text-stone-600">
        A regisztráció után a <Link href="/par" className="text-rose-600 hover:underline">Párom</Link>{' '}
        oldalon tudjátok összekapcsolni a fiókjaitokat — de az app egyedül is teljes értékű.
      </p>
      <Flash hiba={sp.hiba} />
      <form action={register} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">Név</label>
          <input className="input" id="name" name="name" required minLength={2} maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail cím</label>
          <input className="input" type="email" id="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Jelszó (legalább 8 karakter)</label>
          <input className="input" type="password" id="password" name="password" required minLength={8} autoComplete="new-password" />
        </div>
        <button className="btn-primary w-full">Fiók létrehozása</button>
        <p className="text-center text-sm text-stone-500">
          Van már fiókod?{' '}
          <Link href="/belepes" className="font-medium text-rose-600 hover:underline">Lépj be</Link>
        </p>
      </form>
    </div>
  );
}
