import { z } from "zod";
export const assetPathSchema = z
  .string()
  .regex(/^\/brand\/[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/);
export const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  identity: z.string().max(200),
  massMg: z.number().positive().max(10000),
  priceCents: z.number().int().min(0).max(1000000),
  category: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9][A-Za-z0-9 &()-]+$/),
  description: z.string().max(2000),
  available: z.boolean(),
  composition: z.array(
    z.object({
      name: z.string().min(1).max(100),
      massMg: z.number().positive(),
    }),
  ),
  gallery: z
    .array(z.object({ src: assetPathSchema, alt: z.string().min(1).max(200) }))
    .max(6)
    .default([]),
  image: z
    .string()
    .regex(/^\/brand\/[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/)
    .or(z.literal("")),
});
export type Product = z.infer<typeof productSchema>;
const entries = [
  ["glp-2-tz", "GLP-2 (TZ)", "tirzepatide", 5, 4999],
  ["bpc-157", "BPC-157", "BPC-157", 10, 4999],
  ["ghk-cu", "GHK-Cu", "GHK-Cu", 50, 3999],
  ["glp-3-rt", "GLP-3 (RT)", "retatrutide", 10, 6999],
  ["melanotan-1", "Melanotan-1", "Melanotan-1", 10, 3999],
  ["wolverine-stack", "Wolverine Stack", "BPC-157 + TB-500", 20, 8999],
  ["klow-stack", "KLOW Stack", "GHK-Cu + KPV + TB-500 + BPC-157", 80, 11999],
] as const;
export const seedProducts: Product[] = entries.map(
  ([id, name, identity, massMg, priceCents], i) => ({
    id,
    name,
    identity,
    massMg,
    priceCents,
    category: i > 4 ? "Research blend" : "Single compound",
    description:
      "Provisional laboratory research catalog entry. Supplier specifications and supporting documentation are pending review. Not for human or veterinary use.",
    available: false,
    image: "",
    gallery: [],
    composition:
      i === 5
        ? [
            { name: "BPC-157", massMg: 10 },
            { name: "TB-500", massMg: 10 },
          ]
        : i === 6
          ? [
              { name: "GHK-Cu", massMg: 50 },
              { name: "KPV", massMg: 10 },
              { name: "TB-500", massMg: 10 },
              { name: "BPC-157", massMg: 10 },
            ]
          : [{ name: identity, massMg }],
  }),
);
export const settingsSchema = z.object({
  heroTitle: z.string().min(1).max(120),
  heroText: z.string().min(1).max(500),
  announcement: z.string().min(1).max(120),
  announcementEnabled: z.boolean(),
  shippingThresholdCents: z.number().int().min(0).max(1000000),
  navy: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  cyan: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const defaultSettings: z.infer<typeof settingsSchema> = {
  heroTitle: "A brighter tomorrow starts with research.",
  heroText:
    "Explore a focused collection of research compounds, with a considered approach to scientific information and laboratory documentation.",
  announcement: "FREE SHIPPING ON ORDERS {threshold}+",
  announcementEnabled: true,
  shippingThresholdCents: 15000,
  navy: "#062640",
  cyan: "#00add0",
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const VERIFICATION_KEY = "svolta-research-ack-v1";
export const ACK_DURATION = 30 * 24 * 60 * 60 * 1000;
export function validAcknowledgment(value: string | null, now = Date.now()) {
  if (!value) return false;
  const expires = Number(value);
  return (
    Number.isFinite(expires) && expires > now && expires <= now + ACK_DURATION
  );
}

export type CartItem = { productId: string; quantity: number };
export type ShopProduct = { id: string; name: string; massMg: number; priceCents: number; available: boolean };
export type Order = {
  id: string; createdAt: string; status: string; emailStatus: string;
  customer: { fullName: string; email: string; address1: string; address2: string; city: string; region: string; postalCode: string; country: string };
  items: { productId: string; name: string; massMg: number; quantity: number; unitPriceCents: number; availabilityConfirmed: boolean }[];
  estimatedSubtotalCents: number;
  invoice: null | { number: string; shippingCents: number; taxCents: number; totalCents: number; payment: { handle: string; recipientName: string }; senderEmail: string; supportEmail: string };
};
