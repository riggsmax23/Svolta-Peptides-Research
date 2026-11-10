import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/faq", "Frequently Asked Questions", "Answers about Svolta\u2019s research catalog, documentation, storage information, unpaid order requests and off-site invoice payments.", false);
import {
  CircleHelp,
  Thermometer,
  FlaskConical,
  Shield,
  Package,
  Mail,
  MessageCircle,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import {
  marketingContent,
  faqAnswer,
  supplierCopy,
} from "@/lib/marketing-content";
import { contactEmail, inquiryHref } from "@/lib/site-content";

const icons = {
  help: CircleHelp,
  thermometer: Thermometer,
  flask: FlaskConical,
  shield: Shield,
  package: Package,
};
export default function FaqPage() {
  const faq = marketingContent.faq;
  return (
    <div className="svolta-faq">
      <div className="faq-heading">
        <span className="eyebrow">{faq.eyebrow}</span>
        <h1>{faq.title}</h1>
      </div>
      <div className="faq-body">
        {faq.categories
          .filter((c) => c.enabled && c.items.length > 0)
          .map((category) => {
            const Icon = icons[category.icon as keyof typeof icons];
            return (
              <section
                className="faq-category"
                key={category.id}
                aria-labelledby={`faq-${category.id}`}
              >
                <div className="faq-category-heading">
                  <span className="faq-category-icon">
                    <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h2 id={`faq-${category.id}`}>{category.title}</h2>
                  <span className="faq-heading-line" />
                  {"link" in category && category.link && (
                    <a className="faq-coa-link" href={category.link.href}>
                      {category.link.label}
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
                <div className="faq-questions">
                  {category.items.map((item) => (
                    <details
                      className="faq-item"
                      key={item.id}
                      name={`faq-${category.id}`}
                    >
                      <summary>
                        <span>{item.question}</span>
                        <ChevronDown
                          size={17}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </summary>
                      <div className="faq-answer">
                        <p>{faqAnswer(item)}</p>
                        {"link" in item && item.link && (
                          <a className="link-arrow" href={item.link.href}>
                            {item.link.label} ↗
                          </a>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        <section
          className="faq-category faq-contact"
          aria-labelledby="faq-contact-title"
        >
          <div className="faq-category-heading">
            <span className="faq-category-icon">
              <MessageCircle size={17} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h2 id="faq-contact-title">{faq.contact.title}</h2>
            <span className="faq-heading-line" />
          </div>
          <p>
            {faq.contact.intro} Visit the{" "}
            <a href="/contact/">contact page</a> for details.
          </p>
          <p>{supplierCopy("service").answer}</p>
          {contactEmail && (
            <a className="faq-email" href={inquiryHref()}>
              <Mail size={19} strokeWidth={1.5} />
              <span>
                <small>Email</small>
                {contactEmail}
              </span>
              <ArrowUpRight size={18} />
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
