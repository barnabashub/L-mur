import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { isModerator } from '@/lib/permissions';
import { db } from '@/lib/db';
import { logout } from '@/lib/actions/auth';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { AccessibilityMenu } from './AccessibilityMenu';

export async function Header() {
  const user = await getCurrentUser();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent dark:from-violet-400 dark:to-fuchsia-400">
            L’mur
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-mute">
          <Link href="/otletek" className="hover:text-brand">Ötletek</Link>
          <Link href="/terkep" className="hover:text-brand">Térkép</Link>
          <Link href="/bakancslistak" className="hover:text-brand">Bakancslisták</Link>
          <Link href="/partnerek" className="hover:text-brand">Partnerek</Link>
          {user && (
            <>
              <Link href="/naplo" className="hover:text-brand">Naplónk</Link>
              <Link href="/datumok" className="hover:text-brand">Dátumaink</Link>
              {user.role === 'PARTNER' && (
                <Link href="/partner" className="text-amber-600 hover:text-amber-500 dark:text-amber-400">
                  Partnerfelület
                </Link>
              )}
              {isModerator(user.role) && (
                <Link href="/moderacio" className="text-amber-600 hover:text-amber-500 dark:text-amber-400">
                  Moderáció
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1 text-sm">
          <AccessibilityMenu />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/ertesitesek"
                className="relative rounded-2xl p-2 text-mute hover:bg-soft"
                title="Értesítések"
                aria-label={unread > 0 ? `Értesítések — ${unread} olvasatlan` : 'Értesítések'}
              >
                🔔
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1 text-[10px] font-bold text-white">
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
