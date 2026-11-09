import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/checkout", "Checkout \u2014 Request an Invoice", "Submit contact and delivery details for an unpaid Svolta order request. Availability and final charges are confirmed separately.", true);
import { CheckoutPage } from '@/components/request-checkout';

export default CheckoutPage;
