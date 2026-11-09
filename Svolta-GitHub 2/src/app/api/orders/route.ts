import catalog from '@/data/catalog.json';
import { cookieToken, hash, saveRequest, requireSameOrigin, readJson, privateJson, errorResponse, CheckoutError } from '@/server/checkout.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore } from '@/server/store.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const token = cookieToken(request);
    if (!token) throw new CheckoutError(403, 'Please allow essential cookies and reload checkout before submitting.');
    const env = orderEnvironment();
    // CF-Connecting-IP is trusted only behind the Sites Worker. On Vercel use
    // its platform-controlled client IP header, never X-Forwarded-For input.
    const ip = env.DB?.prepare ? request.headers.get('cf-connecting-ip') : request.headers.get('x-vercel-forwarded-for');
    const rateKey = hash(`ip:${ip?.split(',')[0].trim() ?? token}`);
    const order = await saveRequest(orderStore(env), await readJson(request), catalog.products, hash(token), rateKey);
    return privateJson({ order });
  } catch (error) { return errorResponse(error); }
}
