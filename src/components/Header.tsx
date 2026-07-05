import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { isModerator } from '@/lib/permissions';
import { db } from '@/lib/db';
import { logout } from '@/lib/actions/auth';

export async function Header() {
  const user = await getCurrentUser();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-rose-600">
          💛 Kettesben
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-stone-600">
          <Link href="/otletek" className="hover:text-rose-600">Ötletek</Link>
          <Link href="/bakancslistak" className="hover:text-rose-600">Bakancslisták</Link>
          <Link href="/partnerek" className="hover:text-rose-600">Partnerek</Link>
          {user && (
            <>
              <Link href="/naplo" className="hover:text-rose-600">Naplónk</Link>
              <Link href="/datumok" className="hover:text-rose-600">Dátumaink</Link>
              {isModerator(user.role) && (
                <Link href="/moderacio" className="font-semibold text-amber-700 hover:text-amber-800">
                  Moderáció
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/ertesitesek"
                className="relative rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                title="Értesítések"
              >
                🔔
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link href="/profil" className="btn-ghost">
                {user.name}
              </Link>
              <form action={logout}>
                <button className="btn-ghost" title="Kijelentkezés">Kilépés</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/belepes" className="btn-ghost">Belépés</Link>
              <Link href="/regisztracio" className="btn-primary">Regisztráció</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
