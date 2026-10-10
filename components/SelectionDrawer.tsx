"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, Lock } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useSelection } from "@/lib/store";
import { formatCOP } from "@/lib/format";
import { buildSelectionLink } from "@/lib/whatsapp";
import { lockScroll } from "@/lib/scroll-lock";
import EmptyBagIcon from "@/components/EmptyBagIcon";
import FreeShippingHint from "@/components/FreeShippingHint";

export default function SelectionDrawer() {
  const { items, isOpen, close, remove, setQty } = useSelection();
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  useEffect(() => {
    if (!isOpen) return;
    return lockScroll();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-background shadow-2xl"
            role="dialog"
            aria-label="Mi selección"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-5">
              <h2 className="font-serif text-2xl">Mi selección</h2>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <EmptyBagIcon />
                <p className="font-serif text-2xl text-secondary">
                  Tu selección está vacía
                </p>
                <p className="text-sm text-secondary/70">
                  Explora la colección y guarda tus piezas favoritas.
                </p>
                <Link href="/coleccion" onClick={close} className="btn-primary mt-2">
                  Ver colección
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="space-y-5">
                    {items.map((i) => (
                      <li
                        key={`${i.slug}-${i.size ?? ""}`}
                        className="flex gap-4"
                      >
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={i.image}
                            alt={i.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/producto/${i.slug}`}
                              onClick={close}
                              className="font-serif text-lg leading-tight transition-colors hover:text-accent"
                            >
                              {i.name}
                            </Link>
                            <button
                              onClick={() => remove(i.slug, i.size)}
                              aria-label="Quitar"
                              className="text-secondary/50 transition-colors hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {i.size && (
                            <span className="mt-0.5 text-xs text-secondary/70">
                              Talla {i.size}
                            </span>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
                              <button
                                onClick={() => setQty(i.slug, i.size, i.qty - 1)}
                                aria-label="Disminuir"
                                className="text-secondary transition-colors hover:text-accent cursor-pointer"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-4 text-center text-sm">{i.qty}</span>
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
                    <span className="text-sm text-secondary">Total estimado</span>
                    <span className="font-serif text-2xl">{formatCOP(total)}</span>
                  </div>
                  <p className="mb-3 text-xs text-secondary/60">
                    Paga en línea de forma segura o finaliza tu pedido por WhatsApp.
                  </p>
                  <div className="mb-4">
                    <FreeShippingHint subtotal={total} />
                  </div>
                  {/* Dos caminos con el mismo peso visual. Antes el pago en
                      línea solo se alcanzaba con un enlace chico ("Ver
                      selección completa") que casi nadie notaba. ?pagar=1 abre
                      el formulario de pago directamente en /seleccion. */}
                  <Link
                    href="/seleccion?pagar=1"
                    onClick={close}
                    className="btn-primary w-full py-4"
                  >
                    <Lock className="h-4 w-4" />
                    Pagar en línea
                  </Link>
                  <p className="mb-3 mt-1.5 text-center text-xs text-secondary/60">
                    Tarjeta, PSE, Nequi y más · Pago seguro con Wompi
                  </p>
                  <a
                    href={buildSelectionLink(items, total)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 ease-luxe hover:brightness-105 active:scale-[0.98]"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Finalizar por WhatsApp
                  </a>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
