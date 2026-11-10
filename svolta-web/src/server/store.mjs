// A small, parameterized SQLite interface shared by D1 and Turso SQL over HTTP.
import { z } from 'zod';
import { CheckoutError } from './checkout.mjs';
export async function recordAnalytics(store, input, publicPaths, retentionDays = 90, now = new Date()) {
  const schema = z.object({
    consent: z.literal(true),
    path: z.string().max(160),
    event: z.enum(['page_view', 'catalog_click', 'checkout_start', 'invoice_request']),
  }).strict();
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new CheckoutError(400, 'Invalid analytics event');
  const { path, event } = parsed.data;
  const allowed = event === 'page_view' ? publicPaths.includes(path)
    : event === 'catalog_click' ? path === '/compounds/' : path === '/checkout/';
  if (!allowed) throw new CheckoutError(400, 'Invalid analytics path');
  const day = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - retentionDays * 86400000).toISOString().slice(0, 10);
  await store.query('DELETE FROM analytics_daily WHERE day < ?', [cutoff]);
  await store.query('INSERT INTO analytics_daily (day, path, event, count) VALUES (?, ?, ?, 1) ON CONFLICT(day, path, event) DO UPDATE SET count = count + 1', [day, path, event]);
}
// No request creates tables; apply the committed migrations before activation.
export function orderStore(env, fetcher = fetch) {
  if (env.DB?.prepare) {
    return {
      async query(sql, args = []) {
        const result = await env.DB.prepare(sql).bind(...args).all();
        if (!result.success) throw new Error('Order storage failed');
        return result.results ?? [];
      },
    };
  }
  if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
    const base = new URL(env.TURSO_DATABASE_URL.replace(/^(libsql|turso):/, 'https:'));
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
      throw new Error('Invalid database configuration');
    }
    return {
      async query(sql, args = []) {
        const response = await fetcher(new URL('/v2/pipeline', base), {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [
            { type: 'execute', stmt: { sql, args: args.map(value => value === null
              ? { type: 'null' }
              : { type: typeof value === 'number' ? 'integer' : 'text', value: String(value) }), want_rows: true } },
            { type: 'close' },
          ] }),
          signal: AbortSignal.timeout(12000),
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Order storage unavailable');
        const body = await response.json();
        const first = body.results?.[0];
        if (first?.type !== 'ok' || !first.response?.result) throw new Error('Order storage failed');
        const result = first.response.result;
        return result.rows.map(row => Object.fromEntries(result.cols.map((column, index) => {
          const cell = row[index];
          return [column.name, cell.type === 'null' ? null : cell.type === 'integer' || cell.type === 'float' ? Number(cell.value) : cell.value];
        })));
      },
    };
  }
  throw new Error('Order storage is not configured');
}
