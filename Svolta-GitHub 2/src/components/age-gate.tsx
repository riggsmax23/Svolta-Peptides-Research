"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { marketingContent } from '@/lib/marketing-content';
import {
  ACK_DURATION,
  VERIFICATION_KEY,
  validAcknowledgment,
} from "@/lib/catalog";
export function AgeGate() {
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState(false);
  const [research, setResearch] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    let valid = false;
    try {
      valid = validAcknowledgment(localStorage.getItem(VERIFICATION_KEY));
    } catch {}
    const path = pathname.replace(/\/+$/, '') || '/';
    const publicPolicy = ['/privacy', '/terms', '/cookies', '/accessibility', '/access-denied'].includes(path);
    setOpen(!valid && !publicPolicy && !path.startsWith('/manage'));
  }, [pathname]);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) {
      setAge(false);
      setResearch(false);
      dialog?.showModal();
    }
    if (!open && dialog?.open) dialog?.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="age-modal"
      aria-labelledby="age-title"
      closedby="none"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onClose={() => {
        if (open) ref.current?.showModal();
      }}
      onCancel={(e) => e.preventDefault()}
    >
      <span className="eyebrow">SVOLTA / RESEARCH ACCESS</span>
      <h2 id="age-title">
        AGE &amp; RESEARCH
        <br />
        USE VERIFICATION
      </h2>
      <p>
        This collection is intended for laboratory research. Please confirm
        before you continue.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={age}
          onChange={(e) => setAge(e.target.checked)}
        />{" "}
        <span>I confirm that I am at least 21 years old.</span>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={research}
          onChange={(e) => setResearch(e.target.checked)}
        />
        <span>
          I understand that these products are intended for laboratory research
          only and are not for human or veterinary use.
        </span>
      </label>
      <button
        className="button full"
        disabled={!age || !research}
        onClick={() => {
          try {
            localStorage.setItem(
              VERIFICATION_KEY,
              String(Date.now() + ACK_DURATION),
            );
          } catch {}
          setOpen(false);
        }}
      >
        ENTER SITE <span>↗</span>
      </button>
      <a className="exit" href="/access-denied/">
        I am under 21 / Exit site
      </a>
      <small>
        Acknowledgment is remembered for 30 days on this browser. It does not
        establish product legality or purchaser eligibility.
      </small>
    </dialog>
  );
}
export function ResetAcknowledgment() {
  return (
    <button
      className="text-button"
      onClick={() => {
        try {
          localStorage.removeItem(VERIFICATION_KEY);
        } catch {}
        location.reload();
      }}
    >
      Reset research acknowledgment
    </button>
  );
}

const CONSENT_KEY = 'svolta-privacy-choice-v1';
export function SharePage() {
  const path = usePathname();
  const [message, setMessage] = useState('');
  if (/^\/(cart|checkout|manage|api|access-denied)(\/|$)/.test(path)) return null;
  return <div className="share-page"><button type="button" onClick={async () => {
    const url = new URL(path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`, marketingContent.website.origin).href;
    try { await navigator.clipboard.writeText(url); setMessage('Page link copied.'); }
    catch { setMessage(`Copy this page link: ${url}`); }
  }}>Copy page link</button><span role="status">{message}</span></div>;
}
type PrivacyChoice = { analytics: boolean; expires: number };
export function CookiePreferences() {
  const [choice, setChoice] = useState<PrivacyChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const measured = useRef('');
  const globalOptOut = () => Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null');
      if (typeof saved?.analytics === 'boolean' && typeof saved?.expires === 'number' && saved.expires > Date.now()) setChoice(saved);
      else setOpen(true);
    } catch { setOpen(true); }
    setReady(true);
  }, []);
  function save(analytics: boolean) {
    const next = { analytics: analytics && !globalOptOut(), expires: Date.now() + 180 * 86400000 };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch {}
    setChoice(next); setOpen(false);
  }
  useEffect(() => {
    if (!ready || !choice?.analytics || !marketingContent.website.analyticsEnabled || globalOptOut()) return;
    const send = (path: string, event: string) => {
      void fetch('/api/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true, path, event }), keepalive: true,
      }).catch(() => { /* Optional measurement never blocks browsing or checkout. */ });
    };
    const privatePage = /^\/(cart|checkout|manage|api|access-denied)(\/|$)/.test(pathname);
    if (!privatePage && measured.current !== pathname) {
      measured.current = pathname;
      send(pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`, 'page_view');
    }
    const click = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!link) return;
      const url = new URL(link.getAttribute('href')!, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (/^\/compounds\/?$/.test(url.pathname)) send('/compounds/', 'catalog_click');
      if (/^\/checkout\/?$/.test(url.pathname)) send('/checkout/', 'checkout_start');
    };
    const submitted = () => send('/checkout/', 'invoice_request');
    document.addEventListener('click', click);
    window.addEventListener('svolta-request-saved', submitted);
    return () => { document.removeEventListener('click', click); window.removeEventListener('svolta-request-saved', submitted); };
  }, [ready, choice, pathname]);
  return <>
    <div className="cookie-settings-link"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="privacy-preferences">Cookie preferences</button></div>
    <section id="privacy-preferences" className="cookie-panel" hidden={!ready || !open} aria-labelledby="privacy-preferences-title">
      <div><h2 id="privacy-preferences-title">Your privacy choices.</h2><p>Essential storage supports your cart, research acknowledgment, saved requests and privacy preferences. Optional analytics counts page views and actions without visitor IDs or third-party tracking. It stays off unless you allow it.</p><a href="/cookies/">Cookie details</a> · <a href="/privacy/">Privacy policy</a></div>
      <div className="cookie-actions"><button type="button" className="button outline" onClick={() => save(false)}>Essential only</button><button type="button" className="button outline" onClick={() => save(true)}>Allow analytics</button></div>
      {ready && globalOptOut() && <p className="cookie-gpc">Your browser’s global privacy signal keeps analytics disabled.</p>}
      {choice && <p className="cookie-current">Current choice: {choice.analytics ? 'analytics allowed' : 'essential only'}. You can change this at any time.</p>}
    </section>
  </>;
}
