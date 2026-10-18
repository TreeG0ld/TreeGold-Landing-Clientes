// =============================================================================
//  Migración de Imágenes de Marca (Hero, Modales, Artesanos) a ImageKit
// =============================================================================

const {
  IMAGEKIT_URL_ENDPOINT,
  IMAGEKIT_PRIVATE_KEY,
} = process.env;

if (!IMAGEKIT_URL_ENDPOINT || !IMAGEKIT_PRIVATE_KEY) {
  console.error("Faltan credenciales de ImageKit en .env");
  process.exit(1);
}

const BRAND_IMAGES = [
  {
    name: "hero-banner-v2.png",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1784118180/treegold/marca/hero-banner-v2.png",
  },
  {
    name: "hero-banner-movil.png",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1789257686/treegold/marca/hero-banner-movil.png",
  },
  {
    name: "medios-de-pago.png",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/treegold/marca/medios-de-pago.png",
  },
  {
    name: "balines-oro.png",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/treegold/marca/balines-oro.png",
  },
  {
    name: "artesano-1.jpg",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708924/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.47.jpg",
  },
  {
    name: "artesano-2.jpg",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708925/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.47_2.jpg",
  },
  {
    name: "artesano-3.jpg",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708927/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.46_1.jpg",
  },
  {
    name: "artesano-4.jpg",
    url: "https://res.cloudinary.com/dkab59i18/image/upload/v1783708928/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.46.jpg",
  },
];

async function uploadFile({ fileUrl, fileName }) {
  const authHeader = "Basic " + Buffer.from(IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
  const form = new FormData();
  form.append("file", fileUrl);
  form.append("fileName", fileName);
  form.append("folder", "/treegold/marca");
  form.append("useUniqueFileName", "false");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data.url;
}

async function main() {
  console.log("Subiendo imágenes de marca a ImageKit (/treegold/marca)...");
  for (const item of BRAND_IMAGES) {
    try {
      console.log(`Subiendo ${item.name}...`);
      const url = await uploadFile({ fileUrl: item.url, fileName: item.name });
      console.log(`✅ ${item.name} -> ${url}`);
    } catch (err) {
      console.error(`❌ ${item.name}: ${err.message}`);
    }
  }
}

main();
