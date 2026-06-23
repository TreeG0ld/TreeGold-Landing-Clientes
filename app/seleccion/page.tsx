import type { Metadata } from "next";
import SelectionView from "@/components/SelectionView";

export const metadata: Metadata = {
  title: "Mi selección",
  description: "Revisa tu selección de joyas y finaliza tu pedido por WhatsApp.",
};

export default function SeleccionPage() {
  return <SelectionView />;
}
