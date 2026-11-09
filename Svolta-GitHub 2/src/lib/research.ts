import { z } from "zod";
import { assetPathSchema, seedProducts } from "./catalog";
const httpsUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an HTTPS source URL");
const citationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(500),
  authors: z.string().min(1).max(250),
  year: z.number().int().min(1900).max(2100),
  url: httpsUrl,
  doi: z.string().max(120),
  evidence: z.enum([
    "Preclinical",
    "Clinical",
    "Preclinical and clinical",
    "Analytical",
  ]),
});
export const articleSchema = z
  .object({
    productId: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(120),
    summary: z.string().min(1).max(700),
    overview: z.string().min(1).max(1000),
    identityText: z.string().min(1).max(1500),
    molecularNotes: z.string().min(1).max(1500),
    evidenceLabel: z.enum([
      "Preclinical research",
      "Preclinical and clinical literature",
      "Clinical literature",
      "Ingredient evidence only",
    ]),
    status: z.enum(["draft", "published"]),
    reviewedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
      ),
    image: z
      .object({
        src: assetPathSchema,
        alt: z.string().min(1).max(200),
        caption: z.string().max(500),
      })
      .nullable()
      .default(null),
    seoTitle: z.string().max(120),
    seoDescription: z.string().max(300),
    sections: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          title: z.string().min(1).max(120),
          body: z.string().min(1).max(5000),
          citationIds: z.array(z.string()).max(20),
        }),
      )
      .min(1)
      .max(15),
    references: z.array(citationSchema).min(1).max(20),
  })
  .superRefine((article, ctx) => {
    const ids = article.references.map((r) => r.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Reference IDs must be unique" });
    if (
      new Set(article.sections.map((s) => s.id)).size !==
      article.sections.length
    )
      ctx.addIssue({ code: "custom", message: "Section IDs must be unique" });
    article.sections.forEach((section, i) => {
      if (["identity", "molecular", "references", "main"].includes(section.id))
        ctx.addIssue({
          code: "custom",
          path: ["sections", i, "id"],
          message: "Section ID is reserved",
        });
      section.citationIds.forEach((id) => {
        if (!ids.includes(id))
          ctx.addIssue({
            code: "custom",
            path: ["sections", i, "citationIds"],
            message: "Citation must point to an existing reference",
          });
      });
    });
  });
export type ResearchArticle = z.infer<typeof articleSchema>;
export type Citation = ResearchArticle["references"][number];
export const sources: Record<string, Citation> = {
  tirzepatide: {
    id: "coskun-2018",
    title:
      "LY3298176, a novel dual GIP and GLP-1 receptor agonist for the treatment of type 2 diabetes mellitus: From discovery to clinical proof of concept",
    authors: "Coskun T et al.",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/30473097/",
    doi: "10.1016/j.molmet.2018.09.009",
    evidence: "Preclinical and clinical",
  },
  retatrutide: {
    id: "jastreboff-2023",
    title:
      "Triple–Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial",
    authors: "Jastreboff AM et al.",
    year: 2023,
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2301972",
    doi: "10.1056/NEJMoa2301972",
    evidence: "Clinical",
  },
  bpc: {
    id: "bpc-adme-2022",
    title:
      "Pharmacokinetics, distribution, metabolism, and excretion of body-protective compound 157, a potential drug for treating various wounds, in rats and dogs",
    authors: "He L et al.",
    year: 2022,
    url: "https://pubmed.ncbi.nlm.nih.gov/36588717/",
    doi: "10.3389/fphar.2022.1026182",
    evidence: "Preclinical",
  },
  ghk: {
    id: "maquart-1993",
    title:
      "In vivo stimulation of connective tissue accumulation by the tripeptide-copper complex glycyl-L-histidyl-L-lysine-Cu2+ in rat experimental wounds",
    authors: "Maquart FX et al.",
    year: 1993,
    url: "https://pubmed.ncbi.nlm.nih.gov/8227353/",
    doi: "10.1172/JCI116842",
    evidence: "Preclinical",
  },
  melanotan: {
    id: "melanotan-2000",
    title:
      "Increased eumelanin expression and tanning is induced by a superpotent melanotropin [Nle4-D-Phe7]-alpha-MSH in humans",
    authors: "Dorr RT et al.",
    year: 2000,
    url: "https://pubmed.ncbi.nlm.nih.gov/11045725/",
    doi: "10.1562/0031-8655(2000)072<0526:ieeati>2.0.co;2",
    evidence: "Clinical",
  },
  tb: {
    id: "ho-2012",
    title:
      "Doping control analysis of TB-500, a synthetic version of an active region of thymosin β₄, in equine urine and plasma by liquid chromatography-mass spectrometry.",
    authors: "Ho ENM et al.",
    year: 2012,
    url: "https://pubmed.ncbi.nlm.nih.gov/23084823/",
    doi: "10.1016/j.chroma.2012.09.043",
    evidence: "Analytical",
  },
  kpv: {
    id: "dalmasso-2008",
    title:
      "PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation",
    authors: "Dalmasso G et al.",
    year: 2008,
    url: "https://pubmed.ncbi.nlm.nih.gov/18061177/",
    doi: "10.1053/j.gastro.2007.10.026",
    evidence: "Preclinical",
  },
};
const section = (
  id: string,
  title: string,
  body: string,
  citationIds: string[] = [],
) => ({ id, title, body, citationIds });
const evidenceLimit =
  "These references describe the materials and experimental conditions in the cited publications. They do not verify the identity, purity, stability or suitability of a Svolta catalog vial. Supplier specifications and authentic batch documentation remain pending. No human or veterinary use is intended.";
const blendLimit =
  "Ingredient studies are not evidence that this exact combination has been studied, is compatible or has additive effects. No study of this exact Svolta formulation is cited here. The stated recipe is owner-confirmed catalog information, not an analytical measurement of manufactured material.";
const pendingMolecular =
  "Supplier-specific sequence, molecular mass, salt/counterion, water content and analytical identity have not been verified. Numerical molecular values and storage or stability instructions are intentionally withheld until supported by appropriate records.";
export const seedArticles: ResearchArticle[] = seedProducts.map((p) => {
  const base = {
    image: null,
    productId: p.id,
    title: `${p.name}: research reference`,
    status: "published" as const,
    reviewedAt: "2026-10-14",
    seoTitle: `${p.name} research context`,
    seoDescription: `Scientific background, evidence limitations and primary references for ${p.name}. Laboratory research only.`,
    molecularNotes: pendingMolecular,
  };
  if (p.id === "glp-2-tz")
    return {
      ...base,
      evidenceLabel: "Preclinical and clinical literature",
      summary:
        "Tirzepatide research context, with a clear distinction between the commercial catalog name and the molecule described in the literature.",
      overview:
        "GLP-2 (TZ) is the catalog display name for tirzepatide. Published research describes GIP and GLP-1 receptor activity. The display name does not identify native GLP-2. This provisional vial is for laboratory research only, not human or veterinary use.",
      identityText:
        "The intended scientific identity is tirzepatide, also reported as LY3298176. “GLP-2 (TZ)” is a Svolta catalog name; it should not be interpreted as a claim that the material is the naturally occurring GLP-2 hormone.",
      sections: [
        section(
          "background",
          "Compound identification",
          "Coskun and colleagues described LY3298176 as a modified peptide with activity at GIP and GLP-1 receptors.",
          [sources.tirzepatide.id],
        ),
        section(
          "models",
          "Experimental context",
          "The 2018 study combined receptor assays, mouse experiments and early human investigation. These are different evidence settings and must be interpreted separately. Receptor activity is a research characteristic, not a guarantee about a catalog material.",
          [sources.tirzepatide.id],
        ),
        section("limits", "Evidence and interpretation", evidenceLimit),
        section(
          "documentation",
          "Material verification",
          "A literature identifier is not a batch identity test. Before any publication of physical specifications, supplier records must establish sequence, composition, format and analytical identity. Literature concerning pharmaceutical preparations does not establish equivalence of this provisional catalog entry.",
        ),
      ],
      references: [sources.tirzepatide],
    };
  if (p.id === "bpc-157")
    return {
      ...base,
      evidenceLabel: "Preclinical research",
      summary:
        "A preclinical literature starting point for BPC-157, emphasizing what animal pharmacokinetic experiments can and cannot establish.",
      overview:
        "BPC-157 is a synthetic pentadecapeptide investigated in preclinical research. The cited work examines pharmacokinetic and distribution questions in rats and dogs. Such findings do not establish human safety or efficacy. Laboratory research only; not for human or veterinary use.",
      identityText:
        "BPC-157 is described as a synthetic peptide containing fifteen amino-acid residues. The provisional catalog identity and listed mass must still be checked against actual supplier documentation.",
      sections: [
        section(
          "background",
          "Scientific background",
          "The cited 2022 primary study examined the disposition of BPC157 in rats and dogs, including pharmacokinetics, distribution, metabolism and excretion.",
          [sources.bpc.id],
        ),
        section(
          "models",
          "Preclinical findings in context",
          "The investigators reported species-specific pharmacokinetic observations. These findings describe their experimental material and models; they should not be translated into a human schedule, treatment recommendation or storage instruction.",
          [sources.bpc.id],
        ),
        section("limits", "Limitations of the evidence", evidenceLimit),
        section(
          "documentation",
          "Questions for supplier verification",
          "Sequence identity, counterion, content, physical format and batch evidence remain unverified for the Svolta entry. Neither the listed 10 mg mass nor a literature citation is a certificate of analysis.",
        ),
      ],
      references: [sources.bpc],
    };
  if (p.id === "ghk-cu")
    return {
      ...base,
      evidenceLabel: "Preclinical research",
      summary:
        "An introduction to a copper-associated tripeptide and primary animal-model work on extracellular matrix biology.",
      overview:
        "GHK-Cu is a copper complex of glycyl-L-histidyl-L-lysine. Published preclinical work examines extracellular matrix responses in experimental rat wounds. These observations do not establish clinical benefit or verify Svolta material. Laboratory research only; not for human or veterinary use.",
      identityText:
        "GHK denotes glycyl-L-histidyl-L-lysine; the Cu designation indicates a copper complex. Supplier-specific complex composition, counterions and content must be independently established.",
      sections: [
        section(
          "background",
          "Compound background",
          "Maquart and colleagues investigated GHK-Cu in experimental wound chambers in rats. Their analysis concerned connective tissue accumulation and related biochemical endpoints.",
          [sources.ghk.id],
        ),
        section(
          "models",
          "Experimental findings",
          "The study reported changes in extracellular matrix-associated measurements in that animal model. This is preclinical evidence; it does not demonstrate a human treatment outcome or show what an untested catalog vial contains.",
          [sources.ghk.id],
        ),
        section("limits", "Evidence limitations", evidenceLimit),
        section(
          "documentation",
          "Material-specific questions",
          "The 50 mg listing is a provisional catalog specification. Copper content, complex stoichiometry, peptide content and supplier-specific molecular values need authentic documentation. No purity percentage is currently available.",
        ),
      ],
      references: [sources.ghk],
    };
  if (p.id === "glp-3-rt")
    return {
      ...base,
      evidenceLabel: "Clinical literature",
      summary:
        "Retatrutide literature context, distinguishing triple-receptor research from the provisional GLP-3 (RT) catalog label.",
      overview:
        "GLP-3 (RT) is the catalog display name for retatrutide. Published clinical research describes combined GIP, GLP-1 and glucagon receptor agonism. Findings from a clinical trial do not validate this catalog vial. Laboratory research only; not for human or veterinary use.",
      identityText:
        "The intended identity is retatrutide. “GLP-3 (RT)” is a commercial catalog designation, not the name of a native GLP-3 hormone and not proof of identity or regulatory eligibility.",
      sections: [
        section(
          "background",
          "Research background",
          "The cited 2023 phase 2 study examined retatrutide, described as a GIP, GLP-1 and glucagon receptor agonist, in a controlled clinical setting.",
          [sources.retatrutide.id],
        ),
        section(
          "models",
          "Reading clinical evidence",
          "That randomized trial evaluated defined trial material, participants and outcomes. Its results cannot be generalized to unverified supplier materials, other formulations or a research catalog entry. This page omits treatment schedules and administration instructions.",
          [sources.retatrutide.id],
        ),
        section("limits", "Limitations and boundaries", evidenceLimit),
        section(
          "documentation",
          "Identity before specification",
          "The 10 mg mass and lyophilized-vial format remain provisional. Batch identity, composition, stability and documentary evidence have not been established. Current legal and provider eligibility must be reviewed separately before any transaction activation.",
        ),
      ],
      references: [sources.retatrutide],
    };
  if (p.id === "melanotan-1")
    return {
      ...base,
      evidenceLabel: "Clinical literature",
      summary:
        "A literature reference for Melanotan-I and melanocortin-related pigmentation research, distinct from Melanotan-II.",
      overview:
        "Melanotan-1 is associated in the literature with the α-MSH analogue [Nle4-D-Phe7]-α-MSH, called Melanotan-I. The cited study examined pigmentation-related endpoints in humans; it does not establish this catalog material’s identity or suitability. Not for human or veterinary use.",
      identityText:
        "The intended literature identity is Melanotan-I, an α-melanocyte-stimulating hormone analogue. Melanotan-I and Melanotan-II are different compounds and must not be substituted in references or supplier specifications.",
      sections: [
        section(
          "background",
          "Scientific identification",
          "The cited primary paper identifies [Nle4-D-Phe7]-α-MSH as Melanotan-I and investigates eumelanin-related measurements in human skin.",
          [sources.melanotan.id],
        ),
        section(
          "models",
          "Evidence context",
          "This study concerns defined experimental conditions and a particular preparation. It does not establish safety, efficacy or suitability for a provisional vial bearing the same catalog name. No cosmetic, tanning or therapeutic use is recommended.",
          [sources.melanotan.id],
        ),
        section("limits", "Interpretation limits", evidenceLimit),
        section(
          "documentation",
          "Pending supplier confirmation",
          "The listed 10 mg content is provisional. Supplier confirmation is required for peptide identity, chemical form, analytical content and physical specifications. No relationship to an approved pharmaceutical product is claimed.",
        ),
      ],
      references: [sources.melanotan],
    };
  const klow = p.id === "klow-stack";
  const refs = klow
    ? [sources.ghk, sources.kpv, sources.tb, sources.bpc]
    : [sources.bpc, sources.tb];
  return {
    ...base,
    evidenceLabel: "Ingredient evidence only",
    summary: klow
      ? "An owner-confirmed four-component research blend. Read ingredient literature separately from evidence for the exact combined formulation."
      : "An owner-confirmed BPC-157 and TB-500 research blend. Its listed composition is not evidence of combined effects.",
    overview: klow
      ? "KLOW Stack lists GHK-Cu 50 mg, KPV 10 mg, TB-500 10 mg and BPC-157 10 mg, totaling 80 mg. References concern individual ingredients, not this exact combination. Laboratory research only; not for human or veterinary use."
      : "Wolverine Stack lists BPC-157 10 mg and TB-500 10 mg, totaling 20 mg. Ingredient research does not establish the behavior of this exact blend. Laboratory research only; not for human or veterinary use.",
    identityText: `${p.name} is an owner-defined catalog formulation. Its component masses are provisional specifications; composition, identity and compatibility have not been analytically verified.`,
    sections: [
      section(
        "formulation",
        "Confirmed catalog formulation",
        p.composition.map((c) => `${c.name}: ${c.massMg} mg`).join(". ") +
          `. Total listed mass: ${p.massMg} mg. These are owner-confirmed recipe values, not measured results.`,
      ),
      section(
        "ingredients",
        "Ingredient research context",
        klow
          ? "GHK-Cu has been studied in rat wound models; KPV has been examined in cell and mouse intestinal-inflammation models. BPC-157 has preclinical disposition literature. The references are ingredient-specific starting points, not a study of this mixture."
          : "The cited BPC-157 work concerns rats and dogs. The TB-500 reference is an analytical investigation of a specific preparation. Their methods and findings do not test the combined Wolverine formulation.",
        klow
          ? [sources.ghk.id, sources.kpv.id, sources.bpc.id]
          : [sources.bpc.id],
      ),
      section(
        "tb-identity",
        "TB-500 identity requires care",
        "Ho and colleagues analyzed N-acetylated LKKTETQ in a preparation called TB-500. A catalog name alone does not establish that a supplier uses this same peptide species. It should not be silently equated with full-length thymosin β4.",
        [sources.tb.id],
      ),
      section("limits", "No combined-formulation claim", blendLimit),
      section("documentation", "Outstanding documentation", evidenceLimit),
    ],
    references: refs,
  };
});
export function visibleArticles(articles: ResearchArticle[]) {
  return articles.filter((a) => a.status === "published");
}
