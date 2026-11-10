'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { CartItem, ShopProduct } from '@/lib/catalog';
const CART_KEY = 'svolta-request-cart-v1';
const MAX_CART_QUANTITY = 20;
type Cart = { items: CartItem[]; products: ShopProduct[]; ready: boolean; count: number; add: (id: string, quantity?: number) => void; setQuantity: (id: string, quantity: number) => void; clear: () => void };
const Context = createContext<Cart | null>(null);
export function CartProvider({ products, children }: { products: ShopProduct[]; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
      if (Array.isArray(saved)) setItems(saved.filter(i => products.some(p => p.id === i?.productId) && Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= MAX_CART_QUANTITY).slice(0, 20));
    } catch { /* Storage can be unavailable; the current tab still works. */ }
    setReady(true);
  }, [products]);
  useEffect(() => { if (ready) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {} } }, [items, ready]);
  const setQuantity = (id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_CART_QUANTITY) return;
    setItems(items => items.flatMap(i => i.productId !== id ? [i] : quantity ? [{ ...i, quantity }] : []));
  };
  const add = (id: string, quantity = 1) => {
    if (!products.some(p => p.id === id) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) return;
    setItems(items => items.some(i => i.productId === id) ? items.map(i => i.productId === id ? { ...i, quantity: Math.min(MAX_CART_QUANTITY, i.quantity + quantity) } : i) : [...items, { productId: id, quantity }]);
  };
  const clear = () => {
    // Persist before the receipt navigation unloads this document.
    try { localStorage.removeItem(CART_KEY); } catch {}
    setItems([]);
  };
  return <Context.Provider value={{ items, products, ready, count: items.reduce((n, i) => n + i.quantity, 0), add, setQuantity, clear }}>{children}</Context.Provider>;
}
export function useCart() {
  const cart = useContext(Context);
  if (!cart) throw new Error('Cart provider is missing');
  return cart;
}

export function ProductPurchase({ productId }: { productId: string; available?: boolean }) {
  const cart = useCart();
  const quantity = cart.items.find(item => item.productId === productId)?.quantity ?? 0;
  const atLimit = quantity >= MAX_CART_QUANTITY;
  return <div className="purchase-preview catalog-inquiry">
    <button type="button" className="button full" disabled={!cart.ready || atLimit} data-cart-limit={atLimit} onClick={() => cart.add(productId)}>
      {!atLimit && <Plus size={17} aria-hidden="true" />}
      {!cart.ready ? 'Loading cart…' : atLimit ? 'Cart limit reached' : quantity ? 'Add another' : 'Add to request'}
    </button>
    <div className="cart-feedback" data-filled={quantity > 0}>
      <span role="status" aria-atomic="true">{quantity > 0 && <><Check size={17} aria-hidden="true" /> {quantity} in cart</>}</span>
      {quantity > 0 && <a href="/cart/">View cart <ArrowUpRight size={14} aria-hidden="true" /></a>}
    </div>
    <p>Availability and specifications are pending review. Request an invoice; no payment is collected here.</p>
  </div>;
}
