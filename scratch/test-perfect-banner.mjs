import sharp from 'sharp';
import fs from 'fs';

async function generatePerfectWideBanner() {
  const inputPath = 'public/banner-mayoristas.jpg';
  const targetW = 2400;
  const targetH = 1025;

  // 1. Scale original image to target height 1025
  const scaledBuf = await sharp(inputPath)
    .resize(null, targetH, { fit: 'inside' })
    .toBuffer();

  const { width: scaledW, height: scaledH } = await sharp(scaledBuf).metadata();
  console.log('Scaled dimensions:', scaledW, 'x', scaledH); // 1838 x 1025

  // Center the sharp image
  const leftPad = Math.round((targetW - scaledW) / 2); // 281
  const rightPad = targetW - scaledW - leftPad; // 281

  // 2. Left side extension:
  // Use the 3px from the left edge (pure studio grey + marble slab) and stretch it smoothly across leftPad
  const leftExt = await sharp(scaledBuf)
    .extract({ left: 0, top: 0, width: 3, height: scaledH })
    .resize(leftPad + 50, scaledH, { fit: 'fill' })
    .blur(1)
    .toBuffer();

  // 3. Right side extension:
  // For the right side, the top is studio grey (#bcbebc) and the bottom is marble (#e3d8d2).
  // Notice the model's arm is at y=350..650.
  // If we take the studio grey and marble and create a smooth vertical gradient matching the right edge,
  // or take the right edge and blur it heavily so her arm becomes a soft warm ambient shadow:
  const rightExt = await sharp(scaledBuf)
    .extract({ left: scaledW - 10, top: 0, width: 10, height: scaledH })
    .resize(rightPad + 50, scaledH, { fit: 'fill' })
    .blur(18)
    .toBuffer();

  // 4. Feather the scaled image edges so there is ZERO hard seam
  const featherW = 40;
  const maskBuf = Buffer.alloc(scaledW * scaledH);
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < scaledW; x++) {
      let alpha = 255;
      if (x < featherW) {
        alpha = Math.round((x / featherW) * 255);
      } else if (x > scaledW - featherW) {
        alpha = Math.round(((scaledW - 1 - x) / featherW) * 255);
      }
      maskBuf[y * scaledW + x] = alpha;
    }
  }

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

  // 5. Build base canvas with ambient background
  const finalImage = await sharp({
    create: {
      width: targetW,
      height: targetH,
      channels: 3,
      background: { r: 189, g: 191, b: 190 }
    }
  })
  .composite([
    { input: leftExt, left: 0, top: 0 },
    { input: rightExt, left: targetW - rightPad - 50, top: 0 },
    { input: feathered, left: leftPad, top: 0 }
  ])
  .jpeg({ quality: 96 })
  .toBuffer();

  fs.writeFileSync('public/banner-mayoristas-wide.jpg', finalImage);
  console.log('Saved public/banner-mayoristas-wide.jpg! Size:', finalImage.length, 'bytes');
}

generatePerfectWideBanner();
