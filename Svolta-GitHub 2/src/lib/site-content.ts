import snapshot from "@/data/catalog.json";
import siteContent from "@/data/site-content.json";
import type { Metadata } from "next";
export const website = siteContent.website;
export const canonicalUrl = (path = "/") => new URL(path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`, website.origin).href;
export function pageMetadata(path: string, title: string, description: string, privatePage = false): Metadata {
  const url = canonicalUrl(path);
  const shareTitle = `${title} | Svolta Research`;
  const image = new URL('/brand/social-share.png', website.origin).href;
  return {
    title, description, alternates: { canonical: url },
    robots: { index: !privatePage && website.indexingEnabled, follow: !privatePage && website.indexingEnabled },
    openGraph: { type: 'website', title: shareTitle, description, url, siteName: website.businessName, locale: 'en_US', images: [{ url: image, width: 1200, height: 630, alt: 'Svolta Peptide Research — laboratory research catalog' }] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image] },
  };
}
export const publicPagePaths = [
  '/', '/compounds', '/research', '/coa-library', '/about', '/contact', '/faq', '/privacy', '/terms', '/cookies', '/accessibility',
  ...snapshot.products.map(p => `/compounds/${p.id}`),
  ...snapshot.articles.filter(a => a.status === 'published').map(a => `/research/${a.productId}`),
];
export type SiteContent = {
  title: string;
  intro: string;
  sections: ("hero" | "principles" | "collection" | "story" | "transparency")[];
  collectionTitle: string;
  storyTitle: string;
  storyText: string;
  transparencyTitle: string;
  transparencyText: string;
  font: string;
  spacing: string;
  footerText: string;
  navigation: { label: string; href: string }[];
  paragraphs: string[];
};
export function siteDocument(slug: string): { published: SiteContent | null } {
  const raw = snapshot.documents[slug as keyof typeof snapshot.documents];
  if (!raw) return { published: null };
  return {
    published: {
      ...raw,
      footerText: raw.footerText ?? "Research fuels a brighter tomorrow.",
      navigation: [
        ...(raw.navigation ?? [
          { label: "Compounds", href: "/compounds/" },
          { label: "About", href: "/about/" },
          { label: "Contact", href: "/contact/" },
        ]),
        ...((raw.navigation ?? []).some((n) => n.href.replace(/\/+$/, '') === "/faq")
          ? []
          : [{ label: "FAQ", href: "/faq/" }]),
      ],
    } as SiteContent,
  };
}

// Use the current owner-published contact address, not a fabricated form endpoint.
export const contactEmail = siteDocument('contact').published?.paragraphs.join(' ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
export function inquiryHref(compound?: string) {
 return contactEmail ? `mailto:${contactEmail}?subject=${encodeURIComponent(compound ? `Research catalog inquiry: ${compound}` : 'Svolta research catalog inquiry')}` : '/contact/';
}
