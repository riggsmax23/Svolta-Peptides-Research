import type { Product } from "@/lib/catalog";
export function Vial({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  if (product.image)
    return (
      <img
        className="product-photo"
        src={product.image}
        alt={`${product.name} supplied catalog image`}
        loading={large ? 'eager' : 'lazy'}
        decoding="async"
        width={600}
        height={800}
      />
    );
  return (
    <div
      className={`vial-scene ${large ? "large" : ""}`}
      role="img"
      aria-label={`Illustrated ${product.name} vial, ${product.massMg} mg. Design placeholder, not manufactured inventory.`}
    >
      <div className="vial-shadow" />
      <div className="vial">
        <div className="cap" />
        <div className="neck" />
        <div className="glass">
          <div className="vial-label">
            <b className="mini-brand">
              SVOLT<span>Λ</span>
            </b>
            <small>PEPTIDE RESEARCH</small>
            <div className="label-rule" />
            <strong>{product.name}</strong>
            <span className="vial-mass">{product.massMg} mg</span>
            <div className="mountains" />
            <em>LABORATORY RESEARCH ONLY</em>
          </div>
        </div>
      </div>
      <span className="illustration-note">DESIGN ILLUSTRATION</span>
    </div>
  );
}
