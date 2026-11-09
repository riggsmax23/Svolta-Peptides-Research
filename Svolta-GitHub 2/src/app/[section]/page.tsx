import { siteDocument, pageMetadata, website } from "@/lib/site-content";
import { notFound } from "next/navigation";
import { contactEmail, inquiryHref } from '@/lib/site-content';
export const dynamicParams = false;
export function generateStaticParams() { return ['about','contact','terms','cookies','accessibility','access-denied'].map(section => ({section})); }
const pages: Record<
  string,
  { label: string; title: string; text: string; phase?: string; sections?: { title: string; body: string }[] }
> = {
  about: {
    label: "ABOUT / SVOLTA",
    title: "Research fuels a brighter tomorrow.",
    text: "Svolta Peptides Research is developing a focused catalog of laboratory research compounds with an emphasis on clear scientific information and accessible documentation. Supplier relationships, product specifications and testing records remain under review. This private development site is an opportunity to refine that experience before any launch.",
  },
  contact: {
    label: "CONTACT / SUPPORT",
    title: "Start a conversation.",
    text: "Business contact: herbert@svoltapeptideresearch.com. This email address has been supplied by the owner; delivery has not been verified. No external email is sent from this preview. Please do not submit sensitive information through this preview.",
  },
  terms: {
    label: "POLICIES / TERMS", title: "Terms of use.",
    text: "These terms explain the current Svolta Peptide Research catalog and unpaid invoice-request process. Supplier availability and return terms remain under review. Confirm delivery eligibility and applicable purchase terms before paying an invoice.",
    sections: [
      {title:"Research-only catalog",body:"Materials are presented for laboratory research only, not human, veterinary, therapeutic or diagnostic use. Scientific references describe published studies and do not verify Svolta material. No dosing or administration guidance is provided."},
      {title:"Age and eligibility",body:"Catalog access asks you to confirm that you are at least 21 and acknowledge research use. This is self-attestation and does not verify identity, affiliation or eligibility. Svolta reviews requests and may decline a request that cannot be fulfilled appropriately."},
      {title:"Provisional listings",body:"Identities, vial masses, composition, prices, physical format and availability remain provisional until supporting supplier records and an invoice are reviewed. Illustrations are design placeholders, not photographs of inventory. No unverified purity or testing claim should be inferred."},
      {title:"Unpaid requests and invoices",body:"Completing checkout saves an unpaid request. It does not reserve stock, collect payment or confirm acceptance. Svolta reviews availability, delivery eligibility and final charges before preparing an itemized invoice. Review that invoice and ask about discrepancies before paying."},
      {title:"Separate payment",body:"Wait for the reviewed invoice. Payment is arranged separately through the business Venmo profile specified in that invoice. Verify the recipient and references. This website does not collect card or Venmo login details, and a request is not marked paid merely because it was submitted."},
      {title:"Shipping, changes and returns",body:"The Svolta Promise on the homepage describes what’s included with orders and the free replacement offer for late delivery. Confirm delivery eligibility and applicable return terms before paying an invoice. For a delivery issue, correction, or cancellation question, contact Svolta with your order reference."},
      {title:"Website use",body:"Provide accurate details for your own request. Do not misuse the site, submit automated spam, attempt unauthorized access or copy customer information. Contact Svolta if a page, price or record appears incorrect."},
      {title:"Privacy and policy updates",body:"The Privacy and Cookie policies explain the current data practices. Future supplier, service or purchasing changes must be reflected in the applicable information before relying on them. This page does not identify a governing jurisdiction or claim to replace applicable legal rights."},
    ],
  },
  cookies: {
    label:"POLICIES / COOKIES",title:"Cookies & browser storage.",
    text:"Essential storage supports functions you request. Optional aggregate analytics remains off unless you allow it. You can change that choice using Cookie preferences in the footer.",
    sections:[
      {title:"Saved requests",body:"svolta_order_session is an HttpOnly, SameSite=Lax cookie, Secure on HTTPS, with a 30-day maximum age. It lets the same browser retrieve its own saved request. It is not a payment credential."},
      {title:"Cart and research acknowledgment",body:"svolta-request-cart-v1 stores cart contents in local storage until you clear or complete the request, or clear browser storage. svolta-research-ack-v1 remembers the age/research acknowledgment for up to 30 days. These values do not verify identity or supplier eligibility."},
      {title:"Privacy choice and checkout retries",body:"svolta-privacy-choice-v1 stores your optional analytics choice for 180 days. svolta-pending-request-key is session storage used to prevent duplicate order requests; it is removed after a successful submission. Clearing browser storage removes these local values."},
      {title:"Optional measurement",body:"Choosing Allow analytics enables first-party aggregate counts. The feature sets no analytics cookies and assigns no visitor ID. Essential only prevents those requests. No form values, receipt references or customer records are included in measurement. A supported Global Privacy Control signal keeps it off."},
      {title:"Hosting and browser controls",body:"Sites sign-in and hosting security may use their own necessary cookies. Those are controlled by the hosting service rather than this optional analytics setting. Browser settings can block or delete storage, but doing so may affect cart persistence, sign-in and access to saved requests."},
    ],
  },
  accessibility: {
    label:"SUPPORT / ACCESSIBILITY",title:"Access to the catalog.",
    text:"Svolta aims to make its catalog usable with keyboards, screen readers and mobile devices. This describes the features and checks in this implementation; it is not a certification of full WCAG conformance.",
    sections:[
      {title:"Navigation and reading",body:"Pages use landmarks and headings, a skip-to-content link, visible keyboard focus, descriptive link names and text alternatives for meaningful images. Research category cards are buttons with selected states; menus and native disclosures can be opened with a keyboard."},
      {title:"Forms and dialogs",body:"Checkout fields have visible labels, appropriate input types and required-field validation. Errors and status messages are announced. Native dialogs manage focus for the research acknowledgment and image enlargement. The full checkout requires JavaScript; email support is available if a feature is inaccessible."},
      {title:"Display preferences",body:"Layouts adapt to smaller screens and browser zoom. Reduced-motion preferences are respected. Optional analytics can be refused without blocking the catalog or checkout."},
      {title:"Report a barrier",body:"Email the contact address below with the page, feature and assistive technology involved. Include only the information needed to describe the problem. No support-response deadline has been established."},
    ],
  },
  "access-denied": {
    label: "ACCESS / RESTRICTED",
    title: "Research access is restricted.",
    text: "You must be at least 21 and acknowledge laboratory research use to enter this preview.",
  },
};
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
 const { section } = await params;
 const page = pages[section];
 const descriptions: Record<string, string> = {
  about: 'Learn about Svolta Peptide Research, its focus on a clear laboratory catalog, and the status of supplier and material documentation.',
  contact: 'Contact Svolta Peptide Research about catalog information, documentation or an unpaid invoice request using the published business email.',
  terms: 'Understand research-only access, provisional catalog listings, unpaid requests, reviewed invoices and separate payment arrangements at Svolta.',
  cookies: 'Learn how Svolta uses essential browser storage and optional aggregate analytics, and how to change your privacy choices.',
  accessibility: 'Read about keyboard navigation, text alternatives, responsive layouts and how to report an accessibility barrier on the Svolta catalog.',
  'access-denied': 'Research catalog access requires an adult research-use acknowledgment. Public privacy and policy pages remain available.',
 };
 return pageMetadata(`/${section}`, page?.title.replace(/\.$/, '') || 'Page not found', descriptions[section] || 'This page is not in the Svolta catalog.', !page || section === 'access-denied');
}
export default async function Section({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const page = pages[section];
  const content = ["about", "contact"].includes(section)
    ? siteDocument(section).published
    : null;
  if (!page) notFound();
  return (
    <section className={page.sections ? "request-page privacy-page" : "status-page"}>
      <span className="eyebrow">{page.label}</span>
      <h1>{content?.title || page.title}</h1>
      {content ? (
        content.paragraphs.map((p, i) => <p key={i}>{p}</p>)
      ) : (
        <p>{page.text}</p>
      )}
      {page.sections && <><p>Last updated: {website.updatedAt} · {website.businessName}</p>{page.sections.map(item => <section key={item.title}><h2>{item.title}</h2><p>{item.body}</p></section>)}<p>Contact: <a href={inquiryHref()}>{contactEmail}</a></p><nav className="policy-links" aria-label="Related policies"><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms of use</a><a href="/cookies/">Cookie policy</a></nav></>}
      {page.phase && (
        <div className="notice">
          Scheduled for {page.phase}. This feature is not active in the current
          phase.
        </div>
      )}
      {section === 'contact' && contactEmail && <div className="contact-actions"><a className="button" href={inquiryHref()}>Email Svolta ↗</a><p className="muted">Your email application will open. This website does not collect your message or payment information.</p></div>}
      <a
        className="button"
        href={section === "access-denied" ? "/" : "/compounds"}
      >
        {section === "access-denied"
          ? "Return to verification"
          : "Explore the collection"}{" "}
        ↗
      </a>
    </section>
  );
}
