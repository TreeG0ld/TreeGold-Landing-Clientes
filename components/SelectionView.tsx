"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useSelection } from "@/lib/store";
import { formatCOP } from "@/lib/format";
import { buildSelectionLink } from "@/lib/whatsapp";

export default function SelectionView() {
  const { items, remove, setQty, clear } = useSelection();
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hasta montar en cliente, el estado del localStorage no está disponible:
  // evitamos el desajuste de hidratación mostrando un placeholder neutro.
  if (!mounted) {
    return <div className="min-h-[60vh]" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-5 py-32 text-center">
        <h1 className="font-serif text-4xl">Tu selección está vacía</h1>
        <p className="text-secondary">
          Explora nuestra colección y guarda las piezas que te enamoren.
        </p>
        <Link href="/coleccion" className="btn-primary mt-2">
          Ver colección <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-3">Tu pedido</p>
          <h1 className="text-4xl md:text-5xl">Mi selección</h1>
        </div>
        <button
          onClick={clear}
          className="text-sm text-secondary underline-offset-4 transition-colors hover:text-destructive hover:underline cursor-pointer"
        >
          Vaciar
        </button>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Lista */}
        <ul className="divide-y divide-border border-y border-border">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.li
                key={`${i.slug}-${i.size ?? ""}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex gap-5 py-6"
              >
                <Link
                  href={`/producto/${i.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  <Image src={i.image} alt={i.name} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/producto/${i.slug}`}
                      className="font-serif text-2xl leading-tight transition-colors hover:text-accent"
                    >
                      {i.name}
                    </Link>
                    <button
                      onClick={() => remove(i.slug, i.size)}
                      aria-label="Quitar"
                      className="text-secondary/50 transition-colors hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  {i.size && (
                    <span className="mt-1 text-sm text-secondary/70">Talla {i.size}</span>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-4 rounded-full border border-border px-3 py-1.5">
                      <button
                        onClick={() => setQty(i.slug, i.size, i.qty - 1)}
                        aria-label="Disminuir"
                        className="text-secondary transition-colors hover:text-accent cursor-pointer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-5 text-center text-sm">{i.qty}</span>
                      <button
                        onClick={() => setQty(i.slug, i.size, i.qty + 1)}
                        aria-label="Aumentar"
                        className="text-secondary transition-colors hover:text-accent cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-medium">{formatCOP(i.price * i.qty)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Resumen */}
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="font-serif text-2xl">Resumen</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Piezas</span>
                <span>{items.reduce((n, i) => n + i.qty, 0)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-medium">Total estimado</span>
                <span className="font-serif text-2xl">{formatCOP(total)}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-secondary/60">
              Los precios son referenciales. Confirmamos disponibilidad, tallas y
              forma de pago por WhatsApp.
            </p>
            <a
              href={buildSelectionLink(items, total)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 ease-luxe hover:brightness-105 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Finalizar por WhatsApp
            </a>
            <Link
              href="/coleccion"
              className="mt-3 block text-center text-sm text-secondary underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Seguir explorando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
