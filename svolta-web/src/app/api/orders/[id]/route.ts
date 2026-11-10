import { cookieToken, hash, getOwnedOrder, privateJson, errorResponse, CheckoutError } from '@/server/checkout.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore } from '@/server/store.mjs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const token = cookieToken(request);
    if (!token) throw new CheckoutError(404, 'This order is not available in this browser. Contact Svolta with your order reference.');
    const { id } = await context.params;
    return privateJson({ order: await getOwnedOrder(orderStore(orderEnvironment()), id, hash(token)) });
  } catch (error) { return errorResponse(error); }
}
