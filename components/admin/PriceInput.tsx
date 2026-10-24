"use client";

import { useLayoutEffect, useRef } from "react";
import { formatPriceInput, priceDigits } from "@/lib/format";

// Campo de precio en pesos del panel: muestra "$ 380.000" mientras se escribe
// (con un precio de seis cifras el admin se perdía contando ceros) y entrega a
// onChange solo los dígitos ("380000"), que es lo que valida el servidor.
export default function PriceInput({
  value,
  onChange,
  required,
  placeholder,
}: {
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // Cuántos dígitos había antes del cursor en la última tecla: al agregar o
  // quitar puntos el texto cambia de largo, y sin esto el cursor saltaba al
  // final cada vez que se corregía un número en medio.
  const digitsBeforeCaret = useRef<number | null>(null);
  const shown = formatPriceInput(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || digitsBeforeCaret.current === null || document.activeElement !== el) return;
    placeCaret(el, shown, digitsBeforeCaret.current);
    digitsBeforeCaret.current = null;
  }, [shown]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-secondary">$</span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        onChange={(e) => {
          const el = e.target;
          const before = priceDigits(el.value.slice(0, el.selectionStart ?? el.value.length)).length;
          const digits = priceDigits(el.value);
          if (digits === value) {
            // Se tecleó algo que no es un número: el valor no cambia, React
            // devuelve el texto anterior y el cursor saltaría al final.
            requestAnimationFrame(() => placeCaret(el, shown, before));
            return;
          }
          digitsBeforeCaret.current = before;
          onChange(digits);
        }}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border py-2.5 pl-8 pr-4 text-sm tabular-nums outline-none focus:border-accent"
      />
    </div>
  );
}

/** Pone el cursor justo después del dígito número `digits` del texto. */
function placeCaret(el: HTMLInputElement, text: string, digits: number) {
  let pos = 0;
  while (pos < text.length && digits > 0) {
    if (text[pos] >= "0" && text[pos] <= "9") digits--;
    pos++;
  }
  el.setSelectionRange(pos, pos);
}
