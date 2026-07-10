# Cambios 10 de julio — TreeGold Joyería

Spec de implementación derivada de la lista original del cliente, revisada contra el
código actual y con decisiones ya confirmadas. Cada punto indica archivos afectados y
qué cambia exactamente.

## 1. Separar "Cadenas" en mujer / hombre

- **Decisión**: 2 categorías nuevas, no jerarquía. El modelo `Category` es plano
  (sin `parentId`), así que se mantiene así.
- Crear categorías `cadenas-mujer` ("Cadenas mujer") y `cadenas-hombre` ("Cadenas hombre").
- Reasignar `categoryId` de todos los productos que hoy están en `cadenas` según su
  medida (`Product.size`): 40cm/45cm/50cm → mujer, 60cm/65cm → hombre.
- Eliminar (o dejar vacía y ocultar) la categoría genérica `cadenas` una vez migrados
  todos los productos.
- Script de migración de datos en `scripts/` (patrón `PrismaPg` + `DIRECT_URL`, como
  `seed-productos.mjs`), no `prisma migrate` (el proyecto no lo usa).

## 2. Categorías nuevas: Manillas tejidas y Anillos tejidos

- **Confirmado**: son productos distintos a "Pulseras" y "Anillos" existentes (no
  sinónimos ni rename). Se crean como categorías nuevas e independientes:
  `manillas-tejidas` y `anillos-tejidos`.
- Pulseras y Anillos genéricos quedan intactos.

## 3. Sección de promociones (arriba de la home)

- **Confirmado**: manual desde `/admin`, no automática.
- Agregar campo `isPromo Boolean @default(false)` a `Product` en `schema.prisma`
  (+ aplicar con el patrón de `scripts/add-indexes.mjs`, idempotente).
- Checkbox "En promoción" en el formulario de producto del admin
  (`app/admin/(protected)/productos/...`, `app/api/admin/products/route.ts` y `[id]/route.ts`
  — agregar `isPromo` a la validación de `lib/validation.ts`).
- Nueva sección en `app/page.tsx`, **antes** del Hero o justo debajo (a definir visualmente),
  que consulta productos con `isPromo: true` y los muestra con `ProductCard` existente.
- Si no hay productos en promoción, la sección no se renderiza (sin placeholder vacío).

## 4. "Encuentra tu pieza" → carrusel

- **Confirmado**: es la grilla de categorías (Anillos, Aretes, Cadenas, Candongas, etc.)
  en `app/page.tsx:25-49`, hoy un `grid sm:grid-cols-2 lg:grid-cols-4`.
- Cambiar a carrusel horizontal con swipe, **reducido de tamaño** en mobile.
- **Recomendación técnica** (no confirmada explícitamente por el cliente, se sugiere en
  la implementación): instalar **Embla Carousel** — no hay ninguna librería de carrusel
  en el proyecto hoy (solo GSAP y Motion), y Embla es liviana, headless, con buen soporte
  touch, y se reutiliza también en el punto 5. Alternativa sin dependencias nuevas:
  scroll-snap CSS a mano. Confirmar con el cliente antes de instalar el paquete.
- En desktop puede mantenerse el grid actual o pasar a carrusel también — a definir en
  revisión visual.

## 5. Mayoristas: precio de costo + precio recomendado de venta

- Archivo `lib/wholesale.ts`: el tipo `WholesaleProduct` (línea 7-15) hoy **descarta**
  `retailPrice` — solo expone `price` (= `wholesalePrice ?? retailPrice`).
- Agregar `retailPrice: number` al tipo y al mapeo `toWholesaleProduct` (línea 17-35).
- `components/WholesaleProductCard.tsx` (línea 25 hoy solo muestra `product.price`):
  agregar segunda línea/etiqueta "Precio sugerido de venta: {formatCOP(product.retailPrice)}"
  junto al precio de costo actual.

## 6. Fuente tipográfica

- **Confirmado**: reemplazar Cormorant + Montserrat por **Marcellus + Jost**.
- Cambiar en `app/layout.tsx` (líneas 2, 7-18): importar `Marcellus` y `Jost` de
  `next/font/google` en vez de `Cormorant`/`Montserrat`, mismas variables CSS
  (`--font-cormorant` → renombrar o mantener nombre de variable, `--font-montserrat` ídem)
  para no tener que tocar cada uso de `font-serif` en el resto del código.
- Revisar `tailwind.config`/`globals.css` por si el mapeo de `font-serif`/`font-sans`
  necesita ajuste de pesos (Marcellus solo trae weight 400).

## 7. Logo + eslogan "Tú mereces brillar"

- Hoy: `lib/site.ts:7` tiene `tagline: "Joyería de autor en oro laminado y plata 925"`,
  usado en `Footer.tsx` y metadata de `layout.tsx`. No existe el eslogan nuevo en ningún
  lado del código.
- Cambiar `site.tagline` a `"Tú mereces brillar"` (o agregarlo como campo nuevo
  `slogan` si se quiere conservar la descripción larga para SEO/metadata y usar el
  eslogan corto solo visualmente junto al logo).
- Definir dónde se muestra junto al logo (Navbar y/o Hero) — a confirmar en revisión
  visual, no bloqueante para empezar.

## 8. "El arte detrás de cada joya" — carrusel de fotos + nuevo texto

- Hoy (`app/page.tsx:70-109`): imagen única de Unsplash (placeholder), no hay carrusel
  en el proyecto.
- **Fotos**: el cliente las va a compartir directamente en la conversación — subir a
  Cloudinary bajo `treegold/` (respetando la firma de subida existente) y armar el
  carrusel con Embla (ver punto 4) en el mismo recuadro que ya existe.
- **Texto**: reemplazar el copy actual ("HECHAS A MANO / El arte detrás de cada joya / ...")
  por una versión nueva — pendiente de redactar y validar con el cliente antes de
  implementar (no se debe improvisar el copy final sin su visto bueno).

## 9. Quitar contador animado

- **Confirmado**: eliminar toda la sección de stats de la home.
- Quitar el `<StatsCounter />` de `app/page.tsx:114` y la sección que lo envuelve
  (líneas 111-115). El componente `components/StatsCounter.tsx` puede borrarse si no
  se usa en ningún otro lado (confirmar con grep antes de borrar el archivo).

## 10. CTA final — nuevo copy

- Hoy (`app/page.tsx:117-136`): "¿TIENES UNA IDEA EN MENTE? / Diseñamos tu joya a medida /
  Cuéntanos qué imaginas... / Hablemos de tu pieza".
- Reemplazar por copy más directo y natural (menos "forzado") — igual que el punto 8,
  el texto final se redacta y valida con el cliente antes de implementar, no se
  hardcodea a ciegas.

## 11. Imagen del Hero

- Hoy (`components/Hero.tsx:60-61`): placeholder de Unsplash.
- El cliente va a generar la imagen con IA y la va a compartir — reemplazar la URL
  cuando la tenga lista.

---

## Resumen de lo que falta antes de poder implementar todo de punta a punta

1. Fotos del taller/equipo para el carrusel de "El arte detrás de cada joya" (punto 8).
2. Imagen nueva del Hero generada con IA (punto 11).
3. Copy final aprobado para el bloque "El arte detrás de cada joya" (punto 8) y el CTA
   final (punto 9/10).
4. Confirmar si se instala Embla Carousel o se construye a mano (punto 4/8).
5. Confirmar ubicación visual exacta de la sección de promociones (punto 3) y del
   eslogan junto al logo (punto 7).

Todo lo demás (categorías, precios mayoristas, tipografía, quitar contador) tiene
decisión tomada y se puede empezar a implementar de una vez.
