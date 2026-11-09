"use client";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Search, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { money } from "@/lib/catalog";
import { Vial } from "./vial";
import { marketingContent } from "@/lib/marketing-content";
import { ProductPurchase } from './cart-provider';
export function Collection({
  products,
  featured = false,
}: {
  products: Product[];
  featured?: boolean;
}) {
  const [filter, setFilter] = useState("All compounds");
  const [sort, setSort] = useState(featured ? "Featured" : "Name: A–Z");
  const [query, setQuery] = useState("");
  const [researchArea, setResearchArea] = useState("all");
  const resultSummary = useRef<HTMLDivElement>(null);
  const activeArea = marketingContent.researchCategories.find((area) => area.id === researchArea);
  function selectArea(id: string) {
    setResearchArea(id);
    setFilter("All compounds");
    setQuery("");
  }
  function showArea(id: string) {
    selectArea(id);
    // Let the updated results render before moving focus to their summary.
    requestAnimationFrame(() => {
      resultSummary.current?.focus({ preventScroll: true });
      resultSummary.current?.scrollIntoView({ block: "start" });
    });
  }
  const filtered = useMemo(() => {
    // Homepage selections retain their editorial order and have no catalog controls.
    if (featured) return products;
    const list = products.filter(
      (p) =>
        (!activeArea || activeArea.products.some((item) => item.id === p.id)) &&
        (filter === "All compounds" || p.category === filter) &&
        `${p.name} ${p.identity}`.toLowerCase().includes(query.toLowerCase().trim()),
    );
    const byName = (a: Product, b: Product) =>
      a.name.localeCompare(b.name, "en", { numeric: true });
    switch (sort) {
      case "Price: low to high":
        return list.sort((a, b) => a.priceCents - b.priceCents || byName(a, b));
      case "Price: high to low":
        return list.sort((a, b) => b.priceCents - a.priceCents || byName(a, b));
      case "Name: A–Z":
        return list.sort(byName);
      case "Name: Z–A":
        return list.sort((a, b) => byName(b, a));
      default:
        return list;
    }
  }, [products, featured, activeArea, filter, sort, query]);
  return (
    <>
      {!featured && (
        <section className="research-picker" aria-labelledby="research-picker-title">
          <div className="research-picker-heading">
            <div>
              <span className="eyebrow">EXPLORE THE COLLECTION</span>
              <h2 id="research-picker-title" tabIndex={-1}>What are you researching?</h2>
            </div>
            {activeArea && <button type="button" className="research-picker-reset" onClick={() => showArea("all")}>View all compounds</button>}
          </div>
          <div className="research-picker-grid">
            {marketingContent.researchCategories.map((area, index) => {
              const members = area.products.filter((item) => products.some((p) => p.id === item.id));
              return (
                <button
                  type="button"
                  key={area.id}
                  className={`research-picker-card${researchArea === area.id ? " selected" : ""}`}
                  aria-pressed={researchArea === area.id}
                  aria-controls="compound-results"
                  onClick={() => showArea(area.id)}
                >
                  <span className="research-picker-top"><span>0{index + 1} / {members.length} compounds</span>{researchArea === area.id ? <span className="research-picker-selected"><Check size={14} aria-hidden="true" /> Selected</span> : <ArrowUpRight size={20} aria-hidden="true" />}</span>
                  <span className="research-picker-name">{area.title}</span>
                  <span className="research-picker-products">{members.map((item) => item.label).join(" · ")}</span>
                  <span className="research-picker-action">{researchArea === area.id ? "View results" : "Browse compounds"} <span aria-hidden="true">↓</span></span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {!featured && (
        <div className="collection-results" ref={resultSummary} tabIndex={-1}>
          <div role="status" aria-atomic="true">
            <h2>{activeArea?.title ?? "All compounds"}</h2>
            <p>{filtered.length === products.length
              ? `Showing all ${products.length} compounds`
              : `Showing ${filtered.length} of ${products.length} compounds`}</p>
          </div>
          {activeArea && <div className="collection-result-actions">
            <a href="#research-picker-title">Change category ↑</a>
            <button type="button" onClick={() => showArea("all")}>Clear category</button>
          </div>}
        </div>
      )}
      {!featured && (
        <div className="collection-tools">
          <div className="tabs" aria-label="Compound categories">
            {["All compounds", "Single compound", "Research blend"].map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? "active" : ""}
                aria-pressed={filter === f}
                aria-controls="compound-results"
                onClick={() => setFilter(f)}
              >
                {f === "Single compound"
                  ? "Single compounds"
                  : f === "Research blend"
                    ? "Research blends"
                    : f}
              </button>
            ))}
          </div>
          <div className="search-sort">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search compounds"
                placeholder="Search compounds"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="sort">
              <SlidersHorizontal size={15} />
              <span>Sort by</span>
              <select
                aria-label="Sort compounds"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Featured</option>
                <option>Name: A–Z</option>
                <option>Name: Z–A</option>
                <option>Price: low to high</option>
                <option>Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
      )}
      <div className="product-grid" id={featured ? undefined : "compound-results"}>
        {(featured ? filtered.slice(0, 4) : filtered).map((p, i) => (
          <article className="product-card" key={p.id}>
            <a
              className="product-art"
              href={`/compounds/${p.id}/`}
              aria-label={`View ${p.name}`}
            >
              <span className="product-index">
                SV / {String(i + 1).padStart(2, "0")}
              </span>
              <span className="type-tag">
                {p.category === "Research blend" ? "BLEND" : "COMPOUND"}
              </span>
              <Vial product={p} />
              <span className="art-action">
                <ArrowUpRight size={19} />
              </span>
            </a>
            <div className="product-meta">
              <a href={`/compounds/${p.id}/`}>{p.name}</a>
              <span>{money(p.priceCents)}</span>
            </div>
            <div className="product-sub">
              <span>
                {p.massMg} mg <i /> {p.category}
              </span>
              <span>View details ↗</span>
            </div>
            {!featured && <div className="collection-request"><ProductPurchase productId={p.id} /></div>}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty">
          No compounds match your search. Try another name or category.
        </p>
      )}
    </>
  );
}
