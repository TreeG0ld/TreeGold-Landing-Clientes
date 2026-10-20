import sharp from 'sharp';
import fs from 'fs';

async function generateBlackFadeBannerRefined() {
  const inputPath = 'C:/Users/JuanEstebanCarmona/.gemini/antigravity-ide/brain/78e0009d-cb8a-41a3-a733-7f431d28083d/.user_uploaded/media_1792525940352.jpg';
  const targetW = 2400;
  const targetH = 1025;

  // 1. Scale original image to target height 1025
  const scaledBuf = await sharp(inputPath)
    .resize(null, targetH, { fit: 'inside' })
    .toBuffer();

  const { width: scaledW, height: scaledH } = await sharp(scaledBuf).metadata();
  console.log('Scaled dimensions:', scaledW, 'x', scaledH); // ~1822 x 1025

  // 2. Refined fade width: 130px on left, 130px on right
  // This keeps the red spool vibrant and her shoulder natural while delivering a rich black gradient!
  const fadeLeft = 120;
  const fadeRight = 130;
  const maskBuf = Buffer.alloc(scaledW * scaledH);
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < scaledW; x++) {
      let alpha = 255;
      if (x < fadeLeft) {
        const t = x / fadeLeft;
        const smooth = 3 * t * t - 2 * t * t * t;
        alpha = Math.round(smooth * 255);
      } else if (x > scaledW - fadeRight) {
        const t = (scaledW - 1 - x) / fadeRight;
        const smooth = 3 * t * t - 2 * t * t * t;
        alpha = Math.round(smooth * 255);
      }
      maskBuf[y * scaledW + x] = alpha;
    }
  }

  // Apply alpha mask to scaled image
  const sharpPng = await sharp(scaledBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < scaledW; x++) {
      const idx = (y * scaledW + x) * 4;
      sharpPng.data[idx + 3] = Math.min(sharpPng.data[idx + 3], maskBuf[y * scaledW + x]);
    }
  }

  const feathered = await sharp(sharpPng.data, {
    raw: { width: scaledW, height: scaledH, channels: 4 }
  }).png().toBuffer();

  const leftPos = Math.round((targetW - scaledW) / 2);

  const blackBanner = await sharp({
    create: {
      width: targetW,
      height: targetH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite([
    {
      input: feathered,
      top: 0,
      left: leftPos
    }
  ])
  .jpeg({ quality: 96 })
  .toBuffer();

  fs.writeFileSync('public/banner-mayoristas-black.jpg', blackBanner);
  console.log('Saved refined banner-mayoristas-black.jpg');
}

generateBlackFadeBannerRefined().catch(console.error);
