import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Prometheus-formátumú metrikák (Grafana/alerting alá).
 * Ha a METRICS_TOKEN env be van állítva, Bearer tokennel védett.
 */
export async function GET(req: Request) {
  const token = process.env.METRICS_TOKEN;
  if (token && req.headers.get('authorization') !== `Bearer ${token}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const [users, couples, ideas, pendingIdeas, completions, reviews, openRequests, notifications, emailsFailed, redemptions, redeemed] =
    await Promise.all([
      db.user.count(),
      db.couple.count(),
      db.dateIdea.count({ where: { status: 'APPROVED' } }),
      db.dateIdea.count({ where: { status: 'PENDING' } }),
      db.completion.count(),
      db.review.count(),
      db.moderationRequest.count({ where: { status: 'OPEN' } }),
      db.notification.count({ where: { readAt: null } }),
      db.emailLog.count({ where: { status: 'FAILED' } }),
      db.couponRedemption.count(),
      db.couponRedemption.count({ where: { redeemedAt: { not: null } } }),
    ]);

  const mem = process.memoryUsage();
  const lines = [
    '# HELP lmur_users_total Regisztrált felhasználók száma',
    '# TYPE lmur_users_total gauge',
    `lmur_users_total ${users}`,
    '# TYPE lmur_couples_total gauge',
    `lmur_couples_total ${couples}`,
    '# TYPE lmur_ideas_approved_total gauge',
    `lmur_ideas_approved_total ${ideas}`,
    '# HELP lmur_ideas_pending_total Moderációra váró javaslatok (riasztásra érdemes, ha sokáig magas)',
    '# TYPE lmur_ideas_pending_total gauge',
    `lmur_ideas_pending_total ${pendingIdeas}`,
    '# TYPE lmur_completions_total gauge',
    `lmur_completions_total ${completions}`,
    '# TYPE lmur_reviews_total gauge',
    `lmur_reviews_total ${reviews}`,
    '# TYPE lmur_moderation_requests_open gauge',
    `lmur_moderation_requests_open ${openRequests}`,
    '# TYPE lmur_notifications_unread gauge',
    `lmur_notifications_unread ${notifications}`,
    '# HELP lmur_emails_failed_total Sikertelen e-mail küldések (riasztásra érdemes, ha nő)',
    '# TYPE lmur_emails_failed_total gauge',
    `lmur_emails_failed_total ${emailsFailed}`,
    '# TYPE lmur_coupons_issued_total gauge',
    `lmur_coupons_issued_total ${redemptions}`,
    '# TYPE lmur_coupons_redeemed_total gauge',
    `lmur_coupons_redeemed_total ${redeemed}`,
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${Math.round(process.uptime())}`,
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
