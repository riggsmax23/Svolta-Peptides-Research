import { pageMetadata } from '@/lib/site-content';
import { ProductDocumentation } from "@/components/report-card";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products, researchArticle } from "@/lib/db";
import { money } from "@/lib/catalog";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/cart-provider";
import { ResearchOverview } from "@/components/references";
import { Vial } from "@/components/vial";
export const dynamicParams = false;
export function generateStaticParams() { return products().map(p => ({slug:p.id})); }
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = products().find((p) => p.id === slug);
  return pageMetadata(`/compounds/${slug}`, p ? `${p.name} · ${p.massMg} mg` : 'Compound not found', p ? `${p.name} provisional laboratory research catalog. ${p.massMg} mg. Documentation status, scientific references and unpaid invoice requests.` : 'This compound is not in the Svolta catalog.', !p);
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all = products();
  const product = all.find((p) => p.id === slug);
  if (!product) notFound();
  const record = researchArticle(slug);
  const article =
    record?.article.status === "published" ? record.article : null;
  const related = all.filter((p) => p.id !== slug).slice(0, 3);
  return (
    <div className="product-page">
      <div className="breadcrumb">
        <a href="/">HOME</a> / <a href="/compounds/">COMPOUNDS</a> /{" "}
        {product.name.toUpperCase()}
      </div>
      <div className="product-detail">
        <ProductGallery key={product.id} product={product} />
        <div className="product-information">
          <span className="eyebrow">
            {product.category.toUpperCase()} / PROVISIONAL CATALOG
          </span>
          <h1>{product.name}</h1>
          <div className="product-spec-line">
            <span>
              {product.massMg} mg{" "}
              <span className="muted">/ listed total mass</span>
            </span>
            <span className="availability">
              <i />
              Catalog entry · Specifications pending
            </span>
          </div>
          <p className="detail-price">
            {money(product.priceCents)} <small>USD · Provisional price</small>
          </p>
          <p className="product-description">{product.description}</p>
          <ProductPurchase
            key={product.id}
            productId={product.id}
            available={product.available}
          />
          <ResearchOverview article={article} slug={slug} />
          <div className="research-disclosure">
            FOR LABORATORY RESEARCH ONLY
            <br />
            <span>Not for human or veterinary use.</span>
          </div>
          <a href="#documentation" className="documentation-jump">
            Batch documentation <span>Pending ↗</span>
          </a>
        </div>
      </div>
      <section className="scientific-details">
        <div>
          <span className="eyebrow">COMPOUND PROFILE / 01</span>
          <h2>A closer look.</h2>
          <p>
            Separate catalog specifications, published literature and verified
            documentary evidence.
          </p>
          {article && (
            <span className="evidence-pill">{article.evidenceLabel}</span>
          )}
        </div>
        <div className="detail-accordions">
          <details open>
            <summary>
              Scientific overview <span>+</span>
            </summary>
            <p>
              {article?.overview ||
                "Research content is in editorial draft. No scientific overview is published."}
            </p>
            {article && (
              <a className="link-arrow" href={`/research/${slug}/`}>
                Full reference and sources ↗
              </a>
            )}
          </details>
          <details>
            <summary>
              Compound identity <span>+</span>
            </summary>
            <p>{article?.identityText || product.identity}</p>
          </details>
          <details>
            <summary>
              Composition &amp; physical format <span>+</span>
            </summary>
            <ul className="composition-list">
              {product.composition.map((c) => (
                <li key={c.name}>
                  <span>{c.name}</span>
                  <b>{c.massMg} mg</b>
                </li>
              ))}
              <li>
                <span>Total stated mass</span>
                <b>{product.massMg} mg</b>
              </li>
            </ul>
            <p>
              Lyophilized powder in a sealed glass vial is the provisional
              development assumption. Actual supplier format and physical
              specifications have not been verified.
            </p>
            {product.category === "Research blend" && (
              <p>
                Component masses are the confirmed catalog recipe, not
                analytical results. Ingredient research does not establish
                evidence for this exact mixture.
              </p>
            )}
          </details>
          <details>
            <summary>
              Molecular characteristics <span>+</span>
            </summary>
            <p>
              {article?.molecularNotes ||
                "Supplier-specific molecular specifications are pending."}
            </p>
          </details>
          <details>
            <summary>
              Research references <span>+</span>
            </summary>
            {article ? (
              <>
                <p>
                  Primary literature is provided in the product-specific
                  Research Library. It does not certify the catalog material.
                </p>
                <ul className="compact-references">
                  {article.references.map((ref) => (
                    <li key={ref.id}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.authors} · {ref.year} · {ref.evidence} ↗
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  className="link-arrow"
                  href={`/research/${slug}#references`}
                >
                  View full citations ↗
                </a>
              </>
            ) : (
              <p>References are in editorial draft.</p>
            )}
          </details>
          <details>
            <summary>
              Storage &amp; batch information <span>+</span>
            </summary>
            <p>
              No verified storage requirements or stability study are available.
              Batch documentation, when published, appears below. Instructions
              will be added only after evidence review. No lot or expiry values
              are inferred from the reference artwork.
            </p>
          </details>
        </div>
      </section>
      <ProductDocumentation productId={product.id} />
      <section className="related-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONTINUE EXPLORING</span>
            <h2>Within the collection.</h2>
          </div>
          <a href="/compounds/" className="link-arrow">
            All compounds ↗
          </a>
        </div>
        <div className="related-grid">
          {related.map((p) => (
            <a href={`/compounds/${p.id}/`} key={p.id}>
              <div className="related-art">
                <Vial product={p} />
              </div>
              <div>
                <b>{p.name}</b>
                <span>
                  {p.massMg} mg / {money(p.priceCents)} ↗
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
