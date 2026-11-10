import { type SiteContent } from "@/lib/site-content";
import { marketingContent } from "@/lib/marketing-content";
import { reports } from "@/lib/db";
import {
  ArrowUpRight,
  ArrowRight,
  Clock,
  Droplet,
  FileText,
  Truck,
} from "lucide-react";
import { products, settings } from "@/lib/db";
import { Collection } from "@/components/collection";
import { Vial } from "@/components/vial";
import { Fragment } from "react";
import { WhyChoose } from "./why-choose";
const promiseIcons: Record<string, typeof FileText> = {
  shipping: Truck,
  "bac-water": Droplet,
  delivery: Clock,
};

export function HomeContent({ content }: { content: SiteContent }) {
  const reportCount = reports().length;
  const p = products();
  const s = settings();
  const sections = {
    hero: (
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="line" /> SVOLTA PEPTIDES RESEARCH
          </div>
          <h1>{s.heroTitle}</h1>
          <p>{s.heroText}</p>
          <div className="hero-actions">
            <a className="button" href="/compounds/">
              Explore compounds <ArrowUpRight size={19} />
            </a>
            <a className="link-arrow" href="/research/">
              Our approach <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-foot">
            <span>01 / THE RESEARCH COLLECTION</span>
            <span>LABORATORY USE ONLY</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbital orbital-one" />
          <div className="orbital orbital-two" />
          <span className="hero-art-label">CONSIDERED. FOCUSED. SVOLTA.</span>
          <div className="hero-vial back">
            <Vial product={p[2]} large />
          </div>
          <div className="hero-vial front">
            <Vial product={p[1]} large />
          </div>
          <div className="specimen-note">
            <i /> THE SVOLTA COLLECTION
            <span>
              Original design illustrations
              <br />
              Final product photography pending
            </span>
          </div>
        </div>
      </section>
    ),
    principles: (
      <section className="svolta-promise" id="svolta-promise" aria-labelledby="svolta-promise-title">
        <div className="svolta-promise-inner">
          <h2 id="svolta-promise-title">The <span>Svolta</span> Promise</h2>
          <p className="svolta-promise-intro">{marketingContent.homePromise.intro}</p>
          <ul className="svolta-promise-grid" role="list">
            {marketingContent.homePromise.cards.map((card) => {
              const Icon = promiseIcons[card.id] ?? FileText;
              return (
                <li className="svolta-promise-card" key={card.id}>
                  <span className="svolta-promise-label"><Icon size={15} aria-hidden="true" />{card.label}</span>
                  <h3>{card.title}</h3>
                  <div className="svolta-promise-value">
                    {card.value && <s>{card.value}</s>}
                    <strong>{card.offer}</strong>
                  </div>
                  <p>{card.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    ),
    collection: (
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COLLECTION / 01</span>
            <h2>{content.collectionTitle}</h2>
          </div>
          <a className="link-arrow" href="/compounds/">
            View all compounds <ArrowUpRight size={18} />
          </a>
        </div>
        <Collection products={p} featured />
        <p className="catalog-caption">
          Provisional catalog · Illustrations shown · Payment by invoice
        </p>
      </section>
    ),
    story: (
      <section className="brand-story">
        <span className="eyebrow">A NEW PERSPECTIVE ON RESEARCH</span>
        <h2>{content.storyTitle}</h2>
        <p>{content.storyText}</p>
        <a href="/about/" className="link-arrow">
          Discover Svolta <ArrowUpRight size={18} />
        </a>
        <div className="story-number">S / 01</div>
      </section>
    ),
    transparency: (
      <section className="transparency">
        <div>
          <span className="eyebrow">RESEARCH TRANSPARENCY</span>
          <h2>{content.transparencyTitle}</h2>
          <p>{content.transparencyText}</p>
          <p className="status-note">
            <i />{" "}
            {reportCount
              ? `${reportCount} published report(s). Inspect original batch documentation.`
              : "Documentation pending. No verified reports available yet."}
          </p>
        </div>
        <a className="button outline" href="/coa-library/">
          View COA Library <ArrowUpRight size={18} />
        </a>
      </section>
    ),
  };
  return (
    <div
      className={`site-content font-${content.font} spacing-${content.spacing}`}
    >
      {content.sections.map((id) => (
        <Fragment key={id}>
          <div>{sections[id]}</div>
          {id === "collection" && <WhyChoose />}
        </Fragment>
      ))}
      <section className="home-disclaimer" id="research-disclaimer" aria-labelledby="research-disclaimer-title">
        <div className="home-disclaimer-inner">
          <h2 id="research-disclaimer-title">Research Use Disclaimer</h2>
          {marketingContent.homeDisclaimer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="home-disclaimer-age"><strong>{marketingContent.homeDisclaimer.ageRequirement}</strong></p>
        </div>
      </section>
    </div>
  );
}
