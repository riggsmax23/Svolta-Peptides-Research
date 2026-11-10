import { requireSameOrigin, readJson, privateJson, errorResponse } from '@/server/checkout.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore, recordAnalytics } from '@/server/store.mjs';
import { publicPagePaths, website } from '@/lib/site-content';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!website.analyticsEnabled) return new Response(null, { status: 204 });
    if (request.headers.get('sec-gpc') === '1') return new Response(null, { status: 204 });
    const input = await readJson(request);
    const paths = publicPagePaths.map(path => path === '/' ? '/' : `${path}/`);
    await recordAnalytics(orderStore(orderEnvironment()), input, paths, website.analyticsRetentionDays);
    return privateJson({ recorded: true });
  } catch (error) { return errorResponse(error); }
}
