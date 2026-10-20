import sharp from 'sharp';
import fs from 'fs';

async function testEdgeExtension() {
  const inputPath = 'public/banner-mayoristas.jpg';
  const targetW = 2400;
  const targetH = 1025;

  // 1. Scale original image to target height 1025
  const scaledBuf = await sharp(inputPath)
    .resize(null, targetH, { fit: 'inside' })
    .toBuffer();

  const { width: scaledW, height: scaledH } = await sharp(scaledBuf).metadata();
  console.log('Scaled dimensions:', scaledW, 'x', scaledH); // 1838 x 1025

  const leftPad = Math.round((targetW - scaledW) / 2); // 281
  const rightPad = targetW - scaledW - leftPad; // 281

  // Extract the 1-pixel column on the left edge and stretch it across leftPad width!
  const leftCol = await sharp(scaledBuf)
    .extract({ left: 0, top: 0, width: 2, height: scaledH })
    .resize(leftPad, scaledH, { fit: 'fill' })
    .toBuffer();

  // Extract the 1-pixel column on the right edge and stretch it across rightPad width!
  const rightCol = await sharp(scaledBuf)
    .extract({ left: scaledW - 2, top: 0, width: 2, height: scaledH })
    .resize(rightPad, scaledH, { fit: 'fill' })
    .toBuffer();

  // Composite leftCol + scaled image + rightCol into a 2400x1025 canvas!
  const combined = await sharp({
    create: {
      width: targetW,
      height: targetH,
      channels: 3,
      background: { r: 189, g: 191, b: 190 }
    }
  })
  .composite([
    { input: leftCol, left: 0, top: 0 },
    { input: scaledBuf, left: leftPad, top: 0 },
    { input: rightCol, left: leftPad + scaledW, top: 0 }
  ])
  .jpeg({ quality: 96 })
  .toBuffer();

  fs.writeFileSync('public/banner-mayoristas-edge.jpg', combined);
  console.log('Saved public/banner-mayoristas-edge.jpg');
}

testEdgeExtension();
