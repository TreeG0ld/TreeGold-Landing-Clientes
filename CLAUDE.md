# TreeGold — guía para Claude Code

E-commerce de joyería (Next.js 15 App Router + TS, Tailwind, GSAP/Motion). Sin pasarela de
pago: el "carrito" es una selección que genera un mensaje de WhatsApp. Datos en Postgres
(Supabase) vía Prisma; imágenes en Cloudinary.

## Rutas principales

- `/`, `/coleccion`, `/producto/[slug]`, `/seleccion`, `/historia`, `/contacto` — tienda pública.
- `/admin/*` — panel de administración (productos, categorías). Protegido por
  `middleware.ts` + sesión propia (ver abajo). NO usa NextAuth.
- `/mayoristas-<código>` — catálogo de costo para distribuidores, sin login, solo el
  código en la URL. **Importante:** esta ruta vive en `app/[slug]/page.tsx` (catch-all),
  no en una carpeta `mayoristas-[codigo]/` — Next.js App Router no permite mezclar texto
  fijo con un segmento dinámico en el mismo nombre de carpeta. El catch-all revisa si el
  slug empieza con `mayoristas-` y extrae el código; las rutas estáticas siempre tienen
  prioridad sobre él, así que no choca con el resto del sitio.

## Autenticación del admin

`lib/auth.ts` firma una cookie de sesión con HMAC-SHA256 (Web Crypto, sin dependencias
nuevas, compatible con el runtime Edge del middleware). No hay tabla de usuarios: un solo
admin definido por variables de entorno. Verificación en dos capas:
1. `middleware.ts` — bloquea `/admin/*` y `/api/admin/*` (excepto `/admin/login` y
   `/api/admin/login`) si no hay sesión válida con rol `ADMIN`.
2. Cada ruta API de `/api/admin/*` vuelve a llamar `requireAdminApi()` (lib/admin-auth.ts)
   por si se invoca de otra forma.

Variables de entorno relevantes (en `.env`, nunca commitear):
- `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (string largo random).
- `WHOLESALE_SECRET` (el código de la URL `/mayoristas-<código>`).
- `DATABASE_URL` / `DIRECT_URL` (Supabase Postgres, pooler vs conexión directa).
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## Imágenes (Cloudinary)

`lib/imageLoader.ts` es el loader custom de `next/image` (configurado en `next.config.mjs`,
`images.loader: "custom"`). Para fotos de Cloudinary recorta automáticamente la franja
inferior de la imagen original donde el catálogo del proveedor imprime el código y los
precios (`c_crop,g_north,h_0.75`), hace `e_trim` + `c_pad` a cuadrado con fondo blanco, y
sirve WebP/AVIF según el navegador. Si en el futuro aparecen fotos con el precio todavía
visible, es porque la franja de precio empieza más arriba del recorte actual — bajar el
valor de `h_` (no subirlo).

La subida de imágenes desde `/admin` usa **upload firmado** directo del navegador a
Cloudinary (`/api/admin/cloudinary-signature` genera la firma; solo un admin con sesión
puede pedirla). No hay widget de Cloudinary ni dependencia `next-cloudinary` instalada.

## Modelo de datos (Prisma)

`Product.isRetail` / `isWholesale` controlan en qué tienda aparece cada producto.
`Product.retailPrice` (precio público) y `wholesalePrice` (costo) son independientes —
el panel `/admin` deja editar ambos. `Product.size` es texto libre para la medida visible
("Talla 7, 8, 9", "45 cm", "Talla graduable (ajustable)"); no hay modelo de variantes,
cada SKU es un producto distinto.

## Carpeta `scripts/`

Scripts puntuales (no se ejecutan en CI ni en build). Patrón común: `PrismaPg` adapter +
`DIRECT_URL` (conexión directa, no el pooler) para escrituras masivas, estilo
`seed-productos.mjs`. Los archivos `price-correction-*`, `anillos-*` y `drive-titles-raw.json`
son el rastro de una corrección masiva de precios y tallas hecha a partir de fotos en
Google Drive (ya aplicada a la base de datos) — quedan como referencia, no hace falta
volver a correrlos salvo que se repita ese tipo de corrección.

## Cosas que NO están hechas todavía

- Deploy a Vercel / dominio propio (las variables de entorno de arriba hay que
  configurarlas también ahí cuando se haga).
- Mover las credenciales generadas automáticamente (`ADMIN_PASSWORD`, etc.) a algo que el
  dueño del negocio elija — por ahora son valores random generados durante el desarrollo.
