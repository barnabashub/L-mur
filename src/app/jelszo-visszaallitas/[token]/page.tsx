import { resetPassword } from '@/lib/actions/auth';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Új jelszó megadása' };

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ hiba?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Új jelszó megadása</h1>
      <Flash hiba={sp.hiba} />
      <form action={resetPassword} className="card space-y-4 p-6">
        <input type="hidden" name="token" value={token} />
        <div>
          <label className="label" htmlFor="password">Új jelszó (legalább 8 karakter)</label>
          <input className="input" type="password" id="password" name="password" required minLength={8} autoComplete="new-password" />
        </div>
        <button className="btn-primary w-full">Jelszó mentése</button>
      </form>
    </div>
  );
}
