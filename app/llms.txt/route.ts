import { site } from "@/lib/site";
import { getAllCategories } from "@/lib/catalog";

// /llms.txt: resumen de la tienda en Markdown para asistentes de IA (formato
// de llmstxt.org: un título H1, una cita con el resumen y listas de enlaces).
// Se arma con las mismas categorías que el sitemap para no quedar
// desactualizado al crear una nueva. Antes no existía y la ruta caía en la
// página de "no encontrado" (HTML), que PageSpeed marcaba como inválida.
//
// Solo la tienda pública: el catálogo mayorista no se menciona aquí, igual
// que en el sitemap.
export const revalidate = 3600;

export async function GET() {
  const base = site.url;

  let categorias = "";
  try {
    const cats = await getAllCategories();
    categorias = cats
      .map((c) => `- [${c.name}](${base}/coleccion?categoria=${c.slug})`)
      .join("\n");
  } catch {
    // Sin base de datos se sirve el resto del archivo igual.
  }

  const body = `# ${site.fullName}

> ${site.description}

Tienda de joyería en ${site.address}. Los precios de la web son referenciales:
la compra se confirma por WhatsApp (${site.whatsappDisplay}), donde se acuerdan
disponibilidad, forma de pago (Addi, Sistecrédito, tarjetas débito y crédito)
y envío a toda Colombia.

## Tienda

- [Inicio](${base}/): portada con promociones y categorías.
- [Colección](${base}/coleccion): catálogo completo con precios.
- [Nuestra historia](${base}/historia): ${site.yearsInMarket} años en el mercado.
- [Contacto](${base}/contacto): WhatsApp, dirección y horario.
${categorias ? `\n## Categorías\n\n${categorias}\n` : ""}
## Contacto

- [WhatsApp](https://wa.me/${site.whatsapp})
- [Instagram](${site.instagram})
- [Mapa de la tienda](${site.mapsUrl})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
