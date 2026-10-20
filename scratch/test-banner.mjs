import sharp from 'sharp';
import fs from 'fs';

async function generateWideBanner() {
  const inputPath = 'public/banner-mayoristas.jpg';
  const targetW = 2400;
  const targetH = 1025;

  // 1. Create blurred ambient background of target size (2400 x 1025)
  // This ensures the marble line at bottom and studio tone at top match 100% across the full width.
  const bg = await sharp(inputPath)
    .resize(targetW, targetH, { fit: 'cover' })
    .blur(35)
    .toBuffer();

  // 2. Resize original sharp image to height 1025 (proportional)
  // 1025 / 571 = 1.795096... -> width is ~1838 px
  const sharpScaled = await sharp(inputPath)
    .resize(null, targetH, { fit: 'inside' })
    .toBuffer();

  const scaledMeta = await sharp(sharpScaled).metadata();
  console.log('Scaled dimensions:', scaledMeta.width, 'x', scaledMeta.height);

  // 3. Create feather mask for the scaled image so its left and right edges fade seamlessly
  // Mask width = scaledMeta.width, height = targetH
  const maskW = scaledMeta.width;
  const maskH = targetH;
  const featherW = 120; // 120px smooth gradient on edges

  // Generate an 8-bit alpha buffer
  const maskBuf = Buffer.alloc(maskW * maskH);
  for (let y = 0; y < maskH; y++) {
    for (let x = 0; x < maskW; x++) {
      let alpha = 255;
      if (x < featherW) {
        // Smooth fade on left edge
        alpha = Math.round((x / featherW) * 255);
      } else if (x > maskW - featherW) {
        // Smooth fade on right edge
        alpha = Math.round(((maskW - 1 - x) / featherW) * 255);
      }
      maskBuf[y * maskW + x] = alpha;
    }
  }

  // Apply alpha mask to the scaled image
  const sharpPng = await sharp(sharpScaled).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < maskH; y++) {
    for (let x = 0; x < maskW; x++) {
      const idx = (y * maskW + x) * 4;
      const maskVal = maskBuf[y * maskW + x];
      sharpPng.data[idx + 3] = Math.min(sharpPng.data[idx + 3], maskVal);
    }
  }

  const featheredImage = await sharp(sharpPng.data, {
    raw: { width: maskW, height: maskH, channels: 4 }
  }).png().toBuffer();

  // 4. Composite feathered sharp image centered onto the 2400x1025 ambient background
  const leftPos = Math.round((targetW - maskW) / 2);
  const finalImage = await sharp(bg)
    .composite([
      {
        input: featheredImage,
        top: 0,
        left: leftPos,
      }
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  fs.writeFileSync('public/banner-mayoristas-2400.jpg', finalImage);
  console.log('Saved public/banner-mayoristas-2400.jpg successfully! Size:', finalImage.length, 'bytes');
}

generateWideBanner().catch(console.error);
