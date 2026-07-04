// Hook de resolución para node --test:
//  - "@/x"        -> <raíz del proyecto>/x(.ts|.tsx)
//  - "./x" sin extensión (estilo bundler de Next) -> "./x.ts" | "./x.tsx"
//  - "next/server" -> "next/server.js" (el export map de next exige extensión en ESM)
// Node 22+ ya interpreta TypeScript "erasable" de forma nativa, así que basta
// con resolver la ruta; no hace falta transpilar.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

function resolveWithTsExtensions(absPath) {
  for (const ext of ["", ".ts", ".tsx", ".mjs", ".js"]) {
    const candidate = absPath + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return nextResolve("next/server.js", context);
  }

  if (specifier.startsWith("@/")) {
    const resolved = resolveWithTsExtensions(path.join(ROOT, specifier.slice(2)));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith("file:")
  ) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const resolved = resolveWithTsExtensions(path.resolve(parentDir, specifier));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
