import type { ResearchArticle } from "@/lib/research";
import type { Product } from "@/lib/catalog";
import { CitationLinks, References } from "./references";
export function ResearchArticleView({
  article,
  product,
  draft = false,
}: {
  article: ResearchArticle;
  product: Product;
  draft?: boolean;
}) {
  return (
    <div className="research-article">
      <div className="breadcrumb">
        <a href="/research/">RESEARCH LIBRARY</a> /{" "}
        {product.name.toUpperCase()}
      </div>
      {draft && (
        <div className="notice">
          ADMINISTRATOR PREVIEW · {article.status.toUpperCase()} · Saved content
          only. Drafts are not visible in the storefront Research Library.
        </div>
      )}
      <div className="article-heading">
        <span className="eyebrow">
          COMPOUND REFERENCE / {article.evidenceLabel.toUpperCase()}
        </span>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
        <div className="article-meta">
          <span>
            {article.references.length} primary{" "}
            {article.references.length === 1 ? "source" : "sources"}
          </span>
          <span>Editorial source check: {article.reviewedAt}</span>
          <span>Laboratory research only</span>
        </div>
      </div>
      <div className="article-layout">
        <aside className="article-sidebar">
          <span className="eyebrow">ON THIS PAGE</span>
          <a href="#identity">Compound identity</a>
          {article.sections.map((s) => (
            <a href={`#${s.id}`} key={s.id}>
              {s.title}
            </a>
          ))}
          <a href="#molecular">Molecular information</a>
          <a href="#references">Primary references</a>
          <div className="sidebar-product">
            <span className="eyebrow">CATALOG ENTRY</span>
            <b>{product.name}</b>
            <p>{product.massMg} mg · Provisional</p>
            <a href={`/compounds/${product.id}/`}>View compound ↗</a>
          </div>
        </aside>
        <div className="article-body">
          {article.image && (
            <figure className="article-image">
              <img src={article.image.src} alt={article.image.alt} loading="lazy" decoding="async" width={1000} height={600} />
              <figcaption>{article.image.caption}</figcaption>
            </figure>
          )}
          <section id="identity">
            <span className="eyebrow">IDENTITY / CONTEXT</span>
            <h2>Understand the material.</h2>
            <p>
              {article.identityText}{" "}
              {article.evidenceLabel !== "Ingredient evidence only" && (
                <CitationLinks
                  ids={[article.references[0].id]}
                  references={article.references}
                />
              )}
            </p>
          </section>
          {article.sections.map((section, i) => (
            <section key={section.id} id={section.id}>
              <span className="eyebrow">
                {String(i + 1).padStart(2, "0")} / RESEARCH NOTES
              </span>
              <h2>{section.title}</h2>
              {section.body.split("\n\n").map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                  {index === section.body.split("\n\n").length - 1 && (
                    <CitationLinks
                      ids={section.citationIds}
                      references={article.references}
                    />
                  )}
                </p>
              ))}
            </section>
          ))}
          <section id="molecular">
            <span className="eyebrow">MATERIAL SPECIFICATIONS</span>
            <h2>Molecular information.</h2>
            <p>{article.molecularNotes}</p>
          </section>
          <References article={article} />
          <div className="article-boundary">
            <b>Research context, with boundaries.</b>
            <p>
              Not for human or veterinary use. No treatment, dosing or
              administration recommendations are provided. This editorial page
              is not a certificate of analysis, a scientific endorsement, or a
              legal eligibility determination.
            </p>
          </div>
          <a href={`/compounds/${product.id}/`} className="button">
            Return to {product.name} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
