"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useWholesaleSelection } from "@/lib/store";
import { formatCOP } from "@/lib/format";
import { buildWholesaleSelectionLink } from "@/lib/whatsapp";

// Pedido del catálogo mayorista: barra flotante + panel para ajustar
// cantidades y enviarlo completo por WhatsApp. Deliberadamente NO enlaza a
// /producto/[slug] (esa ruta muestra el precio de venta al detal) ni menciona
// la marca, igual que el resto de esta página.
export default function WholesaleOrder() {
  const { items, isOpen, open, close, remove, setQty, clear } =
    useWholesaleSelection();
  const [mounted, setMounted] = useState(false);

  // El carrito se lee de localStorage, que no existe al renderizar en el
  // servidor: sin esperar al montaje, el HTML del servidor y el del navegador
  // no coinciden.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  if (!mounted || items.length === 0) return null;

  return (
    <>
      {/* Barra flotante */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border glass px-5 py-3 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">
              {count} {count === 1 ? "pieza" : "piezas"} en tu pedido
            </p>
            <p className="text-xs text-secondary">Total {formatCOP(total)}</p>
          </div>
          <button
            onClick={open}
            className="btn-primary shrink-0 whitespace-nowrap"
          >
            <ShoppingBag className="h-4 w-4" /> Ver pedido
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-background shadow-2xl"
              role="dialog"
              aria-label="Mi pedido"
            >
              <header className="flex items-center justify-between border-b border-border px-5 py-5">
                <h2 className="font-serif text-2xl">Mi pedido</h2>
                <button
                  onClick={close}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="space-y-5">
                  {items.map((i) => (
                    <li key={i.slug} className="flex gap-4">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                        <Image
                          src={i.image}
                          alt={i.name}
                          fill
                          sizes="80px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif text-lg leading-tight">
                            {i.name}
                          </span>
                          <button
                            onClick={() => remove(i.slug, i.size)}
                            aria-label="Quitar"
                            className="text-secondary/50 transition-colors hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="mt-0.5 text-xs text-secondary/70">
                          {formatCOP(i.price)} c/u
                        </span>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
                            <button
                              onClick={() => setQty(i.slug, i.size, i.qty - 1)}
                              aria-label="Disminuir"
                              className="text-secondary transition-colors hover:text-accent cursor-pointer"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            {/* Escribible: un distribuidor que pide 45 unidades
                                no puede darle 45 veces al "+". Al enfocar se
                                selecciona todo, así teclear la cifra la
                                reemplaza en vez de agregarse a la actual. */}
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={i.qty}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => {
                                const n = parseInt(e.target.value, 10);
                                if (Number.isFinite(n) && n > 0) {
                                  setQty(i.slug, i.size, Math.min(n, 999));
                                }
                              }}
                              aria-label={`Cantidad de ${i.name}`}
                              className="w-12 [appearance:textfield] bg-transparent text-center text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => setQty(i.slug, i.size, i.qty + 1)}
                              aria-label="Aumentar"
                              className="text-secondary transition-colors hover:text-accent cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCOP(i.price * i.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="border-t border-border px-5 py-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-secondary">Total</span>
                  <span className="font-serif text-2xl">{formatCOP(total)}</span>
                </div>
                <p className="mb-4 text-xs text-secondary/60">
                  Precios de mayorista. Confirmamos disponibilidad y cantidades
                  mínimas por WhatsApp.
                </p>
                <a
                  href={buildWholesaleSelectionLink(items, total)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 ease-luxe hover:brightness-105 active:scale-[0.98]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Enviar pedido por WhatsApp
                </a>
                <button
                  onClick={clear}
                  className="mt-3 block w-full text-center text-sm text-secondary underline-offset-4 transition-colors hover:text-destructive hover:underline cursor-pointer"
                >
                  Vaciar pedido
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
