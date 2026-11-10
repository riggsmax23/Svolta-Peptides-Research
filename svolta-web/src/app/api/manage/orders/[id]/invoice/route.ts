import { requireOwner, requireSameOrigin, readJson, privateJson, publicOrder, errorResponse, CheckoutError } from '@/server/checkout.mjs';
import { prepareInvoice, renderInvoice, sendInvoice, markManuallySent } from '@/server/invoice.mjs';
import { orderEnvironment } from '@/server/environment.mjs';
import { orderStore } from '@/server/store.mjs';
import settings from '@/data/checkout.json';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const env = orderEnvironment(); requireOwner(request, env);
    const { id } = await context.params;
    const row = (await orderStore(env).query('SELECT * FROM order_requests WHERE id = ?', [id]))[0];
    if (!row) throw new CheckoutError(404, 'Order not found.');
    const order = publicOrder(row);
    return privateJson({ email: renderInvoice(order, settings) });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const env = orderEnvironment(); requireOwner(request, env); requireSameOrigin(request);
    const { id } = await context.params;
    const { action, ...input } = await readJson(request);
    const store = orderStore(env);
    const order = action === 'prepare' ? await prepareInvoice(store, id, input, settings)
      : action === 'send' ? await sendInvoice(store, id, settings, env)
      : action === 'manual_sent' ? await markManuallySent(store, id)
      : null;
    if (!order) throw new CheckoutError(400, 'Unknown invoice action.');
    return privateJson({ order, email: renderInvoice(order, settings) });
  } catch (error) { return errorResponse(error); }
}
