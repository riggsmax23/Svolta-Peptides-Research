import {
  Tag,
  FlaskConical,
  Shield,
  FileCheck,
  MessageCircle,
  Layers3,
} from "lucide-react";
import { marketingContent, supplierCopy } from "@/lib/marketing-content";
const icons = {
  tag: Tag,
  flask: FlaskConical,
  shield: Shield,
  document: FileCheck,
  message: MessageCircle,
  layers: Layers3,
};
export function WhyChoose() {
  const content = marketingContent.whyChoose;
  return (
    <section
      className="svolta-why"
      id="why-svolta"
      aria-labelledby="why-svolta-title"
    >
      <div className="why-inner">
        <div className="why-heading">
          <h2 id="why-svolta-title">
            {content.title} <span>{content.brand}</span>?
          </h2>
          <p>{content.intro}</p>
        </div>
        <div className="why-grid">
          {content.cards.map((card) => {
            const copy =
              "supplierKey" in card && card.supplierKey
                ? supplierCopy(card.supplierKey)
                : card;
            if (!("title" in copy) || !("summary" in copy))
              throw new Error(`Missing card copy: ${card.id}`);
            const Icon = icons[card.icon as keyof typeof icons];
            return (
              <article className="why-card" key={card.id}>
                <div className="why-icon">
                  <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3>{copy.title}</h3>
                <div className="why-rule" />
                <p>{copy.summary}</p>
                {"href" in card && card.href && (
                  <a className="why-card-link" href={card.href}>
                    {card.id === "documentation"
                      ? "View documentation"
                      : "Contact Svolta"}{" "}
                    ↗
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
