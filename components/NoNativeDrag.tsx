"use client";

import { useEffect } from "react";

// Impide arrastrar imágenes y enlaces en todo el sitio (tienda, mayoristas y
// admin). En Chrome, Edge y Safari ya lo hace la regla `-webkit-user-drag` de
// globals.css; esto cubre Firefox, que no la entiende.
//
// Solo cancela arrastres que EMPIEZAN en una imagen o un enlace: arrastrar
// texto dentro de un campo de formulario sigue funcionando, y soltar archivos
// desde la computadora no pasa por `dragstart`, así que tampoco se afecta.
export default function NoNativeDrag() {
  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("img, a")) e.preventDefault();
    };
    document.addEventListener("dragstart", onDragStart);
    return () => document.removeEventListener("dragstart", onDragStart);
  }, []);

  return null;
}
