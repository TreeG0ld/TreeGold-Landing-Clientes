"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import SelectionDrawer from "@/components/SelectionDrawer";
import FlyToCart from "@/components/FlyToCart";

// El panel /admin tiene su propia navegación (AdminNav) y no debe mostrar
// el navbar/footer/FAB de la tienda pública.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFAB />
      <SelectionDrawer />
      <FlyToCart />
    </>
  );
}
