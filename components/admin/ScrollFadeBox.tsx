"use client";

import { useEffect, useRef, useState } from "react";

// Recuadro con scroll propio que, mientras quede contenido más abajo, muestra
// en su borde inferior un desvanecido con desenfoque: avisa que la tabla sigue
// aunque la última fila visible parezca el final. Al llegar al fondo se
// apaga, para no tapar la última fila.
export default function ScrollFadeBox({
  className,
  children,
}: {
  /** Clases del recuadro que hace scroll (alto máximo, borde, fondo...). */
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [masAbajo, setMasAbajo] = useState(false);
  // Ancho de la barra de scroll vertical: el desvanecido termina antes para
  // no quedar encima de ella.
  const [barra, setBarra] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      // 4px de margen: con zoom del navegador el fondo puede quedar a
      // fracciones de píxel y el desvanecido no se apagaría nunca.
      setMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
      setBarra(el.offsetWidth - el.clientWidth);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    // También al cambiar de tamaño la ventana o el contenido (filtrar,
    // editar una categoría en línea...).
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={className}>
        {children}
      </div>
      <div
        aria-hidden="true"
        style={{ right: barra + 1 }}
        // Sin barra visible (Mac, celular) el desvanecido llega a la esquina
        // derecha, que también va redondeada.
        className={`pointer-events-none absolute bottom-px left-px h-20 rounded-bl-2xl ${barra === 0 ? "rounded-br-2xl" : ""} bg-gradient-to-t from-white via-white/70 to-transparent backdrop-blur-[2px] transition-opacity duration-300 [mask-image:linear-gradient(to_top,black_35%,transparent)] ${
          masAbajo ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
