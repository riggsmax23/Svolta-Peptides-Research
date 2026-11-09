"use client";
import { useState } from "react";
import { Menu, X, ArrowUpRight, ShoppingBag } from "lucide-react";
import { useCart } from './cart-provider';
export function Header({
  announcement,
  navigation,
}: {
  announcement: string | null;
  navigation: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <>
      {announcement && (
        <div className="announcement">
          ✦ <span>{announcement}</span> ✦
        </div>
      )}
      <header>
        <a
          href="/"
          aria-label="Svolta Peptides Research home"
          className="brand"
        >
          <img src="/brand/wordmark.png" alt="Svolta Peptide Research" width={468} height={210} fetchPriority="high" decoding="async" />
        </a>
        <nav id="primary-navigation" className={open ? "nav expanded" : "nav"} aria-label="Primary">
          {navigation.map((n) => (
            <a
              key={n.href + n.label}
              href={n.href}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </a>
          ))}
          <details>
            <summary>
              Research <span>⌄</span>
            </summary>
            <div className="dropdown">
              <a
                href="/research/"
                onClick={(event) => {
                  setOpen(false);
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
              >
                Research Library <ArrowUpRight size={14} />
              </a>
              <a
                href="/coa-library/"
                onClick={(event) => {
                  setOpen(false);
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
              >
                COA Library <ArrowUpRight size={14} />
              </a>
            </div>
          </details>
        </nav>
        <div className="nav-tools">
          <a href="/cart/" className="header-cart" aria-label={`Cart, ${count} items`}><ShoppingBag size={19} /><span className="cart-count">{count}</span></a>
          <a href="/contact/" className="header-contact">Get in touch <ArrowUpRight size={16} /></a>
          <button
            className="mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
