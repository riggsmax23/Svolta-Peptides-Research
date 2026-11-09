import { pageMetadata } from '@/lib/site-content';
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products, researchArticle, researchArticles } from "@/lib/db";
import { ResearchArticleView } from "@/components/research-article";
export const dynamicParams = false;
export function generateStaticParams() { return researchArticles().map(a => ({slug:a.productId})); }
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = researchArticle(slug)?.article;
  return pageMetadata(`/research/${slug}`, a?.seoTitle || a?.title || 'Reference not available', a?.seoDescription || a?.summary || 'This reference is unavailable.', a?.status !== 'published');
}
export default async function ResearchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products().find((p) => p.id === slug);
  const article = researchArticle(slug)?.article;
  if (!product || !article || article.status !== "published") notFound();
  return <ResearchArticleView article={article} product={product} />;
}
