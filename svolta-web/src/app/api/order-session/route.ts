import { cookieToken, newToken, sessionCookie, privateJson, errorResponse } from '@/server/checkout.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore } from '@/server/store.mjs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    // Check actual connectivity and migrations before enabling the checkout.
    await orderStore(orderEnvironment()).query('SELECT id FROM order_requests LIMIT 0');
    const response = privateJson({ ready: true });
    if (!cookieToken(request)) response.headers.set('Set-Cookie', sessionCookie(newToken(), request));
    return response;
  } catch (error) { return errorResponse(error); }
}
