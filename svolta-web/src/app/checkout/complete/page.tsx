import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/checkout/complete", "Order Request Received", "View your saved unpaid request and the next steps for invoice review and separate payment.", true);
import { Suspense } from 'react';
import { OrderComplete } from '@/components/request-checkout';

export default function Page() { return <Suspense fallback={<p className="request-page">Loading your request…</p>}><OrderComplete /></Suspense>; }
