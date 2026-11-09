import { requireOwner, publicOrder, privateJson, errorResponse } from '@/server/checkout.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore } from '@/server/store.mjs';
import settings from '@/data/checkout.json';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const env = orderEnvironment(); requireOwner(request, env);
    const store = orderStore(env);
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const analytics = await store.query('SELECT path, event, SUM(count) AS total FROM analytics_daily WHERE day >= ? GROUP BY path, event ORDER BY total DESC LIMIT 100', [cutoff]);
    const url = new URL(request.url);
    const cursor = url.searchParams.get('before') ?? 'ZZZZ';
    const rows = await orderStore(env).query('SELECT * FROM order_requests WHERE id < ? ORDER BY id DESC LIMIT 51', [cursor]);
    return privateJson({ orders: rows.slice(0, 50).map(publicOrder), nextCursor: rows.length > 50 ? rows[49].id : null, analytics, emailReady: settings.emailEnabled && Boolean(env.RESEND_API_KEY) });
  } catch (error) { return errorResponse(error); }
}
