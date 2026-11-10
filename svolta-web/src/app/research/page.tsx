import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/research", "Research Library", "Read compound-specific scientific context, primary references and evidence limitations. For laboratory research only.", false);
import { products, researchArticles } from "@/lib/db";
import { visibleArticles } from "@/lib/research";
import { ResearchLibrary } from "@/components/research-library";

export default function Research() {
  return (
    <section className="section research-index">
      <div className="breadcrumb">HOME / RESEARCH LIBRARY</div>
      <div className="library-heading">
        <span className="eyebrow">THE RESEARCH LIBRARY / SVOLTA</span>
        <h1>Context before conclusions.</h1>
        <p>
          Product-specific references. Primary literature.
          <br />A clear view of what the evidence does—and does not—establish.
        </p>
      </div>
      <div className="library-note">
        <span>01 / READING THE EVIDENCE</span>
        <p>
          Literature describes specific materials and experimental conditions.
          It does not verify our provisional catalog. Ingredient studies do not
          establish results for a combined blend. Not for human or veterinary
          use.
        </p>
      </div>
      <ResearchLibrary
        products={products()}
        articles={visibleArticles(researchArticles())}
      />
    </section>
  );
}
