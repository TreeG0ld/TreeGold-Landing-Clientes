/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquetes que deben quedar fuera del bundle del servidor (driver de Postgres).
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  images: {
    // Loader propio: optimiza cada imagen (formato, calidad y tamaño)
    // a partir de su URL. Ver lib/imageLoader.ts.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
  },
};

export default nextConfig;
