import { requireUser, partnerOf } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { createInvite, joinCouple, leaveCouple } from '@/lib/actions/couple';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Párom' };

export default async function CouplePage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const partner = partnerOf(user);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Párom 💑</h1>
        <p className="text-sm text-stone-500">
          Az összekapcsolás után közös lesz a randinaplótok, a fontos dátumaitok és a
          bakancslista-haladásotok. Az app pár nélkül is teljes értékűen használható.
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      {partner ? (
        <section className="card p-6">
          <h2 className="font-bold">Összekapcsolva ✔</h2>
          <p className="mt-2 text-sm text-stone-700">
            A párod: <strong>{partner.name}</strong>
            {user.couple && <> · együtt a Kettesben-en: {formatDate(user.couple.createdAt)} óta</>}
          </p>
          <form action={leaveCouple} className="mt-4">
            <button className="btn-danger">Szétkapcsolás</button>
          </form>
          <p className="mt-2 text-xs text-stone-400">
            Szétkapcsolásnál mindenki a saját bejegyzéseit viszi magával; a másik fél emlékeihez
            többé nem fértek hozzá.
          </p>
        </section>
      ) : user.couple ? (
        <section className="card p-6 text-center">
          <h2 className="font-bold">A meghívókódotok</h2>
          <p className="mt-4 inline-block rounded-xl border-2 border-dashed border-rose-300 bg-rose-50 px-8 py-4 font-mono text-3xl font-bold tracking-[0.3em] text-rose-700">
            {user.couple.inviteCode}
          </p>
          <p className="mt-4 text-sm text-stone-600">
            Küldd el a párodnak — neki regisztráció után ide, a <strong>Párom</strong> oldalra kell
            beírnia a kódot.
          </p>
          <form action={leaveCouple} className="mt-4">
            <button className="btn-ghost text-xs">Mégsem, kód visszavonása</button>
          </form>
        </section>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="card p-6">
            <h2 className="font-bold">Meghívom a páromat</h2>
            <p className="mt-1 text-sm text-stone-500">Kapsz egy kódot, amit elküldhetsz neki.</p>
            <form action={createInvite} className="mt-4">
              <button className="btn-primary w-full">Meghívókód készítése</button>
            </form>
          </section>
          <section className="card p-6">
            <h2 className="font-bold">Kaptam egy kódot</h2>
            <p className="mt-1 text-sm text-stone-500">Írd be a párodtól kapott kódot.</p>
            <form action={joinCouple} className="mt-4 space-y-3">
              <input className="input text-center font-mono uppercase tracking-widest" name="code"
                required maxLength={6} placeholder="ABC123" />
              <button className="btn-secondary w-full">Összekapcsolódás</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
