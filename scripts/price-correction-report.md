# Reporte de corrección masiva de precios

Fecha: 2026-06-25

## Resumen general

`scripts/price-correction-data.json` quedó completo con **633 items**, cubriendo las 10 categorías de joyería (se excluyó intencionalmente "Herrajes", confirmado que no se usa). El conteo coincide exactamente con la base de datos en todas las categorías:

| Categoría   | Items en JSON | Productos en DB |
|-------------|---------------|------------------|
| Anillos     | 61            | 61               |
| Aretes      | 12            | 12               |
| Cadenas     | 55            | 55               |
| Candongas   | 43            | 43               |
| Dijes       | 266           | 266              |
| Pulseras    | 47            | 47               |
| Rosarios    | 2             | 2                |
| Set         | 20            | 20               |
| Tobilleras  | 18            | 18               |
| Topos       | 109           | 109              |
| **Total**   | **633**       | **633**          |

(Herrajes, 27 productos en DB, fue excluido a propósito por instrucción explícita.)

## Cambios de precio

- **605 de 633** items (95.6%) tendrán un aumento de precio de venta (`cambia: true`).
- **28 items** no cambian (la fórmula no modifica el precio, p. ej. dijes con venta > $220.000).
- **Suma total de la diferencia en pesos: $7.190.500** (suma de `retailPriceNuevo - retailPriceActualDB` sobre todos los items que cambian).

Desglose de la diferencia por categoría (solo items que cambian):

| Categoría   | Items que cambian | Suma de diferencia ($) |
|-------------|--------------------|--------------------------|
| Anillos     | 61                 | 610.000                  |
| Aretes      | 12                 | 165.000                  |
| Cadenas     | 31                 | 355.000                  |
| Candongas   | 43                 | 435.000                  |
| Dijes       | 266                | 3.455.500                |
| Pulseras    | 47                 | 480.000                  |
| Rosarios    | 1                  | 10.000                   |
| Set         | 17                 | 175.000                  |
| Tobilleras  | 18                 | 185.000                  |
| Topos       | 109                | 1.320.000                |
| **Total**   | **605**            | **7.190.500**            |

## Precios invertidos (venta < costo)

**Ninguno encontrado.** Todos los items del JSON final tienen venta ≥ costo.

## Códigos sin parsear o con precio faltante

**Ninguno en el JSON final.** Durante la exploración de Drive se detectó 1 archivo problemático en Topos/Figuras (`09021129`) cuyo segundo precio no llevaba el símbolo `$` y no pudo parsearse con el patrón estándar — fue excluido del JSON y no se agregó a la base.

## Códigos del Drive sin match en la DB (no agregados)

- **Topos**: 123 códigos encontrados en Drive (principalmente en la subcarpeta "Figuras", también explorada "Cruz", "Gucci", "Religiosos", "Sol" vacía, "Balín") que no corresponden a ningún `slug` existente en la tabla `Product` de la base de datos. No se agregaron al JSON.
- **Dijes**: 1 código (`09130669`, carpeta "Figuras") sin match en la DB. No se agregó.

Nota: la carpeta Drive de Topos resultó tener estructura en subcarpetas (Cruz, Gucci, Religiosos, Sol, Figuras, Balín), no archivos planos como se asumía inicialmente; todas fueron exploradas con paginación completa.

La carpeta raíz de Dijes solo contenía las 3 subcarpetas ya conocidas (Religiosos, Cruz, Figuras) — no había subcarpetas adicionales ni archivos sueltos en la raíz.

## Caso especial "dije tío rico"

**No se encontró** ningún archivo con nombre que contenga "tio rico" / "tío rico" en ninguna de las 266 imágenes de Dijes revisadas (Religiosos, Cruz, Figuras), ni en el conjunto que ya estaba previamente cargado en el JSON. Por lo tanto, no se aplicó el precio fijo especial (costo $105.000 / venta $190.000) a ningún producto.

## Cadenas: distribución por medida

| Medida (cm) | Cantidad de códigos |
|-------------|----------------------|
| 40          | 4                    |
| 45          | 14                   |
| 50          | 14                   |
| 60          | 23                   |
| **Total**   | **55**               |

No se encontraron códigos repetidos entre distintas medidas (cada código de cadena aparece una sola vez en todo el conjunto).

## Nota de corrección durante la validación final

Durante la verificación cruzada contra la DB se detectó que el código `09020875` (perteneciente a la categoría real "Topos" según la DB) había quedado duplicado erróneamente también bajo la categoría "Dijes" con los mismos valores. Se eliminó la entrada duplicada de "Dijes", dejando solo la entrada correcta en "Topos". Esto explica que el conteo final de Dijes sea 266 (no 267 como se reportó en un paso intermedio) y que el total general sea 633 en vez de 634.
