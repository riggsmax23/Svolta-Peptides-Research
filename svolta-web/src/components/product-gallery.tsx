"use client";
import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Vial } from "./vial";
import type { Product } from "@/lib/catalog";
export function ProductGallery({ product }: { product: Product }) {
  const [view, setView] = useState(0);
  const [zoom, setZoom] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (zoom && !modal.current?.open) modal.current?.showModal();
    if (!zoom && modal.current?.open) modal.current?.close();
  }, [zoom]);
  const images = [
    ...(product.image
      ? [{ src: product.image, alt: `${product.name} supplied catalog image` }]
      : []),
    ...product.gallery,
  ];
  const illustrated = images.length === 0;
  const tabs = illustrated
    ? ["Vial illustration", "Label detail"]
    : images.map((_, i) => `Image ${i + 1}`);
  const scene = (
    <div
      className={`detail-scene ${illustrated && view === 1 ? "label-view" : ""}`}
    >
      {illustrated ? (
        <Vial product={product} large />
      ) : (
        <img
          className="detail-photo"
          src={images[view]?.src || images[0].src}
          alt={images[view]?.alt || images[0].alt}
          width={600}
          height={800}
          decoding="async"
        />
      )}
    </div>
  );
  return (
    <div className="product-gallery">
      <div className="gallery-stage">
        <span className="stage-id">SV / {product.id.toUpperCase()}</span>
        {scene}
        <button
          className="zoom-button"
          aria-label="Enlarge product image"
          onClick={() => setZoom(true)}
        >
          <Maximize2 size={17} />
        </button>
      </div>
      <div
        className="gallery-tabs"
        role="group"
        aria-label="Product image views"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab}
            aria-pressed={view === i}
            onClick={() => setView(i)}
          >
            {String(i + 1).padStart(2, "0")} / {tab}
          </button>
        ))}
      </div>
      <p className="image-caption">
        {illustrated
          ? "Original design illustration. Not a photograph of manufactured inventory. Final approved photography is pending."
          : "Owner-supplied catalog imagery. Verify that images match the actual product before publication."}
      </p>
      <dialog
        ref={modal}
        className="gallery-zoom"
        aria-label={`${product.name} enlarged image`}
        onCancel={() => setZoom(false)}
        onClose={() => setZoom(false)}
      >
        <button
          className="close"
          aria-label="Close enlarged image"
          onClick={() => setZoom(false)}
        >
          <X />
        </button>
        {scene}
        <p>
          {illustrated
            ? "Design illustration · Not manufactured inventory"
            : images[view]?.alt}
        </p>
      </dialog>
    </div>
  );
}
