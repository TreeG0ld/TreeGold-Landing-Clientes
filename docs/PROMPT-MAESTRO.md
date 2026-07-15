# PROMPT MAESTRO — Joyería TreeGold (E-commerce premium con checkout por WhatsApp)

> Documento guía / prompt de construcción. Define QUÉ se construye, CÓMO se ve, CÓMO se anima y EN QUÉ ORDEN.
> Pensado para ejecutarse con Next.js + Tailwind, animaciones GSAP + Motion, y datos en Supabase (Postgres).

---

## 0. Resumen ejecutivo

Construir el e-commerce de **Joyería TreeGold**: una tienda online de lujo (anillos, collares, aretes, pulseras, relojes) con una experiencia **premium, elegante y con animaciones fluidas**. No hay pasarela de pago: el cliente arma su selección de productos y al finalizar, el sistema genera un **mensaje de WhatsApp** prellenado con los productos elegidos y lo envía al número de la joyería (`wa.me`). Los productos viven en una **base de datos** administrable.

**Objetivo de marca:** transmitir lujo, confianza y artesanía. Sensación "joyería boutique", no "marketplace barato".

**Enfoque MOBILE-FIRST (prioridad #1):** la mayoría de clientes navegan desde el móvil, así que **se diseña y construye primero para celular** y luego se escala a tablet/desktop. El layout, los tamaños de toque, la navegación y las animaciones se optimizan para móvil. Desktop es una mejora, no el punto de partida.

**Datos de la tienda (configurados):**
- 📱 WhatsApp: **+57 301 778 0779** → formato `wa.me`: `573017780779`
- 💱 Moneda: **COP** (pesos colombianos), formato `$1.200.000`

---

## 1. Stack tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR/SEO, RSC, rendimiento, rutas dinámicas de producto |
| Estilos | **Tailwind CSS** + variables CSS de diseño | Velocidad + sistema de tokens consistente |
| Animación | **GSAP** (+ ScrollTrigger) y **Motion** (`motion`) | GSAP para scroll/timeline cinemáticos; Motion para micro-interacciones de UI/React |
| Base de datos | **Supabase (Postgres)** | DB + Storage de imágenes + panel + free tier. (Alternativas: Neon, PlanetScale, Prisma+SQLite) |
| ORM (opcional) | **Prisma** o cliente `@supabase/supabase-js` | Tipado y queries limpias |
| Iconos | **Lucide** (SVG, nunca emojis) | Coherencia premium |
| Imágenes | `next/image` + Supabase Storage | Optimización, lazy load, AVIF/WebP |
| Despliegue | **Vercel** | Integración nativa con Next.js |

---

## 2. Sistema de diseño (fundamentado con ui-ux-pro-max)

**Estilo base:** Editorial de lujo + acentos *Liquid Glass / Glassmorphism* (vidrio translúcido con blur) usados con moderación sobre una base limpia. Nada recargado.

### Paleta de color (tokens CSS)
```css
:root {
  --color-primary:      #1C1917; /* negro cálido — texto/UI principal */
  --color-on-primary:   #FFFFFF;
  --color-secondary:    #44403C; /* gris piedra */
  --color-accent:       #A16207; /* DORADO — CTAs, detalles (WCAG ok) */
  --color-accent-soft:  #CA8A04; /* dorado brillante para hovers/brillos */
  --color-background:   #FAFAF9; /* marfil/off-white */
  --color-foreground:   #0C0A09;
  --color-muted:        #E8ECF0;
  --color-border:       #D6D3D1;
  --color-destructive:  #DC2626;
}
```
- **Modo oscuro** (opcional fase 2): fondo `#0C0A09`, superficies `#1C1917`, dorado como acento.

### Tipografía
- **Cormorant** (serif) → títulos, nombres de producto, hero. Mood: lujo, fashion, elegante.
- **Montserrat** (sans) → cuerpo, UI, precios, botones.
```
@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
```

### Efectos clave
- Transiciones fluidas **400–600ms**, curvas suaves (`cubic-bezier(0.65,0,0.35,1)`).
- `backdrop-filter: blur()` para navbar y modales (glass).
- Brillo dorado sutil en hover (`text-shadow`/`box-shadow` mínimos).
- Hover en tarjetas: leve elevación + zoom de imagen + reveal de CTA.

### Reglas no negociables (checklist de calidad)
- [ ] Iconos SVG (Lucide), **nunca emojis**.
- [ ] `cursor-pointer` en todo lo clickable.
- [ ] Hover con transición 150–300ms.
- [ ] Contraste de texto ≥ 4.5:1.
- [ ] Focus visible para teclado.
- [ ] **`prefers-reduced-motion` respetado** (desactivar animaciones grandes).
- [ ] **Mobile-first**: diseñar a 375px primero, escalar hacia arriba (768 / 1024 / 1440 px).
- [ ] **Targets táctiles ≥ 44×44px** con ≥ 8px de separación.
- [ ] Sin scroll horizontal; sin anchos fijos en px; viewport meta correcto.

---

## 2.5. Mobile-first (prioridad de construcción)

Se construye **primero la versión móvil** y se mejora hacia pantallas grandes. Reglas concretas:

- **Breakpoints (Tailwind):** base = móvil (375px). Estilos sin prefijo son móviles; `md:` (768), `lg:` (1024), `xl:` (1440) añaden mejoras.
- **Navegación móvil:** navbar compacto con **menú hamburguesa** (drawer lateral) + barra inferior opcional con accesos (Inicio, Colección, Selección, WhatsApp).
- **Carrito/Selección:** el **drawer** ocupa pantalla casi completa en móvil; en desktop es lateral.
- **Grid de productos:** 1–2 columnas en móvil, 3 en tablet, 4 en desktop.
- **FAB de WhatsApp** siempre accesible con el pulgar (esquina inferior derecha).
- **Imágenes** servidas en tamaños móviles primero (`next/image` con `sizes`).
- **Animaciones en móvil:** más sobrias y ligeras (evitar parallax/pin pesados en pantallas pequeñas y en `prefers-reduced-motion`); priorizar 60fps en gama media.
- **Tipografía fluida** (`clamp()`) y espaciado generoso para lectura cómoda en móvil.
- **Pruebas** en 375px (iPhone SE/estándar) como referencia base antes de desktop.

---

## 3. Modelo de datos (Postgres / Supabase)

```sql
-- Categorías
categories (
  id uuid pk, slug text unique, name text, description text,
  image_url text, sort_order int, created_at timestamptz
)

-- Productos
products (
  id uuid pk,
  slug text unique,
  name text,
  description text,
  category_id uuid fk -> categories.id,
  price numeric,                 -- precio de referencia (se muestra, no se cobra)
  currency text default 'COP',
  material text,                 -- oro 18k, oro blanco, plata 925...
  gemstone text,                 -- diamante, esmeralda, ninguno...
  weight_grams numeric,
  sizes text[],                  -- tallas de anillo, longitudes de cadena
  images text[],                 -- URLs (Supabase Storage)
  featured boolean default false,
  in_stock boolean default true,
  sku text,
  created_at timestamptz
)

-- Config de la tienda (un solo registro)
store_settings (
  id int pk,
  whatsapp_number text,          -- p.ej. 57XXXXXXXXXX (sin +)
  whatsapp_greeting text,        -- texto inicial del mensaje
  instagram_url text, ...
)
```
- **Storage:** bucket `product-images` para fotos.
- **Seed inicial:** 12–20 productos de ejemplo repartidos en categorías.

---

## 4. Arquitectura de páginas (rutas)

| Ruta | Página | Contenido |
|------|--------|-----------|
| `/` | **Home** | Hero cinemático, categorías destacadas, productos destacados, historia de marca, CTA WhatsApp |
| `/coleccion` | **Catálogo** | Grid de productos, filtros (categoría, material, precio), orden, búsqueda |
| `/coleccion/[slug]` | **Categoría** | Productos filtrados por categoría |
| `/producto/[slug]` | **Detalle de producto** | Galería, descripción, material, tallas, botón "Agregar a selección", botón "Consultar por WhatsApp" |
| `/seleccion` | **Mi selección (carrito)** | Lista de productos elegidos, cantidades, total estimado, botón **"Finalizar por WhatsApp"** |
| `/historia` | **Nosotros** | Marca, artesanía, valores |
| `/contacto` | **Contacto** | Datos, mapa, WhatsApp, redes |
| `/admin` | **Panel** (protegido) | CRUD de productos y categorías, ajustes (nº WhatsApp) |

---

## 5. Flujo de "carrito" → WhatsApp (clave del proyecto)

1. El usuario navega el catálogo y pulsa **"Agregar a selección"** en productos.
2. La selección se guarda en **estado global + `localStorage`** (Zustand o Context). No requiere login.
3. En `/seleccion` ve la lista: nombre, imagen, talla elegida, cantidad, precio de referencia, total estimado.
4. Al pulsar **"Finalizar pedido por WhatsApp"** se genera un mensaje y se abre:
   ```
   https://wa.me/573017780779?text=<mensaje_url_encoded>
   ```
5. **Formato del mensaje** (ejemplo):
   ```
   ¡Hola Joyería TreeGold! 👋 Quiero consultar por estos productos:

   1. Anillo Solitario Oro 18k — Talla 7 — x1 — $1.200.000
   2. Collar Cascada Esmeralda — x1 — $2.500.000

   Total estimado: $3.700.000
   ¿Me confirman disponibilidad y forma de pago?
   ```
6. Botón secundario en cada producto: **"Consultar este producto por WhatsApp"** (mensaje de un solo ítem).

> Nota: el precio es **referencial** (consulta), no se cobra en el sitio.

---

## 6. Componentes principales

- **Navbar** glass sticky con blur, logo TreeGold, links, contador de selección, búsqueda.
- **Hero** con video/imagen, título serif animado, CTA dorado.
- **ProductCard** con hover premium (zoom imagen + reveal CTA + brillo dorado).
- **ProductGallery** (detalle) con miniaturas y zoom.
- **FilterBar / Sidebar** de filtros (categoría, material, rango de precio).
- **SelectionDrawer** (carrito lateral deslizante) + página `/seleccion`.
- **WhatsAppButton** flotante (FAB) siempre visible.
- **Footer** elegante con newsletter, redes, info.
- **Loader / Page transition** premium entre rutas.

---

## 7. Estrategia de animaciones (premium y fluidas)

**GSAP + ScrollTrigger** (cinemático, narrativo):
- **Hero**: reveal de título por palabras/letras (split), parallax suave de imagen.
- **Scroll reveals**: secciones y tarjetas que aparecen con `fade + translateY` escalonado (stagger) al entrar en viewport.
- **Parallax** sutil en imágenes de categoría/historia.
- **Pin + scrub** opcional en sección "destacados" o storytelling de marca.
- **Contador** de números (años de experiencia, piezas) animado al ver.

**Motion (`motion`)** (micro-interacciones React):
- Hover/tap en botones y tarjetas (scale, glow).
- Entrada/salida del **drawer de selección** y modales (spring suave).
- Transiciones de página (`AnimatePresence`).
- Animación del contador del carrito al agregar producto.

**Reglas de animación:**
- Animar **transform y opacity** (no width/height/top) → 60fps.
- Duración micro: 150–300ms. Cinemáticas: 400–800ms.
- Respetar `prefers-reduced-motion` (envoltura que desactiva).
- `will-change` y limpieza de ScrollTriggers en unmount (usar `useGSAP`).

---

## 8. SEO, rendimiento y accesibilidad

- Metadatos por producto (`generateMetadata`), Open Graph con imagen del producto.
- **JSON-LD** `Product` para rich results.
- Sitemap + robots.
- `next/image` con tamaños responsivos, AVIF/WebP, lazy.
- Lighthouse objetivo ≥ 90 en Performance/SEO/Accesibilidad.
- Alt text en todas las imágenes; navegación por teclado; landmarks ARIA.

---

## 9. Panel de administración (`/admin`)

- Auth simple (Supabase Auth o contraseña básica).
- CRUD de **productos** (con subida de imágenes a Storage) y **categorías**.
- Marcar **destacados**, stock on/off.
- Editar **número de WhatsApp** y textos de la tienda.

---

## 10. Plan por fases

**Fase 1 — Fundaciones**
- Setup Next.js + Tailwind + tokens de diseño + fuentes.
- Layout base (Navbar glass + Footer + FAB WhatsApp).
- Conexión Supabase + esquema + seed de productos.

**Fase 2 — Catálogo y producto**
- Home con hero animado y secciones.
- Catálogo con filtros/orden/búsqueda.
- Página de detalle con galería.

**Fase 3 — Selección + WhatsApp**
- Estado global de selección (Zustand + localStorage).
- Drawer + página `/seleccion`.
- Generación del mensaje y enlace `wa.me`.

**Fase 4 — Animaciones premium**
- GSAP ScrollTrigger en home y secciones.
- Motion en micro-interacciones y transiciones de página.
- Pulido de hovers, loaders y page transitions.

**Fase 5 — Admin + contenido**
- Panel CRUD + subida de imágenes + ajustes.
- Páginas Historia y Contacto.

**Fase 6 — Pulido y lanzamiento**
- SEO, JSON-LD, sitemap.
- Auditoría Lighthouse + accesibilidad + responsive.
- Deploy en Vercel + dominio.

---

## 11. Prompt corto reutilizable (para retomar la construcción)

> "Construye la Joyería TreeGold con Next.js (App Router, TS) + Tailwind, **mobile-first** (diseñar a 375px primero y escalar). Estilo editorial de lujo con acentos glassmorphism: negro cálido `#1C1917`, dorado `#A16207`, marfil `#FAFAF9`; tipografías Cormorant (títulos) + Montserrat (cuerpo). Productos en Supabase/Postgres con panel admin, precios en **COP** (`$1.200.000`). El carrito es una 'selección' guardada en localStorage que, al finalizar, genera un mensaje de WhatsApp a **`wa.me/573017780779`** con los productos. Animaciones premium con GSAP+ScrollTrigger (hero, scroll reveals, parallax) y Motion (hovers, drawer, transiciones de página), más sobrias en móvil y respetando `prefers-reduced-motion`. Navegación móvil con menú hamburguesa + FAB de WhatsApp. Páginas: home, colección, categoría, producto, selección, historia, contacto, admin. Cumple el checklist de calidad (SVG icons, contraste 4.5:1, targets táctiles 44px, focus visible, responsive 375/768/1024/1440)."

```
```
