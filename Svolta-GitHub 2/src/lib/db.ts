// Build-time published catalog snapshot. No database, sessions, or private records.
import snapshot from '@/data/catalog.json';
import { productSchema, settingsSchema } from './catalog';
import { articleSchema } from './research';
export const products = () => snapshot.products.map(p => productSchema.parse(p));
export const settings = () => settingsSchema.parse(snapshot.settings);
export const researchArticles = () => snapshot.articles.map(a => articleSchema.parse(a));
export const researchArticle = (id: string) => {
  const article = researchArticles().find(a => a.productId === id);
  return article ? { article } : null;
};

// Original application has no published reports. Never synthesize COAs.
export const reports = (): never[] => [];
