import type { MetadataRoute } from 'next';
import { canonicalUrl, publicPagePaths } from '@/lib/site-content';
export default function sitemap(): MetadataRoute.Sitemap {
  // No customer, checkout, account, owner, receipt or query-string URLs.
  return publicPagePaths.map(path => ({ url: canonicalUrl(path) }));
}
