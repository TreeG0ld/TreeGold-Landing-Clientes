/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Loader propio: optimiza cada imagen (formato, calidad y tamaño)
    // a partir de su URL. Ver lib/imageLoader.ts.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
  },
};

export default nextConfig;
