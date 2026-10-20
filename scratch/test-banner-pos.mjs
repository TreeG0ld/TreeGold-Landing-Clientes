import sharp from 'sharp';
import fs from 'fs';

async function testPositions() {
  const inputPath = 'public/banner-mayoristas.jpg';
  const targetW = 2400;
  const targetH = 1025;

  const bg = await sharp(inputPath)
    .resize(targetW, targetH, { fit: 'cover' })
    .blur(35)
    .toBuffer();

  const sharpScaled = await sharp(inputPath)
    .resize(null, targetH, { fit: 'inside' })
    .toBuffer();

  const scaledMeta = await sharp(sharpScaled).metadata();
  const maskW = scaledMeta.width;
  const maskH = targetH;
  const featherW = 100;

  // Mask
  const maskBuf = Buffer.alloc(maskW * maskH);
  for (let y = 0; y < maskH; y++) {
    for (let x = 0; x < maskW; x++) {
      let alpha = 255;
      if (x < featherW) {
        alpha = Math.round((x / featherW) * 255);
      } else if (x > maskW - featherW) {
        alpha = Math.round(((maskW - 1 - x) / featherW) * 255);
      }
      maskBuf[y * maskW + x] = alpha;
    }
  }

  const sharpPng = await sharp(sharpScaled).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < maskH; y++) {
    for (let x = 0; x < maskW; x++) {
      const idx = (y * maskW + x) * 4;
      sharpPng.data[idx + 3] = Math.min(sharpPng.data[idx + 3], maskBuf[y * maskW + x]);
    }
  }

  const feathered = await sharp(sharpPng.data, {
    raw: { width: maskW, height: maskH, channels: 4 }
  }).png().toBuffer();

  // Variant A: centered (leftPos = 281)
  // Variant B: slightly shifted right (leftPos = 420), so model's elbow lands gracefully near right edge and text has more breathing room on left!
  const leftPosB = Math.round(targetW - maskW - 60); // 2400 - 1838 - 60 = 502

  const finalB = await sharp(bg)
    .composite([
      { input: feathered, top: 0, left: leftPosB }
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  fs.writeFileSync('public/banner-mayoristas-varB.jpg', finalB);
  console.log('Saved varB');
}

testPositions();
