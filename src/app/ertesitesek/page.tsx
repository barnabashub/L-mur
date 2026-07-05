import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { markAllRead } from '@/lib/actions/notifications';

export const metadata = { title: 'Értesítések' };

const TYPE_EMOJI: Record<string, string> = {
  IDEA: '💡',
  MODERATION: '🛡️',
  WARNING: '⚠️',
  COUPLE: '💑',
  ANNIVERSARY: '🎉',
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Értesítések</h1>
        {hasUnread && (
          <form action={markAllRead}>
            <button className="btn-secondary">Mind olvasottnak jelölése</button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="card p-10 text-center text-mute">Nincs értesítésed.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`card flex gap-3 p-4 text-sm ${n.readAt ? 'opacity-70' : 'border-brand/40'}`}
            >
              <span className="text-lg">{TYPE_EMOJI[n.type] ?? '🔔'}</span>
              <div>
                <p className="text-ink">{n.message}</p>
                <p className="mt-1 text-xs text-faint">
                  {formatDateTime(n.createdAt)}
                  {n.link && (
                    <>
                      {' · '}
                      <Link href={n.link} className="font-medium text-brand hover:underline">
                        Megnézem →
                      </Link>
                    </>
                  )}
                </p>
              </div>
              {!n.readAt && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
