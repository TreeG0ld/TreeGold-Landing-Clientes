# TreeGold — guía para Claude Code

E-commerce de joyería (Next.js 15 App Router + TS, Tailwind, GSAP/Motion). La selección
(carrito) de la tienda pública se paga en línea con **Wompi** o se envía como mensaje de
WhatsApp; el catálogo mayorista sigue solo por WhatsApp. Datos en Postgres (Supabase) vía
Prisma; imágenes en Cloudinary.

## Rutas principales

- `/`, `/coleccion`, `/producto/[slug]`, `/seleccion`, `/historia`, `/contacto` — tienda pública.
- `/pedido/[referencia]` — a donde vuelve el cliente después de pagar en Wompi (ver "Pagos").
- `/admin/*` — panel de administración (productos, categorías). Protegido por
  `middleware.ts` + sesión propia (ver abajo). NO usa NextAuth.
- `/mayoristas-<código>` — catálogo de costo para distribuidores, sin login, solo el
  código en la URL. **Importante:** esta ruta vive en `app/[slug]/page.tsx` (catch-all),
  no en una carpeta `mayoristas-[codigo]/` — Next.js App Router no permite mezclar texto
  fijo con un segmento dinámico en el mismo nombre de carpeta. El catch-all revisa si el
  slug empieza con `mayoristas-` y extrae el código; las rutas estáticas siempre tienen
  prioridad sobre él, así que no choca con el resto del sitio.

## Autenticación (clientes y admin)

Hay **un solo login**: `POST /api/auth/login`, que valida con bcrypt contra la tabla `User`
de Postgres. El admin **no** es una variable de entorno: es una fila normal de `User` con
`role = ADMIN`, creada por `scripts/seed-admin.mjs`. Los clientes se registran en
`/api/auth/register` y salen con `role = CLIENT`. (Existió un segundo login que comparaba
contra `ADMIN_USER`/`ADMIN_PASSWORD`; era código muerto —la página `/admin/login` nunca lo
llamaba— y se eliminó para no mantener dos caminos de autenticación divergentes.)

`lib/auth.ts` firma la cookie de sesión (`tg_session`) con HMAC-SHA256 (Web Crypto, sin
dependencias nuevas, compatible con el runtime Edge del middleware). Verificación en dos
capas:
1. `middleware.ts` — bloquea `/admin/*` y `/api/admin/*` (excepto la página `/admin/login`)
   si no hay sesión válida con rol `ADMIN`.
2. Cada ruta API de `/api/admin/*` vuelve a llamar `requireAdminApi()` (lib/admin-auth.ts)
   por si se invoca de otra forma.

Defensas de las rutas de autenticación (`lib/rate-limit.ts`, en memoria por instancia):
login limitado por IP (10/10 min) y por cuenta (8/15 min, se cuenta exista o no el correo,
para que el 429 no delate qué cuentas existen); registro limitado por IP (5/60 min), con
política de contraseña en servidor (mín. 8 caracteres) y mensaje neutro si el correo ya
está dado de alta. La enumeración de cuentas en el registro no está resuelta del todo:
hace falta verificación por correo, que hoy no existe.

Variables de entorno relevantes (en `.env`, nunca commitear):
- `ADMIN_SESSION_SECRET` (string largo random) — firma las sesiones. `ADMIN_USER` y
  `ADMIN_PASSWORD` ya no autentican nada; solo las usa el seed del admin.
