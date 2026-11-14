import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/header";
import { AgeGate, ResetAcknowledgment, CookiePreferences, SharePage } from "@/components/age-gate";
import { products, settings } from "@/lib/db";
import { CartProvider } from "@/components/cart-provider";
import { siteDocument, pageMetadata, website } from "@/lib/site-content";
import "./globals.css";
import "./checkout.css";
export const metadata: Metadata = {
  ...pageMetadata('/', 'Svolta Peptide Research', 'Explore Svolta’s laboratory research catalog, scientific references and documentation. Submit an unpaid invoice request; payment happens separately.'),
  metadataBase: new URL(website.origin),
  title: {
    default: "Svolta Peptides Research — Research Catalog",
    template: "%s | Svolta Research",
  },
  description:
    "Svolta laboratory research catalog. Explore compounds, review documentation, and submit an unpaid invoice request. Payment is handled separately.",
  icons: { icon: [{ url: "/brand/circular.png", type: 'image/png', sizes: '64x64' }], shortcut: '/brand/circular.png', apple: '/brand/circular.png' },
  robots: { index: website.indexingEnabled, follow: website.indexingEnabled },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate the document per request so its scripts use the same nonce as the CSP.
  await connection();
  const s = settings(),
    content = siteDocument("home").published!;
  return (
    <html
      lang="en"
      style={{ "--navy": s.navy, "--cyan": s.cyan } as React.CSSProperties}
    >
      <body>
        <CartProvider products={products().map(({id, name, massMg, priceCents, available}) => ({id, name, massMg, priceCents, available}))}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header
          navigation={content.navigation}
          announcement="FOR LABORATORY RESEARCH ONLY · PAYMENT BY INVOICE"
        />
        <main id="main" tabIndex={-1}>{children}</main>
        <footer>
          <div className="footer-top">
            <div>
              <b className="footer-brand">
                SVOLTA<span> / </span>
              </b>
              <p>{content.footerText}</p>
            </div>
            <div>
              <span className="eyebrow">EXPLORE</span>
              <a href="/compounds/">Compounds</a>
              <a href="/research/">Research Library</a>
              <a href="/coa-library/">COA Library</a>
            </div>
            <div>
              <span className="eyebrow">SVOLTA</span>
              <a href="/about/">About Svolta</a>
              <a href="/contact/">Contact</a>
              <a href="/faq/">FAQ</a>
              <a href="/privacy/">Privacy</a>
              <a href="/terms/">Terms</a>
              <a href="/cookies/">Cookies</a>
              <a href="/accessibility/">Accessibility</a>
            </div>
            <div className="footer-disclaimer">
              <span className="eyebrow">FOR LABORATORY RESEARCH ONLY</span>
              <p>
                Not for human or veterinary use. Catalog specifications and
                prices are provisional. Order requests are subject to review.
                No payments are collected on this website.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Svolta Peptide Research</span>
            <ResetAcknowledgment />
            <span className="dev-label">
              <i /> PRIVATE CATALOG PREVIEW
            </span>
          </div>
        </footer>
        <AgeGate />
        <CookiePreferences />
        <SharePage />
        </CartProvider>
      </body>
    </html>
  );
}
