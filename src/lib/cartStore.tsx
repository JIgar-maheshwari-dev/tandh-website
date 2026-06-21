"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasMoqViolation: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "tandh-studio-cart-v1";

function lineKey(productId: string, size?: string) {
  return `${productId}__${size ?? ""}`;
}

function roundToStep(value: number, step: number) {
  if (!step || step <= 0) return value;
  const rounded = Math.round(value / step) * step;
  // avoid floating point noise like 1.0000000002
  return Math.round(rounded * 1000) / 1000;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage might be full or unavailable — fail silently, cart still works in-memory
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => lineKey(i.productId, i.size) === lineKey(newItem.productId, newItem.size)
      );
      if (idx > -1) {
        const updated = [...prev];
        const combinedQty = roundToStep(
          updated[idx].quantity + newItem.quantity,
          newItem.moqStep
        );
        updated[idx] = { ...updated[idx], quantity: Math.max(combinedQty, newItem.moq) };
        return updated;
      }
      return [...prev, { ...newItem, quantity: Math.max(newItem.quantity, newItem.moq) }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.size) !== lineKey(productId, size)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (lineKey(i.productId, i.size) !== lineKey(productId, size)) return i;
        const stepped = roundToStep(quantity, i.moqStep);
        const floor = Math.max(stepped, i.moq);
        return { ...i, quantity: floor };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );
  const hasMoqViolation = useMemo(() => items.some((i) => i.quantity < i.moq), [items]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((v) => !v),
    totalItems,
    totalPrice,
    hasMoqViolation,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
