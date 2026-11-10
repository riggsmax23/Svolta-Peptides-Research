import content from "@/data/site-content.json";
export const marketingContent = content;
export type FaqItem = {
  id: string;
  question: string;
  answer?: string;
  supplierKey?: string;
  link?: { label: string; href: string };
};
export function supplierCopy(key: string) {
  const copy = content.supplier[key as keyof typeof content.supplier];
  if (!copy) throw new Error(`Unknown supplier content key: ${key}`);
  return copy;
}
export function faqAnswer(item: FaqItem) {
  const answer = item.supplierKey
    ? supplierCopy(item.supplierKey).answer
    : item.answer;
  if (!answer?.trim()) throw new Error(`Missing FAQ answer: ${item.id}`);
  return answer;
}
