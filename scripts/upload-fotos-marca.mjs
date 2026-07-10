// =============================================================
//  Sube las fotos editoriales de marca (modelos con las joyas)
//  a Cloudinary bajo treegold/marca/. Estas fotos se usan en el
//  carrusel "El arte detrás de cada joya" de la home.
//
//  IMPORTANTE: lib/imageLoader.ts NO aplica el recorte de
//  catálogo (c_crop h_0.75) a la carpeta /marca/ — estas fotos
//  no traen franja de precios y se muestran completas.
//
//    node scripts/upload-fotos-marca.mjs <archivo1> [archivo2...]
//
//  Imprime las secure_url resultantes para pegarlas en el código.
// =============================================================

import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { basename } from "node:path";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Uso: node scripts/upload-fotos-marca.mjs <archivo1> [archivo2...]");
  process.exit(1);
}

for (const file of files) {
  const res = await cloudinary.uploader.upload(file, {
    folder: "treegold/marca",
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: "image",
  });
  console.log(`${basename(file)} -> ${res.secure_url}`);
}
