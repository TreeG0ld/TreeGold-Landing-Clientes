"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

// Muestra el enlace secreto de la tienda mayorista con botón de copiar.
// Recibe la URL ya armada desde el servidor (el secreto vive en el .env).
export default function WholesaleLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback silencioso: el input de abajo permite copiar a mano.
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 font-mono text-sm text-primary"
      />
      <div className="flex shrink-0 gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/85 cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:border-accent hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" /> Abrir
        </a>
      </div>
    </div>
  );
}
