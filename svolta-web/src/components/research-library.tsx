"use client";
import { useState } from "react";
import type { ResearchArticle } from "@/lib/research";
import type { Product } from "@/lib/catalog";
export function ResearchLibrary({
  articles,
  products,
}: {
  articles: ResearchArticle[];
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All references");
  const filtered = articles.filter((a) => {
    const p = products.find((p) => p.id === a.productId);
    return (
      `${p?.name} ${p?.identity} ${a.title}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All references" ||
        (filter === "Blends"
          ? a.evidenceLabel === "Ingredient evidence only"
          : a.evidenceLabel !== "Ingredient evidence only"))
    );
  });
  return (
    <>
      <div className="research-tools">
        <div className="tabs">
          {["All references", "Single compounds", "Blends"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="research-search"
          aria-label="Search research references"
          placeholder="Search compound or scientific identity"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="research-result-count" role="status">
        {filtered.length} reference {filtered.length === 1 ? "page" : "pages"}
      </p>
      <div className="research-grid">
        {filtered.map((a, i) => {
          const p = products.find((p) => p.id === a.productId)!;
          return (
            <article key={a.productId} className="research-card">
              <div className="research-card-top">
                <span className="eyebrow">
                  REFERENCE / {String(i + 1).padStart(2, "0")}
                </span>
                <span className="evidence-pill">{a.evidenceLabel}</span>
              </div>
              <h2>
                <a href={`/research/${a.productId}/`}>{p.name}</a>
              </h2>
              <p>{a.summary}</p>
              <div className="research-card-bottom">
                <span>
                  {a.references.length} primary{" "}
                  {a.references.length === 1 ? "source" : "sources"}
                </span>
                <a href={`/research/${a.productId}/`}>Read reference ↗</a>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <p className="empty">
          No references match your search. Try a compound name or scientific
          identity.
        </p>
      )}
    </>
  );
}
