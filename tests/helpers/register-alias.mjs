// Registra el resolutor de módulos para los tests (node --test).
// Permite importar archivos del proyecto que usan el alias "@/..." (tsconfig)
// e imports relativos sin extensión, que Node ESM no resuelve por sí solo.
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
