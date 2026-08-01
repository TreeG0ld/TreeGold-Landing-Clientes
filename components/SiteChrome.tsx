"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import SelectionDrawer from "@/components/SelectionDrawer";
import FlyToCart from "@/components/FlyToCart";

// El panel /admin tiene su propia navegación (AdminNav) y no debe mostrar
// el navbar/footer/FAB de la tienda pública. La tienda mayorista
// (/mayoristas-<código>) es una página discreta sin marca: tampoco los lleva.
//
// El pie de página llega como prop desde el layout (no se importa aquí) porque
// no necesita interactividad: así se queda renderizado en el servidor en vez
// de viajar como JavaScript al navegador en cada página.
export default function SiteChrome({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless =
    pathname?.startsWith("/admin") || pathname?.startsWith("/mayoristas-");

  if (isChromeless) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      {footer}
      <WhatsAppFAB />
      <SelectionDrawer />
      <FlyToCart />
    </>
  );
}
