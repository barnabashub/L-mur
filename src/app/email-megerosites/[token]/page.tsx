import Link from 'next/link';
import { db } from '@/lib/db';
import { consumeToken } from '@/lib/tokens';

export const metadata = { title: 'E-mail megerősítés' };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await consumeToken(token, 'EMAIL_VERIFY');

  if (row && !row.user.emailVerifiedAt) {
    await db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  }
  const alreadyVerified = !!row?.user.emailVerifiedAt;

  return (
    <div className="mx-auto max-w-md text-center">
      {row ? (
        <div className="card p-10">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-bold">
            {alreadyVerified ? 'Ez a cím már meg volt erősítve' : 'E-mail cím megerősítve!'}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Köszönjük, {row.user.name} — minden készen áll a közös kalandokhoz.
          </p>
          <Link href="/otletek" className="btn-primary mt-6">Irány az ötletgyűjtemény →</Link>
        </div>
      ) : (
        <div className="card p-10">
          <div className="text-5xl">⌛</div>
          <h1 className="mt-4 text-2xl font-bold">A link érvénytelen vagy lejárt</h1>
          <p className="mt-2 text-sm text-stone-600">
            A megerősítő linkek 24 óráig érvényesek. A profilodon kérhetsz újat.
          </p>
          <Link href="/profil" className="btn-secondary mt-6">Profilom →</Link>
        </div>
      )}
    </div>
  );
}
