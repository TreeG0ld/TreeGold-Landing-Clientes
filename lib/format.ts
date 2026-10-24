// Formato de precio en pesos colombianos (COP), sin decimales: $1.200.000
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

// Campos de precio del panel (components/admin/PriceInput): se ven con punto de
// miles mientras se escriben, pero el formulario guarda y envía solo los
// dígitos. Importa: el servidor lee el texto con Number(), y "380.000" lo
// leería como 380 pesos.

/** Solo los dígitos de lo que se escribió, sin ceros a la izquierda: "$ 380.000" → "380000". */
export function priceDigits(text: string): string {
  return text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/**
 * Cómo se muestra en el campo un precio guardado: "380000" → "380.000". Punto
 * de miles siempre, también en miles de 4 cifras ("5.000"; Intl en español no
 * los separa). Un precio con decimales de la base de datos se redondea.
 */
export function formatPriceInput(value: string): string {
  if (value.trim() === "") return "";
  const digits = /^\d+$/.test(value) ? value : String(Math.round(Number(value)));
  if (!/^\d+$/.test(digits)) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
