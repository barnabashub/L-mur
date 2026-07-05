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
    '# HELP kettesben_users_total Regisztrált felhasználók száma',
    '# TYPE kettesben_users_total gauge',
    `kettesben_users_total ${users}`,
    '# TYPE kettesben_couples_total gauge',
    `kettesben_couples_total ${couples}`,
    '# TYPE kettesben_ideas_approved_total gauge',
    `kettesben_ideas_approved_total ${ideas}`,
    '# HELP kettesben_ideas_pending_total Moderációra váró javaslatok (riasztásra érdemes, ha sokáig magas)',
    '# TYPE kettesben_ideas_pending_total gauge',
    `kettesben_ideas_pending_total ${pendingIdeas}`,
    '# TYPE kettesben_completions_total gauge',
    `kettesben_completions_total ${completions}`,
    '# TYPE kettesben_reviews_total gauge',
    `kettesben_reviews_total ${reviews}`,
    '# TYPE kettesben_moderation_requests_open gauge',
    `kettesben_moderation_requests_open ${openRequests}`,
    '# TYPE kettesben_notifications_unread gauge',
    `kettesben_notifications_unread ${notifications}`,
    '# HELP kettesben_emails_failed_total Sikertelen e-mail küldések (riasztásra érdemes, ha nő)',
    '# TYPE kettesben_emails_failed_total gauge',
    `kettesben_emails_failed_total ${emailsFailed}`,
    '# TYPE kettesben_coupons_issued_total gauge',
    `kettesben_coupons_issued_total ${redemptions}`,
    '# TYPE kettesben_coupons_redeemed_total gauge',
    `kettesben_coupons_redeemed_total ${redeemed}`,
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
