import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/", "Svolta Peptide Research", "Browse Svolta\u2019s laboratory research compounds, scientific references and documentation. Request an invoice with payment handled separately.", false);
import { HomeContent } from '@/components/home-content';
import { siteDocument } from '@/lib/site-content';
export default function Home() { return <HomeContent content={siteDocument('home').published!} />; }
