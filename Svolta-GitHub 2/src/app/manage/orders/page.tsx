import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/manage/orders", "Owner Order Workspace", "Protected Svolta workspace for reviewing unpaid requests, preparing invoices and viewing aggregate analytics.", true);
import { OrderManager } from '@/components/order-manager';

export default OrderManager;
