"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectionItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  qty: number;
};

type SelectionState = {
  items: SelectionItem[];
  isOpen: boolean;
  add: (item: Omit<SelectionItem, "qty">, qty?: number) => void;
  remove: (slug: string, size?: string) => void;
  setQty: (slug: string, size: string | undefined, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  count: () => number;
  total: () => number;
};

const sameLine = (a: SelectionItem, slug: string, size?: string) =>
  a.slug === slug && a.size === size;

function createSelectionStore(persistKey: string) {
  return create<SelectionState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, item.slug, item.size)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.slug, item.size)
                  ? { ...i, qty: i.qty + qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      remove: (slug, size) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, slug, size)),
        })),
      setQty: (slug, size, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (sameLine(i, slug, size) ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      total: () => get().items.reduce((n, i) => n + i.qty * i.price, 0),
    }),
    {
      name: persistKey,
      // Solo persistir los productos, no el estado de UI (drawer abierto/cerrado).
      partialize: (state) => ({ items: state.items }),
    }
  )
  );
}

export const useSelection = createSelectionStore("treegold-selection");

// Carrito aparte para el catálogo mayorista. No se comparte con el de la
// tienda pública porque los precios son de COSTO, no de venta: en una sola
// lista quedarían líneas a dos precios distintos y el pedido que llega por
// WhatsApp sería imposible de interpretar.
export const useWholesaleSelection = createSelectionStore(
  "treegold-wholesale-selection"
);