- `WHOLESALE_SECRET` (el código de la URL `/mayoristas-<código>`).
- `DATABASE_URL` / `DIRECT_URL` (Supabase Postgres, pooler vs conexión directa).
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` — las tres del mismo
  ambiente (pruebas o producción); el webhook ignora eventos del otro ambiente.

## Pagos (Wompi)

Se eligió Wompi (Bancolombia, cobra en COP). **Polar se descartó** porque su política de
uso prohíbe vender productos físicos. Integración sin SDK, por **Web Checkout con
redirección** (no el widget en iframe: la CSP de `next.config.mjs` bloquea iframes y
formularios a otros dominios, y una navegación normal no pasa por ninguna de las dos).

1. `POST /api/checkout` recibe solo `{slug, qty}` + datos de envío (`lib/checkout.ts`
   valida). Precio y stock salen de la BD, **nunca** del carrito del navegador. Crea el
   `Order` en `PENDING`, firma (`lib/wompi.ts`, SHA-256 con `WOMPI_INTEGRITY_SECRET`) y
   devuelve la URL de Wompi. El enlace caduca en 1 hora. Envío: `shippingFor()`
   (`lib/checkout.ts`): `site.shippingCost` ($18.000), gratis desde `site.freeShippingFrom`
   ($600.000 de subtotal, inclusive).
2. `POST /api/wompi/webhook` (URL a configurar en el panel de Wompi) verifica el
   checksum con `WOMPI_EVENTS_SECRET`, guarda el evento en `PaymentEvent` y aplica
   `lib/order-rules.ts`: solo un `APPROVED` con el monto firmado marca `PAID` y descuenta
   stock (`lib/orders.ts`, en una transacción). Si otra persona pagó la última pieza entre
   medias, el pedido queda `PAID` con `stockShortage = true` para que el admin lo resuelva.
   Wompi reintenta solo 3 veces en 24 h si no respondemos 200.
3. `/pedido/[referencia]` solo **lee** el estado; la URL de regreso (`?id=`) no es prueba
   de pago. La referencia (80 bits al azar) es la única llave de la página, por eso
   muestra lo mínimo (sin dirección ni teléfono).

El stock (`Product.stock`) ahora importa: bloquea el pago cuando no alcanza. Hay que
mantenerlo real desde `/admin`.

## Imágenes (Cloudinary)

`lib/imageLoader.ts` es el loader custom de `next/image` (configurado en `next.config.mjs`,
`images.loader: "custom"`). Para fotos de Cloudinary recorta automáticamente la franja
inferior de la imagen original donde el catálogo del proveedor imprime el código y los
precios (`c_crop,g_north,h_0.75`), hace `e_trim` + `c_pad` a cuadrado con fondo blanco, y
sirve WebP a todos (`f_webp,fl_awebp`, no `f_auto`). Si en el futuro aparecen fotos con el precio todavía
visible, es porque la franja de precio empieza más arriba del recorte actual — bajar el
valor de `h_` (no subirlo).

**Cuota de Cloudinary (plan gratuito, 25 créditos en ventana móvil de 30 días).** En octubre
de 2026 llegó al 126%: el 65% eran transformaciones, porque `f_auto` guardaba una copia por
formato (WebP, JPEG XL para iPhone, original para bots) × cada ancho × cada loader. Por eso
el formato es WebP fijo y `next.config.mjs` tiene solo 7 anchos. **Cualquier cambio al texto de
las transformaciones regenera todas las copias** (el 5-oct-2026, al cambiar los loaders de
fotos del admin, se generaron 3.000 en un día): no tocarlo a la ligera, y no agregar anchos.
`tests/imageLoader.test.mjs` fija las URLs exactas para que un cambio así no pase sin querer.

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

## Despliegue (producción)

La tienda está EN VIVO en **https://treegold.shop**, sobre un VPS de Hostinger
(Ubuntu, `/var/www/treegold`). No es Vercel.

**Para publicar cambios**, una vez subidos a GitHub, dentro del VPS:

```bash
cd /var/www/treegold
./deploy.sh
```

`deploy.sh` hace `git pull` + `npm install` + `prisma generate` + `npm run build`
+ `pm2 restart treegold`, y se detiene en el primer error. No toca Nginx ni el
`.env`. Mientras compila, la tienda sigue sirviendo la versión anterior: el
cambio ocurre en el `pm2 restart`, que tarda un par de segundos.

Piezas del servidor, por si hay que diagnosticar:

- **PM2** corre la app (proceso `treegold`) en `127.0.0.1:3000` y arranca sola
  si el servidor se reinicia (`systemctl is-enabled pm2-root` → `enabled`).
- **Nginx** es el proxy reverso (`/etc/nginx/sites-available/treegold`). Manda
  `X-Forwarded-For` con la IP real al final, que es lo que `lib/client-ip.ts`
  necesita junto con `TRUST_PROXY_XFF=1` en el `.env` de producción.
- **TLS**: Let's Encrypt vía Certbot, con renovación automática. NO es el
  "Origin Certificate" de Cloudflare que describe `deploy/nginx.conf.example`:
  no hay Cloudflare delante, el DNS apunta directo al VPS.
- **Rate limit de Nginx**: 30 req/s por IP con picos de 60
  (`/etc/nginx/conf.d/ratelimit.conf`). Si aparecen 429 inesperados en
  producción, mirar ahí ANTES que en la app. Respaldo de la config previa en
  `/root/nginx-treegold-backup.conf`.

## Cosas que NO están hechas todavía

- Mover las credenciales generadas automáticamente (`ADMIN_PASSWORD`, etc.) a algo que el
  dueño del negocio elija — por ahora son valores random generados durante el desarrollo.
  Ojo: cambiarlas en `.env` ya no basta, hay que volver a correr `scripts/seed-admin.mjs`
  para que se actualice el hash de la fila `User`.
- Verificación de correo en el registro (y con ella, cierre real de la enumeración de
  cuentas) y recuperación de contraseña.
- Panel `/admin/pedidos` para ver los pedidos pagados y marcarlos como despachados
  (`Order.shippedAt` ya existe en el esquema).
- Política de tratamiento de datos personales (Ley 1581 de 2012) enlazada desde el
  checkout, que ya pide nombre, correo, celular y dirección.
