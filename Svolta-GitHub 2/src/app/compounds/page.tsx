import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/compounds", "Research Compounds", "Explore Svolta\u2019s research catalog. Filter compounds, compare provisional prices, review material information and submit an unpaid invoice request.", false);
import { products } from "@/lib/db";
import { Collection } from "@/components/collection";

export default function Compounds() {
  return (
    <section className="section collection-page">
      <div className="breadcrumb">HOME / COMPOUNDS</div>
      <div className="collection-heading">
        <div>
          <span className="eyebrow">THE SVOLTA COLLECTION</span>
          <h1>Research compounds.</h1>
          <p>A focused collection. A clear starting point for discovery.</p>
        </div>
        <span className="collection-count">
          07
          <span>
            COMPOUNDS
            <br />
            &amp; BLENDS
          </span>
        </span>
      </div>
      <p className="notice">
        Catalog preview. Listed masses, prices, and formats are provisional.
        Submit an unpaid order request for review. Availability and final charges are confirmed by invoice; payment is handled separately.
        Supplier records and documentation remain pending review.
      </p>
      <Collection products={products()} />
    </section>
  );
}
