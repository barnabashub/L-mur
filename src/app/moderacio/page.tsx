import Link from 'next/link';
import { db } from '@/lib/db';
import { requireModerator } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  approveIdea,
  rejectIdea,
  resolveRequest,
  suspendUser,
  toggleModerator,
  unsuspendUser,
  warnUser,
} from '@/lib/actions/moderation';
import { IdeaImage } from '@/components/IdeaImage';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Moderáció' };

const TABS = [
  { key: 'javaslatok', label: 'Ötletjavaslatok' },
  { key: 'keresek', label: 'Moderációs kérések' },
  { key: 'felhasznalok', label: 'Felhasználók' },
  { key: 'naplo', label: 'Audit napló' },
  { key: 'emailek', label: 'E-mail napló' },
] as const;

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ nezet?: string; hiba?: string; uzenet?: string }>;
}) {
  const mod = await requireModerator();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.nezet) ? sp.nezet! : 'javaslatok';

  const [pendingCount, openRequestCount] = await Promise.all([
    db.dateIdea.count({ where: { status: 'PENDING' } }),
    db.moderationRequest.count({ where: { status: 'OPEN' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderátori felület 🛡️</h1>
        <p className="text-sm text-mute">
          {pendingCount} javaslat és {openRequestCount} kérés vár elbírálásra.
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/moderacio?nezet=${t.key}`}
            className={`btn ${tab === t.key ? 'bg-brand-strong text-white' : 'bg-white text-mute border border-edge hover:bg-soft'}`}
          >
            {t.label}
            {t.key === 'javaslatok' && pendingCount > 0 && ` (${pendingCount})`}
            {t.key === 'keresek' && openRequestCount > 0 && ` (${openRequestCount})`}
          </Link>
        ))}
      </nav>

      {tab === 'javaslatok' && <PendingIdeas />}
      {tab === 'keresek' && <OpenRequests />}
      {tab === 'felhasznalok' && <Users actorRole={mod.role} actorId={mod.id} />}
      {tab === 'naplo' && <AuditLog />}
      {tab === 'emailek' && <EmailLogView />}
    </div>
  );
}

async function PendingIdeas() {
  const pending = await db.dateIdea.findMany({
    where: { status: 'PENDING' },
    include: { submitter: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) {
    return <p className="card p-10 text-center text-mute">Nincs elbírálásra váró javaslat. 🎉</p>;
  }
  return (
    <div className="space-y-6">
      {pending.map((idea) => (
        <section key={idea.id} className="card overflow-hidden">
          <div className="grid sm:grid-cols-[200px_1fr]">
            <IdeaImage imagePath={idea.imagePath} category={idea.category} title={idea.title} className="h-40 w-full sm:h-full" />
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-brand">{idea.category}</span>
                <span className="badge-soft">
                  {idea.isLocationIndependent ? '🌍 Helyfüggetlen' : `📍 ${idea.locationName}`}
                </span>
                {idea.isSeasonal && idea.seasonLabel && (
                  <span className="badge-sky">📅 {idea.seasonLabel}</span>
                )}
              </div>
              <h2 className="text-lg font-bold">{idea.title}</h2>
              <p className="whitespace-pre-line text-sm text-mute">{idea.description}</p>
              <p className="text-xs text-faint">
                Beküldte: {idea.submitter.name} ({idea.submitter.email}) · {formatDateTime(idea.createdAt)}
              </p>
              <div className="flex flex-wrap items-start gap-3 border-t border-edge pt-3">
                <form action={approveIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button className="btn-primary">✔ Elfogadás és publikálás</button>
                </form>
                <Link href={`/moderacio/otlet/${idea.id}`} className="btn-secondary">✏️ Szerkesztés</Link>
                <form action={rejectIdea} className="flex min-w-60 flex-1 gap-2">
                  <input type="hidden" name="id" value={idea.id} />
                  <input className="input" name="message" required minLength={5}
                    placeholder="Visszadobás indoklása (kötelező)…" />
                  <button className="btn-danger shrink-0">Visszadobás</button>
                </form>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

async function OpenRequests() {
  const requests = await db.moderationRequest.findMany({
    where: { status: 'OPEN' },
    include: {
      idea: { select: { id: true, title: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (requests.length === 0) {
    return <p className="card p-10 text-center text-mute">Nincs nyitott moderációs kérés. 🎉</p>;
  }
  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <section key={r.id} className="card space-y-3 p-5">
          <p className="text-sm">
            <Link href={`/otletek/${r.idea.id}`} className="font-semibold text-brand-strong dark:text-violet-200 hover:underline">
              {r.idea.title}
            </Link>
            <span className="text-faint"> · jelezte: {r.user.name} · {formatDateTime(r.createdAt)}</span>
          </p>
          <p className="rounded-lg bg-soft px-3 py-2 text-sm text-ink/90">„{r.message}"</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/moderacio/otlet/${r.idea.id}`} className="btn-secondary">✏️ Ötlet szerkesztése</Link>
            <form action={resolveRequest} className="flex min-w-60 flex-1 gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input className="input" name="resolution" required minLength={2}
                placeholder="Válasz a bejelentőnek…" />
              <button className="btn-primary shrink-0">Lezárás</button>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}

async function Users({ actorRole, actorId }: { actorRole: string; actorId: string }) {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { ideas: true, completions: true } } },
  });

  return (
    <div className="space-y-3">
      {users.map((u) => {
        const untouchable =
          u.id === actorId || u.role === 'ADMIN' || (u.role === 'MODERATOR' && actorRole !== 'ADMIN');
        return (
          <section key={u.id} className="card space-y-3 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <p className="font-semibold">
                  {u.name}
                  {u.role !== 'USER' && (
                    <span className="badge-amber ml-2">
                      {u.role === 'ADMIN' ? 'admin' : 'moderátor'}
                    </span>
                  )}
                  {u.status === 'SUSPENDED' && (
                    <span className="badge-red ml-2">felfüggesztve</span>
                  )}
                </p>
                <p className="text-xs text-faint">
                  {u.email} · csatlakozott: {formatDate(u.createdAt)} · {u._count.ideas} ötlet,{' '}
                  {u._count.completions} pipa
                </p>
              </div>
              {actorRole === 'ADMIN' && u.role !== 'ADMIN' && u.id !== actorId && (
                <form action={toggleModerator} className="ml-auto">
                  <input type="hidden" name="userId" value={u.id} />
                  <button className="btn-ghost text-xs">
                    {u.role === 'MODERATOR' ? 'Moderátori jog visszavonása' : 'Kinevezés moderátornak'}
                  </button>
                </form>
              )}
            </div>
            {!untouchable && (
              <div className="flex flex-wrap gap-3 border-t border-edge pt-3">
                <form action={warnUser} className="flex min-w-60 flex-1 gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input className="input" name="message" required minLength={5}
                    placeholder="Figyelmeztetés szövege…" />
                  <button className="btn-secondary shrink-0">⚠️ Figyelmeztetés</button>
                </form>
                {u.status === 'SUSPENDED' ? (
                  <form action={unsuspendUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn-primary">Visszaállítás</button>
                  </form>
                ) : (
                  <form action={suspendUser} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn-danger">⛔ Felfüggesztés</button>
                  </form>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

async function AuditLog() {
  const actions = await db.moderationAction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      moderator: { select: { name: true } },
      targetUser: { select: { name: true } },
      idea: { select: { id: true, title: true } },
    },
  });

  const LABEL: Record<string, string> = {
    APPROVE: 'elfogadta',
    REJECT: 'visszadobta',
    EDIT: 'szerkesztette',
    WARN: 'figyelmeztette',
    SUSPEND: 'felfüggesztette',
    UNSUSPEND: 'visszaállította',
    RESOLVE_REQUEST: 'lezárta a kérést',
  };

  if (actions.length === 0) {
    return <p className="card p-10 text-center text-mute">Még nincs moderátori művelet.</p>;
  }
  return (
    <ul className="space-y-2">
      {actions.map((a) => (
        <li key={a.id} className="card p-3 text-sm">
          <span className="font-medium">{a.moderator.name}</span> {LABEL[a.type] ?? a.type}
          {a.idea && (
            <>
              {' '}
              <Link href={`/otletek/${a.idea.id}`} className="text-brand hover:underline">
                „{a.idea.title}"
              </Link>
            </>
          )}
          {a.targetUser && <> — {a.targetUser.name}</>}
          {a.message && <span className="text-mute"> · „{a.message}"</span>}
          <span className="float-right text-xs text-faint">{formatDateTime(a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

async function EmailLogView() {
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

  const STATUS_BADGE: Record<string, string> = {
    SENT: 'badge-green',
    LOGGED: 'badge-sky',
    FAILED: 'badge-red',
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">
        A rendszer által küldött e-mailek. A <span className="badge-sky">LOGGED</span>{' '}
        státusz azt jelenti, hogy nincs SMTP beállítva (fejlesztői mód) — a levél csak itt, a
        naplóban jelent meg.
      </p>
      {emails.length === 0 ? (
        <p className="card p-10 text-center text-mute">Még nem ment ki e-mail.</p>
      ) : (
        emails.map((m) => (
          <details key={m.id} className="card p-4 text-sm">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2">
              <span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-soft'}`}>{m.status}</span>
              <span className="font-medium">{m.subject}</span>
              <span className="text-faint">→ {m.to}</span>
              <span className="ml-auto text-xs text-faint">{formatDateTime(m.createdAt)}</span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-soft p-3 text-xs text-ink/90">{m.text}</pre>
            {m.error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">Hiba: {m.error}</p>}
          </details>
        ))
      )}
    </div>
  );
}
