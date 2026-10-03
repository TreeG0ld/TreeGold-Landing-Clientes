"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/lib/store";

// El cliente suele volver de Wompi ANTES de que llegue el webhook: mientras
// el pedido siga pendiente se vuelve a pedir la página cada pocos segundos
// (router.refresh re-renderiza el server component sin recargar). Cuando ya
// está pagado, se vacía la selección: esas piezas ya se compraron.
const REFRESH_EVERY_MS = 4000;
const MAX_REFRESHES = 30; // ~2 minutos; después queda el botón de recargar

export default function OrderStatusWatcher({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "PAID") {
      useSelection.getState().clear();
      return;
    }
    if (status !== "PENDING") return;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      if (count > MAX_REFRESHES) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(id);
  }, [status, router]);

  return null;
}
