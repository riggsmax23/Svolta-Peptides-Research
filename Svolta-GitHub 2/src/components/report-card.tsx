export function ProductDocumentation({ productId }: { productId: string }) {
 return <section id="documentation" className="transparency">
  <div><span className="eyebrow">BATCH DOCUMENTATION / {productId.toUpperCase()}</span>
  <h2>Evidence comes first.</h2><p>No verified batch-specific certificate of analysis is published for this catalog entry. No purity, sterility, or laboratory certification is claimed.</p>
  <p className="status-note"><i /> Documentation pending review</p></div>
  <a href="/coa-library/" className="button outline">Documentation library ↗</a>
 </section>;
}
