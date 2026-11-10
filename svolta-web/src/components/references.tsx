import type { Citation, ResearchArticle } from "@/lib/research";
export function CitationLinks({
  ids,
  references,
}: {
  ids: string[];
  references: Citation[];
}) {
  return (
    <span className="citation-links">
      {ids.map((id) => {
        const index = references.findIndex((r) => r.id === id);
        return index < 0 ? null : (
          <a key={id} href={`#ref-${id}`} aria-label={`Reference ${index + 1}`}>
            [{index + 1}]
          </a>
        );
      })}
    </span>
  );
}
export function References({ article }: { article: ResearchArticle }) {
  return (
    <section className="references" id="references">
      <span className="eyebrow">PRIMARY LITERATURE</span>
      <h2>Follow the evidence.</h2>
      <p>
        Source links describe published research, not verification of Svolta
        material. Study titles may use clinical terminology; they are cited for
        context, not as product claims.
      </p>
      <ol>
        {article.references.map((ref) => (
          <li id={`ref-${ref.id}`} key={ref.id}>
            <div className="source-meta">
              <span>{ref.evidence}</span>
              <span>
                {ref.year} / {ref.authors}
              </span>
            </div>
            <a href={ref.url} target="_blank" rel="noopener noreferrer">
              {ref.title} ↗
            </a>
            {ref.doi && <small>DOI: {ref.doi}</small>}
          </li>
        ))}
      </ol>
    </section>
  );
}
export function ResearchOverview({
  article,
  slug,
}: {
  article: ResearchArticle | null;
  slug: string;
}) {
  return (
    <div className="research-overview">
      <span className="eyebrow">RESEARCH OVERVIEW</span>
      <p>
        {article?.overview ||
          "Scientific content is currently in editorial draft. Product identity, documentation and supplier specifications remain pending verification. Laboratory research only; not for human or veterinary use."}
      </p>
      {article && (
        <a href={`/research/${slug}/`} className="link-arrow">
          Read the research reference <span>↗</span>
        </a>
      )}
    </div>
  );
}
