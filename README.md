# 💍 Joyería TreeGold

Landing / e-commerce premium para una joyería de lujo. Catálogo de joyas con animaciones fluidas, diseño **mobile-first** y pedidos directos por **WhatsApp** (sin pasarela de pago).

---

## ✨ ¿Qué es?

Una tienda online donde el cliente explora las joyas, arma su **selección** y al finalizar se genera un mensaje de **WhatsApp** con los productos elegidos, listo para enviar a la joyería. Los precios son referenciales: la disponibilidad y el pago se confirman por chat.

## 🛠️ Tecnologías

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** — diseño y estilos
- **GSAP** + **Motion** — animaciones (hero, scroll, "volar al carrito")
- **Zustand** — estado de la selección (guardado en el navegador)
- **Lucide** — iconos

## 🚀 Cómo correr el proyecto

Necesitas tener instalado **Node.js 18+**.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar en modo desarrollo
npm run dev
```

Luego abre **http://localhost:3000** en el navegador.

### Otros comandos

```bash
npm run build   # Compila para producción
npm start       # Arranca la versión de producción (requiere build antes)
```

## 📁 Estructura

```
app/          → páginas (inicio, colección, producto, selección, historia, contacto)
components/    → componentes (navbar, cards, animaciones, carrito, etc.)
lib/           → datos de productos, estado, helpers (formato COP, WhatsApp)
```

## 🔧 Cosas importantes

- **Productos:** por ahora están en `lib/products.ts` (datos de ejemplo). Más adelante se conectan a una base de datos.
- **Imágenes:** son de muestra (Unsplash). Reemplazar por las fotos reales de las joyas.
- **WhatsApp:** el número de la joyería se configura en `lib/site.ts` (campo `whatsapp`).
- **Moneda:** pesos colombianos (COP).
- **Diseño:** pensado primero para celular y luego adaptado a pantallas grandes.

---

Hecho con dedicación para **Joyería TreeGold** 🌳✨
